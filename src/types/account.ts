import type { AccountTag } from '@/api/tag'
import type { AccountSourceAttribution, SourceType } from '@/types/source'

export enum AdminStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
  PENDING = 'pending'
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'logged_out'

export interface Account {
  id: number
  phone_number: string
  push_name?: string
  full_name?: string
  first_name?: string
  avatar?: string
  platform?: string
  business_name?: string

  status: ConnectionStatus
  admin_status: AdminStatus
  is_online: boolean
  last_seen?: string
  disconnect_reason?: string
  disconnected_at?: string

  connector_id?: string
  connector_name?: string
  channel_id?: number
  channel_name?: string
  workgroup_id?: number
  workgroup_name?: string
  message_count: number

  ai_analysis_enabled?: boolean
  keep_chats_archived?: boolean

  tags?: AccountTag[]
  sync_status?: {
    overall_status: string
    last_full_sync_at?: string
    has_error: boolean
  }

  // 来源追踪字段（新）
  source_type?: SourceType | null
  source?: AccountSourceAttribution | null

  // 裂变推荐相关字段（向后兼容，后续由 source 字段承载）
  referral_code?: string
  referral_count?: number
  referred_by_account_id?: number
  referral_operator_id?: number
  referral_registered_at?: string

  created_at: string
  updated_at: string
}

export interface AccountListParams {
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  status?: ConnectionStatus
  admin_status?: AdminStatus | string
  is_online?: boolean
  tag_id?: number
  search?: string
  phone?: string
  channel_id?: number
  // 来源筛选参数（新）
  source_type?: SourceType | 'unknown' // referral, channel, unknown
  channel_source_id?: number // 筛选特定渠道来源
  created_from?: string // YYYY-MM-DD
  created_to?: string // YYYY-MM-DD
}

export interface AccountListResponse {
  items: Account[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface AccountStatsResponse {
  total: number
  active: number
  online: number
  connected: number
  disconnected: number
  logged_out: number
}

export interface AccountChartsResponse {
  account_growth: Array<{ date: string; count: number }>
  status_distribution: Array<{ status: string; count: number }>
  message_activity: Array<{ date: string; count: number }>
}

export interface BatchOperationRequest {
  account_ids: number[]
  operation: 'update_admin_status' | 'delete' | 'add_tags' | 'remove_tags'
  data?: {
    admin_status?: AdminStatus
    tag_ids?: number[]
  }
}

export interface BatchOperationResponse {
  success: boolean
  affected_count: number
  errors?: Array<{ account_id: number; error: string }>
}

export interface AccountTableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  sortable?: boolean | string
  formatter?: (row: Account, column: any, cellValue: any) => string
  fixed?: boolean | string
}

export interface AccountFilter {
  admin_status: AdminStatus | ''
  status: ConnectionStatus | ''
  is_online: boolean | ''
  tag_ids: number[]
  date_range: [string, string] | null
}
