import request from '@/utils/request'

export interface ExportParams {
  phone?: string
  name?: string
  status?: string
  is_online?: boolean
  country?: string
  city?: string
  language?: string
  tag_id?: number
}

export interface ExportHistoryParams {
  page?: number
  limit?: number
}

export const exportApi = {
  // 导出用户数据
  exportUsers(params: ExportParams = {}) {
    return request({
      url: '/api/v1/export/users',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  // 导出用户导入模板
  exportUserTemplate() {
    return request({
      url: '/api/v1/export/user-template',
      method: 'get',
      responseType: 'blob'
    })
  },

  // 导出标签数据
  exportTags() {
    return request({
      url: '/api/v1/export/tags',
      method: 'get',
      responseType: 'blob'
    })
  },

  // 导出用户统计数据
  exportUserStats(period: string = 'monthly') {
    return request({
      url: '/api/v1/export/user-stats',
      method: 'get',
      params: { period },
      responseType: 'blob'
    })
  },

  // 获取支持的导出格式
  getExportFormats() {
    return request({
      url: '/api/v1/export/formats',
      method: 'get'
    })
  },

  // 获取导出历史记录
  getExportHistory(params: ExportHistoryParams = {}) {
    return request({
      url: '/api/v1/export/history',
      method: 'get',
      params: {
        page: 1,
        limit: 20,
        ...params
      }
    })
  }
}