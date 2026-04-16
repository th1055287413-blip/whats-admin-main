import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getToken } from '@/utils/auth'
import type { WSMessage, NewMessageData, MessageStatusData } from '@/types/websocket'

export interface WebSocketMessage {
  type: string
  account_id: number
  data: any
  timestamp: string
}

// 导出类型供外部使用
export type { WSMessage, NewMessageData, MessageStatusData }

class WebSocketClient {
  private ws: WebSocket | null = null
  private accountId: number | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map()

  public connected = ref(false)

  // 连接 WebSocket
  connect(accountId: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket 已连接')
      return
    }

    this.accountId = accountId
    const token = getToken()

    if (!token) {
      console.error('未找到认证令牌，请先登录')
      ElMessage.error('未找到认证令牌，请先登录')
      return
    }

    // 构建 WebSocket URL
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
    let wsBaseUrl: string
    if (apiBaseUrl.startsWith('http')) {
      const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws'
      const wsHost = apiBaseUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '')
      wsBaseUrl = `${wsProtocol}://${wsHost}/api`
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      wsBaseUrl = `${wsProtocol}://${window.location.host}${apiBaseUrl}`
    }

    const wsUrl = `${wsBaseUrl}/ws?account_id=${accountId}&token=${encodeURIComponent(token)}`
    console.log('[WebSocket Debug] 最终 WebSocket URL:', wsUrl.replace(/token=[^&]+/, 'token=***'))

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('WebSocket 连接成功')
        this.connected.value = true
        this.reconnectAttempts = 0
        ElMessage.success('实时消息连接成功')
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          console.log('收到 WebSocket 消息:', message)
          this.handleMessage(message)
        } catch (error) {
          console.error('解析 WebSocket 消息失败:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        this.connected.value = false
      }

      this.ws.onclose = () => {
        console.log('WebSocket 连接关闭')
        this.connected.value = false
        this.ws = null

        // 尝试重连
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.accountId) {
          this.reconnectAttempts++
          console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
          this.reconnectTimer = window.setTimeout(() => {
            this.connect(this.accountId!)
          }, this.reconnectDelay)
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          ElMessage.error('WebSocket 连接失败，请刷新页面重试')
        }
      }
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
      this.connected.value = false
    }
  }

  // 断开连接
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connected.value = false
    this.accountId = null
    this.reconnectAttempts = 0
  }

  // 处理接收到的消息
  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data)
        } catch (error) {
          console.error('处理 WebSocket 消息时出错:', error)
        }
      })
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

  // 发送消息（如果需要客户端向服务器发送消息）
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket 未连接')
    }
  }
}

// 创建单例
export const wsClient = new WebSocketClient()
