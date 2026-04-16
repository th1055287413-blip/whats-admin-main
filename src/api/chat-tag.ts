/**
 * 聊天标签管理 API
 */
import { request } from './index'

export interface ChatTag {
  id: number
  chat_id: string
  account_id: number
  tag: string
  category: string
  source: string
  created_at: string
  updated_at: string
}

export interface CreateChatTagRequest {
  chat_id: string
  account_id: number
  tag: string
  source?: string
}

/**
 * 创建聊天标签
 */
export const createChatTag = (data: CreateChatTagRequest) => {
  return request.post<ChatTag>('/admin/chat-tags', data)
}

/**
 * 删除聊天标签
 */
export const deleteChatTag = (id: number) => {
  return request.delete(`/admin/chat-tags/${id}`)
}

/**
 * 获取聊天标签列表
 */
export const getChatTags = (params?: {
  chat_id?: string
  account_id?: number
  tag?: string
  source?: string
  page?: number
  page_size?: number
}) => {
  return request.get<{ list: ChatTag[]; total: number }>('/admin/chat-tags', params)
}
