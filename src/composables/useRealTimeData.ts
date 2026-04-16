import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useWebSocket } from './useWebSocket'
import type {
  RealTimeDataState,
  MessageMonitorData,
  ContactMonitorData,
  AlertData,
  SystemStatusData,
  RealTimeConfig
} from '@/types/monitor'

/**
 * 实时数据管理Hook
 * 整合WebSocket数据流和本地缓存
 */
export function useRealTimeData() {
  const { subscribe, subscribeTopic, unsubscribeTopic, isConnected } = useWebSocket()

  // 实时数据状态
  const state = reactive<RealTimeDataState>({
    isEnabled: true,
    subscribedTopics: [],
    messageBuffer: [],
    contactBuffer: [],
    alertBuffer: [],
    lastUpdated: new Date().toISOString()
  })

  // 配置
  const config = reactive<RealTimeConfig>({
    enabled: true,
    bufferSize: 100,
    updateInterval: 1000,
    autoRefresh: true,
    topics: ['message_monitor', 'contact_monitor', 'alerts', 'system_status']
  })

  // 统计数据
  const stats = reactive({
    messageCount: 0,
    contactCount: 0,
    alertCount: 0,
    totalUpdates: 0,
    lastUpdateTime: null as string | null
  })

  // 订阅清理函数
  const unsubscribeFunctions = ref<(() => void)[]>([])

  // 计算属性
  const isActive = computed(() => config.enabled && isConnected.value)
  const hasNewData = computed(() =>
    state.messageBuffer.length > 0 ||
    state.contactBuffer.length > 0 ||
    state.alertBuffer.length > 0
  )
  const totalBufferSize = computed(() =>
    state.messageBuffer.length +
    state.contactBuffer.length +
    state.alertBuffer.length
  )

  /**
   * 启用实时数据
   */
  function enable(): void {
    if (config.enabled) return

    config.enabled = true
    state.isEnabled = true

    if (isConnected.value) {
      setupSubscriptions()
    }

    ElMessage.success('实时数据已启用')
  }

  /**
   * 禁用实时数据
   */
  function disable(): void {
    config.enabled = false
    state.isEnabled = false

    clearSubscriptions()
    clearBuffers()

    ElMessage.info('实时数据已禁用')
  }

  /**
   * 设置订阅
   */
  function setupSubscriptions(): void {
    if (!config.enabled || !isConnected.value) return

    clearSubscriptions()

    // 订阅消息监控
    if (config.topics.includes('message_monitor')) {
      const unsubscribe = subscribe('message_monitor', handleMessageMonitor)
      unsubscribeFunctions.value.push(unsubscribe)
      subscribeTopic('message_monitor')
      state.subscribedTopics.push('message_monitor')
    }

    // 订阅联系人监控
    if (config.topics.includes('contact_monitor')) {
      const unsubscribe = subscribe('contact_monitor', handleContactMonitor)
      unsubscribeFunctions.value.push(unsubscribe)
      subscribeTopic('contact_monitor')
      state.subscribedTopics.push('contact_monitor')
    }

    // 订阅告警
    if (config.topics.includes('alerts')) {
      const unsubscribe = subscribe('alert', handleAlert)
      unsubscribeFunctions.value.push(unsubscribe)
      subscribeTopic('alerts')
      state.subscribedTopics.push('alerts')
    }

    // 订阅系统状态
    if (config.topics.includes('system_status')) {
      const unsubscribe = subscribe('system_status', handleSystemStatus)
      unsubscribeFunctions.value.push(unsubscribe)
      subscribeTopic('system_status')
      state.subscribedTopics.push('system_status')
    }
  }

  /**
   * 清理订阅
   */
  function clearSubscriptions(): void {
    // 清理WebSocket订阅
    unsubscribeFunctions.value.forEach(unsubscribe => unsubscribe())
    unsubscribeFunctions.value = []

    // 取消主题订阅
    state.subscribedTopics.forEach(topic => {
      unsubscribeTopic(topic)
    })
    state.subscribedTopics = []
  }

  /**
   * 处理消息监控数据
   */
  function handleMessageMonitor(data: MessageMonitorData): void {
    if (!config.enabled) return

    // 添加到缓冲区
    state.messageBuffer.push(data)

    // 限制缓冲区大小
    if (state.messageBuffer.length > config.bufferSize) {
      state.messageBuffer.shift()
    }

    // 更新统计
    stats.messageCount++
    updateStats()
  }

  /**
   * 处理联系人监控数据
   */
  function handleContactMonitor(data: ContactMonitorData): void {
    if (!config.enabled) return

    state.contactBuffer.push(data)

    if (state.contactBuffer.length > config.bufferSize) {
      state.contactBuffer.shift()
    }

    stats.contactCount++
    updateStats()
  }

  /**
   * 处理告警数据
   */
  function handleAlert(data: AlertData): void {
    if (!config.enabled) return

    state.alertBuffer.push(data)

    if (state.alertBuffer.length > config.bufferSize) {
      state.alertBuffer.shift()
    }

    stats.alertCount++
    updateStats()
  }

  /**
   * 处理系统状态数据
   */
  function handleSystemStatus(data: SystemStatusData): void {
    if (!config.enabled) return

    // 系统状态数据可以用于更新全局统计
    updateStats()
  }

  /**
   * 更新统计信息
   */
  function updateStats(): void {
    stats.totalUpdates++
    stats.lastUpdateTime = new Date().toISOString()
    state.lastUpdated = stats.lastUpdateTime
  }

  /**
   * 清空缓冲区
   */
  function clearBuffers(): void {
    state.messageBuffer = []
    state.contactBuffer = []
    state.alertBuffer = []
    state.lastUpdated = new Date().toISOString()
  }

  /**
   * 获取最新消息
   */
  function getLatestMessages(count: number = 10): MessageMonitorData[] {
    return state.messageBuffer.slice(-count)
  }

  /**
   * 获取最新联系人活动
   */
  function getLatestContacts(count: number = 10): ContactMonitorData[] {
    return state.contactBuffer.slice(-count)
  }

  /**
   * 获取最新告警
   */
  function getLatestAlerts(count: number = 10): AlertData[] {
    return state.alertBuffer.slice(-count)
  }

  /**
   * 获取敏感消息
   */
  function getSensitiveMessages(): MessageMonitorData[] {
    return state.messageBuffer.filter(msg => msg.sensitiveLevel !== 'normal')
  }

  /**
   * 获取高风险联系人活动
   */
  function getHighRiskContacts(): ContactMonitorData[] {
    return state.contactBuffer.filter(contact => contact.riskLevel === 'high')
  }

  /**
   * 获取严重告警
   */
  function getCriticalAlerts(): AlertData[] {
    return state.alertBuffer.filter(alert =>
      alert.severity === 'critical' || alert.severity === 'error'
    )
  }

  /**
   * 清空特定类型的缓冲区
   */
  function clearMessageBuffer(): void {
    state.messageBuffer = []
  }

  function clearContactBuffer(): void {
    state.contactBuffer = []
  }

  function clearAlertBuffer(): void {
    state.alertBuffer = []
  }

  /**
   * 设置缓冲区大小
   */
  function setBufferSize(size: number): void {
    config.bufferSize = Math.max(10, Math.min(1000, size))

    // 调整现有缓冲区
    if (state.messageBuffer.length > config.bufferSize) {
      state.messageBuffer = state.messageBuffer.slice(-config.bufferSize)
    }
    if (state.contactBuffer.length > config.bufferSize) {
      state.contactBuffer = state.contactBuffer.slice(-config.bufferSize)
    }
    if (state.alertBuffer.length > config.bufferSize) {
      state.alertBuffer = state.alertBuffer.slice(-config.bufferSize)
    }
  }

  /**
   * 配置主题订阅
   */
  function updateTopics(topics: string[]): void {
    config.topics = topics
    if (isConnected.value && config.enabled) {
      setupSubscriptions()
    }
  }

  /**
   * 获取实时统计
   */
  function getRealTimeStats() {
    return {
      ...stats,
      bufferSizes: {
        messages: state.messageBuffer.length,
        contacts: state.contactBuffer.length,
        alerts: state.alertBuffer.length
      },
      isActive: isActive.value,
      subscribedTopics: state.subscribedTopics.length,
      totalBufferSize: totalBufferSize.value
    }
  }

  /**
   * 导出缓冲区数据
   */
  function exportBufferData() {
    return {
      messages: [...state.messageBuffer],
      contacts: [...state.contactBuffer],
      alerts: [...state.alertBuffer],
      exportTime: new Date().toISOString(),
      stats: getRealTimeStats()
    }
  }

  // 监听连接状态变化
  watch(isConnected, (connected) => {
    if (connected && config.enabled) {
      setupSubscriptions()
    } else {
      clearSubscriptions()
    }
  })

  // 组件挂载时初始化
  onMounted(() => {
    if (isConnected.value && config.enabled) {
      setupSubscriptions()
    }
  })

  // 组件卸载时清理
  onUnmounted(() => {
    clearSubscriptions()
  })

  return {
    // 状态
    state: readonly(state),
    config,
    stats: readonly(stats),

    // 计算属性
    isActive,
    hasNewData,
    totalBufferSize,

    // 方法
    enable,
    disable,
    clearBuffers,
    clearMessageBuffer,
    clearContactBuffer,
    clearAlertBuffer,
    getLatestMessages,
    getLatestContacts,
    getLatestAlerts,
    getSensitiveMessages,
    getHighRiskContacts,
    getCriticalAlerts,
    setBufferSize,
    updateTopics,
    getRealTimeStats,
    exportBufferData
  }
}