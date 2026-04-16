import { api } from '@/utils/request'
import type {
  GenerateReferralCodeRequest,
  GenerateReferralCodeResponse,
  ReferralProfile,
  ReferralRegistrationParams,
  ReferralRegistrationListResponse,
  ReferralStatsParams,
  ReferralStats,
  ValidateReferralCodeResponse
} from '@/types/referral'

/**
 * 裂变推荐相关 API
 */
export const referralApi = {
  /**
   * 为用户生成推荐码
   */
  generateCode(
    accountId: number,
    data: GenerateReferralCodeRequest
  ): Promise<GenerateReferralCodeResponse> {
    return api.post(`/accounts/${accountId}/referral-code`, data)
  },

  /**
   * 获取用户的推荐信息
   */
  getReferralProfile(accountId: number): Promise<ReferralProfile> {
    return api.get(`/accounts/${accountId}/referral-profile`)
  },

  /**
   * 更新推荐码配置
   */
  updateReferralProfile(
    accountId: number,
    data: Partial<GenerateReferralCodeRequest>
  ): Promise<void> {
    return api.patch(`/accounts/${accountId}/referral-profile`, data)
  },

  /**
   * 获取裂变注册记录列表
   */
  getRegistrations(
    params: ReferralRegistrationParams
  ): Promise<ReferralRegistrationListResponse> {
    return api.get('/referrals/registrations', { params })
  },

  /**
   * 获取裂变统计数据
   */
  getStats(params: ReferralStatsParams): Promise<ReferralStats> {
    return api.get('/referrals/stats', { params })
  },

  /**
   * 验证推荐码
   */
  validateCode(code: string): Promise<ValidateReferralCodeResponse> {
    return api.get(`/referrals/validate/${code}`)
  }
}

export default referralApi
