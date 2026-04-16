import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useWebSocket } from '@/composables/useWebSocket'
import { useRealTimeData } from '@/composables/useRealTimeData'
import type {
  MonitorState,
  MessageMonitor,
  ContactMonitor,
  RealTimeAlert,
  SensitiveWord,
  MessageMonitorFilter,
  ContactMonitorFilter,
  AlertFilter,
  SensitiveWordFilter,
  MessageMonitorStats,
  ContactMonitorStats,
  AlertStats
} from '@/types/monitor'

/**
 * 监控系统状态管理Store
 */
export const useMonitorStore = defineStore('monitor', () => {
  // WebSocket和实时数据管理
  const webSocketHook = useWebSocket()
  const realTimeDataHook = useRealTimeData()

  // 消息监控状态
  const messageMonitor = reactive({
    data: [] as MessageMonitor[],
    filter: {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    } as MessageMonitorFilter,
    stats: null as MessageMonitorStats | null,
    loading: false,
    error: null as string | null
  })

  // 联系人监控状态
  const contactMonitor = reactive({
    data: [] as ContactMonitor[],
    filter: {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    } as ContactMonitorFilter,
    stats: null as ContactMonitorStats | null,
    loading: false,
    error: null as string | null
  })

  // 告警状态
  const alerts = reactive({
    data: [] as RealTimeAlert[],
    filter: {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    } as AlertFilter,
    stats: null as AlertStats | null,
    loading: false,
    error: null as string | null
  })

  // 敏感词状态
  const sensitiveWords = reactive({
    data: [] as SensitiveWord[],
    filter: {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    } as SensitiveWordFilter,
    loading: false,
    error: null as string | null
  })

  // 全局设置
  const settings = reactive({
    autoRefresh: true,
    refreshInterval: 30000, // 30秒
    realTimeEnabled: true,
    notificationsEnabled: true,
    theme: 'light' as 'light' | 'dark',
    layout: 'grid' as 'grid' | 'list'
  })

  // 分页信息
  const pagination = reactive({
    messages: { total: 0, totalPages: 0, page: 1, pageSize: 20 },
    contacts: { total: 0, totalPages: 0, page: 1, pageSize: 20 },
    alerts: { total: 0, totalPages: 0, page: 1, pageSize: 20 },
    sensitiveWords: { total: 0, totalPages: 0, page: 1, pageSize: 20 }
  })

  // 计算属性
  const isWebSocketConnected = computed(() => webSocketHook.isConnected.value)
  const isRealTimeActive = computed(() => realTimeDataHook.isActive.value)

  // 未读统计
  const unreadCounts = computed(() => ({
    messages: messageMonitor.data.filter(m => !m.isRead).length,
    alerts: alerts.data.filter(a => !a.isRead).length,
    sensitiveMessages: messageMonitor.data.filter(m =>
      m.sensitiveLevel !== 'normal' && !m.isRead
    ).length,
    criticalAlerts: alerts.data.filter(a =>
      a.severity === 'critical' && !a.isHandled
    ).length
  }))

  // 总体统计
  const overallStats = computed(() => ({
    totalMessages: messageMonitor.stats?.totalMessages || 0,
    totalContacts: contactMonitor.stats?.totalContacts || 0,
    totalAlerts: alerts.stats?.totalAlerts || 0,
    totalSensitiveWords: sensitiveWords.data.filter(w => w.isActive).length,
    sensitiveMessageRate: messageMonitor.stats ?
      (messageMonitor.stats.sensitiveMessages / messageMonitor.stats.totalMessages * 100) : 0,
    alertHandleRate: alerts.stats ?
      ((alerts.stats.totalAlerts - alerts.stats.unhandledAlerts) / alerts.stats.totalAlerts * 100) : 0
  }))

  /**
   * 初始化监控系统
   */
  async function initialize(): Promise<void> {
    try {
      // 连接WebSocket
      await webSocketHook.connect()

      // 启用实时数据
      if (settings.realTimeEnabled) {
        realTimeDataHook.enable()
      }

      // 加载初始数据
      await Promise.all([
        fetchMessageMonitors(),
        fetchContactMonitors(),
        fetchAlerts(),
        fetchSensitiveWords()
      ])

      ElMessage.success('监控系统初始化成功')
    } catch (error: any) {
      ElMessage.error('监控系统初始化失败')
      console.error('Monitor initialization failed:', error)
    }
  }

  /**
   * 获取消息监控数据
   */
  async function fetchMessageMonitors(filter?: Partial<MessageMonitorFilter>): Promise<void> {
    try {
      messageMonitor.loading = true
      messageMonitor.error = null

      if (filter) {
        Object.assign(messageMonitor.filter, filter)
      }

      // 模拟API调用
      const response = await mockFetchMessageMonitors(messageMonitor.filter)
      messageMonitor.data = response.data
      pagination.messages = response.pagination

      // 获取统计数据
      await fetchMessageStats()

    } catch (error: any) {
      messageMonitor.error = error.message
      ElMessage.error('获取消息监控数据失败')
    } finally {
      messageMonitor.loading = false
    }
  }

  /**
   * 获取联系人监控数据
   */
  async function fetchContactMonitors(filter?: Partial<ContactMonitorFilter>): Promise<void> {
    try {
      contactMonitor.loading = true
      contactMonitor.error = null

      if (filter) {
        Object.assign(contactMonitor.filter, filter)
      }

      const response = await mockFetchContactMonitors(contactMonitor.filter)
      contactMonitor.data = response.data
      pagination.contacts = response.pagination

      await fetchContactStats()

    } catch (error: any) {
      contactMonitor.error = error.message
      ElMessage.error('获取联系人监控数据失败')
    } finally {
      contactMonitor.loading = false
    }
  }

  /**
   * 获取告警数据
   */
  async function fetchAlerts(filter?: Partial<AlertFilter>): Promise<void> {
    try {
      alerts.loading = true
      alerts.error = null

      if (filter) {
        Object.assign(alerts.filter, filter)
      }

      const response = await mockFetchAlerts(alerts.filter)
      alerts.data = response.data
      pagination.alerts = response.pagination

      await fetchAlertStats()

    } catch (error: any) {
      alerts.error = error.message
      ElMessage.error('获取告警数据失败')
    } finally {
      alerts.loading = false
    }
  }

  /**
   * 获取敏感词数据
   */
  async function fetchSensitiveWords(filter?: Partial<SensitiveWordFilter>): Promise<void> {
    try {
      sensitiveWords.loading = true
      sensitiveWords.error = null

      if (filter) {
        Object.assign(sensitiveWords.filter, filter)
      }

      const response = await mockFetchSensitiveWords(sensitiveWords.filter)
      sensitiveWords.data = response.data
      pagination.sensitiveWords = response.pagination

    } catch (error: any) {
      sensitiveWords.error = error.message
      ElMessage.error('获取敏感词数据失败')
    } finally {
      sensitiveWords.loading = false
    }
  }

  /**
   * 获取消息统计
   */
  async function fetchMessageStats(): Promise<void> {
    try {
      messageMonitor.stats = await mockFetchMessageStats()
    } catch (error) {
      console.error('Failed to fetch message stats:', error)
    }
  }

  /**
   * 获取联系人统计
   */
  async function fetchContactStats(): Promise<void> {
    try {
      contactMonitor.stats = await mockFetchContactStats()
    } catch (error) {
      console.error('Failed to fetch contact stats:', error)
    }
  }

  /**
   * 获取告警统计
   */
  async function fetchAlertStats(): Promise<void> {
    try {
      alerts.stats = await mockFetchAlertStats()
    } catch (error) {
      console.error('Failed to fetch alert stats:', error)
    }
  }

  /**
   * 刷新所有数据
   */
  async function refreshAll(): Promise<void> {
    await Promise.all([
      fetchMessageMonitors(),
      fetchContactMonitors(),
      fetchAlerts(),
      fetchSensitiveWords()
    ])
  }

  /**
   * 切换实时数据
   */
  function toggleRealTime(): void {
    if (settings.realTimeEnabled) {
      realTimeDataHook.enable()
    } else {
      realTimeDataHook.disable()
    }
  }

  /**
   * 更新设置
   */
  function updateSettings(newSettings: Partial<typeof settings>): void {
    Object.assign(settings, newSettings)

    // 应用实时数据设置
    if ('realTimeEnabled' in newSettings) {
      toggleRealTime()
    }
  }

  /**
   * 标记告警为已读
   */
  async function markAlertAsRead(alertId: number): Promise<boolean> {
    try {
      await mockMarkAlertAsRead(alertId)

      const alert = alerts.data.find(a => a.id === alertId)
      if (alert) {
        alert.isRead = true
      }

      return true
    } catch (error) {
      ElMessage.error('标记告警已读失败')
      return false
    }
  }

  /**
   * 处理告警
   */
  async function handleAlert(alertId: number, comment?: string): Promise<boolean> {
    try {
      await mockHandleAlert(alertId, comment)

      const alert = alerts.data.find(a => a.id === alertId)
      if (alert) {
        alert.isHandled = true
        alert.handledAt = new Date().toISOString()
      }

      ElMessage.success('告警处理成功')
      return true
    } catch (error) {
      ElMessage.error('告警处理失败')
      return false
    }
  }

  /**
   * 创建敏感词
   */
  async function createSensitiveWord(word: Omit<SensitiveWord, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const newWord = await mockCreateSensitiveWord(word)
      sensitiveWords.data.unshift(newWord)
      ElMessage.success('敏感词创建成功')
      return true
    } catch (error) {
      ElMessage.error('敏感词创建失败')
      return false
    }
  }

  /**
   * 更新敏感词
   */
  async function updateSensitiveWord(id: number, updates: Partial<SensitiveWord>): Promise<boolean> {
    try {
      await mockUpdateSensitiveWord(id, updates)

      const word = sensitiveWords.data.find(w => w.id === id)
      if (word) {
        Object.assign(word, updates, { updatedAt: new Date().toISOString() })
      }

      ElMessage.success('敏感词更新成功')
      return true
    } catch (error) {
      ElMessage.error('敏感词更新失败')
      return false
    }
  }

  /**
   * 删除敏感词
   */
  async function deleteSensitiveWord(id: number): Promise<boolean> {
    try {
      await mockDeleteSensitiveWord(id)

      const index = sensitiveWords.data.findIndex(w => w.id === id)
      if (index > -1) {
        sensitiveWords.data.splice(index, 1)
      }

      ElMessage.success('敏感词删除成功')
      return true
    } catch (error) {
      ElMessage.error('敏感词删除失败')
      return false
    }
  }

  /**
   * 重置过滤器
   */
  function resetFilters(type: 'messages' | 'contacts' | 'alerts' | 'sensitiveWords'): void {
    switch (type) {
      case 'messages':
        Object.assign(messageMonitor.filter, {
          page: 1,
          pageSize: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        break
      case 'contacts':
        Object.assign(contactMonitor.filter, {
          page: 1,
          pageSize: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        break
      case 'alerts':
        Object.assign(alerts.filter, {
          page: 1,
          pageSize: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        break
      case 'sensitiveWords':
        Object.assign(sensitiveWords.filter, {
          page: 1,
          pageSize: 20,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        break
    }
  }

  // 模拟API函数（后续替换为真实API）
  async function mockFetchMessageMonitors(filter: MessageMonitorFilter) {
    await new Promise(resolve => setTimeout(resolve, 300))
    // 返回模拟数据...
    return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
  }

  async function mockFetchContactMonitors(filter: ContactMonitorFilter) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
  }

  async function mockFetchAlerts(filter: AlertFilter) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
  }

  async function mockFetchSensitiveWords(filter: SensitiveWordFilter) {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { data: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }
  }

  async function mockFetchMessageStats(): Promise<MessageMonitorStats> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      totalMessages: 0,
      sensitiveMessages: 0,
      blockedMessages: 0,
      reviewedMessages: 0,
      messagesByType: {} as any,
      messagesBySensitiveLevel: {} as any,
      timeSeriesData: []
    }
  }

  async function mockFetchContactStats(): Promise<ContactMonitorStats> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      totalContacts: 0,
      suspiciousContacts: 0,
      reviewedContacts: 0,
      contactsByAction: {} as any,
      contactsByRiskLevel: {} as any,
      timeSeriesData: []
    }
  }

  async function mockFetchAlertStats(): Promise<AlertStats> {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      totalAlerts: 0,
      unreadAlerts: 0,
      unhandledAlerts: 0,
      alertsByType: {} as any,
      alertsBySeverity: {} as any,
      timeSeriesData: []
    }
  }

  async function mockMarkAlertAsRead(alertId: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  async function mockHandleAlert(alertId: number, comment?: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  async function mockCreateSensitiveWord(word: any): Promise<SensitiveWord> {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { ...word, id: Date.now(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  }

  async function mockUpdateSensitiveWord(id: number, updates: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  async function mockDeleteSensitiveWord(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return {
    // 状态
    messageMonitor: readonly(messageMonitor),
    contactMonitor: readonly(contactMonitor),
    alerts: readonly(alerts),
    sensitiveWords: readonly(sensitiveWords),
    settings,
    pagination: readonly(pagination),

    // 计算属性
    isWebSocketConnected,
    isRealTimeActive,
    unreadCounts,
    overallStats,

    // WebSocket相关
    webSocket: webSocketHook,
    realTimeData: realTimeDataHook,

    // 方法
    initialize,
    fetchMessageMonitors,
    fetchContactMonitors,
    fetchAlerts,
    fetchSensitiveWords,
    refreshAll,
    updateSettings,
    markAlertAsRead,
    handleAlert,
    createSensitiveWord,
    updateSensitiveWord,
    deleteSensitiveWord,
    resetFilters
  }
})