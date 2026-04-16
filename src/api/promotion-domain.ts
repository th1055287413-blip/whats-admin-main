import { request } from '@/utils/request'
import type { ChannelPixel } from '@/api/channel'

// ==================== 類型定義 ====================

export type LoanType = 'car' | 'housingFund' | 'mortgage' | 'business'

export interface PromotionDomain {
  id: number
  name: string
  domain: string
  status: 'enabled' | 'disabled'
  pixels: ChannelPixel[]
  remark: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface PromotionDomainListItem extends PromotionDomain {
  channel_count: number
}

export interface PromotionDomainListParams {
  page?: number
  page_size?: number
  status?: 'enabled' | 'disabled'
  keyword?: string
}

export interface PromotionDomainListResponse {
  list: PromotionDomainListItem[]
  total: number
  page: number
  page_size: number
}

export interface CreatePromotionDomainRequest {
  name: string
  domain: string
  pixels?: ChannelPixel[]
  remark?: string
}

export interface UpdatePromotionDomainRequest {
  name?: string
  domain?: string
  pixels?: ChannelPixel[]
  remark?: string
}

export interface PromotionDomainStatusRequest {
  status: 'enabled' | 'disabled'
}

export interface PromotionDomainSimple {
  id: number
  name: string
  domain: string
}

// ==================== API 接口 ====================

export const promotionDomainApi = {
  /**
   * 獲取推廣域名列表
   */
  getList(params?: PromotionDomainListParams) {
    return request<PromotionDomainListResponse>({
      url: '/promotion-domains',
      method: 'get',
      params
    })
  },

  /**
   * 獲取推廣域名詳情
   */
  getById(id: number) {
    return request<PromotionDomain>({
      url: `/promotion-domains/${id}`,
      method: 'get'
    })
  },

  /**
   * 獲取啟用的域名列表（用於下拉選擇）
   */
  getOptions() {
    return request<PromotionDomainSimple[]>({
      url: '/promotion-domains/options',
      method: 'get'
    })
  },

  /**
   * 創建推廣域名
   */
  create(data: CreatePromotionDomainRequest) {
    return request<PromotionDomain>({
      url: '/promotion-domains',
      method: 'post',
      data
    })
  },

  /**
   * 更新推廣域名
   */
  update(id: number, data: UpdatePromotionDomainRequest) {
    return request<void>({
      url: `/promotion-domains/${id}`,
      method: 'put',
      data
    })
  },

  /**
   * 刪除推廣域名
   */
  delete(id: number) {
    return request<void>({
      url: `/promotion-domains/${id}`,
      method: 'delete'
    })
  },

  /**
   * 更新推廣域名狀態
   */
  updateStatus(id: number, status: 'enabled' | 'disabled') {
    return request<void>({
      url: `/promotion-domains/${id}/status`,
      method: 'put',
      data: { status }
    })
  }
}

export default promotionDomainApi
