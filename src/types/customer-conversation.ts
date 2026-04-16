// 客户咨询对话类型

export interface CustomerConversation {
  id: number
  session_id: string
  user_identifier: string
  user_message: string
  bot_reply: string
  matched_keyword_id?: number
  is_matched: boolean
  is_admin_reply: boolean
  admin_id?: number
  admin_name?: string
  ip_address?: string
  user_agent?: string
  created_at: string
  matched_keyword?: {
    id: number
    keywords: string[]
    reply: string
  }
}

// 客户会话（活跃会话列表）
export interface CustomerSession {
  session_id: string
  user_identifier: string
  last_message: string
  last_time: string
  message_count: number
  has_admin_reply: boolean
  needs_human: boolean
}

export interface CustomerConversationListParams {
  page?: number
  limit?: number
  user_identifier?: string
  session_id?: string
  is_matched?: boolean
  keyword_id?: number
  start_date?: string
  end_date?: string
  search?: string
}

export interface CustomerConversationListResponse {
  list: CustomerConversation[]
  total: number
  page: number
  limit: number
}

export interface CustomerSessionListResponse {
  list: CustomerSession[]
  total: number
  page: number
  limit: number
}

export interface CustomerConversationStats {
  total_conversations: number
  total_users: number
  matched_rate: number
  today_conversations: number
  today_users: number
}

export interface KeywordMatchStats {
  keyword_id: number
  keyword_name: string
  match_count: number
  percentage: number
}
