/**
 * WhatsApp相关类型定义
 */

// WhatsApp账号信息
export interface WhatsAppAccount {
  id: number
  phone_number: string
  device_id: string
  status: string
  is_online: boolean
  last_seen: string
  last_connected: string
  avatar: string
  avatar_id: string
  push_name: string        // WhatsApp显示名称
  full_name: string        // 联系人完整名称
  first_name: string       // 联系人名字
  display_name: string     // 计算后的显示名称(优先级: push_name > full_name > phone_number)
  connected: boolean       // 连接状态
  platform: string         // smba/smbi=商業號, android/iphone=個人號, ""=尚未取得
  business_name: string    // 商業帳號名稱，個人號為空
  tags?: AccountTag[]
  created_at: string
  updated_at: string
}

// 账号标签
export interface AccountTag {
  id: number
  name: string
  color: string
}

// WhatsApp联系人
export interface WhatsAppContact {
  id: number
  account_id: number
  jid: string
  name: string
  phone: string
  avatar: string
  status: string
  is_online: boolean
  last_seen: string
  tags?: AccountTag[]
  created_at: string
  updated_at: string
}

// WhatsApp聊天会话
export interface WhatsAppChat {
  id: number
  account_id: number
  jid: string
  name: string
  last_message: string
  last_time: string
  unread_count: number
  is_group: boolean
  participants: string
  archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

// WhatsApp消息
export interface WhatsAppMessage {
  id: number
  account_id: number
  chat_id: number
  message_id: string
  from_jid: string
  to_jid: string
  content: string
  original_text?: string
  type: string
  media_url: string
  timestamp: string
  is_from_me: boolean
  is_read: boolean
  send_status: string
  created_at: string
  updated_at: string
}
