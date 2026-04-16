/**
 * 消息搜索API客户端
 */
import { request } from './index'
import type {
  MessageSearchRequest,
  MessageSearchResponse,
  MessageContextRequest,
  MessageContextResponse
} from '@/types/message-search'
import type { ApiResponse } from '@/types/api'

/**
 * 搜索消息
 * @param params 搜索参数
 * @returns 搜索结果
 */
export const searchMessages = (params: MessageSearchRequest): Promise<ApiResponse<MessageSearchResponse>> => {
  return request.post('/whatsapp/messages/search', params)
}

/**
 * 获取消息上下文
 * @param messageId 消息ID
 * @param params 上下文参数
 * @returns 消息上下文
 */
export const getMessageContext = (
  messageId: number,
  params: MessageContextRequest
): Promise<ApiResponse<MessageContextResponse>> => {
  return request.get(`/whatsapp/messages/${messageId}/context`, params)
}

/**
 * 删除消息(管理员操作)
 * @param messageId 消息ID
 * @returns 删除结果
 */
export const deleteMessage = (messageId: number): Promise<ApiResponse<null>> => {
  return request.delete(`/messages/${messageId}`)
}

/**
 * 仅删除我方装置上的消息（对方仍看得到）
 * @param messageId 消息ID
 * @returns 删除结果
 */
export const deleteMessageForMe = (messageId: number): Promise<ApiResponse<null>> => {
  return request.post(`/messages/${messageId}/delete-for-me`)
}

/**
 * 撤销消息(用户操作)
 * @param messageId 消息ID
 * @returns 撤销结果
 */
export const revokeMessage = (messageId: number): Promise<ApiResponse<null>> => {
  return request.post(`/messages/${messageId}/revoke`)
}
