import request from '@/utils/request'

export interface ImportHistoryParams {
  page?: number
  limit?: number
}

export const importApi = {
  // 导入用户数据
  importUsers(formData: FormData) {
    return request({
      url: '/api/v1/import/users',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 验证导入文件
  validateImportFile(formData: FormData) {
    return request({
      url: '/api/v1/import/validate',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 预览导入数据
  previewImportData(formData: FormData) {
    return request({
      url: '/api/v1/import/preview',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取导入进度
  getImportProgress(taskId: string) {
    return request({
      url: `/api/v1/import/progress/${taskId}`,
      method: 'get'
    })
  },

  // 获取导入历史记录
  getImportHistory(params: ImportHistoryParams = {}) {
    return request({
      url: '/api/v1/import/history',
      method: 'get',
      params: {
        page: 1,
        limit: 20,
        ...params
      }
    })
  },

  // 获取导入模板信息
  getImportTemplate() {
    return request({
      url: '/api/v1/import/template',
      method: 'get'
    })
  }
}