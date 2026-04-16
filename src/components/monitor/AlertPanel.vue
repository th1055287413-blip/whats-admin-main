<template>
  <div class="alert-panel">
    <el-card shadow="never">
      <template #header>
        <div class="panel-header">
          <div class="header-left">
            <span>实时告警</span>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0">
              <el-icon size="20" color="#F56C6C">
                <Bell />
              </el-icon>
            </el-badge>
          </div>
          <div class="header-right">
            <el-button-group size="small">
              <el-button
                :type="filterSeverity === 'all' ? 'primary' : ''"
                @click="handleFilterChange('all')"
              >
                全部 ({{ totalCount }})
              </el-button>
              <el-button
                :type="filterSeverity === 'critical' ? 'danger' : ''"
                @click="handleFilterChange('critical')"
              >
                严重 ({{ criticalCount }})
              </el-button>
              <el-button
                :type="filterSeverity === 'unhandled' ? 'warning' : ''"
                @click="handleFilterChange('unhandled')"
              >
                未处理 ({{ unhandledCount }})
              </el-button>
            </el-button-group>

            <el-dropdown @command="handleBatchAction">
              <el-button size="small" :disabled="selectedAlerts.length === 0">
                批量操作
                <el-icon><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="markRead">标记已读</el-dropdown-item>
                  <el-dropdown-item command="handle">批量处理</el-dropdown-item>
                  <el-dropdown-item command="export" divided>导出选中</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-button
              size="small"
              :icon="Refresh"
              @click="handleRefresh"
              :loading="loading"
            />
          </div>
        </div>
      </template>

      <div v-loading="loading" class="panel-content">
        <!-- 告警统计 -->
        <div v-if="showStats" class="alert-stats">
          <el-row :gutter="12">
            <el-col :span="6">
              <div class="stat-card critical">
                <div class="stat-icon">
                  <el-icon><Warning /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ stats?.alertsBySeverity?.critical || 0 }}</div>
                  <div class="stat-label">严重告警</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card error">
                <div class="stat-icon">
                  <el-icon><InfoFilled /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ stats?.alertsBySeverity?.error || 0 }}</div>
                  <div class="stat-label">错误告警</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card warning">
                <div class="stat-icon">
                  <el-icon><WarningFilled /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ stats?.alertsBySeverity?.warning || 0 }}</div>
                  <div class="stat-label">警告告警</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card info">
                <div class="stat-icon">
                  <el-icon><Message /></el-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-number">{{ stats?.alertsBySeverity?.info || 0 }}</div>
                  <div class="stat-label">信息告警</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 告警列表 -->
        <div class="alert-list" :style="{ height: listHeight }">
          <div v-if="displayedAlerts.length === 0 && !loading" class="empty-state">
            <el-empty description="暂无告警" />
          </div>

          <div v-else class="alert-items">
            <!-- 全选控制 -->
            <div v-if="displayedAlerts.length > 0" class="select-all-control">
              <el-checkbox
                v-model="selectAll"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              >
                全选当前页 ({{ displayedAlerts.length }} 条)
              </el-checkbox>
            </div>

            <!-- 告警项 -->
            <div
              v-for="alert in displayedAlerts"
              :key="alert.id"
              class="alert-item"
              :class="{
                'alert-unread': !alert.isRead,
                'alert-handled': alert.isHandled,
                'alert-selected': selectedAlerts.includes(alert.id)
              }"
              @click="handleAlertClick(alert)"
            >
              <div class="alert-item-header">
                <div class="alert-select">
                  <el-checkbox
                    :model-value="selectedAlerts.includes(alert.id)"
                    @change="(checked) => handleAlertSelect(alert.id, checked)"
                    @click.stop
                  />
                </div>

                <div class="alert-severity">
                  <el-tag
                    :type="getSeverityTagType(alert.severity)"
                    size="small"
                    effect="dark"
                  >
                    {{ getSeverityLabel(alert.severity) }}
                  </el-tag>
                </div>

                <div class="alert-type">
                  <el-tag size="small">
                    {{ getTypeLabel(alert.type) }}
                  </el-tag>
                </div>

                <div class="alert-time">
                  <el-text size="small" type="info">
                    {{ formatRelativeTime(alert.createdAt) }}
                  </el-text>
                </div>

                <div class="alert-actions">
                  <el-button
                    v-if="!alert.isRead"
                    size="small"
                    type="primary"
                    text
                    @click.stop="handleMarkRead(alert)"
                  >
                    标记已读
                  </el-button>

                  <el-button
                    v-if="!alert.isHandled"
                    size="small"
                    type="success"
                    text
                    @click.stop="handleMarkHandled(alert)"
                  >
                    处理
                  </el-button>

                  <el-button
                    size="small"
                    type="info"
                    text
                    @click.stop="handleViewDetail(alert)"
                  >
                    详情
                  </el-button>
                </div>
              </div>

              <div class="alert-item-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-description">{{ alert.description }}</div>

                <!-- 告警元数据 -->
                <div v-if="alert.metadata && Object.keys(alert.metadata).length > 0" class="alert-metadata">
                  <el-tag
                    v-for="(value, key) in getDisplayMetadata(alert.metadata)"
                    :key="key"
                    size="small"
                    type="info"
                    effect="plain"
                  >
                    {{ key }}: {{ value }}
                  </el-tag>
                </div>

                <!-- 处理信息 -->
                <div v-if="alert.isHandled" class="alert-handled-info">
                  <el-text size="small" type="success">
                    已于 {{ formatDateTime(alert.handledAt!) }} 处理完成
                  </el-text>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="displayedAlerts.length > 0" class="alert-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredAlerts.length"
            layout="prev, pager, next, jumper, total"
            size="small"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="告警详情"
      width="60%"
      destroy-on-close
    >
      <AlertDetail
        v-if="detailVisible && selectedAlert"
        :alert="selectedAlert"
        @update="handleAlertUpdate"
      />
    </el-dialog>

    <!-- 批量处理对话框 -->
    <el-dialog
      v-model="batchHandleVisible"
      title="批量处理告警"
      width="40%"
    >
      <el-form label-width="80px">
        <el-form-item label="处理说明">
          <el-input
            v-model="batchHandleComment"
            type="textarea"
            :rows="3"
            placeholder="请输入处理说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchHandleVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmBatchHandle">
          确认处理 ({{ selectedAlerts.length }} 条)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  Refresh,
  Warning,
  InfoFilled,
  WarningFilled,
  Message,
  ArrowDown
} from '@element-plus/icons-vue'
import { useRealTimeData } from '@/composables/useRealTimeData'
import type {
  RealTimeAlert,
  AlertType,
  AlertSeverity,
  AlertStats,
  AlertMetadata
} from '@/types/monitor'
import AlertDetail from './AlertDetail.vue'

