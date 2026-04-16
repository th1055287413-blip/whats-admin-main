import request from '@/utils/request'
import type {
  BatchOperationRequest,
  BatchHistoryParams
} from '@/types/batch'

export const batchApi = {
  // 批量操作用户
  batchOperateUsers(data: BatchOperationRequest) {
    return request({
      url: '/api/v1/batch/users',
      method: 'post',
      data
    })
  },

  // 获取批量操作进度
  getBatchProgress(taskId: string) {
    return request({
      url: `/api/v1/batch/progress/${taskId}`,
      method: 'get'
    })
  },

  // 取消批量操作
  cancelBatchOperation(taskId: string) {
    return request({
      url: `/api/v1/batch/cancel/${taskId}`,
      method: 'post'
    })
  },

  // 获取批量操作历史
  getBatchHistory(params: BatchHistoryParams = {}) {
    return request({
      url: '/api/v1/batch/history',
      method: 'get',
      params: {
        page: 1,
        limit: 20,
        ...params
      }
    })
  },

  // 获取支持的批量操作类型
  getBatchOperationTypes() {
    return request({
      url: '/api/v1/batch/operations',
      method: 'get'
    })
  }
}