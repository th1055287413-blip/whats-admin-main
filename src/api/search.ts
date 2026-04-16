import request from '@/utils/request'
import type { AdvancedSearchParams } from '@/types/search'

export interface SaveSearchRequest {
  name: string
  description?: string
  params: AdvancedSearchParams
  is_public: boolean
}

export interface SearchHistoryParams {
  limit?: number
  page?: number
}

export interface AddSearchHistoryRequest {
  params: AdvancedSearchParams
  result_count: number
  execution_time: number
}

export interface ExportSearchRequest extends AdvancedSearchParams {
  format: 'excel' | 'csv'
}

export const searchApi = {
  // 高级搜索
  advancedSearch(params: AdvancedSearchParams) {
    return request({
      url: '/api/v1/search/advanced',
      method: 'post',
      data: params
    })
  },

  // 快速搜索建议
  getSearchSuggestions(field: string, query: string) {
    return request({
      url: '/api/v1/search/suggestions',
      method: 'get',
      params: { field, query, limit: 10 }
    })
  },

  // 保存搜索
  saveSearch(data: SaveSearchRequest) {
    return request({
      url: '/api/v1/search/saved',
      method: 'post',
      data
    })
  },

  // 获取已保存的搜索
  getSavedSearches(params = { page: 1, limit: 20 }) {
    return request({
      url: '/api/v1/search/saved',
      method: 'get',
      params
    })
  },

  // 删除已保存的搜索
  deleteSavedSearch(id: number) {
    return request({
      url: `/api/v1/search/saved/${id}`,
      method: 'delete'
    })
  },

  // 更新搜索使用次数
  updateSearchUsage(id: number) {
    return request({
      url: `/api/v1/search/saved/${id}/usage`,
      method: 'post'
    })
  },

  // 获取搜索历史
  getSearchHistory(params: SearchHistoryParams = {}) {
    return request({
      url: '/api/v1/search/history',
      method: 'get',
      params: {
        limit: 10,
        page: 1,
        ...params
      }
    })
  },

  // 添加搜索历史
  addSearchHistory(data: AddSearchHistoryRequest) {
    return request({
      url: '/api/v1/search/history',
      method: 'post',
      data
    })
  },

  // 清除搜索历史
  clearSearchHistory() {
    return request({
      url: '/api/v1/search/history',
      method: 'delete'
    })
  },

  // 导出搜索结果
  exportSearchResults(params: ExportSearchRequest) {
    return request({
      url: '/api/v1/search/export',
      method: 'post',
      data: params,
      responseType: 'blob'
    })
  },

  // 获取搜索模板
  getSearchTemplate() {
    return request({
      url: '/api/v1/search/template',
      method: 'get'
    })
  },

  // 获取搜索分析数据
  getSearchAnalytics(params = {}) {
    return request({
      url: '/api/v1/search/analytics',
      method: 'get',
      params
    })
  },

  // 获取热门搜索
  getPopularSearches(limit = 10) {
    return request({
      url: '/api/v1/search/popular',
      method: 'get',
      params: { limit }
    })
  }
}