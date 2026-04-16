/**
 * WebSocket 消息类型定义
 * 用于 WhatsApp 消息实时推送
 */

// WebSocket 消息类型枚举
export enum WSMessageType {
  NEW_MESSAGE = 'new_message',
  MESSAGE_STATUS = 'message_status',
  MESSAGE_REVOKED = 'message_revoked',
  MESSAGE_EDITED = 'message_edited',
  TYPING = 'typing',
  ONLINE_STATUS = 'online_status',
  CONNECTED = 'connected'
}

// WebSocket 消息基础结构
export interface WSMessage<T = any> {
  type: WSMessageType | string
  account_id: number
  data: T
  timestamp: string
}

// 新消息数据结构
export interface NewMessageData {
  id: number
  message_id: string
  from_jid: string
  to_jid: string
  from_phone_jid?: string // LID -> PhoneJID mapping
  to_phone_jid?: string // LID -> PhoneJID mapping
  content: string
  original_text?: string
  type: string
  media_url?: string
  is_from_me: boolean
  timestamp: string
  created_at: string
}

// 消息状态更新数据
export interface MessageStatusData {
  message_id: string
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending'
}

// 正在输入数据（可选功能）
export interface TypingData {
  contact_phone: string
  is_typing: boolean
}

// 在线状态数据（可选功能）
export interface OnlineStatusData {
  contact_phone: string
  is_online: boolean
  last_seen?: string
}

// 连接成功数据
export interface ConnectedData {
  message: string
  account_id?: number
}

// 消息撤回数据
export interface MessageRevokedData {
  message_id: string
  chat_jid: string
  is_from_me: boolean
  revoked_at: string
}

// 消息编辑数据
export interface MessageEditedData {
  message_id: string
  chat_jid: string
  new_content: string
  is_from_me: boolean
  edited_at: string
}

// 会话归档状态变更数据
export interface ChatArchiveChangedData {
  chat_id?: number
  jid?: string
  archived: boolean
  timestamp: string
}
