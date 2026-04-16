import request from '@/utils/request'

// 敏感词相关接口
export const sensitiveWordApi = {
  // 获取敏感词列表
  list(params: {
    page?: number
    pageSize?: number
    keyword?: string
    matchType?: string
    category?: string
    enabled?: boolean
  }) {
    return request.get('/admin/sensitive-words', { params })
  },

  // 获取单个敏感词
  get(id: number) {
    return request.get(`/admin/sensitive-words/${id}`)
  },

  // 创建敏感词
  create(data: {
    word: string
    matchType: string
    category?: string
    priority?: number
    description?: string
    enabled?: boolean
  }) {
    return request.post('/admin/sensitive-words', data)
  },

  // 更新敏感词
  update(id: number, data: {
    word: string
    matchType: string
    category?: string
    priority?: number
    description?: string
    enabled?: boolean
  }) {
    return request.put(`/admin/sensitive-words/${id}`, data)
  },

  // 删除敏感词
  delete(id: number) {
    return request.delete(`/admin/sensitive-words/${id}`)
  },

  // 批量创建
  batchCreate(words: Array<{
    word: string
    matchType: string
    category?: string
    priority?: number
    enabled?: boolean
  }>) {
    return request.post('/admin/sensitive-words/batch', { words })
  },

  // 批量删除
  batchDelete(ids: number[]) {
    return request.delete('/admin/sensitive-words/batch', { data: { ids } })
  },

  // 导出
  export(params: {
    keyword?: string
    matchType?: string
    category?: string
    enabled?: boolean
  }) {
    return request.get('/admin/sensitive-words/export', {
      params,
      responseType: 'blob'
    })
  },

  // 刷新缓存
  refreshCache() {
    return request.post('/admin/sensitive-words/refresh-cache')
  }
}

// 系统配置相关接口
export const systemConfigApi = {
  // 获取配置
  getConfig(key: string) {
    return request.get(`/admin/configs/${key}`)
  },

  // 设置配置
  setConfig(key: string, value: string) {
    return request.put(`/admin/configs/${key}`, { value })
  },

  // 获取 Telegram 配置(分别获取三个配置项)
  async getTelegramConfig() {
    try {
      const [botTokenRes, chatIDRes, enabledRes] = await Promise.all([
        request.get('/admin/configs/telegram.bot_token'),
        request.get('/admin/configs/telegram.chat_id'),
        request.get('/admin/configs/telegram.enabled')
      ])

      return {
        code: 200,
        message: 'success',
        data: {
          botToken: botTokenRes.data?.value || '',
          chatID: chatIDRes.data?.value || '',
          enabled: enabledRes.data?.value === 'true'
        }
      }
    } catch (error) {
      return {
        code: 200,
        message: 'success',
        data: {
          botToken: '',
          chatID: '',
          enabled: false
        }
      }
    }
  },

  // 测试 Telegram 连接
  testTelegram(data: {
    botToken: string
    chatID: string
  }) {
    return request.post('/admin/configs/telegram/test', data)
  }
}

// 敏感词告警相关接口
export const sensitiveWordAlertApi = {
  // 获取告警列表
  list(params: {
    page?: number
    pageSize?: number
    keyword?: string
    status?: string
    startDate?: string
    endDate?: string
  }) {
    return request.get('/admin/sensitive-word-alerts', { params })
  },

  // 获取单个告警
  get(id: number) {
    return request.get(`/admin/sensitive-word-alerts/${id}`)
  },

  // 删除告警
  delete(id: number) {
    return request.delete(`/admin/sensitive-word-alerts/${id}`)
  },

  // 获取统计数据
  getStats() {
    return request.get('/admin/sensitive-word-alerts/stats')
  },

  // 重发通知
  resend(id: number) {
    return request.post(`/admin/sensitive-word-alerts/${id}/resend`)
  }
}
