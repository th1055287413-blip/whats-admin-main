import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useFilesStore } from '@/stores/files'
import type {
  FileTransfer,
  FileQueryParams,
  FileTransferStats,
  SecurityStats,
  FileTransferStatus,
  FileTransferType,
  SecurityScanResult
} from '@/types/files'

export interface UseFileMonitorOptions {
  autoRefresh?: boolean
  refreshInterval?: number
  enableRealTime?: boolean
  pageSize?: number
}

export interface MonitorFilters {
  status?: FileTransferStatus[]
  transferType?: FileTransferType
  dateRange?: [string, string]
  userIds?: number[]
  fileTypes?: string[]
  sizeRange?: [number, number]
  keyword?: string
  isIntercepted?: boolean
  securityStatus?: SecurityScanResult[]
}

/**
 * 文件监控组合式函数
 */
export function useFileMonitor(options: UseFileMonitorOptions = {}) {
  const filesStore = useFilesStore()

  // 配置
  const config = {
    autoRefresh: options.autoRefresh ?? true,
    refreshInterval: options.refreshInterval || 30000, // 30秒
    enableRealTime: options.enableRealTime ?? true,
    pageSize: options.pageSize || 20
  }

  // 状态
  const loading = ref(false)
  const refreshing = ref(false)
  const error = ref<string | null>(null)
  const lastRefreshTime = ref<Date | null>(null)

  // 筛选器状态
  const filters = reactive<MonitorFilters>({})
  const quickFilters = ref<string[]>([])

  // 定时器
  const refreshTimer = ref<NodeJS.Timeout | null>(null)

  // 实时状态
  const realTimeStats = ref({
    activeUploads: 0,
    uploadSpeed: 0,
    queueSize: 0,
    errorRate: 0,
    systemLoad: 0
  })

  // 时间范围预设
  const timeRanges = [
    { label: '最近1小时', value: 'last_hour' },
    { label: '今天', value: 'today' },
    { label: '昨天', value: 'yesterday' },
    { label: '最近7天', value: 'last_week' },
    { label: '最近30天', value: 'last_month' },
    { label: '自定义', value: 'custom' }
  ]

  // 状态选项
  const statusOptions = [
    { label: '等待中', value: 'pending', color: 'warning' },
    { label: '上传中', value: 'uploading', color: 'primary' },
    { label: '已完成', value: 'completed', color: 'success' },
    { label: '失败', value: 'failed', color: 'danger' },
    { label: '已拦截', value: 'blocked', color: 'danger' },
    { label: '已暂停', value: 'paused', color: 'info' },
    { label: '已取消', value: 'cancelled', color: 'info' }
  ]

  // 计算属性
  const transfers = computed(() => filesStore.transfers)
  const activeTransfers = computed(() => filesStore.activeTransfers)
  const pagination = computed(() => filesStore.pagination)
  const transferStats = computed(() => filesStore.transferStats)
  const securityStats = computed(() => filesStore.securityStats)

  const filteredTransfers = computed(() => {
    let result = [...transfers.value]

    // 状态筛选
    if (filters.status?.length) {
      result = result.filter(t => filters.status!.includes(t.status))
    }

    // 传输类型筛选
    if (filters.transferType) {
      result = result.filter(t => t.transfer_type === filters.transferType)
    }

    // 关键词搜索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase()
      result = result.filter(t =>
        t.file_name.toLowerCase().includes(keyword) ||
        t.user_name?.toLowerCase().includes(keyword) ||
        t.file_type.toLowerCase().includes(keyword)
      )
    }

    // 拦截状态筛选
    if (filters.isIntercepted !== undefined) {
      result = result.filter(t => t.is_intercepted === filters.isIntercepted)
    }

    // 安全状态筛选
    if (filters.securityStatus?.length) {
      result = result.filter(t =>
        t.security_scan_result && filters.securityStatus!.includes(t.security_scan_result)
      )
    }

    // 文件类型筛选
    if (filters.fileTypes?.length) {
      result = result.filter(t =>
        filters.fileTypes!.some(type => t.file_type.includes(type))
      )
    }

    // 文件大小筛选
    if (filters.sizeRange?.length === 2) {
      const [minSize, maxSize] = filters.sizeRange
      result = result.filter(t => t.file_size >= minSize && t.file_size <= maxSize)
    }

    // 日期范围筛选
    if (filters.dateRange?.length === 2) {
      const [startDate, endDate] = filters.dateRange
      result = result.filter(t => {
        const createdAt = new Date(t.created_at)
        return createdAt >= new Date(startDate) && createdAt <= new Date(endDate)
      })
    }

    return result
  })

  const transferSummary = computed(() => {
    const total = filteredTransfers.value.length
    const statuses = filteredTransfers.value.reduce((acc, transfer) => {
      acc[transfer.status] = (acc[transfer.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalSize = filteredTransfers.value.reduce((sum, transfer) => sum + transfer.file_size, 0)
    const completedSize = filteredTransfers.value
      .filter(t => t.status === 'completed')
      .reduce((sum, transfer) => sum + transfer.file_size, 0)

    return {
      total,
      statuses,
      totalSize,
      completedSize,
      completionRate: total > 0 ? Math.round((statuses.completed || 0) / total * 100) : 0
    }
  })

  const activeUploadsSummary = computed(() => {
    const uploads = activeTransfers.value.filter(t => t.transfer_type === 'upload')
    const totalSpeed = uploads.reduce((sum, transfer) => sum + (transfer.transfer_speed || 0), 0)
    const totalProgress = uploads.length > 0 ?
      uploads.reduce((sum, transfer) => sum + transfer.progress_percent, 0) / uploads.length : 0

    return {
      count: uploads.length,
      totalSpeed,
      totalProgress: Math.round(totalProgress)
    }
  })

  const hasActiveFilters = computed(() => {
    return Object.values(filters).some(value => {
      if (Array.isArray(value)) return value.length > 0
      return value !== undefined && value !== null && value !== ''
    })
  })

  // ==================== 数据获取方法 ====================

  /**
   * 刷新传输列表
   */
  async function refreshTransfers(showLoading = true): Promise<void> {
    try {
      if (showLoading) loading.value = true
      refreshing.value = true
      error.value = null

      const queryParams = buildQueryParams()
      await filesStore.fetchTransfers(queryParams)

      lastRefreshTime.value = new Date()
    } catch (err: any) {
      error.value = err.message || '刷新失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  /**
   * 加载更多数据
   */
  async function loadMore(): Promise<void> {
    if (loading.value || pagination.value.current_page >= pagination.value.total_pages) {
      return
    }

    try {
      loading.value = true
      const queryParams = buildQueryParams()
      queryParams.page = pagination.value.current_page + 1

      await filesStore.fetchTransfers(queryParams)
    } catch (err: any) {
      ElMessage.error(err.message || '加载失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新活跃传输
   */
  async function refreshActiveTransfers(): Promise<void> {
    try {
      await filesStore.fetchActiveTransfers()
    } catch (err: any) {
      console.error('Failed to refresh active transfers:', err)
    }
  }

  /**
   * 刷新统计数据
   */
  async function refreshStats(): Promise<void> {
    try {
      const dateRange = getDateRangeFromFilters()
      await Promise.all([
        filesStore.fetchTransferStats(dateRange),
        filesStore.fetchSecurityStats(dateRange)
      ])
    } catch (err: any) {
      console.error('Failed to refresh stats:', err)
    }
  }

  /**
   * 获取实时统计
   */
  async function fetchRealTimeStats(): Promise<void> {
    try {
      const response = await filesStore.getRealTimeStats()
      if (response) {
        realTimeStats.value = response.data
      }
    } catch (err: any) {
      console.error('Failed to fetch real-time stats:', err)
    }
  }

  // ==================== 筛选器方法 ====================

  /**
   * 应用筛选器
   */
  async function applyFilters(): Promise<void> {
    await refreshTransfers()
    await refreshStats()
  }

  /**
   * 重置筛选器
   */
  async function resetFilters(): Promise<void> {
    Object.keys(filters).forEach(key => {
      delete filters[key as keyof MonitorFilters]
    })
    quickFilters.value = []
    await applyFilters()
  }

  /**
   * 设置快速筛选
   */
  async function setQuickFilter(filter: string): Promise<void> {
    resetFilters()

    switch (filter) {
      case 'uploading':
        filters.status = ['uploading']
        break
      case 'failed':
        filters.status = ['failed']
        break
      case 'blocked':
        filters.status = ['blocked']
        filters.isIntercepted = true
        break
      case 'today':
        filters.dateRange = [
          new Date().toISOString().split('T')[0],
          new Date().toISOString().split('T')[0]
        ]
        break
      case 'threats':
        filters.securityStatus = ['malicious', 'suspicious']
        break
    }

    quickFilters.value = [filter]
    await applyFilters()
  }

  /**
   * 设置时间范围
   */
  function setTimeRange(range: string): void {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (range) {
      case 'last_hour':
        filters.dateRange = [
          new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          now.toISOString()
        ]
        break
      case 'today':
        filters.dateRange = [
          today.toISOString(),
          new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        ]
        break
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
        filters.dateRange = [
          yesterday.toISOString(),
          today.toISOString()
        ]
        break
      case 'last_week':
        filters.dateRange = [
          new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          now.toISOString()
        ]
        break
      case 'last_month':
        filters.dateRange = [
          new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          now.toISOString()
        ]
        break
    }
  }

  // ==================== 传输操作方法 ====================

  /**
   * 重试传输
   */
  async function retryTransfer(transferId: string): Promise<boolean> {
    return await filesStore.retryTransfer(transferId)
  }

  /**
   * 取消传输
   */
  async function cancelTransfer(transferId: string): Promise<boolean> {
    return await filesStore.cancelTransfer(transferId)
  }

  /**
   * 批量操作
   */
  async function batchOperation(
    transferIds: string[],
    action: string,
    params?: any
  ): Promise<void> {
    await filesStore.batchTransferOperation(transferIds, action as any, params)
    await refreshTransfers()
  }

  // ==================== 工具方法 ====================

  /**
   * 构建查询参数
   */
  function buildQueryParams(): FileQueryParams {
    const params: FileQueryParams = {
      page: 1,
      page_size: config.pageSize,
      sort_by: 'created_at',
      sort_order: 'desc'
    }

    if (filters.status?.length) {
      params.status = filters.status
    }

    if (filters.transferType) {
      params.transfer_type = filters.transferType
    }

    if (filters.keyword) {
      params.keyword = filters.keyword
    }

    if (filters.isIntercepted !== undefined) {
      params.is_intercepted = filters.isIntercepted
    }

    if (filters.securityStatus?.length) {
      params.security_status = filters.securityStatus
    }

    if (filters.fileTypes?.length) {
      params.file_type = filters.fileTypes
    }

    if (filters.sizeRange?.length === 2) {
      params.size_min = filters.sizeRange[0]
      params.size_max = filters.sizeRange[1]
    }

    if (filters.dateRange?.length === 2) {
      params.date_from = filters.dateRange[0]
      params.date_to = filters.dateRange[1]
    }

    return params
  }

  /**
   * 从筛选器获取日期范围
   */
  function getDateRangeFromFilters(): { date_from?: string; date_to?: string } {
    if (filters.dateRange?.length === 2) {
      return {
        date_from: filters.dateRange[0],
        date_to: filters.dateRange[1]
      }
    }
    return {}
  }

  /**
   * 格式化文件大小
   */
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
  }

  /**
   * 格式化传输速度
   */
  function formatSpeed(bytesPerSecond: number): string {
    return `${formatFileSize(bytesPerSecond)}/s`
  }

  /**
   * 格式化时间
   */
  function formatTime(timeString: string): string {
    return new Date(timeString).toLocaleString()
  }

  /**
   * 格式化持续时间
   */
  function formatDuration(startTime: string, endTime?: string): string {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = end.getTime() - start.getTime()

    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * 获取状态显示信息
   */
  function getStatusInfo(status: FileTransferStatus): { label: string; color: string } {
    const option = statusOptions.find(opt => opt.value === status)
    return option || { label: status, color: 'default' }
  }

  /**
   * 导出数据
   */
  async function exportData(format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<void> {
    try {
      loading.value = true
      const options = {
        format,
        filters: buildQueryParams(),
        include_security_details: true,
        include_metadata: true
      }

      await filesStore.exportTransfers(options)
      ElMessage.success('导出成功')
    } catch (err: any) {
      ElMessage.error(err.message || '导出失败')
    } finally {
      loading.value = false
    }
  }

  // ==================== 自动刷新 ====================

  /**
   * 启动自动刷新
   */
  function startAutoRefresh(): void {
    if (!config.autoRefresh || refreshTimer.value) return

    refreshTimer.value = setInterval(async () => {
      await refreshActiveTransfers()
      if (config.enableRealTime) {
        await fetchRealTimeStats()
      }
    }, config.refreshInterval)
  }

  /**
   * 停止自动刷新
   */
  function stopAutoRefresh(): void {
    if (refreshTimer.value) {
      clearInterval(refreshTimer.value)
      refreshTimer.value = null
    }
  }

  // ==================== 生命周期 ====================

  onMounted(async () => {
    // 连接WebSocket
    if (config.enableRealTime) {
      await filesStore.connectWebSocket()
    }

    // 初始化数据
    await refreshTransfers()
    await refreshActiveTransfers()
    await refreshStats()

    // 启动自动刷新
    startAutoRefresh()
  })

  onUnmounted(() => {
    stopAutoRefresh()
    filesStore.disconnectWebSocket()
  })

  // ==================== 返回对象 ====================

  return {
    // 状态
    loading,
    refreshing,
    error,
    lastRefreshTime,
    filters,
    quickFilters,
    realTimeStats,

    // 计算属性
    transfers: filteredTransfers,
    activeTransfers,
    pagination,
    transferStats,
    securityStats,
    transferSummary,
    activeUploadsSummary,
    hasActiveFilters,

    // 选项
    timeRanges,
    statusOptions,

    // 数据获取方法
    refreshTransfers,
    loadMore,
    refreshActiveTransfers,
    refreshStats,
    fetchRealTimeStats,

    // 筛选器方法
    applyFilters,
    resetFilters,
    setQuickFilter,
    setTimeRange,

    // 传输操作方法
    retryTransfer,
    cancelTransfer,
    batchOperation,

    // 工具方法
    formatFileSize,
    formatSpeed,
    formatTime,
    formatDuration,
    getStatusInfo,
    exportData,

    // 自动刷新控制
    startAutoRefresh,
    stopAutoRefresh
  }
}