// Props
interface Props {
  alerts?: RealTimeAlert[]
  stats?: AlertStats | null
  loading?: boolean
  height?: string
  showStats?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  alerts: () => [],
  height: '600px',
  showStats: true,
  autoRefresh: true,
  refreshInterval: 10000
})

// Emits
const emit = defineEmits<{
  refresh: []
  alertClick: [alert: RealTimeAlert]
  markRead: [alertId: number]
  markHandled: [alertId: number, comment?: string]
  batchMarkRead: [alertIds: number[]]
  batchHandle: [alertIds: number[], comment?: string]
}>()

// 实时数据
const { getLatestAlerts, getCriticalAlerts } = useRealTimeData()

// 组件状态
const filterSeverity = ref<'all' | 'critical' | 'unhandled'>('all')
const selectedAlerts = ref<number[]>([])
const selectAll = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const selectedAlert = ref<RealTimeAlert | null>(null)
const batchHandleVisible = ref(false)
const batchHandleComment = ref('')

// 自动刷新计时器
let refreshTimer: number | null = null

// 计算属性
const allAlerts = computed(() => {
  // 合并props传入的告警和实时告警
  const propAlerts = props.alerts || []
  const realTimeAlerts = getLatestAlerts(50)

  // 去重并按时间排序
  const alertMap = new Map()

  propAlerts.forEach(alert => {
    alertMap.set(alert.id, alert)
  })

  realTimeAlerts.forEach(realTimeAlert => {
    // 将实时告警数据转换为RealTimeAlert格式
    if (!alertMap.has(realTimeAlert.timestamp)) {
      alertMap.set(realTimeAlert.timestamp, {
        id: Date.now() + Math.random(),
        type: realTimeAlert.type,
        severity: realTimeAlert.severity,
        title: realTimeAlert.title,
        description: realTimeAlert.description,
        metadata: realTimeAlert.metadata,
        isRead: false,
        isHandled: false,
        createdAt: realTimeAlert.timestamp,
        updatedAt: realTimeAlert.timestamp
      } as RealTimeAlert)
    }
  })

  return Array.from(alertMap.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

const filteredAlerts = computed(() => {
  let filtered = allAlerts.value

  switch (filterSeverity.value) {
    case 'critical':
      filtered = filtered.filter(alert => alert.severity === 'critical')
      break
    case 'unhandled':
      filtered = filtered.filter(alert => !alert.isHandled)
      break
  }

  return filtered
})

const displayedAlerts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAlerts.value.slice(start, end)
})

const totalCount = computed(() => allAlerts.value.length)
const criticalCount = computed(() =>
  allAlerts.value.filter(alert => alert.severity === 'critical').length
)
const unhandledCount = computed(() =>
  allAlerts.value.filter(alert => !alert.isHandled).length
)
const unreadCount = computed(() =>
  allAlerts.value.filter(alert => !alert.isRead).length
)

const isIndeterminate = computed(() => {
  const selectedCount = selectedAlerts.value.length
  const totalDisplayed = displayedAlerts.value.length
  return selectedCount > 0 && selectedCount < totalDisplayed
})

const listHeight = computed(() => {
  let height = parseInt(props.height)
  if (props.showStats) height -= 120 // 减去统计区域高度
  height -= 100 // 减去头部和分页高度
  return `${Math.max(300, height)}px`
})

// 事件处理
const handleFilterChange = (filter: 'all' | 'critical' | 'unhandled') => {
  filterSeverity.value = filter
  currentPage.value = 1
  selectedAlerts.value = []
  selectAll.value = false
}

const handleRefresh = () => {
  emit('refresh')
}

const handleAlertClick = (alert: RealTimeAlert) => {
  emit('alertClick', alert)
}

const handleAlertSelect = (alertId: number, checked: boolean) => {
  if (checked) {
    if (!selectedAlerts.value.includes(alertId)) {
      selectedAlerts.value.push(alertId)
    }
  } else {
    const index = selectedAlerts.value.indexOf(alertId)
    if (index > -1) {
      selectedAlerts.value.splice(index, 1)
    }
  }

  // 更新全选状态
  const totalDisplayed = displayedAlerts.value.length
  selectAll.value = selectedAlerts.value.length === totalDisplayed
}

const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedAlerts.value = displayedAlerts.value.map(alert => alert.id)
  } else {
    selectedAlerts.value = []
  }
}

