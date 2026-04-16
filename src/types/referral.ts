import type { Account } from './account'

/**
 * 推荐码配置
 */
export interface ReferralCode {
  id: number
  account_id: number
  referral_code: string
  promotion_domain_id: number
  promotion_domain_name?: string
  landing_path: string
  share_url: string
  qr_code_url?: string
  created_by_admin_id?: number
  created_at: string
  updated_at: string
}

/**
 * 推荐码生成请求
 */
export interface GenerateReferralCodeRequest {
  promotion_domain_id: number
  landing_path?: string
}

/**
 * 推荐码生成响应
 */
export interface GenerateReferralCodeResponse {
  referral_code: string
  share_url: string
  qr_code_url?: string
}

/**
 * 裂变注册记录
 */
export interface ReferralRegistration {
  id: number
  referral_code: string
  source_account_id: number
  source_account?: Account
  new_account_id: number
  new_account?: Account
  operator_admin_id?: number
  operator_admin?: {
    id: number
    username: string
    real_name?: string
  }
  promotion_domain_id?: number
  registered_at: string
  metadata?: Record<string, any>
}

/**
 * 推荐信息概览
 */
export interface ReferralProfile {
  referral_code: string
  share_url: string
  qr_code_url?: string
  stats: ReferralStats
  recent_registrations: ReferralRegistration[]
}

/**
 * 推荐统计数据
 */
export interface ReferralStats {
  total_referrals: number
  today_referrals: number
  this_week_referrals: number
  this_month_referrals: number
}

/**
 * 裂变记录查询参数
 */
export interface ReferralRegistrationParams {
  page?: number
  page_size?: number
  source_account_id?: number
  operator_admin_id?: number
  promotion_domain_id?: number
  date_from?: string
  date_to?: string
}

/**
 * 裂变记录列表响应
 */
export interface ReferralRegistrationListResponse {
  items: ReferralRegistration[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

/**
 * 裂变统计查询参数
 */
export interface ReferralStatsParams {
  account_id?: number
  promotion_domain_id?: number
  date_from?: string
  date_to?: string
}

/**
 * 推荐码验证响应
 */
export interface ValidateReferralCodeResponse {
  valid: boolean
  source_account?: {
    id: number
    push_name?: string
    avatar?: string
    phone_number: string
  }
}
