<template>
  <div class="config-history">
    <!-- 页面头部 -->
    <div class="history-header">
      <div class="header-main">
        <h2>配置历史</h2>
        <p class="description">查看配置变更历史记录，支持版本对比和回滚操作</p>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          :icon="Refresh"
          :loading="configStore.configHistoriesLoading"
          @click="refreshHistory"
        >
          刷新
        </el-button>
        <el-button
          type="info"
          :icon="Download"
          @click="exportHistory"
        >
          导出历史
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="history-search">
      <el-card shadow="never">
        <el-form :model="searchForm" inline>
          <el-form-item label="配置类型">
            <el-select
              v-model="searchForm.configType"
              placeholder="选择配置类型"
              clearable
              style="width: 150px"
              @change="handleSearch"
            >
              <el-option label="系统配置" value="system" />
              <el-option label="敏感词" value="sensitive_word" />
              <el-option label="审批模板" value="approval_template" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select
              v-model="searchForm.operation"
              placeholder="选择操作"
              clearable
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="创建" value="create" />
              <el-option label="更新" value="update" />
              <el-option label="删除" value="delete" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作人">
            <el-select
              v-model="searchForm.operatorId"
              placeholder="选择操作人"
              clearable
              filterable
              remote
              :remote-method="searchOperators"
              :loading="searchingOperators"
              style="width: 150px"
              @change="handleSearch"
            >
              <el-option
                v-for="operator in operatorOptions"
                :key="operator.id"
                :label="operator.name"
                :value="operator.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleDateChange"
              style="width: 350px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 历史记录列表 -->
    <div class="history-table">
      <el-card shadow="never">
        <el-table
          v-loading="configStore.configHistoriesLoading"
          :data="configStore.configHistories"
          @selection-change="handleSelectionChange"
          stripe
        >
          <el-table-column type="selection" width="55" />

          <el-table-column label="配置类型" prop="configType" width="120">
            <template #default="{ row }">
              <el-tag :type="getConfigTypeColor(row.configType)" size="small">
                {{ getConfigTypeLabel(row.configType) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="操作类型" prop="operation" width="100">
            <template #default="{ row }">
              <el-tag :type="getOperationColor(row.operation)" size="small">
                {{ getOperationLabel(row.operation) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="配置标识" prop="configId" width="100">
            <template #default="{ row }">
              <el-text type="primary">#{{ row.configId }}</el-text>
            </template>
          </el-table-column>

          <el-table-column label="变更内容" min-width="200">
            <template #default="{ row }">
              <div class="change-content">
                <div v-if="row.operation === 'create'" class="change-item">
                  <span class="change-label">新增:</span>
                  <span class="change-value">{{ getChangePreview(row.newValue) }}</span>
                </div>
                <div v-else-if="row.operation === 'delete'" class="change-item">
                  <span class="change-label">删除:</span>
                  <span class="change-value">{{ getChangePreview(row.oldValue) }}</span>
                </div>
                <div v-else class="change-comparison">
                  <div class="old-value">
                    <span class="change-label">旧值:</span>
                    <span class="value">{{ getChangePreview(row.oldValue) }}</span>
                  </div>
                  <div class="new-value">
                    <span class="change-label">新值:</span>
                    <span class="value">{{ getChangePreview(row.newValue) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作原因" prop="reason" min-width="150">
            <template #default="{ row }">
              <el-text line-clamp="2">{{ row.reason || '-' }}</el-text>
            </template>
          </el-table-column>

          <el-table-column label="操作人" prop="operatorName" width="120">
            <template #default="{ row }">
              <div class="operator-info">
                <el-avatar :size="24" :src="getOperatorAvatar(row.operatorId)" />
                <span>{{ row.operatorName }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作时间" prop="createdAt" width="160">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="viewDetail(row)"
              >
                详情
              </el-button>
              <el-button
                v-if="row.operation !== 'delete'"
                type="warning"
                size="small"
                text
                @click="rollbackToHistory(row)"
              >
                回滚
              </el-button>
              <el-button
                v-if="selectedHistories.length === 1 && selectedHistories[0].id !== row.id"
                type="info"
                size="small"
                text
                @click="compareHistories(selectedHistories[0], row)"
              >
                对比
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="searchForm.page"
            v-model:page-size="searchForm.pageSize"
            :total="configStore.pagination.history.total"
            :page-sizes="[20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>

        <!-- 批量操作 -->
        <div v-if="selectedHistories.length > 0" class="batch-actions">
          <el-alert
            :title="`已选择 ${selectedHistories.length} 条记录`"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <div class="batch-action-buttons">
                <el-button
                  v-if="selectedHistories.length === 2"
                  type="primary"
                  size="small"
                  @click="compareSelectedHistories"
                >
                  对比选中项
                </el-button>
                <el-button
                  type="info"
                  size="small"
                  @click="exportSelectedHistories"
                >
                  导出选中项
                </el-button>
              </div>
            </template>
          </el-alert>
        </div>
      </el-card>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="历史记录详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedHistory" class="history-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="配置类型">
            <el-tag :type="getConfigTypeColor(selectedHistory.configType)">
              {{ getConfigTypeLabel(selectedHistory.configType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getOperationColor(selectedHistory.operation)">
              {{ getOperationLabel(selectedHistory.operation) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="配置ID">
            #{{ selectedHistory.configId }}
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ selectedHistory.operatorName }}
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">
            {{ formatDate(selectedHistory.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作原因" :span="2">
            {{ selectedHistory.reason || '无' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="value-comparison">
          <el-row :gutter="20">
            <el-col :span="12" v-if="selectedHistory.oldValue">
              <h4>变更前</h4>
              <el-input
                :model-value="formatValue(selectedHistory.oldValue)"
                type="textarea"
                :rows="10"
                readonly
              />
            </el-col>
            <el-col :span="selectedHistory.oldValue ? 12 : 24">
              <h4>{{ selectedHistory.operation === 'delete' ? '删除内容' : '变更后' }}</h4>
              <el-input
                :model-value="formatValue(selectedHistory.newValue || selectedHistory.oldValue)"
                type="textarea"
                :rows="10"
                readonly
              />
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>

    <!-- 对比对话框 -->
    <el-dialog
      v-model="compareDialogVisible"
      title="历史版本对比"
      width="90%"
      :close-on-click-modal="false"
    >
      <div v-if="compareResult" class="history-compare">
        <div class="compare-header">
          <div class="version-info">
            <div class="version-item">
              <h4>版本 A</h4>
              <p>{{ formatDate(historyA?.createdAt) }} - {{ historyA?.operatorName }}</p>
            </div>
            <div class="version-item">
              <h4>版本 B</h4>
              <p>{{ formatDate(historyB?.createdAt) }} - {{ historyB?.operatorName }}</p>
            </div>
          </div>
        </div>

        <div class="compare-content">
          <div v-if="compareResult.differences.length === 0" class="no-differences">
            <el-empty description="两个版本没有差异" />
          </div>
          <div v-else class="differences">
            <div
              v-for="(diff, index) in compareResult.differences"
              :key="index"
              class="diff-item"
            >
              <div class="diff-field">{{ diff.field }}</div>
              <div class="diff-values">
                <div class="diff-old">
                  <span class="diff-label">旧值:</span>
                  <pre>{{ formatValue(diff.oldValue) }}</pre>
                </div>
                <div class="diff-new">
                  <span class="diff-label">新值:</span>
                  <pre>{{ formatValue(diff.newValue) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Download,
  Search
} from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import { useConfig } from '@/composables/useConfig'
import type {
  ConfigHistory,
  ConfigHistoryQuery
} from '@/types/config'

// ============= Props =============
interface Props {
  configType?: string
  configId?: number
}

const props = withDefaults(defineProps<Props>(), {
  configType: '',
  configId: undefined
})

// ============= 响应式数据 =============
const configStore = useConfigStore()
const configUseConfig = useConfig()

// 搜索表单
const searchForm = ref<ConfigHistoryQuery>({
  configType: props.configType,
  configId: props.configId,
  operation: '',
  operatorId: undefined,
  startDate: '',
  endDate: '',
  page: 1,
  pageSize: 20
})

// 日期范围
const dateRange = ref<[string, string] | null>(null)

// 操作人选项
const operatorOptions = ref<Array<{ id: number; name: string }>>([])
const searchingOperators = ref(false)

// 选中的历史记录
const selectedHistories = ref<ConfigHistory[]>([])

// 对话框状态
const detailDialogVisible = ref(false)
const compareDialogVisible = ref(false)

// 详情和对比数据
const selectedHistory = ref<ConfigHistory | null>(null)
const historyA = ref<ConfigHistory | null>(null)
const historyB = ref<ConfigHistory | null>(null)
const compareResult = ref<any>(null)

// ============= 生命周期 =============
onMounted(async () => {
  await initData()
})

// ============= 方法 =============

/**
 * 初始化数据
 */
async function initData() {
  await configStore.fetchConfigHistory(searchForm.value)
}

/**
 * 处理搜索
 */
async function handleSearch() {
  await configStore.fetchConfigHistory(searchForm.value)
}

/**
 * 重置搜索
 */
async function resetSearch() {
  searchForm.value = {
    configType: props.configType,
    configId: props.configId,
    operation: '',
    operatorId: undefined,
    startDate: '',
    endDate: '',
    page: 1,
    pageSize: 20
  }
  dateRange.value = null
  await configStore.fetchConfigHistory(searchForm.value)
}

/**
 * 处理日期范围变化
 */
function handleDateChange(dates: [string, string] | null) {
  if (dates) {
    searchForm.value.startDate = dates[0]
    searchForm.value.endDate = dates[1]
  } else {
    searchForm.value.startDate = ''
    searchForm.value.endDate = ''
  }
  handleSearch()
}

/**
 * 分页处理
 */
async function handlePageSizeChange(pageSize: number) {
  searchForm.value.pageSize = pageSize
  await handleSearch()
}

async function handleCurrentChange(page: number) {
  searchForm.value.page = page
  await handleSearch()
}

/**
 * 搜索操作人
 */
async function searchOperators(query: string) {
  if (!query) return

  searchingOperators.value = true
  try {
    // 这里应该调用真实的用户搜索API
    setTimeout(() => {
      operatorOptions.value = [
        { id: 1, name: `用户1-${query}` },
        { id: 2, name: `用户2-${query}` },
        { id: 3, name: `用户3-${query}` }
      ]
      searchingOperators.value = false
    }, 500)
  } catch (error) {
    console.error('搜索操作人失败:', error)
    searchingOperators.value = false
  }
}

/**
 * 处理选择变化
 */
function handleSelectionChange(selection: ConfigHistory[]) {
  selectedHistories.value = selection
}

/**
 * 刷新历史
 */
async function refreshHistory() {
  await configStore.fetchConfigHistory(searchForm.value)
  ElMessage.success('历史记录已刷新')
}

/**
 * 查看详情
 */
function viewDetail(history: ConfigHistory) {
  selectedHistory.value = history
  detailDialogVisible.value = true
}

/**
 * 回滚到历史版本
 */
async function rollbackToHistory(history: ConfigHistory) {
  const success = await configUseConfig.rollbackToHistory(history.id, '手动回滚操作')
  if (success) {
    await handleSearch()
  }
}

/**
 * 对比历史版本
 */
async function compareHistories(historyA: ConfigHistory, historyB: ConfigHistory) {
  try {
    const response = await configStore.configApi.history.compareHistory(historyA.id, historyB.id)

    this.historyA = historyA
    this.historyB = historyB
    compareResult.value = response.data
    compareDialogVisible.value = true
  } catch (error) {
    console.error('对比失败:', error)
    ElMessage.error('对比失败')
  }
}

/**
 * 对比选中的历史版本
 */
async function compareSelectedHistories() {
  if (selectedHistories.value.length !== 2) {
    ElMessage.warning('请选择两条记录进行对比')
    return
  }

  await compareHistories(selectedHistories.value[0], selectedHistories.value[1])
}

/**
 * 导出历史记录
 */
async function exportHistory() {
  try {
    const histories = configStore.configHistories
    const csvContent = generateHistoryCSV(histories)

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `config-history-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('历史记录导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

/**
 * 导出选中的历史记录
 */
async function exportSelectedHistories() {
  try {
    const csvContent = generateHistoryCSV(selectedHistories.value)

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `config-history-selected-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('选中记录导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

/**
 * 生成CSV内容
 */
function generateHistoryCSV(histories: ConfigHistory[]): string {
  const headers = ['配置类型', '操作类型', '配置ID', '操作人', '操作时间', '操作原因']
  const rows = histories.map(history => [
    getConfigTypeLabel(history.configType),
    getOperationLabel(history.operation),
    history.configId.toString(),
    history.operatorName,
    history.createdAt,
    history.reason || ''
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

// ============= 工具方法 =============

function getConfigTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    system: '系统配置',
    sensitive_word: '敏感词',
    approval_template: '审批模板'
  }
  return labels[type] || type
}

function getConfigTypeColor(type: string): string {
  const colors: Record<string, string> = {
    system: 'primary',
    sensitive_word: 'warning',
    approval_template: 'success'
  }
  return colors[type] || 'info'
}

function getOperationLabel(operation: string): string {
  const labels: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除'
  }
  return labels[operation] || operation
}

function getOperationColor(operation: string): string {
  const colors: Record<string, string> = {
    create: 'success',
    update: 'warning',
    delete: 'danger'
  }
  return colors[operation] || 'info'
}

function getChangePreview(value: any): string {
  if (!value) return '-'

  const str = typeof value === 'string' ? value : JSON.stringify(value)
  return str.length > 50 ? str.substring(0, 50) + '...' : str
}

function formatValue(value: any): string {
  if (!value) return ''

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return value
    }
  }

  return JSON.stringify(value, null, 2)
}

function getOperatorAvatar(operatorId: number): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${operatorId}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped>
.config-history {
  padding: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-main h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-main .description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.history-search {
  margin-bottom: 20px;
}

.history-search :deep(.el-card__body) {
  padding: 16px 20px;
}

.history-table {
  background: white;
  border-radius: 4px;
}

.change-content {
  font-size: 13px;
}

.change-item {
  display: flex;
  gap: 8px;
}

.change-comparison {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.change-label {
  color: #909399;
  font-weight: 500;
  min-width: 40px;
}

.change-value,
.value {
  color: #606266;
  font-family: monospace;
}

.old-value .value {
  color: #f56c6c;
  text-decoration: line-through;
}

.new-value .value {
  color: #67c23a;
  font-weight: 500;
}

.operator-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.batch-actions {
  margin-top: 16px;
}

.batch-action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.history-detail {
  padding: 20px 0;
}

.value-comparison {
  margin-top: 30px;
}

.value-comparison h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.history-compare {
  padding: 20px 0;
}

.compare-header {
  margin-bottom: 30px;
}

.version-info {
  display: flex;
  gap: 40px;
}

.version-item h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.version-item p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.compare-content {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.no-differences {
  padding: 40px;
  text-align: center;
}

.differences {
  padding: 20px;
}

.diff-item {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.diff-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.diff-field {
  font-weight: 500;
  color: #303133;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.diff-values {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.diff-old,
.diff-new {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.diff-label {
  display: block;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.diff-old .diff-label {
  color: #f56c6c;
  background: #fef0f0;
}

.diff-new .diff-label {
  color: #67c23a;
  background: #f0f9ff;
}

.diff-old pre,
.diff-new pre {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  background: white;
  overflow-x: auto;
  font-family: 'Monaco', 'Consolas', monospace;
}

.diff-old pre {
  color: #f56c6c;
}

.diff-new pre {
  color: #67c23a;
}
</style>