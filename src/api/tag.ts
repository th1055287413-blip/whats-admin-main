import { request } from '@/utils/request'

// ==================== 类型定义 ====================

export interface AccountTag {
  id: number
  name: string
  tag_type: 'system' | 'custom'
  color: string
  description: string
  source_key?: string // 来源代码，用于 URL 参数匹配（如 ?source=FB_AD_2024）
  apply_rules?: AutoRuleCondition[]
  account_count: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface AutoRuleCondition {
  field: string
  operator: string
  value: any
  logic?: 'AND' | 'OR'
}

export interface TagAutoRule {
  id: number
  tag_id: number
  rule_name: string
  conditions: AutoRuleCondition[]
  execute_strategy: 'immediate' | 'scheduled'
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at?: string
  tag?: AccountTag
}

export interface TagStatistics {
  tag_id: number
  tag_name: string
  tag_color: string
  account_count: number
  percentage: number
  online_count: number
  active_count: number
  average_message_count: number
}

export interface TagTrendData {
  date: string
  message_count: number
  account_count: number
}

export interface TagListParams {
  page?: number
  limit?: number
  tag_type?: 'system' | 'custom'
  query?: string
  color?: string
  min_account_count?: number
}

export interface TagListResponse {
  list: AccountTag[]
  total: number
  page: number
  limit: number
}

export interface CreateTagRequest {
  name: string
  tag_type?: 'system' | 'custom'
  color: string
  description?: string
  source_key?: string // 来源代码
  apply_rules?: AutoRuleCondition[]
}

export interface UpdateTagRequest {
  name?: string
  tag_type?: 'system' | 'custom'
  color?: string
  description?: string
  source_key?: string // 来源代码
  apply_rules?: AutoRuleCondition[]
}

export interface AddAccountTagsRequest {
  tag_ids: number[]
}

export interface BatchAddAccountTagsRequest {
  account_ids: number[]
  tag_ids: number[]
}

// ==================== 标签管理 API ====================

/**
 * 获取标签列表
 */
export function getTagList(params?: TagListParams) {
  return request.get<TagListResponse>('/tags/accounts', { params })
}

/**
 * 获取标签详情
 */
export function getTagById(id: number) {
  return request.get<AccountTag>(`/tags/accounts/${id}`)
}

/**
 * 创建标签
 */
export function createTag(data: CreateTagRequest) {
  return request.post<AccountTag>('/tags/accounts', data)
}

/**
 * 更新标签
 */
export function updateTag(id: number, data: UpdateTagRequest) {
  return request.put<AccountTag>(`/tags/accounts/${id}`, data)
}

/**
 * 删除标签
 */
export function deleteTag(id: number) {
  return request.delete(`/tags/accounts/${id}`)
}

// ==================== 标签统计 API ====================

/**
 * 获取单个标签统计信息
 */
export function getTagStatistics(tagId: number) {
  return request.get<TagStatistics>(`/tags/accounts/${tagId}/stats`)
}

/**
 * 获取所有标签统计信息
 */
export function getAllTagsStatistics() {
  return request.get<TagStatistics[]>('/tags/accounts/analytics')
}

/**
 * 获取标签趋势数据
 */
export function getTagTrendData(tagId: number, days = 30) {
  return request.get<TagTrendData[]>(`/tags/accounts/${tagId}/trend`, { params: { days } })
}

// ==================== 账号标签绑定 API ====================

/**
 * 获取账号的所有标签
 */
export function getAccountTags(accountId: number) {
  return request.get<AccountTag[]>(`/accounts/${accountId}/tags`)
}

/**
 * 为账号添加标签
 */
export function addAccountTags(accountId: number, tagIds: number[]) {
  return request.post(`/accounts/${accountId}/tags`, { tag_ids: tagIds })
}

/**
 * 移除账号标签
 */
export function removeAccountTag(accountId: number, tagId: number) {
  return request.delete(`/accounts/${accountId}/tags/${tagId}`)
}

/**
 * 批量为账号添加标签
 */
export function batchAddAccountTags(data: BatchAddAccountTagsRequest) {
  return request.post('/accounts/tags/batch', data)
}

// ==================== 自动规则 API ====================

/**
 * 获取标签的自动规则列表
 */
export function getAutoRules(tagId: number) {
  return request.get<TagAutoRule[]>('/tags/auto-rules', { params: { tagId } })
}

/**
 * 创建自动规则
 */
export function createAutoRule(data: Omit<TagAutoRule, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) {
  return request.post<TagAutoRule>('/tags/auto-rules', data)
}

/**
 * 更新自动规则
 */
export function updateAutoRule(id: number, data: Partial<TagAutoRule>) {
  return request.put<TagAutoRule>(`/tags/auto-rules/${id}`, data)
}

/**
 * 删除自动规则
 */
export function deleteAutoRule(id: number) {
  return request.delete(`/tags/auto-rules/${id}`)
}

/**
 * 执行自动规则
 */
export function executeAutoRules(tagId: number) {
  return request.post(`/tags/accounts/${tagId}/execute-rules`)
}

// ==================== 导出默认对象 ====================

export default {
  // 标签管理
  getTagList,
  getTagById,
  createTag,
  updateTag,
  deleteTag,

  // 标签统计
  getTagStatistics,
  getAllTagsStatistics,
  getTagTrendData,

  // 账号标签绑定
  getAccountTags,
  addAccountTags,
  removeAccountTag,
  batchAddAccountTags,

  // 自动规则
  getAutoRules,
  createAutoRule,
  updateAutoRule,
  deleteAutoRule,
  executeAutoRules
}
