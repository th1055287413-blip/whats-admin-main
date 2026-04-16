import request from '@/utils/request'
import type {
  KeywordReply,
  KeywordListParams,
  KeywordListResponse,
  CreateKeywordRequest,
  UpdateKeywordRequest
} from '@/types/keyword'

// 获取关键词列表
export function getKeywordList(params?: KeywordListParams) {
  return request.get<KeywordListResponse>('/admin/auto-reply-keywords', { params })
}

// 获取单个关键词
export function getKeywordById(id: number) {
  return request.get<KeywordReply>(`/admin/auto-reply-keywords/${id}`)
}

// 创建关键词
export function createKeyword(data: CreateKeywordRequest) {
  return request.post<KeywordReply>('/admin/auto-reply-keywords', data)
}

// 更新关键词
export function updateKeyword(id: number, data: UpdateKeywordRequest) {
  return request.put<KeywordReply>(`/admin/auto-reply-keywords/${id}`, data)
}

// 删除关键词
export function deleteKeyword(id: number) {
  return request.delete(`/admin/auto-reply-keywords/${id}`)
}

// 批量删除关键词
export function batchDeleteKeywords(ids: number[]) {
  return request.post('/admin/auto-reply-keywords/batch-delete', { ids })
}

// 更新关键词状态
export function updateKeywordStatus(id: number, status: 'active' | 'inactive') {
  return request.patch(`/admin/auto-reply-keywords/${id}/status`, { status })
}
