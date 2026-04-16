import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'
import type {
  NewMessageData,
  MessageStatusData,
  MessageRevokedData,
  MessageEditedData,
  ChatArchiveChangedData
} from '@/types/websocket'

export interface SSEMessage {
  type: string
  account_id: number
  data: any
  timestamp: string
}

// 导出类型供外部使用
export type { NewMessageData, MessageStatusData, MessageRevokedData, MessageEditedData, ChatArchiveChangedData }

class SSEClient {
  private eventSource: EventSource | null = null
  private accountId: number | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map()

  public connected = ref(false)

  // 连接 SSE
  connect(accountId: number) {
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      console.log('SSE 已连接')
      return
    }

    this.accountId = accountId
    const token = getToken()

    if (!token) {
      console.error('未找到认证令牌，请先登录')
      ElMessage.error('未找到认证令牌，请先登录')
      return
    }

    // 构建 SSE URL
    let baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

    console.log('[SSE Debug] VITE_API_BASE_URL:', baseUrl)

    // 如果是相对路径，使用当前域名
    if (!baseUrl.startsWith('http')) {
      baseUrl = `${window.location.origin}${baseUrl}`
    }

    const sseUrl = `${baseUrl}/sse?account_id=${accountId}&token=${encodeURIComponent(token)}`
    console.log('[SSE Debug] 最终 SSE URL:', sseUrl.replace(/token=[^&]+/, 'token=***'))

    try {
      this.eventSource = new EventSource(sseUrl)

      this.eventSource.onopen = () => {
        console.log('SSE 连接成功')
        this.connected.value = true
        this.reconnectAttempts = 0
        ElMessage.success('实时消息连接成功')
      }

      // 监听通用消息事件
      this.eventSource.onmessage = (event) => {
        this.handleEvent('message', event)
      }

      // 监听特定事件类型
      const eventTypes = [
        'connected',
        'heartbeat',
        'new_message',
        'message_status',
        'message_revoked',
        'message_edited',
        'chat_archive_changed',
        'batch_send_progress'
      ]

      eventTypes.forEach((eventType) => {
        this.eventSource!.addEventListener(eventType, (event) => {
          this.handleEvent(eventType, event as MessageEvent)
        })
      })

      this.eventSource.onerror = (error) => {
        console.error('SSE 错误:', error)
        this.connected.value = false
        this.eventSource?.close()
        this.eventSource = null

        // 尝试重连
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.accountId) {
          this.reconnectAttempts++
          console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
          this.reconnectTimer = window.setTimeout(() => {
            this.connect(this.accountId!)
          }, this.reconnectDelay)
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          ElMessage.error('SSE 连接失败，请刷新页面重试')
        }
      }
    } catch (error) {
      console.error('创建 SSE 连接失败:', error)
      this.connected.value = false
    }
  }

  // 断开连接
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }

    this.connected.value = false
    this.accountId = null
    this.reconnectAttempts = 0
  }

  // 处理 SSE 事件
  private handleEvent(eventType: string, event: MessageEvent) {
    try {
      const message: SSEMessage = JSON.parse(event.data)
      console.log(`收到 SSE 事件 [${eventType}]:`, message)

      // 使用事件类型调用对应的处理器
      const handlers = this.messageHandlers.get(message.type || eventType)
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.data)
          } catch (error) {
            console.error('处理 SSE 消息时出错:', error)
          }
        })
      }
    } catch (error) {
      console.error('解析 SSE 消息失败:', error)
    }
  }

  // 注册消息处理器
  on(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }
    this.messageHandlers.get(type)!.add(handler)
  }

  // 移除消息处理器
  off(type: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(type)
    if (handlers) {
      handlers.delete(handler)
    }
  }
}

// 创建单例
export const sseClient = new SSEClient()
