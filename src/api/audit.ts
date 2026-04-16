import { request } from './index'
import type {
  // 操作日志相关类型
  OperationLog,
  OperationLogQuery,
  OperationLogsResponse,
  OperationLogResponse,
  OperationLogStats,
  OperationLogStatsResponse,

  // 登录日志相关类型
  LoginLog,
  LoginLogQuery,
  LoginLogsResponse,
  LoginLogResponse,
  LoginLogStats,
  LoginLogStatsResponse,

  // 异常检测相关类型
  AnomalyDetection,
  AnomalyDetectionQuery,
  AnomalyDetectionsResponse,
  AnomalyDetectionResponse,
  AnomalyDetectionStats,
  AnomalyDetectionStatsResponse,

  // 日志归档相关类型
  LogArchive,
  LogArchiveQuery,
  LogArchivesResponse,
  ArchiveStats,
  ArchiveStatsResponse,

  // 审计配置相关类型
  AuditConfig,
  AuditConfigQuery,
  AuditConfigsResponse,
  AuditConfigResponse,

  // 审计报告相关类型
  AuditReport,
  AuditReportQuery,
  AuditReportsResponse,
  AuditReportResponse,
  ReportGenerateRequest,

  // 合规相关类型
  ComplianceMetrics,
  ComplianceMetricsResponse,
  ComplianceReport,
  ComplianceReportResponse,

  // 工具类型
  ExportOptions,
  LogFilter
} from '@/types/audit'
import type { ApiResponse } from '@/types/api'

// ================================
// 操作日志相关API
// ================================

export const operationLogApi = {
  /**
   * 获取操作日志列表
   */
  getOperationLogs: (params: OperationLogQuery): Promise<OperationLogsResponse> => {
    return request.get('/admin/operation-logs', params)
  },

  /**
   * 获取操作日志详情
   */
  getOperationLog: (id: number): Promise<OperationLogResponse> => {
    return request.get(`/admin/operation-logs/${id}`)
  },

  /**
   * 获取操作日志统计
   */
  getOperationLogStats: (params?: {
    start_time?: string
    end_time?: string
    user_id?: number
  }): Promise<OperationLogStatsResponse> => {
    return request.get('/audit/operation-logs/stats', params)
  },

  /**
   * 导出操作日志
   */
  exportOperationLogs: (options: ExportOptions): Promise<ApiResponse<{ download_url: string }>> => {
    return request.post('/audit/operation-logs/export', options)
  },

  /**
   * 批量删除操作日志 (仅超级管理员)
   */
  deleteOperationLogs: (ids: number[]): Promise<ApiResponse<void>> => {
    return request.delete('/audit/operation-logs/batch', { ids })
  }
}

// ================================
// 登录日志相关API
// ================================

export const loginLogApi = {
  /**
   * 获取登录日志列表
   */
  getLoginLogs: (params: LoginLogQuery): Promise<LoginLogsResponse> => {
    return request.get('/audit/login-logs', params)
  },

  /**
   * 获取登录日志详情
   */
  getLoginLog: (id: number): Promise<LoginLogResponse> => {
    return request.get(`/audit/login-logs/${id}`)
  },

  /**
   * 获取登录日志统计
   */
  getLoginLogStats: (params?: {
    start_time?: string
    end_time?: string
    user_id?: number
  }): Promise<LoginLogStatsResponse> => {
    return request.get('/audit/login-logs/stats', params)
  },

  /**
   * 标记可疑登录
   */
  markSuspiciousLogin: (id: number, suspicious: boolean): Promise<ApiResponse<void>> => {
    return request.patch(`/audit/login-logs/${id}/suspicious`, { is_suspicious: suspicious })
  },

  /**
   * 获取用户登录分析
   */
  getUserLoginAnalysis: (userId: number, days: number = 30): Promise<ApiResponse<{
    total_logins: number
    unique_locations: number
    unique_devices: number
    average_session_duration: number
    login_pattern: Array<{ hour: number; count: number }>
    risk_factors: string[]
  }>> => {
    return request.get(`/audit/login-logs/analysis/${userId}`, { days })
  },

  /**
   * 导出登录日志
   */
  exportLoginLogs: (options: ExportOptions): Promise<ApiResponse<{ download_url: string }>> => {
    return request.post('/audit/login-logs/export', options)
  }
}

