import request from '@/utils/request'
import type {
  CustomerConversation,
  CustomerConversationListParams,
  CustomerConversationListResponse,
  CustomerConversationStats,
  KeywordMatchStats,
  CustomerSession,
  CustomerSessionListResponse
} from '@/types/customer-conversation'

// 获取对话列表
export function getConversationList(params?: CustomerConversationListParams) {
  return request.get<CustomerConversationListResponse>('/admin/customer-conversations', { params })
}

// 获取会话详情（某个用户的所有对话）
export function getSessionConversations(sessionId: string) {
  return request.get<CustomerConversation[]>(`/admin/customer-conversations/session/${sessionId}`)
}

// 获取统计数据
export function getConversationStats(params?: { start_date?: string; end_date?: string }) {
  return request.get<CustomerConversationStats>('/admin/customer-conversations/stats', { params })
}

// 获取关键词匹配统计
export function getKeywordMatchStats(params?: {
  start_date?: string
  end_date?: string
  limit?: number
}) {
  return request.get<KeywordMatchStats[]>('/admin/customer-conversations/keyword-stats', {
    params
  })
}

// 获取活跃会话列表
export function getActiveSessions(limit = 20, offset = 0) {
  return request.get<CustomerSessionListResponse>('/admin/customer-conversations/sessions', {
    params: { limit, offset }
  })
}

// 管理员回复
export function sendAdminReply(sessionId: string, content: string) {
  return request.post<CustomerConversation>(
    `/admin/customer-conversations/session/${sessionId}/reply`,
    { content }
  )
}
