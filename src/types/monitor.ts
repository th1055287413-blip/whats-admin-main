// 监控系统相关类型定义
// 基于Stream A的数据模型设计

/**
 * 消息类型枚举
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  VOICE = 'voice',
  VIDEO = 'video'
}

/**
 * 敏感等级枚举
 */
export enum SensitiveLevel {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

/**
 * 消息状态枚举
 */
export enum MessageStatus {
  NORMAL = 'normal',
  BLOCKED = 'blocked',
  REVIEWED = 'reviewed'
}

/**
 * 联系人操作类型枚举
 */
export enum ContactAction {
  ADD = 'add',
  REMOVE = 'remove',
  BLOCK = 'block',
  UNBLOCK = 'unblock'
}

/**
 * 风险等级枚举
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * 敏感词类型枚举
 */
export enum WordType {
  KEYWORD = 'keyword',
  REGEX = 'regex'
}

/**
 * 敏感词等级枚举
 */
export enum SensitiveWordLevel {
  WARNING = 'warning',
  CRITICAL = 'critical',
  BLOCK = 'block'
}

/**
 * 告警类型枚举
 */
export enum AlertType {
  SENSITIVE_MESSAGE = 'sensitive_message',
  SUSPICIOUS_CONTACT = 'suspicious_contact',
  SYSTEM_ERROR = 'system_error',
  RATE_LIMIT = 'rate_limit'
}

/**
 * 告警严重程度枚举
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 敏感词检测结果
 */
export interface SensitiveWords {
  keywords: Array<{
    word: string
    level: SensitiveLevel
    position: number
  }>
  patterns: Array<{
    pattern: string
    level: SensitiveLevel
    match: string
    position: number
  }>
}

/**
 * 消息监控数据
 */
export interface MessageMonitor {
  id: number
  messageId: string
  fromUserId: number
  toUserId?: number
  groupId?: number
  content: string
  messageType: MessageType
  sentAt: string
  sensitiveWords?: SensitiveWords
  sensitiveLevel: SensitiveLevel
  status: MessageStatus
  reviewedBy?: number
  reviewedAt?: string
  reviewComments?: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

/**
 * 联系人详细信息
 */
export interface ContactDetails {
  phoneNumber?: string
  displayName?: string
  profilePicture?: string
  addedBy?: number
  addedAt?: string
  metadata?: Record<string, any>
}

/**
 * 联系人监控数据
 */
export interface ContactMonitor {
  id: number
  userId: number
  contactUserId: number
  action: ContactAction
  timestamp: string
  details: ContactDetails
  suspiciousScore: number
  riskLevel: RiskLevel
  isReviewed: boolean
  reviewedBy?: number
  reviewedAt?: string
  reviewComments?: string
  createdAt: string
  updatedAt: string
}

/**
 * 敏感词配置
 */
export interface SensitiveWord {
  id: number
  word: string
  type: WordType
  level: SensitiveWordLevel
  language: string
  category: string
  isActive: boolean
  createdBy: number
  createdAt: string
  updatedAt: string
}

/**
 * 敏感词批量操作
 */
export interface SensitiveWordBatch {
  words: Array<Omit<SensitiveWord, 'id' | 'createdAt' | 'updatedAt'>>
}

/**
 * 告警元数据
 */
export interface AlertMetadata {
  messageId?: string
  contactId?: string
  errorCode?: string
  details?: Record<string, any>
  relatedData?: Record<string, any>
}

/**
 * 实时告警数据
 */
export interface RealTimeAlert {
  id: number
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  metadata: AlertMetadata
  isRead: boolean
  isHandled: boolean
  handledBy?: number
  handledAt?: string
  messageMonitorId?: number
  contactMonitorId?: number
  createdAt: string
  updatedAt: string
}

/**
 * WebSocket消息类型
 */
export interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  messageId?: string
}

/**
 * 消息监控WebSocket数据
 */
export interface MessageMonitorData {
  messageId: string
  fromUserId: number
  toUserId?: number
  groupId?: number
  content: string
  messageType: MessageType
  sensitiveWords?: SensitiveWords
  sensitiveLevel: SensitiveLevel
  timestamp: string
}

/**
 * 联系人监控WebSocket数据
 */
export interface ContactMonitorData {
  userId: number
  contactUserId: number
  action: ContactAction
  details: ContactDetails
  suspiciousScore: number
  riskLevel: RiskLevel
  timestamp: string
}

/**
 * 告警WebSocket数据
 */
export interface AlertData {
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  metadata: AlertMetadata
  timestamp: string
}

/**
 * 系统状态数据
 */
export interface SystemStatusData {
  connectionCount: number
  messageCount: number
  alertCount: number
  timestamp: string
}

/**
 * 消息监控过滤器
 */
export interface MessageMonitorFilter {
  fromUserId?: number
  toUserId?: number
  groupId?: number
  messageType?: MessageType
  sensitiveLevel?: SensitiveLevel
  status?: MessageStatus
  dateFrom?: string
  dateTo?: string
  hasKeywords?: boolean
  isRead?: boolean
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 联系人监控过滤器
 */
export interface ContactMonitorFilter {
  userId?: number
  contactUserId?: number
  action?: ContactAction
  riskLevel?: RiskLevel
  dateFrom?: string
  dateTo?: string
  isReviewed?: boolean
  minSuspiciousScore?: number
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 告警过滤器
 */
export interface AlertFilter {
  type?: AlertType
  severity?: AlertSeverity
  isRead?: boolean
  isHandled?: boolean
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 敏感词过滤器
 */
export interface SensitiveWordFilter {
  type?: WordType
  level?: SensitiveWordLevel
  language?: string
  category?: string
  isActive?: boolean
  keyword?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

/**
 * 统计数据
 */
export interface MessageMonitorStats {
  totalMessages: number
  sensitiveMessages: number
  blockedMessages: number
  reviewedMessages: number
  messagesByType: Record<MessageType, number>
  messagesBySensitiveLevel: Record<SensitiveLevel, number>
  timeSeriesData: TimeSeriesData[]
}

export interface ContactMonitorStats {
  totalContacts: number
  suspiciousContacts: number
  reviewedContacts: number
  contactsByAction: Record<ContactAction, number>
  contactsByRiskLevel: Record<RiskLevel, number>
  timeSeriesData: TimeSeriesData[]
}

export interface AlertStats {
  totalAlerts: number
  unreadAlerts: number
  unhandledAlerts: number
  alertsByType: Record<AlertType, number>
  alertsBySeverity: Record<AlertSeverity, number>
  timeSeriesData: TimeSeriesData[]
}

export interface TimeSeriesData {
  date: string
  count: number
  sensitiveCount?: number
  suspiciousCount?: number
}

/**
 * 用户活动统计
 */
export interface UserActivityStats {
  userId: number
  messageCount: number
  contactCount: number
  suspiciousScore: number
  lastActivity: string
}

/**
 * 联系人行为模式
 */
export interface ContactBehaviorPattern {
  userId: number
  contactUserId: number
  addCount: number
  removeCount: number
  blockCount: number
  unblockCount: number
  avgSuspiciousScore: number
  lastActivity: string
}

/**
 * WebSocket连接状态
 */
export interface WebSocketStatus {
  connected: boolean
  reconnecting: boolean
  url: string
  lastConnected?: string
  lastDisconnected?: string
  reconnectAttempts: number
  connectionId?: string
}

/**
 * 实时数据状态
 */
export interface RealTimeDataState {
  isEnabled: boolean
  subscribedTopics: string[]
  messageBuffer: MessageMonitorData[]
  contactBuffer: ContactMonitorData[]
  alertBuffer: AlertData[]
  lastUpdated: string
}

/**
 * 监控界面状态
 */
export interface MonitorState {
  webSocket: WebSocketStatus
  realTimeData: RealTimeDataState
  messageMonitor: {
    data: MessageMonitor[]
    filter: MessageMonitorFilter
    stats: MessageMonitorStats | null
    loading: boolean
    error: string | null
  }
  contactMonitor: {
    data: ContactMonitor[]
    filter: ContactMonitorFilter
    stats: ContactMonitorStats | null
    loading: boolean
    error: string | null
  }
  alerts: {
    data: RealTimeAlert[]
    filter: AlertFilter
    stats: AlertStats | null
    loading: boolean
    error: string | null
  }
  sensitiveWords: {
    data: SensitiveWord[]
    filter: SensitiveWordFilter
    loading: boolean
    error: string | null
  }
}

/**
 * 敏感词缓存统计
 */
export interface SensitiveCacheStats {
  keywordCount: number
  regexCount: number
  lastRefresh: string
  cacheSize: number
}

/**
 * 敏感词检测结果
 */
export interface SensitiveDetectionResult {
  isSensitive: boolean
  level: SensitiveLevel
  words: SensitiveWords
  score: number
}

/**
 * 消息检查结果
 */
export interface MessageCheckResult {
  shouldBlock: boolean
  detection: SensitiveDetectionResult
  reviewRequired: boolean
  reason?: string
}

/**
 * 图表数据
 */
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    fill?: boolean
  }>
}

/**
 * 实时数据配置
 */
export interface RealTimeConfig {
  enabled: boolean
  bufferSize: number
  updateInterval: number
  autoRefresh: boolean
  topics: string[]
}

/**
 * 导出配置
 */
export interface ExportConfig {
  format: 'csv' | 'xlsx' | 'pdf'
  dateRange: {
    from: string
    to: string
  }
  includeData: {
    messages: boolean
    contacts: boolean
    alerts: boolean
    sensitiveWords: boolean
  }
  filters: {
    messageFilter?: MessageMonitorFilter
    contactFilter?: ContactMonitorFilter
    alertFilter?: AlertFilter
  }
}