// ================================
// 异常检测相关API
// ================================

export const anomalyDetectionApi = {
  /**
   * 获取异常检测记录列表
   */
  getAnomalyDetections: (params: AnomalyDetectionQuery): Promise<AnomalyDetectionsResponse> => {
    return request.get('/audit/anomaly-detections', params)
  },

  /**
   * 获取异常检测详情
   */
  getAnomalyDetection: (id: number): Promise<AnomalyDetectionResponse> => {
    return request.get(`/audit/anomaly-detections/${id}`)
  },

  /**
   * 获取异常检测统计
   */
  getAnomalyDetectionStats: (params?: {
    start_time?: string
    end_time?: string
    user_id?: number
  }): Promise<AnomalyDetectionStatsResponse> => {
    return request.get('/audit/anomaly-detections/stats', params)
  },

  /**
   * 确认异常为真实威胁
   */
  confirmAnomaly: (id: number, note?: string): Promise<ApiResponse<void>> => {
    return request.post(`/audit/anomaly-detections/${id}/confirm`, { handling_note: note })
  },

  /**
   * 标记异常为误报
   */
  markFalsePositive: (id: number, note?: string): Promise<ApiResponse<void>> => {
    return request.post(`/audit/anomaly-detections/${id}/false-positive`, { handling_note: note })
  },

  /**
   * 获取实时异常检测
   */
  getRealTimeAnomalies: (): Promise<AnomalyDetectionsResponse> => {
    return request.get('/audit/anomaly-detections/realtime')
  },

  /**
   * 获取异常检测规则
   */
  getDetectionRules: (): Promise<ApiResponse<Array<{
    id: number
    name: string
    type: string
    enabled: boolean
    threshold: number
    severity: string
  }>>> => {
    return request.get('/audit/anomaly-detections/rules')
  },

  /**
   * 更新异常检测规则
   */
  updateDetectionRule: (id: number, data: {
    enabled?: boolean
    threshold?: number
    severity?: string
  }): Promise<ApiResponse<void>> => {
    return request.put(`/audit/anomaly-detections/rules/${id}`, data)
  }
}

// ================================
// 日志归档相关API
// ================================

