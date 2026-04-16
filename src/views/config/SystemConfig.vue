<template>
  <div class="system-config">
    <!-- 页面头部 -->
    <div class="config-header">
      <div class="header-main">
        <h2>系統組態</h2>
        <p class="description">管理系統運行參數、安全組態和服務連接等設定</p>
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜尋組態..."
          :prefix-icon="Search"
          clearable
          class="header-search"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button
          :icon="Refresh"
          :loading="configStore.systemConfigsLoading"
          @click="refreshConfigs"
        >
          刷新組態
        </el-button>
        <el-button
          :icon="Download"
          @click="exportConfigs"
        >
          匯出組態
        </el-button>
      </div>
    </div>

    <!-- 配置列表 -->
    <div class="config-content">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane
          v-for="group in filteredConfigGroups"
          :key="group.category"
          :label="group.categoryName"
          :name="group.category"
        >
          <ConfigForm
            :configs="group.configs"
            :category="group.category"
            :loading="configStore.systemConfigsLoading"
            @update="handleConfigUpdate"
            @test-connection="handleTestConnection"
            @batch-save="handleBatchSave"
          />
        </el-tab-pane>

        <div v-if="filteredConfigGroups.length === 0" class="empty-state">
          <el-empty description="暫無組態項" />
        </div>
      </el-tabs>
    </div>

    <!-- Sticky 未保存变更栏 -->
    <Transition name="slide-up">
      <div v-if="hasChanges" class="sticky-action-bar">
        <div class="sticky-bar-content">
          <div class="changes-info">
            <el-icon class="changes-icon"><Warning /></el-icon>
            <span>你有未儲存的變更</span>
          </div>
          <div class="sticky-bar-actions">
            <el-button @click="resetAllChanges">重置所有</el-button>
            <el-button
              type="primary"
              :icon="CircleCheck"
              :loading="applying"
              @click="applyChanges"
            >
              應用更改
            </el-button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 配置历史对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="組態歷史"
      width="80%"
      :close-on-click-modal="false"
    >
      <ConfigHistory
        v-if="historyDialogVisible"
        :config-type="'system'"
        :config-id="selectedConfigId"
        @rollback="handleRollback"
      />
    </el-dialog>

    <!-- 批量操作确认对话框 -->
    <el-dialog
      v-model="batchConfirmVisible"
      title="批量儲存確認"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="batch-confirm-content">
        <el-alert
          title="以下組態將被更新"
          type="warning"
          :closable="false"
          show-icon
        />
        <div class="config-changes">
          <div
            v-for="change in pendingChanges"
            :key="change.configKey"
            class="change-item"
          >
            <div class="change-key">{{ change.configKey }}</div>
            <div class="change-value">
              <span class="old-value">{{ change.oldValue }}</span>
              <el-icon><ArrowRight /></el-icon>
              <span class="new-value">{{ change.newValue }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchConfirmVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="configUseConfig.saving.value"
          @click="confirmBatchSave"
        >
          確認儲存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  CircleCheck,
  Download,
  Search,
  ArrowRight,
  Warning
} from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import { useConfig } from '@/composables/useConfig'
import ConfigForm from '@/components/config/ConfigForm.vue'
import ConfigHistory from '@/components/config/ConfigHistory.vue'
import type { SystemConfig } from '@/types/config'

// ============= 响应式数据 =============
const route = useRoute()
const configStore = useConfigStore()
const configUseConfig = useConfig()

// route meta 控制顯示的 category 範圍
const includeCategories = computed(() => (route.meta.includeCategories as string[] | undefined) || null)
const excludeCategories = computed(() => (route.meta.excludeCategories as string[] | undefined) || null)
const configSource = computed(() => includeCategories.value?.includes('sensitive_word') ? 'content_moderation' as const : 'system' as const)

const activeTab = ref('')
const applying = ref(false)
const searchKeyword = ref('')

// 变更跟踪
const originalConfigs = ref<Record<string, string>>({})
const currentConfigs = ref<Record<string, string>>({})

// 历史对话框
const historyDialogVisible = ref(false)
const selectedConfigId = ref<number | null>(null)

// 批量操作
const batchConfirmVisible = ref(false)
const pendingChanges = ref<Array<{
  configKey: string
  oldValue: string
  newValue: string
}>>([])

// ============= 计算属性 =============
const filteredConfigGroups = computed(() => {
  let groups = configStore.systemConfigs

  if (includeCategories.value) {
    groups = groups.filter(g => includeCategories.value!.includes(g.category))
  }
  if (excludeCategories.value) {
    groups = groups.filter(g => !excludeCategories.value!.includes(g.category))
  }

  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    groups = groups.map(group => ({
      ...group,
      configs: group.configs.filter(config =>
        config.configKey.toLowerCase().includes(kw) ||
        config.description?.toLowerCase().includes(kw) ||
        config.label?.toLowerCase().includes(kw)
      )
    })).filter(group => group.configs.length > 0)
  }

  return groups
})

const hasChanges = computed(() => {
  return Object.keys(currentConfigs.value).some(key =>
    currentConfigs.value[key] !== originalConfigs.value[key]
  )
})

// ============= 生命周期 =============
onMounted(async () => {
  await initData()
})

