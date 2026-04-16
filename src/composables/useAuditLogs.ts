import { ref, computed, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useAuditStore } from '@/stores/audit'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from './usePermission'
import type {
  OperationLog,
  LoginLog,
  AnomalyDetection,
  LogFilter,
  QuickFilter,
  OperationLogQuery,
  LoginLogQuery,
  AnomalyDetectionQuery,
  ExportOptions,
  DateRange
} from '@/types/audit'

/**
 * 审计日志组合函数
 */
export function useAuditLogs() {
  const auditStore = useAuditStore()
  const { hasPermission } = usePermission()

  // ================================
  // 响应式状态
  // ================================

  // 当前视图类型
  const currentView = ref<'operation' | 'login' | 'anomaly'>('operation')

  // 搜索相关
  const searchQuery = ref('')
  const searchResults = ref<any[]>([])
  const isSearching = ref(false)

  // 导出相关
  const isExporting = ref(false)
  const exportProgress = ref(0)

  // 表格配置
  const tableConfig = reactive({
    pageSize: 20,
    currentPage: 1,
    showDetails: false,
    virtualScroll: true,
    height: '600px'
  })

  // 筛选器展开状态
  const filterExpanded = ref(false)

  // 自动刷新
  const autoRefresh = ref(false)
  const refreshInterval = ref<number | null>(null)

  // ================================
  // 计算属性
  // ================================

  const currentLogs = computed(() => {
    switch (currentView.value) {
      case 'operation':
        return auditStore.operationLogs
      case 'login':
        return auditStore.loginLogs
      case 'anomaly':
        return auditStore.anomalyDetections
      default:
        return []
    }
  })

  const currentTotal = computed(() => {
    switch (currentView.value) {
      case 'operation':
        return auditStore.operationLogsTotal
      case 'login':
        return auditStore.loginLogsTotal
      case 'anomaly':
        return auditStore.anomalyDetectionsTotal
      default:
        return 0
    }
  })

  const currentLoading = computed(() => {
    switch (currentView.value) {
      case 'operation':
        return auditStore.operationLogsLoading
      case 'login':
        return auditStore.loginLogsLoading
      case 'anomaly':
        return auditStore.anomalyDetectionsLoading
      default:
        return false
    }
  })

  const currentQuery = computed(() => {
    switch (currentView.value) {
      case 'operation':
        return auditStore.currentOperationQuery
      case 'login':
        return auditStore.currentLoginQuery
      case 'anomaly':
        return auditStore.currentAnomalyQuery
      default:
        return {}
    }
  })

  const hasSearchResults = computed(() => {
    return searchResults.value.length > 0
  })

  const displayLogs = computed(() => {
    return hasSearchResults.value ? searchResults.value : currentLogs.value
  })

  const canExport = computed(() => {
    return hasPermission('system.log_view') && currentLogs.value.length > 0
  })

  const canDelete = computed(() => {
    return hasPermission('system.admin')
  })

  const canManageAnomalies = computed(() => {
    return hasPermission('system.admin')
  })

  // ================================
  // 数据获取方法
  // ================================

  async function fetchLogs(query?: any) {
    switch (currentView.value) {
      case 'operation':
        await auditStore.fetchOperationLogs(query)
        break
      case 'login':
        await auditStore.fetchLoginLogs(query)
        break
      case 'anomaly':
        await auditStore.fetchAnomalyDetections(query)
        break
    }
  }

  async function refreshLogs() {
    await fetchLogs()
    ElMessage.success('数据已刷新')
  }

  async function loadMore() {
    const nextPage = Math.floor(currentLogs.value.length / tableConfig.pageSize) + 1

    await fetchLogs({
      ...currentQuery.value,
      page: nextPage
    })
  }

  // ================================
  // 搜索功能
  // ================================

  async function search(query?: string) {
    const searchTerm = query || searchQuery.value
    if (!searchTerm.trim()) {
      clearSearch()
      return
    }

    isSearching.value = true

    try {
      const results = await auditStore.searchLogs(searchTerm, {
        type: currentView.value,
        limit: 100
      })

      if (results) {
        searchResults.value = results.results.map(result => result.data)
        ElMessage.success(`找到 ${results.total} 条相关记录`)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      isSearching.value = false
    }
  }

  function clearSearch() {
    searchQuery.value = ''
    searchResults.value = []
  }

  // ================================
  // 筛选功能
  // ================================

  function applyQuickFilter(filter: QuickFilter) {
    auditStore.applyQuickFilter(filter)
    clearSearch() // 清除搜索结果
    fetchLogs()
  }

  function applyCustomFilter(filters: Partial<LogFilter>) {
    Object.keys(filters).forEach(key => {
      auditStore.updateCustomFilter(key as keyof LogFilter, filters[key as keyof LogFilter])
    })
    clearSearch()
  }

  function clearAllFilters() {
    auditStore.clearAllFilters()
    clearSearch()
    fetchLogs()
  }

  function applyDateRangeFilter(dateRange: DateRange | null) {
    if (dateRange) {
      auditStore.updateCustomFilter('time_range', {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString()
      })
    } else {
      auditStore.updateCustomFilter('time_range', null)
    }
  }

  // ================================
  // 分页功能
  // ================================

  function handlePageChange(page: number) {
    tableConfig.currentPage = page

    fetchLogs({
      ...currentQuery.value,
      page: page
    })
  }

  function handlePageSizeChange(size: number) {
    tableConfig.pageSize = size
    tableConfig.currentPage = 1

    fetchLogs({
      ...currentQuery.value,
      page: 1,
      page_size: size
    })
  }

  // ================================
  // 导出功能
  // ================================

  async function exportLogs(options: Partial<ExportOptions> = {}) {
    if (!canExport.value) {
      ElMessage.error('无权限导出数据')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要导出当前筛选条件下的${currentTotal.value}条记录吗？`,
        '确认导出',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      isExporting.value = true
      exportProgress.value = 0

      // 模拟导出进度
      const progressTimer = setInterval(() => {
        exportProgress.value += 10
        if (exportProgress.value >= 90) {
          clearInterval(progressTimer)
        }
      }, 200)

      const exportOptions: ExportOptions = {
        format: options.format || 'excel',
        filename: options.filename || `${currentView.value}_logs_${Date.now()}`,
        includeColumns: options.includeColumns || [],
        filters: auditStore.filters
      }

      switch (currentView.value) {
        case 'operation':
          await auditStore.exportOperationLogs(exportOptions)
          break
        case 'login':
          // 登录日志导出逻辑
          break
        case 'anomaly':
          // 异常检测导出逻辑
          break
      }

      exportProgress.value = 100

      setTimeout(() => {
        isExporting.value = false
        exportProgress.value = 0
      }, 1000)

    } catch (error) {
      if (error !== 'cancel') {
        console.error('Export failed:', error)
        ElMessage.error('导出失败')
      }
      isExporting.value = false
      exportProgress.value = 0
    }
  }

  // ================================
  // 异常检测特殊操作
  // ================================

  async function handleAnomalyAction(anomaly: AnomalyDetection, action: 'confirm' | 'false_positive', note?: string) {
    if (!canManageAnomalies.value) {
      ElMessage.error('无权限处理异常检测记录')
      return
    }

    try {
      const actionText = action === 'confirm' ? '确认为真实威胁' : '标记为误报'

      await ElMessageBox.confirm(
        `确定要${actionText}吗？${note ? `\n处理备注：${note}` : ''}`,
        '确认操作',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      if (action === 'confirm') {
        await auditStore.confirmAnomaly(anomaly.id, note)
      } else {
        await auditStore.markFalsePositive(anomaly.id, note)
      }

    } catch (error) {
      if (error !== 'cancel') {
        console.error('Anomaly action failed:', error)
      }
    }
  }

  async function batchHandleAnomalies(anomalies: AnomalyDetection[], action: 'confirm' | 'false_positive') {
    if (!canManageAnomalies.value) {
      ElMessage.error('无权限批量处理异常检测记录')
      return
    }

    try {
      const actionText = action === 'confirm' ? '确认为真实威胁' : '标记为误报'

      await ElMessageBox.confirm(
        `确定要批量${actionText} ${anomalies.length} 条记录吗？`,
        '批量操作确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      const promises = anomalies.map(anomaly => {
        return action === 'confirm'
          ? auditStore.confirmAnomaly(anomaly.id)
          : auditStore.markFalsePositive(anomaly.id)
      })

      await Promise.all(promises)
      ElMessage.success(`批量${actionText}成功`)

    } catch (error) {
      if (error !== 'cancel') {
        console.error('Batch anomaly action failed:', error)
        ElMessage.error('批量操作失败')
      }
    }
  }

  // ================================
  // 登录日志特殊操作
  // ================================

  async function markSuspiciousLogin(login: LoginLog, suspicious: boolean) {
    try {
      await auditStore.markSuspiciousLogin(login.id, suspicious)
    } catch (error) {
      console.error('Mark suspicious login failed:', error)
    }
  }

  // ================================
  // 视图切换
  // ================================

  function switchView(view: 'operation' | 'login' | 'anomaly') {
    if (currentView.value === view) return

    currentView.value = view
    clearSearch()
    tableConfig.currentPage = 1

    // 重新获取数据
    fetchLogs()
  }

  // ================================
  // 实时数据
  // ================================

  function enableAutoRefresh(interval: number = 30000) {
    if (autoRefresh.value) return

    autoRefresh.value = true
    refreshInterval.value = window.setInterval(() => {
      if (!currentLoading.value) {
        fetchLogs()
      }
    }, interval)

    ElMessage.success('已开启自动刷新')
  }

  function disableAutoRefresh() {
    if (!autoRefresh.value) return

    autoRefresh.value = false
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }

    ElMessage.info('已关闭自动刷新')
  }

  // ================================
  // 日志详情
  // ================================

  function viewLogDetails(log: OperationLog | LoginLog | AnomalyDetection) {
    auditStore.selectLog(log)
    tableConfig.showDetails = true
  }

  function closeLogDetails() {
    auditStore.clearSelection()
    tableConfig.showDetails = false
  }

  // ================================
  // 统计数据
  // ================================

  async function fetchStats(dateRange?: DateRange) {
    const params = dateRange ? {
      start_time: dateRange.start.toISOString(),
      end_time: dateRange.end.toISOString()
    } : undefined

    switch (currentView.value) {
      case 'operation':
        await auditStore.fetchOperationLogStats(params)
        break
      case 'login':
        await auditStore.fetchLoginLogStats(params)
        break
      case 'anomaly':
        await auditStore.fetchAnomalyDetectionStats(params)
        break
    }
  }

  // ================================
  // 生命周期
  // ================================

  onMounted(() => {
    // 初始化数据
    fetchLogs()
  })

  onUnmounted(() => {
    // 清理定时器
    disableAutoRefresh()
    auditStore.disableRealTime()
  })

  // ================================
  // 监听器
  // ================================

  // 监听筛选器变化，自动刷新数据
  watch(
    () => auditStore.filters,
    () => {
      if (!isSearching.value) {
        fetchLogs()
      }
    },
    { deep: true }
  )

  // 监听视图切换，重置分页
  watch(currentView, () => {
    tableConfig.currentPage = 1
  })

  // ================================
  // 返回值
  // ================================

  return {
    // 状态
    currentView,
    searchQuery,
    searchResults,
    isSearching,
    isExporting,
    exportProgress,
    tableConfig,
    filterExpanded,
    autoRefresh,

    // 计算属性
    currentLogs,
    currentTotal,
    currentLoading,
    currentQuery,
    hasSearchResults,
    displayLogs,
    canExport,
    canDelete,
    canManageAnomalies,

    // 数据获取
    fetchLogs,
    refreshLogs,
    loadMore,

    // 搜索
    search,
    clearSearch,

    // 筛选
    applyQuickFilter,
    applyCustomFilter,
    clearAllFilters,
    applyDateRangeFilter,

    // 分页
    handlePageChange,
    handlePageSizeChange,

    // 导出
    exportLogs,

    // 异常检测操作
    handleAnomalyAction,
    batchHandleAnomalies,

    // 登录日志操作
    markSuspiciousLogin,

    // 视图切换
    switchView,

    // 实时数据
    enableAutoRefresh,
    disableAutoRefresh,

    // 日志详情
    viewLogDetails,
    closeLogDetails,

    // 统计数据
    fetchStats,

    // Store 引用
    auditStore
  }
}

export default useAuditLogs

// ================================
// 工具函数
// ================================

/**
 * 格式化日志时间
 */
export function formatLogTime(time: string): string {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚'
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  }

  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  }

  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`
  }

  // 超过7天显示具体日期
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 获取风险等级颜色
 */
export function getRiskLevelColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'critical':
      return '#f56c6c'
    case 'high':
      return '#e6a23c'
    case 'medium':
      return '#409eff'
    case 'low':
      return '#67c23a'
    default:
      return '#909399'
  }
}

/**
 * 获取操作类型图标
 */
export function getOperationIcon(operation: string): string {
  switch (operation.toLowerCase()) {
    case 'create':
      return 'plus'
    case 'update':
      return 'edit'
    case 'delete':
      return 'delete'
    case 'read':
      return 'view'
    case 'execute':
      return 'lightning'
    default:
      return 'operation'
  }
}

/**
 * 获取登录状态颜色
 */
export function getLoginStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'success':
      return '#67c23a'
    case 'failed':
      return '#f56c6c'
    case 'blocked':
      return '#e6a23c'
    default:
      return '#909399'
  }
}