export const logArchiveApi = {
  /**
   * 获取日志归档列表
   */
  getLogArchives: (params: LogArchiveQuery): Promise<LogArchivesResponse> => {
    return request.get('/audit/archives', params)
  },

  /**
   * 创建归档任务
   */
  createArchive: (data: {
    archive_type: string
    start_date: string
    end_date: string
  }): Promise<ApiResponse<LogArchive>> => {
    return request.post('/audit/archives', data)
  },

  /**
   * 获取归档统计
   */
  getArchiveStats: (): Promise<ArchiveStatsResponse> => {
    return request.get('/audit/archives/stats')
  },

  /**
   * 恢复归档数据
   */
  restoreArchive: (id: number): Promise<ApiResponse<void>> => {
    return request.post(`/audit/archives/${id}/restore`)
  },

  /**
   * 下载归档文件
   */
  downloadArchive: (id: number): Promise<ApiResponse<{ download_url: string }>> => {
    return request.get(`/audit/archives/${id}/download`)
  },

  /**
   * 删除归档
   */
  deleteArchive: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/audit/archives/${id}`)
  }
}

// ================================
// 审计配置相关API
// ================================

export const auditConfigApi = {
  /**
   * 获取审计配置列表
   */
  getAuditConfigs: (params: AuditConfigQuery): Promise<AuditConfigsResponse> => {
    return request.get('/audit/configs', params)
  },

  /**
   * 获取审计配置详情
   */
  getAuditConfig: (key: string): Promise<AuditConfigResponse> => {
    return request.get(`/audit/configs/${key}`)
  },

  /**
   * 创建审计配置
   */
  createAuditConfig: (data: Partial<AuditConfig>): Promise<AuditConfigResponse> => {
    return request.post('/audit/configs', data)
  },

  /**
   * 更新审计配置
   */
  updateAuditConfig: (key: string, data: Partial<AuditConfig>): Promise<AuditConfigResponse> => {
    return request.put(`/audit/configs/${key}`, data)
  },

  /**
   * 删除审计配置
   */
  deleteAuditConfig: (key: string): Promise<ApiResponse<void>> => {
    return request.delete(`/audit/configs/${key}`)
  },

  /**
   * 重置配置为默认值
   */
  resetConfig: (key: string): Promise<AuditConfigResponse> => {
    return request.post(`/audit/configs/${key}/reset`)
  }
}

// ================================
// 审计报告相关API
// ================================

export const auditReportApi = {
  /**
   * 获取审计报告列表
   */
  getAuditReports: (params: AuditReportQuery): Promise<AuditReportsResponse> => {
    return request.get('/audit/reports', params)
  },

  /**
   * 获取审计报告详情
   */
  getAuditReport: (id: number): Promise<AuditReportResponse> => {
    return request.get(`/audit/reports/${id}`)
  },

  /**
   * 生成审计报告
   */
  generateReport: (data: ReportGenerateRequest): Promise<AuditReportResponse> => {
    return request.post('/audit/reports/generate', data)
  },

  /**
   * 下载审计报告
   */
  downloadReport: (id: number): Promise<ApiResponse<{ download_url: string }>> => {
    return request.get(`/audit/reports/${id}/download`)
  },

  /**
   * 删除审计报告
   */
  deleteReport: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/audit/reports/${id}`)
  },

  /**
   * 获取报告模板
   */
  getReportTemplates: (): Promise<ApiResponse<Array<{
    id: string
    name: string
    type: string
    description: string
    sections: string[]
  }>>> => {
    return request.get('/audit/reports/templates')
  }
}

// ================================
// 合规相关API
// ================================

export const complianceApi = {
  /**
   * 获取合规指标
   */
  getComplianceMetrics: (period?: {
    start: string
    end: string
  }): Promise<ComplianceMetricsResponse> => {
    return request.get('/audit/compliance/metrics', period)
  },

  /**
   * 获取合规报告
   */
  getComplianceReport: (type: string, period: {
    start: string
    end: string
  }): Promise<ComplianceReportResponse> => {
    return request.get('/audit/compliance/reports', { type, ...period })
  },

  /**
   * 生成合规报告
   */
  generateComplianceReport: (data: {
    type: 'GDPR' | 'ISO27001' | 'SOC2' | 'EQUALBANK_LEVEL2'
    period_start: string
    period_end: string
    include_recommendations?: boolean
  }): Promise<ComplianceReportResponse> => {
    return request.post('/audit/compliance/reports', data)
  },

  /**
   * 获取数据保留策略
   */
  getRetentionPolicies: (): Promise<ApiResponse<Array<{
    data_type: string
    retention_days: number
    archive_enabled: boolean
    auto_delete: boolean
  }>>> => {
    return request.get('/audit/compliance/retention-policies')
  },

  /**
   * 更新数据保留策略
   */
  updateRetentionPolicy: (dataType: string, data: {
    retention_days: number
    archive_enabled: boolean
    auto_delete: boolean
  }): Promise<ApiResponse<void>> => {
    return request.put(`/audit/compliance/retention-policies/${dataType}`, data)
  },

  /**
   * 执行合规检查
   */
  runComplianceCheck: (type?: string): Promise<ApiResponse<{
    check_id: string
    status: 'running' | 'completed' | 'failed'
    progress: number
    results?: any
  }>> => {
    return request.post('/audit/compliance/check', { type })
  }
}

