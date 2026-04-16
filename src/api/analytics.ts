import request from '@/utils/request'
import type { AnalyticsParams, CustomReportConfig } from '@/types/analytics'

export const analyticsApi = {
  // 获取用户分析数据
  getUserAnalytics(params: AnalyticsParams = {}) {
    return request({
      url: '/api/v1/analytics/users',
      method: 'get',
      params
    })
  },

  // 获取用户增长趋势
  getUserGrowthTrend(params: { period?: string; duration?: number } = {}) {
    return request({
      url: '/api/v1/analytics/users/growth',
      method: 'get',
      params: {
        period: 'monthly',
        duration: 30,
        ...params
      }
    })
  },

  // 获取用户活动分析
  getUserActivityAnalytics(params: { period?: string } = {}) {
    return request({
      url: '/api/v1/analytics/users/activity',
      method: 'get',
      params: {
        period: 'daily',
        ...params
      }
    })
  },

  // 获取用户分群分析
  getUserSegmentAnalytics() {
    return request({
      url: '/api/v1/analytics/users/segments',
      method: 'get'
    })
  },

  // 获取消息分析
  getMessageAnalytics(params: AnalyticsParams = {}) {
    return request({
      url: '/api/v1/analytics/messages',
      method: 'get',
      params
    })
  },

  // 获取消息趋势分析
  getMessageTrendAnalytics(params: { period?: string } = {}) {
    return request({
      url: '/api/v1/analytics/messages/trend',
      method: 'get',
      params: {
        period: 'daily',
        ...params
      }
    })
  },

  // 获取地理分析
  getGeographicAnalytics() {
    return request({
      url: '/api/v1/analytics/geographic',
      method: 'get'
    })
  },

  // 获取用户行为分析
  getUserBehaviorAnalytics(userId: number, params: { period?: string } = {}) {
    return request({
      url: `/api/v1/analytics/users/${userId}/behavior`,
      method: 'get',
      params: {
        period: 'monthly',
        ...params
      }
    })
  },

  // 获取队列分析
  getCohortAnalysis(params: { period?: string } = {}) {
    return request({
      url: '/api/v1/analytics/cohort',
      method: 'get',
      params: {
        period: 'monthly',
        ...params
      }
    })
  },

  // 获取用户增长预测
  getUserGrowthPrediction(params: { days?: number } = {}) {
    return request({
      url: '/api/v1/analytics/predictions/growth',
      method: 'get',
      params: {
        days: 30,
        ...params
      }
    })
  },

  // 获取流失预测
  getChurnPrediction() {
    return request({
      url: '/api/v1/analytics/predictions/churn',
      method: 'get'
    })
  },

  // 获取实时统计
  getRealTimeStats() {
    return request({
      url: '/api/v1/analytics/realtime',
      method: 'get'
    })
  },

  // 生成自定义报表
  generateCustomReport(config: CustomReportConfig) {
    return request({
      url: '/api/v1/analytics/reports/custom',
      method: 'post',
      data: config
    })
  },

  // 获取分析概览
  getAnalyticsOverview() {
    return request({
      url: '/api/v1/analytics/overview',
      method: 'get'
    })
  }
}