const handleMarkRead = (alert: RealTimeAlert) => {
  emit('markRead', alert.id)
  alert.isRead = true
}

const handleMarkHandled = (alert: RealTimeAlert) => {
  emit('markHandled', alert.id)
  alert.isHandled = true
  alert.handledAt = new Date().toISOString()
}

const handleViewDetail = (alert: RealTimeAlert) => {
  selectedAlert.value = alert
  detailVisible.value = true
}

const handleBatchAction = (command: string) => {
  if (selectedAlerts.value.length === 0) {
    ElMessage.warning('请先选择要操作的告警')
    return
  }

  switch (command) {
    case 'markRead':
      handleBatchMarkRead()
      break
    case 'handle':
      batchHandleVisible.value = true
      break
    case 'export':
      handleBatchExport()
      break
  }
}

const handleBatchMarkRead = () => {
  emit('batchMarkRead', selectedAlerts.value)

  // 更新本地状态
  allAlerts.value.forEach(alert => {
    if (selectedAlerts.value.includes(alert.id)) {
      alert.isRead = true
    }
  })

  selectedAlerts.value = []
  selectAll.value = false
  ElMessage.success('批量标记已读成功')
}

const handleConfirmBatchHandle = () => {
  emit('batchHandle', selectedAlerts.value, batchHandleComment.value)

  // 更新本地状态
  const now = new Date().toISOString()
  allAlerts.value.forEach(alert => {
    if (selectedAlerts.value.includes(alert.id)) {
      alert.isHandled = true
      alert.handledAt = now
    }
  })

  selectedAlerts.value = []
  selectAll.value = false
  batchHandleVisible.value = false
  batchHandleComment.value = ''
  ElMessage.success('批量处理成功')
}