watch(
  () => configStore.systemConfigs,
  (newConfigs) => {
    initConfigValues(newConfigs)
    if (filteredConfigGroups.value.length > 0 && !activeTab.value) {
      activeTab.value = filteredConfigGroups.value[0].category
    }
  },
  { immediate: true }
)

// ============= 方法 =============

async function initData() {
  await configStore.fetchSystemConfigs(configSource.value)
}

function initConfigValues(configGroups: typeof configStore.systemConfigs) {
  const original: Record<string, string> = {}
  const current: Record<string, string> = {}

  configGroups.forEach(group => {
    group.configs.forEach(config => {
      original[config.configKey] = config.configValue
      current[config.configKey] = config.configValue
    })
  })

  originalConfigs.value = original
  currentConfigs.value = current
}

async function refreshConfigs() {
  await configStore.fetchSystemConfigs(configSource.value)
  ElMessage.success('組態已刷新')
}

function handleSearch() {
  // filtering is done reactively via filteredConfigGroups
}

function handleTabChange(tabName: string) {
  activeTab.value = tabName
}

function handleConfigUpdate(configKey: string, newValue: string) {
  currentConfigs.value[configKey] = newValue
}

async function handleTestConnection(configKey: string) {
  await configUseConfig.testConfigConnection(configKey, configSource.value)
}

function handleBatchSave(changes: Array<{ configKey: string; configValue: string; description?: string }>) {
  pendingChanges.value = changes.map(change => ({
    configKey: change.configKey,
    oldValue: originalConfigs.value[change.configKey] || '',
    newValue: change.configValue
  }))

  batchConfirmVisible.value = true
}

async function confirmBatchSave() {
  try {
    const changes = pendingChanges.value.map(change => ({
      configKey: change.configKey,
      configValue: change.newValue
    }))

    const success = await configUseConfig.batchSaveSystemConfigs(changes, configSource.value)

    if (success) {
      changes.forEach(change => {
        originalConfigs.value[change.configKey] = change.configValue
        currentConfigs.value[change.configKey] = change.configValue
      })

      batchConfirmVisible.value = false
      pendingChanges.value = []
    }
  } catch (error) {
    console.error('批量儲存失敗:', error)
  }
}

async function applyChanges() {
  // Collect all changes and trigger batch save flow
  const changedKeys = Object.keys(currentConfigs.value).filter(
    key => currentConfigs.value[key] !== originalConfigs.value[key]
  )

  if (changedKeys.length === 0) return

  pendingChanges.value = changedKeys.map(key => ({
    configKey: key,
    oldValue: originalConfigs.value[key] || '',
    newValue: currentConfigs.value[key]
  }))

  batchConfirmVisible.value = true
}

function resetAllChanges() {
  Object.keys(currentConfigs.value).forEach(key => {
    currentConfigs.value[key] = originalConfigs.value[key]
  })
  // Force ConfigForm to re-init by refreshing
  configStore.fetchSystemConfigs(configSource.value)
}

function exportConfigs() {
  const data: Record<string, string> = {}
  configStore.systemConfigs.forEach(group => {
    group.configs.forEach(config => {
      data[config.configKey] = config.configValue
    })
  })

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `system-config-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('組態匯出成功')
}

async function handleRollback(historyId: number) {
  const success = await configUseConfig.rollbackToHistory(historyId)
  if (success) {
    historyDialogVisible.value = false
    await refreshConfigs()
  }
}
</script>

<style scoped>
.system-config {
  padding: var(--spacing-lg, 24px);
  padding-bottom: 80px; /* space for sticky bar */
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg, 24px);
  gap: 16px;
  flex-wrap: wrap;
}

.header-main h2 {
  margin: 0 0 4px 0;
  color: var(--text-primary, #303133);
  font-size: 20px;
  font-weight: 600;
}

.header-main .description {
  margin: 0;
  color: var(--text-secondary, #909399);
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.header-search {
  width: 220px;
}

.config-content {
  background: white;
  border-radius: 8px;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.06));
  padding: 0 var(--spacing-md, 16px);
}

.config-content :deep(.el-tabs__header) {
  margin-bottom: 0;
  padding: 0 4px;
}

.config-content :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

/* Sticky action bar */
.sticky-action-bar {
  position: fixed;
  bottom: 0;
  left: var(--sidebar-width, 240px);
  right: 0;
  z-index: 100;
  background: white;
  border-top: 1px solid var(--border-base, #e4e7ed);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

.sticky-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  max-width: 100%;
}

.changes-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--warning-color, #e6a23c);
  font-size: 14px;
  font-weight: 500;
}

.changes-icon {
  font-size: 18px;
}

.sticky-bar-actions {
  display: flex;
  gap: 8px;
}

/* Slide-up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Batch confirm dialog */
.batch-confirm-content {
  margin-bottom: 20px;
}

.config-changes {
  margin-top: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.change-item {
  padding: 12px;
  border: 1px solid var(--border-base, #e4e7ed);
  border-radius: 6px;
  margin-bottom: 8px;
}

.change-key {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary, #303133);
  font-size: 13px;
  font-family: monospace;
}

.change-value {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: monospace;
  font-size: 13px;
}

.old-value {
  color: var(--danger-color, #f56c6c);
  text-decoration: line-through;
}

.new-value {
  color: var(--success-color, #67c23a);
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .config-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-search {
    width: 100%;
  }

  .sticky-action-bar {
    left: 0;
  }

  .sticky-bar-content {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
