import { request } from '@/utils/request'

// ==================== 类型定义 ====================

export interface PromotionDomain {
  id: number
  name: string
  domain: string
  pixels: ChannelPixel[]
  status: 'enabled' | 'disabled'
}

export type LoanType = 'car' | 'housingFund' | 'mortgage' | 'business'

export interface ChannelPixel {
  platform: string
  params?: Record<string, unknown>
}

export interface Channel {
  id: number
  channel_code: string
  channel_name: string
  lang: 'zh' | 'ms' | 'en'
  loan_type?: LoanType
  promotion_domain_id?: number
  workgroup_id?: number | null
  status: 'enabled' | 'disabled'
  pixels: ChannelPixel[]
  remark: string
  created_at: string
  updated_at: string
  deleted_at?: string
  promotion_domain?: PromotionDomain
}

export interface ChannelListItem extends Channel {
  user_count: number
  admin_user_count: number
  promotion_url: string
  promotion_domain_name: string
  has_viewer_password: boolean
  workgroup_name: string
}

export interface ChannelListParams {
  page?: number
  page_size?: number
  status?: 'enabled' | 'disabled'
  keyword?: string
}

export interface ChannelListResponse {
  list: ChannelListItem[]
  total: number
  page: number
  page_size: number
}

export interface CreateChannelRequest {
  channel_name: string
  channel_code?: string
  lang: 'zh' | 'ms' | 'en'
  loan_type?: LoanType
  pixels?: ChannelPixel[]
  remark?: string
  promotion_domain_id?: number
  workgroup_id?: number | null
}

export interface UpdateChannelRequest {
  channel_name?: string
  channel_code?: string
  lang?: 'zh' | 'ms' | 'en'
  loan_type?: LoanType | ''
  pixels?: ChannelPixel[]
  remark?: string
  promotion_domain_id?: number
  workgroup_id?: number | null
  clear_workgroup?: boolean
}

export interface ChannelDeleteRequest {
  user_handle_type?: 'transfer' | 'none'
  target_channel_id?: number
}

export interface ChannelStatusRequest {
  status: 'enabled' | 'disabled'
}

export interface GenerateCodeResponse {
  channel_code: string
}

export interface ChannelIsolationConfig {
  enabled: boolean
}

// ==================== API 接口 ====================

export const channelApi = {
  /**
   * 获取渠道列表
   */
  getList(params?: ChannelListParams) {
    return request<ChannelListResponse>({
      url: '/channels',
      method: 'get',
      params
    })
  },

  /**
   * 获取渠道详情
   */
  getById(id: number) {
    return request<Channel>({
      url: `/channels/${id}`,
      method: 'get'
    })
  },

  /**
   * 根据渠道号获取渠道
   */
  getByCode(code: string) {
    return request<Channel>({
      url: '/channels/by-code',
      method: 'get',
      params: { code }
    })
  },

  /**
   * 生成渠道号
   */
  generateCode(lang: 'zh' | 'ms' | 'en') {
    return request<GenerateCodeResponse>({
      url: '/channels/generate-code',
      method: 'get',
      params: { lang }
    })
  },

  /**
   * 创建渠道
   */
  create(data: CreateChannelRequest) {
    return request<Channel>({
      url: '/channels',
      method: 'post',
      data
    })
  },

  /**
   * 更新渠道
   */
  update(id: number, data: UpdateChannelRequest) {
    return request<void>({
      url: `/channels/${id}`,
      method: 'put',
      data
    })
  },

  /**
   * 删除渠道
   */
  delete(id: number, data?: ChannelDeleteRequest) {
    return request<void>({
      url: `/channels/${id}`,
      method: 'delete',
      data
    })
  },

  /**
   * 更新渠道状态
   */
  updateStatus(id: number, status: 'enabled' | 'disabled') {
    return request<void>({
      url: `/channels/${id}/status`,
      method: 'put',
      data: { status }
    })
  },

  /**
   * 获取渠道隔离配置
   */
  getIsolationConfig() {
    return request<ChannelIsolationConfig>({
      url: '/channels/isolation-config',
      method: 'get'
    })
  },

  /**
   * 更新渠道隔离配置
   */
  updateIsolationConfig(enabled: boolean) {
    return request<void>({
      url: '/channels/isolation-config',
      method: 'put',
      data: { enabled }
    })
  },

  /**
   * 设置渠道查看密码
   */
  setViewerPassword(id: number, password: string) {
    return request<void>({
      url: `/channels/${id}/viewer-password`,
      method: 'put',
      data: { password }
    })
  }
}

export default channelApi
