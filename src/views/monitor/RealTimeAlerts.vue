<template>
  <div class="realtime-alerts">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>实时告警</h2>
        <el-text type="info">实时监控系统告警信息</el-text>
      </div>
      <div class="header-right">
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          @change="handleAutoRefreshToggle"
        />
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <el-button :icon="Bell" circle />
        </el-badge>
      </div>
    </div>

    <!-- 告警统计面板 -->
    <div class="alert-stats-panel">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="never" class="stat-card critical">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="28"><Warning /></el-icon>
              </div>
              <div class="stat-data">
                <div class="stat-number">{{ criticalAlerts }}</div>
                <div class="stat-label">严重告警</div>
                <div class="stat-trend">
                  <el-icon><TrendCharts /></el-icon>
                  <span>+{{ criticalTrend }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-card error">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="28"><CircleCloseFilled /></el-icon>
              </div>
              <div class="stat-data">
                <div class="stat-number">{{ errorAlerts }}</div>
                <div class="stat-label">错误告警</div>
                <div class="stat-trend">
                  <el-icon><TrendCharts /></el-icon>
                  <span>+{{ errorTrend }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-card warning">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="28"><WarningFilled /></el-icon>
              </div>
              <div class="stat-data">
                <div class="stat-number">{{ warningAlerts }}</div>
                <div class="stat-label">警告告警</div>
                <div class="stat-trend">
                  <el-icon><TrendCharts /></el-icon>
                  <span>+{{ warningTrend }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-card info">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="28"><InfoFilled /></el-icon>
              </div>
              <div class="stat-data">
                <div class="stat-number">{{ infoAlerts }}</div>
                <div class="stat-label">信息告警</div>
                <div class="stat-trend">
                  <el-icon><TrendCharts /></el-icon>
                  <span>+{{ infoTrend }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧：告警面板 -->
      <el-col :span="18">
        <AlertPanel
          :alerts="alerts"
          :stats="alertStats"
          :loading="loading"
          :height="'calc(100vh - 400px)'"
          :show-stats="false"
          :auto-refresh="autoRefresh"
          :refresh-interval="10000"
          @refresh="handleRefresh"
          @alert-click="handleAlertClick"
          @mark-read="handleMarkRead"
          @mark-handled="handleMarkHandled"
          @batch-mark-read="handleBatchMarkRead"
          @batch-handle="handleBatchHandle"
        />
      </el-col>

      <!-- 右侧：实时信息 -->
      <el-col :span="6">
        <div class="side-panel">
          <!-- 系统健康状态 -->
          <el-card shadow="never" class="health-card">
            <template #header>
              <div class="card-header">
                <span>系统健康状态</span>
                <el-button
                  size="small"
                  :icon="Refresh"
                  @click="handleRefreshHealth"
                  :loading="healthLoading"
                />
              </div>
            </template>
            <div class="health-status">
              <div class="health-item">
                <div class="health-label">整体状态</div>
                <el-tag
                  :type="getHealthTagType(systemHealth.status)"
                  size="large"
                >
                  {{ getHealthLabel(systemHealth.status) }}
                </el-tag>
              </div>
              <div class="health-services">
                <div
                  v-for="(status, service) in systemHealth.services"
                  :key="service"
                  class="service-item"
                >
                  <span class="service-name">{{ getServiceLabel(service) }}</span>
                  <el-icon
                    :color="status ? '#67C23A' : '#F56C6C'"
                    size="16"
                  >
                    <Check v-if="status" />
                    <Close v-else />
                  </el-icon>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 实时告警流 -->
          <el-card shadow="never" class="stream-card">
            <template #header>
              <div class="card-header">
                <span>实时告警流</span>
                <el-switch
                  v-model="alertStream"
                  size="small"
                  @change="handleStreamToggle"
                />
              </div>
            </template>
            <div class="alert-stream" ref="streamContainer">
              <div
                v-for="alert in realtimeAlerts"
                :key="alert.timestamp"
                class="stream-item"
                :class="`stream-${alert.severity}`"
              >
                <div class="stream-time">
                  {{ formatStreamTime(alert.timestamp) }}
                </div>
                <div class="stream-content">
                  <div class="stream-title">{{ alert.title }}</div>
                  <div class="stream-desc">{{ alert.description }}</div>
                </div>
                <div class="stream-severity">
                  <el-tag
                    :type="getSeverityTagType(alert.severity)"
                    size="small"
                  >
                    {{ getSeverityLabel(alert.severity) }}
                  </el-tag>
                </div>
              </div>

              <div v-if="realtimeAlerts.length === 0" class="no-stream">
                <el-text type="info">暂无实时告警</el-text>
              </div>
            </div>
          </el-card>

          <!-- 告警统计图表 -->
          <el-card shadow="never" class="chart-card">
            <template #header>
              <span>24小时告警趋势</span>
            </template>
            <div class="mini-chart" ref="chartContainer">
              <!-- 这里可以放置简单的图表 -->
              <canvas ref="chartCanvas" width="100%" height="120"></canvas>
            </div>
          </el-card>

          <!-- 快速操作 -->
          <el-card shadow="never" class="actions-card">
            <template #header>
              <span>快速操作</span>
            </template>
            <div class="quick-actions">
              <el-button
                type="primary"
                :icon="Download"
                @click="handleExportAlerts"
                block
              >
                导出告警报告
              </el-button>
              <el-button
                type="success"
                :icon="Check"
                @click="handleMarkAllRead"
                :disabled="unreadCount === 0"
                block
              >
                全部标记已读
              </el-button>
              <el-button
                type="warning"
                :icon="Setting"
                @click="handleAlertSettings"
                block
              >
                告警设置
              </el-button>
              <el-button
                type="info"
                :icon="Monitor"
                @click="handleSystemMonitor"
                block
              >
                系统监控
              </el-button>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 告警设置对话框 -->
    <el-dialog
      v-model="settingsVisible"
      title="告警设置"
      width="60%"
      destroy-on-close
    >
      <AlertSettings
        v-if="settingsVisible"
        @save="handleSettingsSave"
        @cancel="settingsVisible = false"
      />
    </el-dialog>

    <!-- 系统监控对话框 -->
    <el-dialog
      v-model="monitorVisible"
      title="系统监控"
      width="80%"
      destroy-on-close
      fullscreen
    >
      <SystemMonitor
        v-if="monitorVisible"
        @close="monitorVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  Warning,
  CircleCloseFilled,
  WarningFilled,
  InfoFilled,
  TrendCharts,
  Check,
  Close,
  Refresh,
  Download,
  Setting,
  Monitor
} from '@element-plus/icons-vue'
import { useMonitorStore } from '@/stores/monitor'
import { useRealTimeData } from '@/composables/useRealTimeData'
import AlertPanel from '@/components/monitor/AlertPanel.vue'
import type {
  RealTimeAlert,
  AlertStats,
  AlertData,
  AlertSeverity
} from '@/types/monitor'

// 模拟导入组件
// import AlertSettings from '@/components/monitor/AlertSettings.vue'
// import SystemMonitor from '@/components/monitor/SystemMonitor.vue'

// Store和数据管理
const monitorStore = useMonitorStore()
const realTimeData = useRealTimeData()

// 组件状态
const autoRefresh = ref(true)
const alertStream = ref(true)
const healthLoading = ref(false)
const settingsVisible = ref(false)
const monitorVisible = ref(false)
const streamContainer = ref<HTMLElement>()
const chartContainer = ref<HTMLElement>()
const chartCanvas = ref<HTMLCanvasElement>()

// 从store获取状态
const { alerts } = monitorStore
const loading = computed(() => alerts.loading)
const alertStats = computed(() => alerts.stats)

// 实时数据
const { getLatestAlerts, getCriticalAlerts } = realTimeData

// 自动刷新计时器
let refreshTimer: number | null = null

// 模拟系统健康状态
const systemHealth = ref({
  status: 'healthy' as 'healthy' | 'warning' | 'error',
  services: {
    database: true,
    websocket: true,
    sensitiveEngine: true,
    cache: true
  }
})

// 计算属性
const unreadCount = computed(() =>
  alerts.data.filter(alert => !alert.isRead).length
)

const criticalAlerts = computed(() =>
  alertStats.value?.alertsBySeverity?.critical || 0
)

const errorAlerts = computed(() =>
  alertStats.value?.alertsBySeverity?.error || 0
)

const warningAlerts = computed(() =>
  alertStats.value?.alertsBySeverity?.warning || 0
)

const infoAlerts = computed(() =>
  alertStats.value?.alertsBySeverity?.info || 0
)

// 模拟趋势数据
const criticalTrend = computed(() => Math.floor(Math.random() * 10))
const errorTrend = computed(() => Math.floor(Math.random() * 15))
const warningTrend = computed(() => Math.floor(Math.random() * 20))
const infoTrend = computed(() => Math.floor(Math.random() * 25))

const realtimeAlerts = computed(() => {
  if (!alertStream.value) return []
  return getLatestAlerts(20)
})

// 事件处理
const handleAutoRefreshToggle = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const handleRefresh = () => {
  monitorStore.fetchAlerts()
}

const handleRefreshHealth = async () => {
  healthLoading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    // 随机更新健康状态
    const statuses = ['healthy', 'warning', 'error'] as const
    systemHealth.value.status = statuses[Math.floor(Math.random() * statuses.length)]
  } finally {
    healthLoading.value = false
  }
}

const handleAlertClick = (alert: RealTimeAlert) => {
  console.log('Alert clicked:', alert)
}

const handleMarkRead = (alertId: number) => {
  monitorStore.markAlertAsRead(alertId)
}

const handleMarkHandled = (alertId: number, comment?: string) => {
  monitorStore.handleAlert(alertId, comment)
}

const handleBatchMarkRead = (alertIds: number[]) => {
  // 批量标记已读
  alertIds.forEach(id => monitorStore.markAlertAsRead(id))
  ElMessage.success(`已标记 ${alertIds.length} 条告警为已读`)
}

const handleBatchHandle = (alertIds: number[], comment?: string) => {
  // 批量处理
  alertIds.forEach(id => monitorStore.handleAlert(id, comment))
  ElMessage.success(`已处理 ${alertIds.length} 条告警`)
}

const handleStreamToggle = (enabled: boolean) => {
  if (enabled) {
    ElMessage.success('实时告警流已启用')
  } else {
    ElMessage.info('实时告警流已禁用')
  }
}

const handleExportAlerts = () => {
  ElMessage.info('导出功能开发中...')
}

const handleMarkAllRead = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要标记所有 ${unreadCount.value} 条未读告警为已读吗？`,
      '确认操作',
      { type: 'warning' }
    )

    const unreadAlerts = alerts.data.filter(alert => !alert.isRead)
    const alertIds = unreadAlerts.map(alert => alert.id)
    handleBatchMarkRead(alertIds)
  } catch {
    // 用户取消
  }
}

const handleAlertSettings = () => {
  settingsVisible.value = true
}

const handleSystemMonitor = () => {
  monitorVisible.value = true
}

const handleSettingsSave = (settings: any) => {
  console.log('Settings saved:', settings)
  settingsVisible.value = false
  ElMessage.success('告警设置已保存')
}

// 工具函数
const getHealthLabel = (status: string) => {
  const labels = {
    healthy: '健康',
    warning: '警告',
    error: '异常'
  }
  return labels[status as keyof typeof labels] || status
}

const getHealthTagType = (status: string) => {
  const types = {
    healthy: 'success',
    warning: 'warning',
    error: 'danger'
  }
  return types[status as keyof typeof types] || 'info'
}

const getServiceLabel = (service: string) => {
  const labels = {
    database: '数据库',
    websocket: 'WebSocket',
    sensitiveEngine: '敏感词引擎',
    cache: '缓存系统'
  }
  return labels[service as keyof typeof labels] || service
}

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

const formatStreamTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 自动刷新
const startAutoRefresh = () => {
  if (refreshTimer) return

  refreshTimer = window.setInterval(() => {
    if (!loading.value) {
      handleRefresh()
    }
  }, 30000) // 30秒刷新一次
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 绘制简单图表
const drawChart = () => {
  nextTick(() => {
    if (!chartCanvas.value) return

    const canvas = chartCanvas.value
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 模拟数据
    const data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 50))
    const maxValue = Math.max(...data)
    const width = canvas.width
    const height = canvas.height
    const barWidth = width / data.length

    // 绘制柱状图
    ctx.fillStyle = '#409EFF'
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * height * 0.8
      const x = index * barWidth
      const y = height - barHeight

      ctx.fillRect(x, y, barWidth - 2, barHeight)
    })
  })
}

// 滚动到最新告警
const scrollToLatest = () => {
  nextTick(() => {
    if (streamContainer.value) {
      streamContainer.value.scrollTop = streamContainer.value.scrollHeight
    }
  })
}

// 监听实时告警变化
watch(realtimeAlerts, (newAlerts) => {
  if (newAlerts.length > 0) {
    scrollToLatest()
  }
}, { deep: true })

// 生命周期
onMounted(async () => {
  await monitorStore.fetchAlerts()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
  drawChart()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.realtime-alerts {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.alert-stats-panel {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
  border: none;
  overflow: hidden;
}

.stat-card.critical {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
}

.stat-card.error {
  background: linear-gradient(135deg, #ffa726 0%, #ff9800 100%);
  color: white;
}

.stat-card.warning {
  background: linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%);
  color: white;
}

.stat-card.info {
  background: linear-gradient(135deg, #42a5f5 0%, #2196f3 100%);
  color: white;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 16px;
}

.stat-icon {
  margin-right: 16px;
  opacity: 0.9;
}

.stat-data {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-trend {
  display: flex;
  align-items: center;
  font-size: 12px;
  opacity: 0.8;
}

.stat-trend .el-icon {
  margin-right: 4px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.health-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.health-label {
  font-weight: 500;
  color: #303133;
}

.health-services {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.service-name {
  font-size: 14px;
  color: #606266;
}

.alert-stream {
  max-height: 300px;
  overflow-y: auto;
}

.stream-item {
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 3px solid;
  background: #f8f9fa;
  transition: all 0.3s;
}

.stream-item.stream-critical {
  border-left-color: #f56c6c;
  background: #fef0f0;
}

.stream-item.stream-error {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.stream-item.stream-warning {
  border-left-color: #e6a23c;
  background: #fdf6ec;
}

.stream-item.stream-info {
  border-left-color: #409eff;
  background: #ecf5ff;
}

.stream-time {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.stream-content {
  margin-bottom: 6px;
}

.stream-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.stream-desc {
  font-size: 12px;
  color: #606266;
  line-height: 1.3;
}

.stream-severity {
  text-align: right;
}

.no-stream {
  text-align: center;
  padding: 40px 0;
}

.mini-chart {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.stat-card .el-card__body) {
  padding: 0;
}

/* 滚动条样式 */
.alert-stream::-webkit-scrollbar {
  width: 4px;
}

.alert-stream::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.alert-stream::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.alert-stream::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

@media (max-width: 1200px) {
  .realtime-alerts {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    align-self: stretch;
    justify-content: flex-end;
  }

  .alert-stats-panel :deep(.el-col) {
    margin-bottom: 16px;
  }
}
</style>