const handleBatchExport = () => {
  ElMessage.info('导出功能开发中...')
}

const handleAlertUpdate = () => {
  emit('refresh')
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  selectedAlerts.value = []
  selectAll.value = false
}

// 工具函数
const getSeverityLabel = (severity: AlertSeverity) => {
  const labels = {
    info: '信息',
    warning: '警告',
    error: '错误',
    critical: '严重'
  }
  return labels[severity] || severity
}

const getSeverityTagType = (severity: AlertSeverity) => {
  const types = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    critical: 'danger'
  }
  return types[severity] || 'info'
}

const getTypeLabel = (type: AlertType) => {
  const labels = {
    sensitive_message: '敏感消息',
    suspicious_contact: '可疑联系人',
    system_error: '系统错误',
    rate_limit: '频率限制'
  }
  return labels[type] || type
}

const getDisplayMetadata = (metadata: AlertMetadata) => {
  const displayed: Record<string, any> = {}

  if (metadata.messageId) {
    displayed['消息ID'] = metadata.messageId
  }
  if (metadata.contactId) {
    displayed['联系人ID'] = metadata.contactId
  }
  if (metadata.errorCode) {
    displayed['错误码'] = metadata.errorCode
  }

  return displayed
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatRelativeTime = (dateString: string) => {
  const now = new Date()
  const date = new Date(dateString)
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDateTime(dateString)
}

// 自动刷新
const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => {
      if (!props.loading) {
        handleRefresh()
      }
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 监听过滤器变化
watch(filterSeverity, () => {
  selectedAlerts.value = []
  selectAll.value = false
})

// 生命周期
onMounted(() => {
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.alert-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-content {
  position: relative;
}

.alert-stats {
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  background: white;
  border: 1px solid #ebeef5;
}

.stat-card.critical {
  border-color: #f56c6c;
  background: #fef0f0;
}

.stat-card.error {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.stat-card.warning {
  border-color: #e6a23c;
  background: #fdf6ec;
}

.stat-card.info {
  border-color: #409eff;
  background: #ecf5ff;
}

.stat-icon {
  margin-right: 12px;
  font-size: 24px;
}

.stat-card.critical .stat-icon {
  color: #f56c6c;
}

.stat-card.error .stat-icon {
  color: #e6a23c;
}

.stat-card.warning .stat-icon {
  color: #e6a23c;
}

.stat-card.info .stat-icon {
  color: #409eff;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #606266;
  margin-top: 2px;
}

.alert-list {
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.select-all-control {
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
  background: #f8f9fa;
}

.alert-item {
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.alert-item:hover {
  background: #f5f7fa;
}

.alert-item.alert-unread {
  background: #fff7f0;
  border-left: 3px solid #e6a23c;
}

.alert-item.alert-handled {
  opacity: 0.7;
}

.alert-item.alert-selected {
  background: #ecf5ff;
}

.alert-item-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
}

.alert-select {
  flex-shrink: 0;
}

.alert-severity {
  flex-shrink: 0;
}

.alert-type {
  flex-shrink: 0;
}

.alert-time {
  flex: 1;
}

.alert-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.alert-item-content {
  padding: 0 12px 12px 40px;
}

.alert-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.alert-description {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.alert-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.alert-handled-info {
  margin-top: 8px;
}

.alert-pagination {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>