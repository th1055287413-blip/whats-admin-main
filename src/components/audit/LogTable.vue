<template>
  <div class="log-table">
    <!-- 表格操作栏 -->
    <div class="log-table-header">
      <div class="header-left">
        <el-button-group>
          <el-button
            type="primary"
            :icon="Refresh"
            @click="handleRefresh"
            :loading="loading"
          >
            刷新
          </el-button>
          <el-button
            :icon="Download"
            @click="handleExport"
            :disabled="!hasData"
          >
            导出
          </el-button>
        </el-button-group>

        <!-- 批量操作 (仅异常检测) -->
        <div v-if="type === 'anomaly' && selectedLogs.length > 0" class="batch-actions">
          <el-button
            type="success"
            :icon="Check"
            @click="handleBatchConfirm"
          >
            批量确认 ({{ selectedLogs.length }})
          </el-button>
          <el-button
            type="warning"
            :icon="Close"
            @click="handleBatchFalsePositive"
          >
            批量标记误报
          </el-button>
        </div>
      </div>

      <div class="header-right">
        <!-- 实时更新开关 -->
        <el-switch
          v-model="realTimeEnabled"
          active-text="实时更新"
          @change="handleRealTimeToggle"
        />

        <!-- 显示选项 -->
        <el-dropdown trigger="click">
          <el-button :icon="Setting" circle />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="toggleDetails">
                <el-icon><View /></el-icon>
                {{ showDetails ? '隐藏详情' : '显示详情' }}
              </el-dropdown-item>
              <el-dropdown-item @click="toggleVirtualScroll">
                <el-icon><Lightning /></el-icon>
                {{ virtualScroll ? '关闭虚拟滚动' : '开启虚拟滚动' }}
              </el-dropdown-item>
              <el-dropdown-item divided @click="resetColumns">
                <el-icon><RefreshLeft /></el-icon>
                重置列设置
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 统计信息卡片 -->
    <div v-if="showStats && stats" class="log-stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ stats.total_count || totalCount }}</div>
              <div class="stat-label">总记录数</div>
            </div>
            <el-icon class="stat-icon"><Document /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number high-risk">{{ getHighRiskCount() }}</div>
              <div class="stat-label">高风险</div>
            </div>
            <el-icon class="stat-icon"><Warning /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ getTodayCount() }}</div>
              <div class="stat-label">今日新增</div>
            </div>
            <el-icon class="stat-icon"><Clock /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ getUniqueUsersCount() }}</div>
              <div class="stat-label">涉及用户</div>
            </div>
            <el-icon class="stat-icon"><User /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主表格 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="displayLogs"
      :height="tableHeight"
      :row-key="getRowKey"
      :default-sort="{ prop: 'created_at', order: 'descending' }"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      @sort-change="handleSortChange"
      stripe
      highlight-current-row
      class="log-table-main"
    >
      <!-- 选择列 (仅异常检测支持批量操作) -->
      <el-table-column
        v-if="selectable && type === 'anomaly'"
        type="selection"
        width="50"
        :selectable="isRowSelectable"
      />

      <!-- 展开详情列 -->
      <el-table-column v-if="showDetails" type="expand" width="50">
        <template #default="{ row }">
          <LogDetailPanel :log="row" :type="type" />
        </template>
      </el-table-column>

      <!-- 状态指示器列 -->
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <LogStatusIndicator :log="row" :type="type" />
        </template>
      </el-table-column>

      <!-- 时间列 -->
      <el-table-column
        label="时间"
        prop="created_at"
        width="180"
        sortable="custom"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <div class="time-cell">
            <div class="time-main">{{ formatTime(row.created_at) }}</div>
            <div class="time-relative">{{ getRelativeTime(row.created_at) }}</div>
          </div>
        </template>
      </el-table-column>

      <!-- 用户列 -->
      <el-table-column
        label="用户"
        prop="user_name"
        width="150"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="28" :src="getUserAvatar(row.user_id)">
              {{ row.user_name?.charAt(0) }}
            </el-avatar>
            <div class="user-info">
              <div class="user-name">{{ row.user_name }}</div>
              <div class="user-id">ID: {{ row.user_id }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 动态列 - 根据日志类型显示不同内容 -->
      <template v-if="type === 'operation'">
        <!-- 操作类型 -->
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <OperationTypeTag :operation="row" />
          </template>
        </el-table-column>

        <!-- 资源信息 -->
        <el-table-column label="资源" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="resource-cell">
              <div class="resource-type">{{ row.resource_type }}</div>
              <div class="resource-name">{{ row.operation_name }}</div>
              <div v-if="row.resource_id" class="resource-id">{{ row.resource_id }}</div>
            </div>
          </template>
        </el-table-column>

        <!-- 请求方法 -->
        <el-table-column label="方法" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getMethodTagType(row.request_method)" size="small">
              {{ row.request_method }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 响应状态 -->
        <el-table-column label="状态码" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.response_status)" size="small">
              {{ row.response_status }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 耗时 -->
        <el-table-column label="耗时" width="80" align="center" sortable="custom">
          <template #default="{ row }">
            <span :class="getDurationClass(row.duration_ms)">
              {{ formatDuration(row.duration_ms) }}
            </span>
          </template>
        </el-table-column>
      </template>

      <template v-else-if="type === 'login'">
        <!-- 登录类型 -->
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <LoginTypeTag :login="row" />
          </template>
        </el-table-column>

        <!-- 登录状态 -->
        <el-table-column label="结果" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getLoginStatusType(row.login_status)" size="small">
              {{ row.login_status }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- IP地址 -->
        <el-table-column label="IP地址" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="ip-cell">
              <span class="ip-address">{{ row.ip_address }}</span>
              <LocationInfo v-if="row.location_info" :location="row.location_info" />
            </div>
          </template>
        </el-table-column>

        <!-- 设备信息 -->
        <el-table-column label="设备" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <DeviceInfo v-if="row.device_info" :device="row.device_info" />
          </template>
        </el-table-column>

        <!-- 会话时长 -->
        <el-table-column label="会话时长" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.session_duration">
              {{ formatDuration(row.session_duration * 1000) }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
      </template>

      <template v-else-if="type === 'anomaly'">
        <!-- 检测类型 -->
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <AnomalyTypeTag :anomaly="row" />
          </template>
        </el-table-column>

        <!-- 异常描述 -->
        <el-table-column label="描述" min-width="250" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="anomaly-description">
              {{ row.anomaly_description }}
            </div>
          </template>
        </el-table-column>

        <!-- 严重程度 -->
        <el-table-column label="严重程度" width="100" align="center">
          <template #default="{ row }">
            <SeverityTag :severity="row.severity" />
          </template>
        </el-table-column>

        <!-- 处理状态 -->
        <el-table-column label="处理状态" width="120" align="center">
          <template #default="{ row }">
            <AnomalyStatusTag :anomaly="row" />
          </template>
        </el-table-column>
      </template>

      <!-- 风险等级 -->
      <el-table-column label="风险" width="80" align="center">
        <template #default="{ row }">
          <RiskLevelTag :level="getRiskLevel(row)" />
        </template>
      </el-table-column>

      <!-- IP地址 (通用) -->
      <el-table-column
        v-if="type !== 'login'"
        label="IP地址"
        prop="ip_address"
        width="140"
        show-overflow-tooltip
      />

      <!-- 操作列 -->
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <div class="action-buttons">
            <el-button
              type="primary"
              link
              :icon="View"
              @click="handleViewDetails(row)"
            >
              详情
            </el-button>

            <!-- 异常检测特殊操作 -->
            <template v-if="type === 'anomaly' && !row.is_confirmed && !row.is_false_positive">
              <el-button
                type="success"
                link
                :icon="Check"
                @click="handleConfirmAnomaly(row)"
              >
                确认
              </el-button>
              <el-button
                type="warning"
                link
                :icon="Close"
                @click="handleMarkFalsePositive(row)"
              >
                误报
              </el-button>
            </template>

            <!-- 登录日志特殊操作 -->
            <template v-if="type === 'login'">
              <el-button
                v-if="!row.is_suspicious"
                type="warning"
                link
                :icon="Warning"
                @click="handleMarkSuspicious(row, true)"
              >
                标记可疑
              </el-button>
              <el-button
                v-else
                type="success"
                link
                :icon="Check"
                @click="handleMarkSuspicious(row, false)"
              >
                取消可疑
              </el-button>
            </template>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页器 -->
    <div class="log-table-footer">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalCount"
        :page-sizes="[10, 20, 50, 100, 200]"
        :small="false"
        :disabled="loading"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />

      <div class="footer-info">
        <span class="last-update">
          最后更新: {{ lastUpdateTime || '暂无' }}
        </span>
      </div>
    </div>

    <!-- 日志详情抽屉 -->
    <LogDetailDrawer
      v-model="detailDrawerVisible"
      :log="selectedLog"
      :type="type"
      @close="handleCloseDetails"
    />

    <!-- 导出确认对话框 -->
    <ExportDialog
      v-model="exportDialogVisible"
      :type="type"
      :total-count="totalCount"
      @confirm="handleConfirmExport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Download,
  Check,
  Close,
  Setting,
  View,
  Lightning,
  RefreshLeft,
  Document,
  Warning,
  Clock,
  User
} from '@element-plus/icons-vue'

// 组件导入
import LogDetailPanel from './LogDetailPanel.vue'
import LogDetailDrawer from './LogDetailDrawer.vue'
import LogStatusIndicator from './LogStatusIndicator.vue'
import OperationTypeTag from './OperationTypeTag.vue'
import LoginTypeTag from './LoginTypeTag.vue'
import AnomalyTypeTag from './AnomalyTypeTag.vue'
import SeverityTag from './SeverityTag.vue'
import AnomalyStatusTag from './AnomalyStatusTag.vue'
import RiskLevelTag from './RiskLevelTag.vue'
import LocationInfo from './LocationInfo.vue'
import DeviceInfo from './DeviceInfo.vue'
import ExportDialog from './ExportDialog.vue'

// 类型导入
import type {
  OperationLog,
  LoginLog,
  AnomalyDetection,
  LogTableProps
} from '@/types/audit'

// 工具函数导入
import {
  formatLogTime,
  getRiskLevelColor,
  getOperationIcon,
  getLoginStatusColor
} from '@/composables/useAuditLogs'

// Props
const props = withDefaults(defineProps<LogTableProps>(), {
  loading: false,
  selectable: false,
  showDetails: false,
  virtualScroll: false,
  height: '600px'
})

// Emits
const emit = defineEmits<{
  refresh: []
  export: [options: any]
  selectionChange: [logs: any[]]
  viewDetails: [log: any]
  confirmAnomaly: [log: AnomalyDetection]
  markFalsePositive: [log: AnomalyDetection]
  markSuspicious: [log: LoginLog, suspicious: boolean]
  pageChange: [page: number]
  pageSizeChange: [size: number]
  sortChange: [sort: any]
}>()

// 响应式数据
const tableRef = ref()
const selectedLogs = ref<any[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const realTimeEnabled = ref(false)
const showStats = ref(true)
const showDetails = ref(props.showDetails)
const virtualScroll = ref(props.virtualScroll)
const detailDrawerVisible = ref(false)
const exportDialogVisible = ref(false)
const selectedLog = ref<any>(null)
const lastUpdateTime = ref<string>('')

// 计算属性
const displayLogs = computed(() => props.logs)
const totalCount = computed(() => props.logs.length)
const hasData = computed(() => totalCount.value > 0)

const tableHeight = computed(() => {
  if (typeof props.height === 'number') {
    return `${props.height}px`
  }
  return props.height
})

// 模拟统计数据
const stats = computed(() => {
  if (!hasData.value) return null

  return {
    total_count: totalCount.value,
    high_risk_count: getHighRiskCount(),
    today_count: getTodayCount(),
    unique_users: getUniqueUsersCount()
  }
})

// 工具函数
function getRowKey(row: any) {
  return row.id
}

function isRowSelectable(row: any) {
  if (props.type === 'anomaly') {
    return !row.is_confirmed && !row.is_false_positive
  }
  return true
}

function getRiskLevel(row: any) {
  return row.risk_level || row.severity || 'low'
}

function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN')
}

function getRelativeTime(time: string) {
  return formatLogTime(time)
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function getDurationClass(ms: number) {
  if (ms > 5000) return 'duration-slow'
  if (ms > 1000) return 'duration-medium'
  return 'duration-fast'
}

function getMethodTagType(method: string) {
  switch (method?.toUpperCase()) {
    case 'GET': return 'primary'
    case 'POST': return 'success'
    case 'PUT': return 'warning'
    case 'DELETE': return 'danger'
    default: return 'info'
  }
}

function getStatusTagType(status: number) {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400 && status < 500) return 'danger'
  if (status >= 500) return 'danger'
  return 'info'
}

function getLoginStatusType(status: string) {
  switch (status?.toLowerCase()) {
    case 'success': return 'success'
    case 'failed': return 'danger'
    case 'blocked': return 'warning'
    default: return 'info'
  }
}

function getUserAvatar(userId: number) {
  // 实际项目中应该从用户服务获取头像
  return `/api/users/${userId}/avatar`
}

function getHighRiskCount() {
  return displayLogs.value.filter(log => {
    const riskLevel = getRiskLevel(log)
    return riskLevel === 'high' || riskLevel === 'critical'
  }).length
}

function getTodayCount() {
  const today = new Date().toDateString()
  return displayLogs.value.filter(log => {
    return new Date(log.created_at).toDateString() === today
  }).length
}

function getUniqueUsersCount() {
  const userIds = new Set(displayLogs.value.map(log => log.user_id))
  return userIds.size
}

// 事件处理
function handleRefresh() {
  lastUpdateTime.value = new Date().toLocaleString('zh-CN')
  emit('refresh')
}

function handleExport() {
  exportDialogVisible.value = true
}

function handleConfirmExport(options: any) {
  emit('export', options)
  exportDialogVisible.value = false
}

function handleSelectionChange(logs: any[]) {
  selectedLogs.value = logs
  emit('selectionChange', logs)
}

function handleRowClick(row: any) {
  if (props.selectable) return
  handleViewDetails(row)
}

function handleViewDetails(log: any) {
  selectedLog.value = log
  detailDrawerVisible.value = true
  emit('viewDetails', log)
}

function handleCloseDetails() {
  selectedLog.value = null
  detailDrawerVisible.value = false
}

function handleSortChange(sort: any) {
  emit('sortChange', sort)
}

function handlePageChange(page: number) {
  currentPage.value = page
  emit('pageChange', page)
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  emit('pageSizeChange', size)
}

function handleRealTimeToggle(enabled: boolean) {
  realTimeEnabled.value = enabled
  if (enabled) {
    ElMessage.success('已开启实时更新')
  } else {
    ElMessage.info('已关闭实时更新')
  }
}

function toggleDetails() {
  showDetails.value = !showDetails.value
}

function toggleVirtualScroll() {
  virtualScroll.value = !virtualScroll.value
}

function resetColumns() {
  ElMessage.success('列设置已重置')
}

// 异常检测操作
async function handleConfirmAnomaly(anomaly: AnomalyDetection) {
  try {
    await ElMessageBox.confirm(
      '确定要将此异常标记为真实威胁吗？',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('confirmAnomaly', anomaly)
  } catch {
    // 用户取消
  }
}

async function handleMarkFalsePositive(anomaly: AnomalyDetection) {
  try {
    await ElMessageBox.confirm(
      '确定要将此异常标记为误报吗？',
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('markFalsePositive', anomaly)
  } catch {
    // 用户取消
  }
}

async function handleBatchConfirm() {
  if (selectedLogs.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要批量确认 ${selectedLogs.value.length} 条异常为真实威胁吗？`,
      '批量确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    for (const anomaly of selectedLogs.value) {
      emit('confirmAnomaly', anomaly)
    }

    selectedLogs.value = []
  } catch {
    // 用户取消
  }
}

async function handleBatchFalsePositive() {
  if (selectedLogs.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要批量标记 ${selectedLogs.value.length} 条异常为误报吗？`,
      '批量标记误报',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    for (const anomaly of selectedLogs.value) {
      emit('markFalsePositive', anomaly)
    }

    selectedLogs.value = []
  } catch {
    // 用户取消
  }
}

// 登录日志操作
function handleMarkSuspicious(login: LoginLog, suspicious: boolean) {
  emit('markSuspicious', login, suspicious)
}

// 监听器
watch(() => props.logs, () => {
  lastUpdateTime.value = new Date().toLocaleString('zh-CN')
})
</script>

<style lang="scss" scoped>
.log-table {
  .log-table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .batch-actions {
        display: flex;
        gap: 8px;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }

  .log-stats {
    margin-bottom: 16px;

    .stat-card {
      :deep(.el-card__body) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
      }

      .stat-content {
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: var(--el-color-primary);

          &.high-risk {
            color: var(--el-color-danger);
          }
        }

        .stat-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-top: 4px;
        }
      }

      .stat-icon {
        font-size: 32px;
        color: var(--el-color-primary-light-3);
      }
    }
  }

  .log-table-main {
    .time-cell {
      .time-main {
        font-size: 13px;
        color: var(--el-text-color-primary);
      }

      .time-relative {
        font-size: 11px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 8px;

      .user-info {
        .user-name {
          font-size: 13px;
          color: var(--el-text-color-primary);
        }

        .user-id {
          font-size: 11px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .resource-cell {
      .resource-type {
        font-size: 13px;
        color: var(--el-color-primary);
        font-weight: 500;
      }

      .resource-name {
        font-size: 12px;
        color: var(--el-text-color-primary);
        margin-top: 2px;
      }

      .resource-id {
        font-size: 11px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }
    }

    .ip-cell {
      .ip-address {
        font-family: monospace;
        font-size: 13px;
      }
    }

    .anomaly-description {
      font-size: 13px;
      line-height: 1.4;
    }

    .duration-fast {
      color: var(--el-color-success);
    }

    .duration-medium {
      color: var(--el-color-warning);
    }

    .duration-slow {
      color: var(--el-color-danger);
    }

    .action-buttons {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .text-muted {
      color: var(--el-text-color-placeholder);
    }
  }

  .log-table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;

    .footer-info {
      .last-update {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// 深度选择器样式
:deep(.el-table__row) {
  cursor: pointer;

  &:hover {
    background-color: var(--el-table-row-hover-bg-color);
  }
}

:deep(.el-table__expanded-cell) {
  padding: 16px;
  background-color: var(--el-bg-color-page);
}
</style>