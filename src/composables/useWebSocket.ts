import { ref, reactive, computed, onUnmounted, nextTick, readonly } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type {
  WebSocketMessage,
  WebSocketStatus,
  MessageMonitorData,
  ContactMonitorData,
  AlertData,
  SystemStatusData
} from '@/types/monitor'

/**
 * WebSocket连接管理Hook
 * 基于Stream B的WebSocket服务实现前端集成
 */
export function useWebSocket() {
  const authStore = useAuthStore()

  // WebSocket实例
  let wsInstance: WebSocket | null = null

  // 连接状态
  const status = reactive<WebSocketStatus>({
    connected: false,
    reconnecting: false,
    url: '',
    lastConnected: undefined,
    lastDisconnected: undefined,
    reconnectAttempts: 0,
    connectionId: undefined
  })

  // 配置
  const config = reactive({
    url: import.meta.env.VITE_WS_URL || '/ws',
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
    messageQueueSize: 1000
  })

  // 消息队列
  const messageQueue = ref<WebSocketMessage[]>([])
  const subscriptions = ref<Map<string, Set<Function>>>(new Map())

  // 重连计时器
  let reconnectTimer: number | null = null
  let heartbeatTimer: number | null = null

  // 计算属性
  const isConnected = computed(() => status.connected)
  const isReconnecting = computed(() => status.reconnecting)
  const canReconnect = computed(() =>
    status.reconnectAttempts < config.maxReconnectAttempts
  )

  /**
   * 建立WebSocket连接
   */
  async function connect(): Promise<boolean> {
    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      return true
    }

    try {
      // 获取认证token
      const token = authStore.token
      if (!token) {
        throw new Error('No authentication token available')
      }

      // 构建WebSocket URL
      const wsUrl = new URL(config.url)
      wsUrl.searchParams.set('token', token)

      status.url = wsUrl.toString()

      // 创建WebSocket连接
      wsInstance = new WebSocket(wsUrl.toString())

      // 设置连接事件监听
      wsInstance.onopen = handleOpen
      wsInstance.onmessage = handleMessage
      wsInstance.onclose = handleClose
      wsInstance.onerror = handleError

      return true
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      ElMessage.error('WebSocket连接失败')
      return false
    }
  }

  /**
   * 断开WebSocket连接
   */
  function disconnect(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }

    if (wsInstance) {
      wsInstance.close(1000, 'Manual disconnect')
      wsInstance = null
    }

    status.connected = false
    status.reconnecting = false
  }

  /**
   * 发送消息
   */
  function send(message: any): boolean {
    if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected')
      return false
    }

    try {
      const wsMessage: WebSocketMessage = {
        type: message.type || 'message',
        data: message.data || message,
        timestamp: new Date().toISOString(),
        messageId: generateMessageId()
      }

      wsInstance.send(JSON.stringify(wsMessage))
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  }

  /**
   * 订阅消息类型
   */
  function subscribe(messageType: string, callback: Function): () => void {
    if (!subscriptions.value.has(messageType)) {
      subscriptions.value.set(messageType, new Set())
    }

    const callbacks = subscriptions.value.get(messageType)!
    callbacks.add(callback)

    // 返回取消订阅函数
    return () => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        subscriptions.value.delete(messageType)
      }
    }
  }

  /**
   * 订阅主题
   */
  function subscribeTopic(topic: string): boolean {
    return send({
      type: 'subscribe',
      data: { topic }
    })
  }

  /**
   * 取消订阅主题
   */
  function unsubscribeTopic(topic: string): boolean {
    return send({
      type: 'unsubscribe',
      data: { topic }
    })
  }

  /**
   * 处理连接打开
   */
  function handleOpen(event: Event): void {
    console.log('WebSocket connected')

    status.connected = true
    status.reconnecting = false
    status.reconnectAttempts = 0
    status.lastConnected = new Date().toISOString()

    // 发送认证消息
    send({
      type: 'auth',
      data: {
        token: authStore.token,
        userId: authStore.user?.id
      }
    })

    // 启动心跳
    startHeartbeat()

    ElMessage.success('WebSocket连接成功')
  }

  /**
   * 处理接收消息
   */
  function handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)

      // 添加到消息队列
      addToMessageQueue(message)

      // 处理特殊消息类型
      handleSpecialMessage(message)

      // 分发给订阅者
      const callbacks = subscriptions.value.get(message.type)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(message.data, message)
          } catch (error) {
            console.error('Error in message callback:', error)
          }
        })
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  /**
   * 处理连接关闭
   */
  function handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason)

    status.connected = false
    status.lastDisconnected = new Date().toISOString()

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }

    // 如果不是手动断开，尝试重连
    if (event.code !== 1000 && canReconnect.value) {
      startReconnect()
    }
  }

  /**
   * 处理连接错误
   */
  function handleError(event: Event): void {
    console.error('WebSocket error:', event)
    ElMessage.error('WebSocket连接出现错误')
  }

  /**
   * 处理特殊消息类型
   */
  function handleSpecialMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'pong':
        // 心跳响应
        break

      case 'auth_success':
        status.connectionId = message.data.connectionId
        ElNotification.success({
          title: 'WebSocket认证成功',
          message: '实时数据推送已启用'
        })
        break

      case 'auth_failed':
        ElMessage.error('WebSocket认证失败')
        disconnect()
        break

      case 'error':
        ElMessage.error(`WebSocket错误: ${message.data.message}`)
        break

      case 'message_monitor':
        // 实时消息监控
        handleMessageMonitor(message.data as MessageMonitorData)
        break

      case 'contact_monitor':
        // 实时联系人监控
        handleContactMonitor(message.data as ContactMonitorData)
        break

      case 'alert':
        // 实时告警
        handleAlert(message.data as AlertData)
        break

      case 'system_status':
        // 系统状态更新
        handleSystemStatus(message.data as SystemStatusData)
        break
    }
  }

  /**
   * 处理消息监控数据
   */
  function handleMessageMonitor(data: MessageMonitorData): void {
    // 如果是敏感消息，显示通知
    if (data.sensitiveLevel !== 'normal') {
      ElNotification.warning({
        title: '检测到敏感消息',
        message: `级别: ${data.sensitiveLevel}`,
        duration: 5000
      })
    }
  }

  /**
   * 处理联系人监控数据
   */
  function handleContactMonitor(data: ContactMonitorData): void {
    // 如果是高风险操作，显示通知
    if (data.riskLevel === 'high') {
      ElNotification.error({
        title: '检测到高风险联系人操作',
        message: `操作: ${data.action}`,
        duration: 5000
      })
    }
  }

  /**
   * 处理告警数据
   */
  function handleAlert(data: AlertData): void {
    const notification = {
      title: data.title,
      message: data.description,
      duration: 0 // 不自动关闭
    }

    switch (data.severity) {
      case 'critical':
        ElNotification.error(notification)
        break
      case 'error':
        ElNotification.error({ ...notification, duration: 8000 })
        break
      case 'warning':
        ElNotification.warning({ ...notification, duration: 6000 })
        break
      default:
        ElNotification.info({ ...notification, duration: 4000 })
    }
  }

  /**
   * 处理系统状态数据
   */
  function handleSystemStatus(data: SystemStatusData): void {
    // 系统状态更新可以在这里处理
    // 比如更新全局状态、显示统计信息等
  }

  /**
   * 开始重连
   */
  function startReconnect(): void {
    if (status.reconnecting || !canReconnect.value) {
      return
    }

    status.reconnecting = true
    status.reconnectAttempts++

    const delay = config.reconnectInterval * Math.pow(2, status.reconnectAttempts - 1)

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${status.reconnectAttempts})`)

    reconnectTimer = window.setTimeout(async () => {
      try {
        await connect()
      } catch (error) {
        console.error('Reconnect attempt failed:', error)
        if (canReconnect.value) {
          startReconnect()
        } else {
          status.reconnecting = false
          ElMessage.error('WebSocket重连失败，已达到最大重试次数')
        }
      }
    }, delay)
  }

  /**
   * 启动心跳
   */
  function startHeartbeat(): void {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
    }

    heartbeatTimer = window.setInterval(() => {
      if (status.connected) {
        send({
          type: 'ping',
          data: { timestamp: Date.now() }
        })
      }
    }, config.heartbeatInterval)
  }

  /**
   * 添加消息到队列
   */
  function addToMessageQueue(message: WebSocketMessage): void {
    messageQueue.value.push(message)

    // 限制队列大小
    if (messageQueue.value.length > config.messageQueueSize) {
      messageQueue.value.shift()
    }
  }

  /**
   * 生成消息ID
   */
  function generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取连接统计
   */
  function getConnectionStats() {
    return {
      status: { ...status },
      messageQueueSize: messageQueue.value.length,
      subscriptionCount: subscriptions.value.size,
      isConnected: isConnected.value,
      isReconnecting: isReconnecting.value
    }
  }

  /**
   * 清空消息队列
   */
  function clearMessageQueue(): void {
    messageQueue.value = []
  }

  /**
   * 获取最近的消息
   */
  function getRecentMessages(count: number = 10): WebSocketMessage[] {
    return messageQueue.value.slice(-count)
  }

  // 组件卸载时清理
  onUnmounted(() => {
    disconnect()
  })

  return {
    // 状态
    status: readonly(status),
    config,
    messageQueue: readonly(messageQueue),

    // 计算属性
    isConnected,
    isReconnecting,
    canReconnect,

    // 方法
    connect,
    disconnect,
    send,
    subscribe,
    subscribeTopic,
    unsubscribeTopic,
    getConnectionStats,
    clearMessageQueue,
    getRecentMessages
  }
}