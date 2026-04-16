/**
 * 消息搜索相关类型定义
 */

// 消息类型枚举
export type MessageType = 'all' | 'text' | 'image' | 'video' | 'audio' | 'document'

// 排序顺序枚举
export type SortOrder = 'desc' | 'asc'

// 消息搜索请求参数
export interface MessageSearchRequest {
  account_id: number
  keyword: string
  chat_jid?: string
  message_type?: MessageType
  date_from?: string
  date_to?: string
  is_from_me?: boolean
  limit?: number
  offset?: number
  sort_order?: SortOrder
}

// 消息搜索结果项
export interface MessageSearchResultItem {
  id: number
  account_id: number
  account_phone: string       // 账号电话号码
  chat_id: number
  message_id: string
  from_jid: string
  from_name: string           // 发送者名称
  to_jid: string
  content: string
  type: string
  media_url: string
  timestamp: string
  is_from_me: boolean
  is_read: boolean
  send_status: string
  snippet: string
  matched_snippet: string
  chat_name: string
  chat_jid: string
  is_group_chat: boolean      // 是否群组聊天
  deleted_at?: string         // 删除时间戳
  deleted_by?: string         // 删除操作者
  is_revoked: boolean         // 是否已撤销
  revoked_at?: string         // 撤销时间戳
  created_at: string
  updated_at: string
}

// 消息搜索响应
export interface MessageSearchResponse {
  results: MessageSearchResultItem[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

// 消息上下文请求参数
export interface MessageContextRequest {
  account_id: number
  before_count?: number
  after_count?: number
}

// 聊天信息
export interface ChatInfo {
  chat_id: number
  chat_jid: string
  chat_name: string
  is_group: boolean
}

// 消息上下文响应
export interface MessageContextResponse {
  target_message: MessageSearchResultItem
  before_messages: MessageSearchResultItem[]
  after_messages: MessageSearchResultItem[]
  chat_info: ChatInfo
}

// 前端搜索表单
export interface SearchFormData {
  accountId: number
  keyword: string
  chatJid: string
  messageType: MessageType
  dateRange: [string, string] | null  // Element Plus DatePicker with value-format returns string
  isFromMe: boolean | null
  sortOrder: SortOrder
}

// 消息类型选项
export interface MessageTypeOption {
  label: string
  value: MessageType
}

// 发送方向选项
export interface DirectionOption {
  label: string
  value: boolean | null
}