// ================================
// 实时数据相关API
// ================================

export const realTimeApi = {
  /**
   * 获取实时统计数据
   */
  getRealTimeStats: (): Promise<ApiResponse<{
    active_users: number
    operations_per_minute: number
    anomalies_last_hour: number
    risk_level_distribution: Record<string, number>
    latest_operations: OperationLog[]
    latest_anomalies: AnomalyDetection[]
  }>> => {
    return request.get('/audit/realtime/stats')
  },

  /**
   * 获取活跃用户列表
   */
  getActiveUsers: (): Promise<ApiResponse<Array<{
    user_id: number
    user_name: string
    last_activity: string
    current_operations: number
    risk_score: number
  }>>> => {
    return request.get('/audit/realtime/active-users')
  },

  /**
   * 获取系统健康状态
   */
  getSystemHealth: (): Promise<ApiResponse<{
    audit_system_status: 'healthy' | 'warning' | 'error'
    log_processing_delay: number
    storage_usage: number
    alert_count: number
    last_backup: string
  }>> => {
    return request.get('/audit/realtime/health')
  }
}

// ================================
// 搜索和分析相关API
// ================================

export const searchApi = {
  /**
   * 全文搜索日志
   */
  searchLogs: (query: string, options: {
    type?: 'operation' | 'login' | 'anomaly'
    filters?: LogFilter
    limit?: number
    highlight?: boolean
  }): Promise<ApiResponse<{
    total: number
    results: Array<{
      type: string
      id: number
      score: number
      highlight: Record<string, string[]>
      data: OperationLog | LoginLog | AnomalyDetection
    }>
  }>> => {
    return request.post('/audit/search', { query, ...options })
  },

  /**
   * 获取搜索建议
   */
  getSearchSuggestions: (query: string, type?: string): Promise<ApiResponse<{
    suggestions: string[]
    filters: Array<{
      field: string
      value: string
      count: number
    }>
  }>> => {
    return request.get('/audit/search/suggestions', { query, type })
  },

  /**
   * 获取热门搜索
   */
  getPopularSearches: (): Promise<ApiResponse<Array<{
    query: string
    count: number
    last_searched: string
  }>>> => {
    return request.get('/audit/search/popular')
  }
}

// ================================
// 导出统一的API对象
// ================================

export const auditApi = {
  operations: operationLogApi,
  logins: loginLogApi,
  anomalies: anomalyDetectionApi,
  archives: logArchiveApi,
  configs: auditConfigApi,
  reports: auditReportApi,
  compliance: complianceApi,
  realtime: realTimeApi,
  search: searchApi
}

export default auditApi

// ================================
// 工具函数
// ================================

/**
 * 构建查询参数，处理空值
 */
export function buildQueryParams(params: Record<string, any>): Record<string, any> {
  const cleanParams: Record<string, any> = {}

  Object.keys(params).forEach(key => {
    const value = params[key]
    if (value !== null && value !== undefined && value !== '') {
      cleanParams[key] = value
    }
  })

  return cleanParams
}

/**
 * 格式化导出选项
 */
export function formatExportOptions(options: Partial<ExportOptions>): ExportOptions {
  return {
    format: options.format || 'csv',
    filename: options.filename || `audit_logs_${new Date().getTime()}`,
    includeColumns: options.includeColumns || [],
    filters: options.filters || {}
  }
}

/**
 * 获取WebSocket连接用于实时数据
 */
export function createWebSocketConnection(endpoint: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const wsBaseUrl = apiBaseUrl.startsWith('http')
    ? apiBaseUrl.replace(/^https?/, protocol.replace(':', ''))
    : `${protocol}//${window.location.host}${apiBaseUrl}`
  const wsUrl = `${wsBaseUrl}/ws${endpoint}`
  return new WebSocket(wsUrl)
}