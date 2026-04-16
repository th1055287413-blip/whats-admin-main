/**
 * 会话管理API客户端
 */
import { request } from './index'
import type { ApiResponse } from '@/types/api'

/**
 * 会话归档响应类型
 */
export interface ArchiveChatResponse {
  id: number
  archived: boolean
  archived_at: string | null
}

/**
 * 归档会话
 * @param chatId 会话ID
 * @returns 归档后的会话信息
 */
export const archiveChat = (chatId: number): Promise<ApiResponse<ArchiveChatResponse>> => {
  return request.post(`/chats/${chatId}/archive`)
}

/**
 * 取消归档会话
 * @param chatId 会话ID
 * @returns 取消归档后的会话信息
 */
export const unarchiveChat = (chatId: number): Promise<ApiResponse<ArchiveChatResponse>> => {
  return request.post(`/chats/${chatId}/unarchive`)
}
