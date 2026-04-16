import { request } from '@/utils/request'
import type {
  AccountSourceAssignmentRequest,
  AccountSourceResponse,
  BatchChannelSourceOperation,
  BatchChannelSourceOperationResponse,
  ChannelSource,
  ChannelSourceCreateRequest,
  ChannelSourceDeleteResponse,
  ChannelSourceListParams,
  ChannelSourceListResponse,
  ChannelSourceUpdateRequest,
  ChannelSourceUsageResponse,
  SourceResolutionParams,
  SourceResolutionPreview,
  SourceStats
} from '@/types/source'

/**
 * 来源管理 API
 */
export const sourceApi = {
  // ==================== 渠道来源管理 ====================

  /**
   * 获取渠道来源列表
   */
  listChannelSources(params?: ChannelSourceListParams): Promise<ChannelSourceListResponse> {
    return request.get('/sources/channels', { params })
  },

  /**
   * 获取渠道来源详情
   */
  getChannelSource(id: number): Promise<ChannelSource> {
    return request.get(`/sources/channels/${id}`)
  },

  /**
   * 创建渠道来源
   */
  createChannelSource(data: ChannelSourceCreateRequest): Promise<ChannelSource> {
    return request.post('/sources/channels', data)
  },

  /**
   * 更新渠道来源
   */
  updateChannelSource(id: number, data: ChannelSourceUpdateRequest): Promise<ChannelSource> {
    return request.patch(`/sources/channels/${id}`, data)
  },

  /**
   * 删除渠道来源（支持删除有用户绑定的渠道）
   * @param id 渠道ID
   * @param force 是否强制删除（即使有用户绑定）
   */
  deleteChannelSource(id: number, force = false): Promise<ChannelSourceDeleteResponse> {
    return request.delete(`/sources/channels/${id}`, {
      params: { force }
    })
  },

  /**
   * 归档渠道来源（软删除）
   */
  archiveChannelSource(id: number): Promise<void> {
    return request.post(`/sources/channels/${id}/archive`)
  },

  /**
   * 恢复渠道来源
   */
  restoreChannelSource(id: number): Promise<void> {
    return request.post(`/sources/channels/${id}/restore`)
  },

  /**
   * 获取渠道来源使用情况
   */
  getChannelSourceUsage(id: number): Promise<ChannelSourceUsageResponse> {
    return request.get(`/sources/channels/${id}/usage`)
  },

  /**
   * 批量操作渠道来源
   */
  batchOperateChannelSources(
    data: BatchChannelSourceOperation
  ): Promise<BatchChannelSourceOperationResponse> {
    return request.post('/sources/channels/batch', data)
  },

  // ==================== 账号来源管理 ====================

  /**
   * 获取账号的来源信息
   */
  getAccountSource(accountId: number): Promise<AccountSourceResponse> {
    return request.get(`/accounts/${accountId}/source`)
  },

  /**
   * 为账号分配来源
   */
  assignAccountSource(accountId: number, data: AccountSourceAssignmentRequest): Promise<void> {
    return request.put(`/accounts/${accountId}/source`, data)
  },

  /**
   * 清除账号的来源信息
   */
  clearAccountSource(accountId: number): Promise<void> {
    return request.delete(`/accounts/${accountId}/source`)
  },

  // ==================== 来源解析 ====================

  /**
   * 预览来源解析结果（用于验证参数）
   */
  previewSourceResolution(params: SourceResolutionParams): Promise<SourceResolutionPreview> {
    return request.get('/sources/resolve', { params })
  },

  // ==================== 统计数据 ====================

  /**
   * 获取来源统计数据
   */
  getSourceStats(params?: { date_from?: string; date_to?: string }): Promise<SourceStats> {
    return request.get('/sources/stats', { params })
  },

  // ==================== 数据迁移相关 ====================

  /**
   * 从标签系统迁移到渠道来源
   * 将现有的 tags 转换为 channel_sources
   */
  migrateTagsToChannels(): Promise<{
    success: boolean
    migrated_count: number
    message: string
  }> {
    return request.post('/sources/migrate-from-tags')
  }
}

export default sourceApi
