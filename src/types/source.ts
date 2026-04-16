/**
 * 来源管理类型定义
 * 统一管理渠道来源（Channel）和裂变来源（Referral）
 */

export type SourceType = 'referral' | 'channel'
export type SourceCaptureMethod = 'pairing_api' | 'manual_override' | 'import' | 'migration'
export type ChannelPlatform = 'facebook' | 'google' | 'tiktok' | 'youtube' | 'twitter' | 'instagram' | 'other'

/**
 * 渠道来源（由管理员管理，从原标签系统迁移而来）
 */
export interface ChannelSource {
  id: number
  key: string // 唯一标识，如 'FB_AD_001'
  name: string // 显示名称
  platform?: ChannelPlatform
  campaign_id?: string
  adset_id?: string
  creative_id?: string
  description?: string
  color?: string // 保留原标签的颜色
  landing_path?: string
  is_active: boolean
  account_count: number // 该渠道的用户数
  metadata?: Record<string, any>
  created_by_admin_id?: number
  created_at: string
  updated_at: string
  archived_at?: string
}

/**
 * 渠道来源列表查询参数
 */
export interface ChannelSourceListParams {
  page?: number
  page_size?: number
  search?: string
  platform?: ChannelPlatform
  is_active?: boolean
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  date_from?: string
  date_to?: string
}

/**
 * 渠道来源列表响应
 */
export interface ChannelSourceListResponse {
  items: ChannelSource[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * 创建渠道来源请求
 */
export interface ChannelSourceCreateRequest {
  key: string
  name: string
  platform?: ChannelPlatform
  campaign_id?: string
  adset_id?: string
  creative_id?: string
  description?: string
  color?: string
  landing_path?: string
  metadata?: Record<string, any>
}

/**
 * 更新渠道来源请求
 */
export interface ChannelSourceUpdateRequest {
  name?: string
  platform?: ChannelPlatform
  campaign_id?: string
  adset_id?: string
  creative_id?: string
  description?: string
  color?: string
  landing_path?: string
  metadata?: Record<string, any>
  is_active?: boolean
}

/**
 * 基础来源归属信息
 */
export interface BaseSourceAttribution {
  source_type: SourceType
  captured_at: string
  capture_method: SourceCaptureMethod
  landing_page?: string
  utm_params?: Record<string, string>
  notes?: string
  raw_params?: Record<string, string | undefined>
}

/**
 * 裂变来源归属（用户通过推荐码注册）
 */
export interface ReferralSourceAttribution extends BaseSourceAttribution {
  source_type: 'referral'
  referral_code: string
  source_account_id: number
  source_account_phone?: string
  source_account_name?: string
  source_account_avatar?: string
  referral_registration_id?: number
  referral_registered_at?: string
}

/**
 * 渠道来源归属（用户通过广告链接注册）
 */
export interface ChannelSourceAttribution extends BaseSourceAttribution {
  source_type: 'channel'
  channel_source_id: number
  channel_source_key: string
  channel_source_name: string
  channel_source_color?: string
  platform?: ChannelPlatform
  campaign_id?: string
  adset_id?: string
  creative_id?: string
}

/**
 * 账号的来源归属信息（联合类型）
 */
export type AccountSourceAttribution = ReferralSourceAttribution | ChannelSourceAttribution

/**
 * 账号来源响应
 */
export interface AccountSourceResponse {
  account_id: number
  source: AccountSourceAttribution | null
}

/**
 * 分配账号来源请求
 */
export interface AccountSourceAssignmentRequest {
  source_type: SourceType
  referral_code?: string
  channel_source_id?: number
  channel_source_key?: string
  landing_page?: string
  utm_params?: Record<string, string>
  notes?: string
  override_existing?: boolean
}

/**
 * 来源解析参数
 */
export interface SourceResolutionParams {
  referral_code?: string
  source_key?: string
  channel_source_id?: number
  landing_page?: string
  utm_params?: Record<string, string>
}

/**
 * 来源解析预览
 */
export interface SourceResolutionPreview {
  matched: boolean
  source?: AccountSourceAttribution
  reason?: string
}

/**
 * 渠道来源使用情况
 */
export interface ChannelSourceUsageResponse {
  source: ChannelSource
  account_count: number
  last_account_at?: string
  recent_accounts?: Array<{
    id: number
    phone_number: string
    push_name?: string
    registered_at: string
  }>
}

/**
 * 来源统计数据
 */
export interface SourceStats {
  total_sources: number
  channel_sources: number
  referral_sources: number
  channel_users: number
  referral_users: number
  today_new: number
  this_week_new: number
  this_month_new: number
  top_channels: Array<{
    id: number
    name: string
    key: string
    account_count: number
  }>
  top_referrers: Array<{
    account_id: number
    account_name: string
    referral_count: number
  }>
}

/**
 * 渠道来源删除响应（支持删除有用户绑定的渠道）
 */
export interface ChannelSourceDeleteResponse {
  success: boolean
  deleted_source_id: number
  affected_accounts: number
  message: string
}

/**
 * 批量操作请求
 */
export interface BatchChannelSourceOperation {
  source_ids: number[]
  operation: 'activate' | 'deactivate' | 'delete'
}

/**
 * 批量操作响应
 */
export interface BatchChannelSourceOperationResponse {
  success: boolean
  affected_count: number
  affected_accounts: number
  errors?: Array<{
    source_id: number
    error: string
  }>
}

/**
 * 常量：平台选项
 */
export const PLATFORM_OPTIONS: Array<{ label: string; value: ChannelPlatform }> = [
  { label: 'Facebook', value: 'facebook' },
  { label: 'Google', value: 'google' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Twitter/X', value: 'twitter' },
  { label: 'Instagram', value: 'instagram' },
  { label: '其他', value: 'other' }
]

/**
 * 常量：默认颜色选项
 */
export const DEFAULT_SOURCE_COLORS = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
  '#C0C4CC',
  '#8B5CF6',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#6366F1',
  '#EC4899',
  '#84CC16'
] as const
