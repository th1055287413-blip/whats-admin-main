import { request } from './index'
import type {
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
  AlertStats,
  PaginatedResponse,
  SensitiveDetectionResult,
  MessageCheckResult,
  SensitiveWordBatch,
  ExportConfig
} from '@/types/monitor'

/**
 * 监控相关API服务
 * 基于Stream A的数据模型和Stream B的WebSocket系统
 */
export const monitorApi = {
  // ==================== 消息监控 API ====================

  /**
   * 获取消息监控列表
   */
  async getMessageMonitors(filter: MessageMonitorFilter): Promise<PaginatedResponse<MessageMonitor>> {
    return request.get('/api/v1/monitor/messages', filter)
  },

  /**
   * 获取单个消息监控详情
   */
  async getMessageMonitor(id: number): Promise<MessageMonitor> {
    return request.get(`/api/v1/monitor/messages/${id}`)
  },

  /**
   * 标记消息为已读
   */
  async markMessageAsRead(id: number): Promise<void> {
    return request.patch(`/api/v1/monitor/messages/${id}/read`)
  },

  /**
   * 批量标记消息为已读
   */
  async markMessagesAsRead(ids: number[]): Promise<void> {
    return request.patch('/api/v1/monitor/messages/batch-read', { ids })
  },

  /**
   * 更新消息状态
   */
  async updateMessageStatus(
    id: number,
    status: string,
    comments?: string
  ): Promise<void> {
    return request.patch(`/api/v1/monitor/messages/${id}/status`, {
      status,
      comments
    })
  },

  /**
   * 获取消息监控统计
   */
  async getMessageStats(filter?: Partial<MessageMonitorFilter>): Promise<MessageMonitorStats> {
    return request.get('/api/v1/monitor/messages/stats', filter)
  },

  /**
   * 导出消息监控数据
   */
  async exportMessages(config: ExportConfig): Promise<Blob> {
    const response = await request.post('/api/v1/monitor/messages/export', config, {
      responseType: 'blob'
    })
    return response.data
  },

  // ==================== 联系人监控 API ====================

  /**
   * 获取联系人监控列表
   */
  async getContactMonitors(filter: ContactMonitorFilter): Promise<PaginatedResponse<ContactMonitor>> {
    return request.get('/api/v1/monitor/contacts', filter)
  },

  /**
   * 获取单个联系人监控详情
   */
  async getContactMonitor(id: number): Promise<ContactMonitor> {
    return request.get(`/api/v1/monitor/contacts/${id}`)
  },

  /**
   * 标记联系人监控为已审核
   */
  async markContactAsReviewed(
    id: number,
    comments?: string
  ): Promise<void> {
    return request.patch(`/api/v1/monitor/contacts/${id}/review`, {
      comments
    })
  },

  /**
   * 获取联系人监控统计
   */
  async getContactStats(filter?: Partial<ContactMonitorFilter>): Promise<ContactMonitorStats> {
    return request.get('/api/v1/monitor/contacts/stats', filter)
  },

  /**
   * 获取用户行为模式分析
   */
  async getUserBehaviorPattern(userId: number): Promise<any> {
    return request.get(`/api/v1/monitor/contacts/behavior/${userId}`)
  },

  // ==================== 实时告警 API ====================

  /**
   * 获取告警列表
   */
  async getAlerts(filter: AlertFilter): Promise<PaginatedResponse<RealTimeAlert>> {
    return request.get('/api/v1/monitor/alerts', filter)
  },

  /**
   * 获取单个告警详情
   */
  async getAlert(id: number): Promise<RealTimeAlert> {
    return request.get(`/api/v1/monitor/alerts/${id}`)
  },

  /**
   * 标记告警为已读
   */
  async markAlertAsRead(id: number): Promise<void> {
    return request.patch(`/api/v1/monitor/alerts/${id}/read`)
  },

  /**
   * 批量标记告警为已读
   */
  async markAlertsAsRead(ids: number[]): Promise<void> {
    return request.patch('/api/v1/monitor/alerts/batch-read', { ids })
  },

  /**
   * 处理告警
   */
  async handleAlert(id: number, comment?: string): Promise<void> {
    return request.patch(`/api/v1/monitor/alerts/${id}/handle`, {
      comment
    })
  },

  /**
   * 批量处理告警
   */
  async handleAlerts(ids: number[], comment?: string): Promise<void> {
    return request.patch('/api/v1/monitor/alerts/batch-handle', {
      ids,
      comment
    })
  },

  /**
   * 获取告警统计
   */
  async getAlertStats(filter?: Partial<AlertFilter>): Promise<AlertStats> {
    return request.get('/api/v1/monitor/alerts/stats', filter)
  },

  /**
   * 删除已处理的告警
   */
  async deleteHandledAlerts(olderThanDays: number = 30): Promise<void> {
    return request.delete(`/api/v1/monitor/alerts/cleanup`, {
      params: { olderThanDays }
    })
  },

  // ==================== 敏感词管理 API ====================

  /**
   * 获取敏感词列表
   */
  async getSensitiveWords(filter: SensitiveWordFilter): Promise<PaginatedResponse<SensitiveWord>> {
    return request.get('/api/v1/monitor/sensitive-words', filter)
  },

  /**
   * 获取单个敏感词详情
   */
  async getSensitiveWord(id: number): Promise<SensitiveWord> {
    return request.get(`/api/v1/monitor/sensitive-words/${id}`)
  },

  /**
   * 创建敏感词
   */
  async createSensitiveWord(
    word: Omit<SensitiveWord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SensitiveWord> {
    return request.post('/api/v1/monitor/sensitive-words', word)
  },

  /**
   * 批量创建敏感词
   */
  async createSensitiveWordsBatch(batch: SensitiveWordBatch): Promise<SensitiveWord[]> {
    return request.post('/api/v1/monitor/sensitive-words/batch', batch)
  },

  /**
   * 更新敏感词
   */
  async updateSensitiveWord(
    id: number,
    updates: Partial<SensitiveWord>
  ): Promise<SensitiveWord> {
    return request.put(`/api/v1/monitor/sensitive-words/${id}`, updates)
  },

  /**
   * 删除敏感词
   */
  async deleteSensitiveWord(id: number): Promise<void> {
    return request.delete(`/api/v1/monitor/sensitive-words/${id}`)
  },

  /**
   * 批量删除敏感词
   */
  async deleteSensitiveWords(ids: number[]): Promise<void> {
    return request.delete('/api/v1/monitor/sensitive-words/batch', { ids })
  },

  /**
   * 启用/禁用敏感词
   */
  async toggleSensitiveWord(id: number, isActive: boolean): Promise<void> {
    return request.patch(`/api/v1/monitor/sensitive-words/${id}/toggle`, {
      isActive
    })
  },

  /**
   * 批量启用/禁用敏感词
   */
  async toggleSensitiveWords(ids: number[], isActive: boolean): Promise<void> {
    return request.patch('/api/v1/monitor/sensitive-words/batch-toggle', {
      ids,
      isActive
    })
  },

  /**
   * 测试敏感词检测
   */
  async testSensitiveDetection(
    text: string,
    language: string = 'zh'
  ): Promise<SensitiveDetectionResult> {
    return request.post('/api/v1/monitor/sensitive-words/test', {
      text,
      language
    })
  },

  /**
   * 检查消息内容
   */
  async checkMessage(
    content: string,
    userId: number,
    language: string = 'zh'
  ): Promise<MessageCheckResult> {
    return request.post('/api/v1/monitor/messages/check', {
      content,
      userId,
      language
    })
  },

  /**
   * 获取敏感词分类
   */
  async getSensitiveWordCategories(): Promise<string[]> {
    return request.get('/api/v1/monitor/sensitive-words/categories')
  },

  /**
   * 刷新敏感词缓存
   */
  async refreshSensitiveCache(): Promise<void> {
    return request.post('/api/v1/monitor/sensitive-words/refresh-cache')
  },

  /**
   * 获取敏感词缓存统计
   */
  async getSensitiveCacheStats(): Promise<any> {
    return request.get('/api/v1/monitor/sensitive-words/cache-stats')
  },

  // ==================== WebSocket 管理 API ====================

  /**
   * 获取WebSocket连接信息
   */
  async getWebSocketInfo(): Promise<any> {
    return request.get('/api/v1/websocket/info')
  },

  /**
   * 获取WebSocket连接统计
   */
  async getWebSocketStats(): Promise<any> {
    return request.get('/api/v1/websocket/stats')
  },

  /**
   * 获取活跃客户端列表
   */
  async getActiveClients(): Promise<any[]> {
    return request.get('/api/v1/websocket/clients')
  },

  /**
   * 断开指定客户端
   */
  async disconnectClient(clientId: string): Promise<void> {
    return request.delete(`/api/v1/websocket/clients/${clientId}`)
  },

  /**
   * 订阅主题
   */
  async subscribeTopic(clientId: string, topic: string): Promise<void> {
    return request.post(`/api/v1/websocket/clients/${clientId}/topics/${topic}/subscribe`)
  },

  /**
   * 取消订阅主题
   */
  async unsubscribeTopic(clientId: string, topic: string): Promise<void> {
    return request.delete(`/api/v1/websocket/clients/${clientId}/topics/${topic}/unsubscribe`)
  },

  /**
   * 全局广播消息
   */
  async broadcastMessage(messageType: string, data: any): Promise<void> {
    return request.post('/api/v1/websocket/broadcast', {
      type: messageType,
      data
    })
  },

  /**
   * 向主题广播消息
   */
  async broadcastToTopic(topic: string, messageType: string, data: any): Promise<void> {
    return request.post(`/api/v1/websocket/topics/${topic}/broadcast`, {
      type: messageType,
      data
    })
  },

  /**
   * 向用户发送消息
   */
  async sendMessageToUser(userId: number, messageType: string, data: any): Promise<void> {
    return request.post(`/api/v1/websocket/users/${userId}/send`, {
      type: messageType,
      data
    })
  },

  /**
   * 向客户端发送消息
   */
  async sendMessageToClient(clientId: string, messageType: string, data: any): Promise<void> {
    return request.post(`/api/v1/websocket/clients/${clientId}/send`, {
      type: messageType,
      data
    })
  },

  // ==================== 模拟测试 API ====================

  /**
   * 模拟消息监控事件
   */
  async simulateMessageMonitor(data: any): Promise<void> {
    return request.post('/api/v1/websocket/simulate/message', data)
  },

  /**
   * 模拟告警事件
   */
  async simulateAlert(data: any): Promise<void> {
    return request.post('/api/v1/websocket/simulate/alert', data)
  },

  // ==================== 导出功能 API ====================

  /**
   * 导出监控报告
   */
  async exportMonitorReport(config: {
    dateRange: { from: string; to: string }
    includeData: {
      messages: boolean
      contacts: boolean
      alerts: boolean
    }
    format: 'pdf' | 'xlsx'
  }): Promise<Blob> {
    const response = await request.post('/api/v1/monitor/export/report', config, {
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * 获取导出任务状态
   */
  async getExportTaskStatus(taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    downloadUrl?: string
    error?: string
  }> {
    return request.get(`/api/v1/monitor/export/tasks/${taskId}`)
  },

  // ==================== 系统健康检查 API ====================

  /**
   * 获取监控系统健康状态
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    services: {
      database: boolean
      websocket: boolean
      sensitiveEngine: boolean
      cache: boolean
    }
    metrics: {
      totalConnections: number
      messagesPerSecond: number
      alertsPerMinute: number
      memoryUsage: number
      cpuUsage: number
    }
  }> {
    return request.get('/api/v1/monitor/health')
  },

  /**
   * 获取系统性能指标
   */
  async getSystemMetrics(): Promise<{
    responseTime: number
    throughput: number
    errorRate: number
    uptime: number
  }> {
    return request.get('/api/v1/monitor/metrics')
  }
}