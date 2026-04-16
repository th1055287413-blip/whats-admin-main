import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { auditApi } from '@/api/audit'
import type {
  // 基础类型
  OperationLog,
  LoginLog,
  AnomalyDetection,
  LogArchive,
  AuditReport,

  // 查询类型
  OperationLogQuery,
  LoginLogQuery,
  AnomalyDetectionQuery,

  // 统计类型
  OperationLogStats,
  LoginLogStats,
  AnomalyDetectionStats,
  ComplianceMetrics,

  // 状态类型
  AuditState,
  LogFilter,
  QuickFilter,

  // 枚举
  OperationType,
  RiskLevel,
  LoginStatus,
  AnomalySeverity
} from '@/types/audit'

export const useAuditStore = defineStore('audit', () => {
  // ================================
  // 状态管理
  // ================================

  // 操作日志状态
  const operationLogs = ref<OperationLog[]>([])
  const operationLogsTotal = ref(0)
  const operationLogsLoading = ref(false)
  const currentOperationQuery = reactive<OperationLogQuery>({
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // 登录日志状态
  const loginLogs = ref<LoginLog[]>([])
  const loginLogsTotal = ref(0)
  const loginLogsLoading = ref(false)
  const currentLoginQuery = reactive<LoginLogQuery>({
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // 异常检测状态
  const anomalyDetections = ref<AnomalyDetection[]>([])
  const anomalyDetectionsTotal = ref(0)
  const anomalyDetectionsLoading = ref(false)
  const currentAnomalyQuery = reactive<AnomalyDetectionQuery>({
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // 当前选中的日志
  const selectedLog = ref<OperationLog | LoginLog | AnomalyDetection | null>(null)

  // 筛选器状态
  const filters = reactive<LogFilter>({})
  const quickFilters = ref<QuickFilter[]>([
    { label: '最近1小时', value: '1h', type: 'time', active: false },
    { label: '最近24小时', value: '24h', type: 'time', active: false },
    { label: '最近7天', value: '7d', type: 'time', active: true },
    { label: '最近30天', value: '30d', type: 'time', active: false },
    { label: '高风险', value: 'high', type: 'risk', active: false },
    { label: '中风险', value: 'medium', type: 'risk', active: false },
    { label: '敏感操作', value: 'sensitive', type: 'operation', active: false }
  ])

  // 统计数据
  const operationStats = ref<OperationLogStats | null>(null)
  const loginStats = ref<LoginLogStats | null>(null)
  const anomalyStats = ref<AnomalyDetectionStats | null>(null)
  const complianceMetrics = ref<ComplianceMetrics | null>(null)

  // 实时更新状态
  const realTimeEnabled = ref(false)
  const lastUpdateTime = ref<string | null>(null)
  const realTimeInterval = ref<number | null>(null)

  // 归档状态
  const archives = ref<LogArchive[]>([])
  const archivesLoading = ref(false)

  // 报告状态
  const reports = ref<AuditReport[]>([])
  const reportsLoading = ref(false)

  // ================================
  // 计算属性
  // ================================

  const totalLogs = computed(() => {
    return operationLogsTotal.value + loginLogsTotal.value + anomalyDetectionsTotal.value
  })

  const isLoading = computed(() => {
    return operationLogsLoading.value || loginLogsLoading.value || anomalyDetectionsLoading.value
  })

  const highRiskAnomalies = computed(() => {
    return anomalyDetections.value.filter(anomaly =>
      anomaly.severity === 'critical' || anomaly.severity === 'error'
    )
  })

  const unhandledAnomalies = computed(() => {
    return anomalyDetections.value.filter(anomaly =>
      !anomaly.is_confirmed && !anomaly.is_false_positive
    )
  })

  const activeFiltersCount = computed(() => {
    return quickFilters.value.filter(filter => filter.active).length
  })

  const hasRealTimeData = computed(() => {
    return realTimeEnabled.value && lastUpdateTime.value !== null
  })

  // ================================
  // 操作日志相关方法
  // ================================

  async function fetchOperationLogs(query?: Partial<OperationLogQuery>) {
    operationLogsLoading.value = true

    try {
      // 合并查询参数
      const finalQuery = { ...currentOperationQuery, ...query }

      const response = await auditApi.operations.getOperationLogs(finalQuery)

      if (response.code === 200) {
        operationLogs.value = response.data.items
        operationLogsTotal.value = response.data.total

        // 更新当前查询参数
        Object.assign(currentOperationQuery, finalQuery)
      }
    } catch (error) {
      console.error('Failed to fetch operation logs:', error)
      ElMessage.error('获取操作日志失败')
    } finally {
      operationLogsLoading.value = false
    }
  }

  async function fetchOperationLogStats(params?: {
    start_time?: string
    end_time?: string
    user_id?: number
  }) {
    try {
      const response = await auditApi.operations.getOperationLogStats(params)

      if (response.code === 200) {
        operationStats.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch operation log stats:', error)
    }
  }

  async function exportOperationLogs(options: {
    format: 'csv' | 'excel' | 'pdf'
    filename?: string
  }) {
    try {
      const response = await auditApi.operations.exportOperationLogs({
        format: options.format,
        filename: options.filename || `operation_logs_${Date.now()}`,
        filters: filters
      })

      if (response.code === 200) {
        // 触发下载
        const downloadUrl = response.data.download_url
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = options.filename || 'operation_logs'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        ElMessage.success('导出成功')
      }
    } catch (error) {
      console.error('Failed to export operation logs:', error)
      ElMessage.error('导出失败')
    }
  }

  // ================================
  // 登录日志相关方法
  // ================================

  async function fetchLoginLogs(query?: Partial<LoginLogQuery>) {
    loginLogsLoading.value = true

    try {
      const finalQuery = { ...currentLoginQuery, ...query }

      const response = await auditApi.logins.getLoginLogs(finalQuery)

      if (response.code === 200) {
        loginLogs.value = response.data.items
        loginLogsTotal.value = response.data.total

        Object.assign(currentLoginQuery, finalQuery)
      }
    } catch (error) {
      console.error('Failed to fetch login logs:', error)
      ElMessage.error('获取登录日志失败')
    } finally {
      loginLogsLoading.value = false
    }
  }

  async function fetchLoginLogStats(params?: {
    start_time?: string
    end_time?: string
    user_id?: number
  }) {
    try {
      const response = await auditApi.logins.getLoginLogStats(params)

      if (response.code === 200) {
        loginStats.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch login log stats:', error)
    }
  }

  async function markSuspiciousLogin(id: number, suspicious: boolean) {
    try {
      const response = await auditApi.logins.markSuspiciousLogin(id, suspicious)

      if (response.code === 200) {
        // 更新本地状态
        const log = loginLogs.value.find(log => log.id === id)
        if (log) {
          log.is_suspicious = suspicious
        }

        ElMessage.success(suspicious ? '已标记为可疑登录' : '已取消可疑标记')
      }
    } catch (error) {
      console.error('Failed to mark suspicious login:', error)
      ElMessage.error('操作失败')
    }
  }

  // ================================
  // 异常检测相关方法
  // ================================

  async function fetchAnomalyDetections(query?: Partial<AnomalyDetectionQuery>) {
    anomalyDetectionsLoading.value = true

    try {
      const finalQuery = { ...currentAnomalyQuery, ...query }

      const response = await auditApi.anomalies.getAnomalyDetections(finalQuery)

      if (response.code === 200) {
        anomalyDetections.value = response.data.items
        anomalyDetectionsTotal.value = response.data.total

        Object.assign(currentAnomalyQuery, finalQuery)
      }
    } catch (error) {
      console.error('Failed to fetch anomaly detections:', error)
      ElMessage.error('获取异常检测记录失败')
    } finally {
      anomalyDetectionsLoading.value = false
    }
  }

  async function fetchAnomalyDetectionStats(params?: {
    start_time?: string
    end_time?: string
    user_id?: number
  }) {
    try {
      const response = await auditApi.anomalies.getAnomalyDetectionStats(params)

      if (response.code === 200) {
        anomalyStats.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch anomaly detection stats:', error)
    }
  }

  async function confirmAnomaly(id: number, note?: string) {
    try {
      const response = await auditApi.anomalies.confirmAnomaly(id, note)

      if (response.code === 200) {
        // 更新本地状态
        const anomaly = anomalyDetections.value.find(item => item.id === id)
        if (anomaly) {
          anomaly.is_confirmed = true
          anomaly.handled_at = new Date().toISOString()
          anomaly.handling_note = note
        }

        ElMessage.success('已确认异常为真实威胁')
      }
    } catch (error) {
      console.error('Failed to confirm anomaly:', error)
      ElMessage.error('确认失败')
    }
  }

  async function markFalsePositive(id: number, note?: string) {
    try {
      const response = await auditApi.anomalies.markFalsePositive(id, note)

      if (response.code === 200) {
        // 更新本地状态
        const anomaly = anomalyDetections.value.find(item => item.id === id)
        if (anomaly) {
          anomaly.is_false_positive = true
          anomaly.handled_at = new Date().toISOString()
          anomaly.handling_note = note
        }

        ElMessage.success('已标记为误报')
      }
    } catch (error) {
      console.error('Failed to mark false positive:', error)
      ElMessage.error('标记失败')
    }
  }

  // ================================
  // 合规相关方法
  // ================================

  async function fetchComplianceMetrics(period?: {
    start: string
    end: string
  }) {
    try {
      const response = await auditApi.compliance.getComplianceMetrics(period)

      if (response.code === 200) {
        complianceMetrics.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch compliance metrics:', error)
    }
  }

  async function generateComplianceReport(data: {
    type: 'GDPR' | 'ISO27001' | 'SOC2' | 'EQUALBANK_LEVEL2'
    period_start: string
    period_end: string
  }) {
    try {
      const response = await auditApi.compliance.generateComplianceReport(data)

      if (response.code === 200) {
        ElMessage.success('合规报告生成成功')
        return response.data
      }
    } catch (error) {
      console.error('Failed to generate compliance report:', error)
      ElMessage.error('生成合规报告失败')
      throw error
    }
  }

  // ================================
  // 筛选器相关方法
  // ================================

  function applyQuickFilter(filter: QuickFilter) {
    // 取消其他同类型筛选器
    quickFilters.value.forEach(f => {
      if (f.type === filter.type && f !== filter) {
        f.active = false
      }
    })

    filter.active = !filter.active

    // 应用筛选器到查询参数
    applyFiltersToQuery()
  }

  function clearAllFilters() {
    quickFilters.value.forEach(filter => {
      filter.active = false
    })

    Object.keys(filters).forEach(key => {
      delete (filters as any)[key]
    })

    applyFiltersToQuery()
  }

  function applyFiltersToQuery() {
    const timeFilter = quickFilters.value.find(f => f.type === 'time' && f.active)
    const riskFilter = quickFilters.value.find(f => f.type === 'risk' && f.active)

    // 应用时间筛选器
    if (timeFilter) {
      const now = new Date()
      let startTime: Date

      switch (timeFilter.value) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }

      filters.time_range = {
        start: startTime.toISOString(),
        end: now.toISOString()
      }
    } else {
      delete filters.time_range
    }

    // 应用风险筛选器
    if (riskFilter) {
      filters.risk_levels = [riskFilter.value as RiskLevel]
    } else {
      delete filters.risk_levels
    }

    // 刷新数据
    refreshCurrentView()
  }

  function updateCustomFilter(key: keyof LogFilter, value: any) {
    if (value === null || value === undefined || value === '') {
      delete (filters as any)[key]
    } else {
      (filters as any)[key] = value
    }

    applyFiltersToQuery()
  }

  // ================================
  // 实时数据相关方法
  // ================================

  function enableRealTime() {
    if (realTimeEnabled.value) return

    realTimeEnabled.value = true

    // 每30秒刷新一次数据
    realTimeInterval.value = window.setInterval(() => {
      refreshCurrentView()
      lastUpdateTime.value = new Date().toISOString()
    }, 30000)

    ElNotification({
      title: '实时监控',
      message: '已开启实时数据监控',
      type: 'success',
      duration: 2000
    })
  }

  function disableRealTime() {
    if (!realTimeEnabled.value) return

    realTimeEnabled.value = false

    if (realTimeInterval.value) {
      clearInterval(realTimeInterval.value)
      realTimeInterval.value = null
    }

    ElNotification({
      title: '实时监控',
      message: '已关闭实时数据监控',
      type: 'info',
      duration: 2000
    })
  }

  async function fetchRealTimeStats() {
    try {
      const response = await auditApi.realtime.getRealTimeStats()

      if (response.code === 200) {
        return response.data
      }
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error)
    }
  }

  // ================================
  // 工具方法
  // ================================

  function refreshCurrentView() {
    // 根据当前页面刷新对应数据
    fetchOperationLogs()
    fetchLoginLogs()
    fetchAnomalyDetections()
  }

  function selectLog(log: OperationLog | LoginLog | AnomalyDetection) {
    selectedLog.value = log
  }

  function clearSelection() {
    selectedLog.value = null
  }

  async function searchLogs(query: string, options?: {
    type?: 'operation' | 'login' | 'anomaly'
    limit?: number
  }) {
    try {
      const response = await auditApi.search.searchLogs(query, {
        filters: filters,
        ...options
      })

      if (response.code === 200) {
        return response.data
      }
    } catch (error) {
      console.error('Failed to search logs:', error)
      ElMessage.error('搜索失败')
    }
  }

  function reset() {
    // 重置所有状态
    operationLogs.value = []
    loginLogs.value = []
    anomalyDetections.value = []
    selectedLog.value = null

    Object.keys(filters).forEach(key => {
      delete (filters as any)[key]
    })

    quickFilters.value.forEach(filter => {
      filter.active = filter.value === '7d' && filter.type === 'time'
    })

    disableRealTime()
  }

  // ================================
  // 返回状态和方法
  // ================================

  return {
    // 状态
    operationLogs,
    operationLogsTotal,
    operationLogsLoading,
    currentOperationQuery,

    loginLogs,
    loginLogsTotal,
    loginLogsLoading,
    currentLoginQuery,

    anomalyDetections,
    anomalyDetectionsTotal,
    anomalyDetectionsLoading,
    currentAnomalyQuery,

    selectedLog,
    filters,
    quickFilters,

    operationStats,
    loginStats,
    anomalyStats,
    complianceMetrics,

    realTimeEnabled,
    lastUpdateTime,

    archives,
    archivesLoading,
    reports,
    reportsLoading,

    // 计算属性
    totalLogs,
    isLoading,
    highRiskAnomalies,
    unhandledAnomalies,
    activeFiltersCount,
    hasRealTimeData,

    // 操作日志方法
    fetchOperationLogs,
    fetchOperationLogStats,
    exportOperationLogs,

    // 登录日志方法
    fetchLoginLogs,
    fetchLoginLogStats,
    markSuspiciousLogin,

    // 异常检测方法
    fetchAnomalyDetections,
    fetchAnomalyDetectionStats,
    confirmAnomaly,
    markFalsePositive,

    // 合规方法
    fetchComplianceMetrics,
    generateComplianceReport,

    // 筛选器方法
    applyQuickFilter,
    clearAllFilters,
    updateCustomFilter,

    // 实时数据方法
    enableRealTime,
    disableRealTime,
    fetchRealTimeStats,

    // 工具方法
    refreshCurrentView,
    selectLog,
    clearSelection,
    searchLogs,
    reset
  }
})

export default useAuditStore