import { request } from './index'
import type {
  SystemConfig,
  SensitiveWord,
  SensitiveWordCategory,
  SensitiveWordRequest,
  SensitiveWordBatchRequest,
  SensitiveWordImportData,
  SensitiveWordImportResult,
  ApprovalTemplate,
  ApprovalTemplateRequest,
  ConfigHistory,
  ConfigHistoryQuery,
  ConfigValidation,
  ConfigExportData,
  ConfigImportResult,
  SensitiveWordSearchParams,
  ApprovalTemplateSearchParams,
  PaginatedResponse,
  ConfigStats,
  ConfigPermission,
  ApiResponse
} from '@/types/config'

/**
 * 系统配置相关API
 */
export const systemConfigApi = {
  // 获取所有系统配置（回傳 SystemConfig 陣列）
  getConfigs(): Promise<ApiResponse<SystemConfig[]>> {
    return request.get('/admin/configs')
  },

  // 获取单个配置项
  getConfig(configKey: string): Promise<ApiResponse<{ key: string; value: string }>> {
    return request.get(`/admin/configs/${configKey}`)
  },

  // 更新单个配置项
  updateConfig(configKey: string, value: string): Promise<ApiResponse<void>> {
    return request.put(`/admin/configs/${configKey}`, { value })
  },

  // 测试 Telegram 连接
  testTelegram(): Promise<ApiResponse<any>> {
    return request.post('/admin/configs/telegram/test')
  }
}

/**
 * 內容審核配置 API（敏感詞監控、Telegram 告警）
 */
export const contentModerationConfigApi = {
  getConfigs(): Promise<ApiResponse<SystemConfig[] | Record<string, string>>> {
    return request.get('/admin/content-moderation/config')
  },

  updateConfig(configKey: string, value: string): Promise<ApiResponse<void>> {
    return request.put(`/admin/content-moderation/config/${configKey}`, { value })
  },

  testTelegram(): Promise<ApiResponse<any>> {
    return request.post('/admin/content-moderation/config/telegram/test')
  }
}

/**
 * 敏感词管理相关API
 */
export const sensitiveWordApi = {
  // 获取所有敏感词分类
  getCategories(): Promise<ApiResponse<SensitiveWordCategory[]>> {
    return request.get('/config/sensitive-words/categories')
  },

  // 获取特定分类的敏感词
  getWordsByCategory(category: string): Promise<ApiResponse<SensitiveWord[]>> {
    return request.get(`/config/sensitive-words/category/${category}`)
  },

  // 搜索敏感词
  searchWords(params: SensitiveWordSearchParams): Promise<ApiResponse<PaginatedResponse<SensitiveWord>>> {
    return request.get('/config/sensitive-words/search', params)
  },

  // 获取单个敏感词
  getWord(id: number): Promise<ApiResponse<SensitiveWord>> {
    return request.get(`/config/sensitive-words/${id}`)
  },

  // 创建敏感词
  createWord(data: SensitiveWordRequest): Promise<ApiResponse<SensitiveWord>> {
    return request.post('/config/sensitive-words', data)
  },

  // 更新敏感词
  updateWord(id: number, data: SensitiveWordRequest): Promise<ApiResponse<SensitiveWord>> {
    return request.put(`/config/sensitive-words/${id}`, data)
  },

  // 删除敏感词
  deleteWord(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/config/sensitive-words/${id}`)
  },

  // 批量操作敏感词
  batchOperateWords(data: SensitiveWordBatchRequest): Promise<ApiResponse<void>> {
    return request.post('/config/sensitive-words/batch', data)
  },

  // 批量导入敏感词
  importWords(data: SensitiveWordImportData[]): Promise<ApiResponse<SensitiveWordImportResult>> {
    return request.post('/config/sensitive-words/import', { words: data })
  },

  // 导出敏感词
  exportWords(category?: string): Promise<ApiResponse<SensitiveWord[]>> {
    const params = category ? { category } : undefined
    return request.get('/config/sensitive-words/export', params)
  },

  // 测试敏感词检测
  testDetection(text: string, categories?: string[]): Promise<ApiResponse<{
    matches: Array<{
      word: string
      category: string
      severity: string
      position: number
    }>
    hasViolation: boolean
  }>> {
    return request.post('/config/sensitive-words/test', { text, categories })
  },

  // 获取敏感词统计
  getStats(): Promise<ApiResponse<{
    total: number
    byCategory: Record<string, number>
    bySeverity: Record<string, number>
    byStatus: Record<string, number>
  }>> {
    return request.get('/config/sensitive-words/stats')
  }
}

/**
 * 审批流程模板相关API
 */
export const approvalTemplateApi = {
  // 获取所有审批模板
  getTemplates(): Promise<ApiResponse<ApprovalTemplate[]>> {
    return request.get('/config/approval-templates')
  },

  // 搜索审批模板
  searchTemplates(params: ApprovalTemplateSearchParams): Promise<ApiResponse<PaginatedResponse<ApprovalTemplate>>> {
    return request.get('/config/approval-templates/search', params)
  },

  // 获取单个审批模板
  getTemplate(id: number): Promise<ApiResponse<ApprovalTemplate>> {
    return request.get(`/config/approval-templates/${id}`)
  },

  // 创建审批模板
  createTemplate(data: ApprovalTemplateRequest): Promise<ApiResponse<ApprovalTemplate>> {
    return request.post('/config/approval-templates', data)
  },

  // 更新审批模板
  updateTemplate(id: number, data: ApprovalTemplateRequest): Promise<ApiResponse<ApprovalTemplate>> {
    return request.put(`/config/approval-templates/${id}`, data)
  },

  // 删除审批模板
  deleteTemplate(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/config/approval-templates/${id}`)
  },

  // 复制审批模板
  cloneTemplate(id: number, name: string): Promise<ApiResponse<ApprovalTemplate>> {
    return request.post(`/config/approval-templates/${id}/clone`, { name })
  },

  // 启用/禁用模板
  toggleTemplateStatus(id: number, status: 'active' | 'disabled'): Promise<ApiResponse<ApprovalTemplate>> {
    return request.patch(`/config/approval-templates/${id}/status`, { status })
  },

  // 验证模板配置
  validateTemplate(nodes: any[]): Promise<ApiResponse<ConfigValidation>> {
    return request.post('/config/approval-templates/validate', { nodes })
  },

  // 获取模板使用统计
  getTemplateStats(id: number): Promise<ApiResponse<{
    usageCount: number
    averageApprovalTime: number
    successRate: number
    recentUsage: Array<{
      date: string
      count: number
    }>
  }>> {
    return request.get(`/config/approval-templates/${id}/stats`)
  }
}

/**
 * 配置历史相关API
 */
export const configHistoryApi = {
  // 获取配置历史记录
  getHistory(params: ConfigHistoryQuery): Promise<ApiResponse<PaginatedResponse<ConfigHistory>>> {
    return request.get('/config/history', params)
  },

  // 获取特定配置的历史记录
  getConfigHistory(configType: string, configId: number): Promise<ApiResponse<ConfigHistory[]>> {
    return request.get(`/config/history/${configType}/${configId}`)
  },

  // 回滚到历史版本
  rollbackToHistory(historyId: number, reason?: string): Promise<ApiResponse<void>> {
    return request.post(`/config/history/${historyId}/rollback`, { reason })
  },

  // 比较两个历史版本
  compareHistory(historyId1: number, historyId2: number): Promise<ApiResponse<{
    differences: Array<{
      field: string
      oldValue: any
      newValue: any
    }>
  }>> {
    return request.get(`/config/history/compare/${historyId1}/${historyId2}`)
  }
}

/**
 * 配置管理通用API
 */
export const configApi = {
  // 获取配置权限
  getPermissions(): Promise<ApiResponse<ConfigPermission>> {
    return request.get('/config/permissions')
  },

  // 获取配置统计信息
  getStats(): Promise<ApiResponse<ConfigStats>> {
    return request.get('/config/stats')
  },

  // 导出配置数据
  exportConfig(types: string[]): Promise<ApiResponse<ConfigExportData>> {
    return request.post('/config/export', { types })
  },

  // 导入配置数据
  importConfig(file: File): Promise<ApiResponse<ConfigImportResult>> {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/config/import', formData)
  },

  // 应用配置更改（热重载）
  applyConfig(): Promise<ApiResponse<{ success: boolean; restartRequired?: boolean }>> {
    return request.post('/config/apply')
  },

  // 检查配置更新状态
  getApplyStatus(): Promise<ApiResponse<{
    isApplying: boolean
    lastApplyTime?: string
    lastApplySuccess?: boolean
    error?: string
  }>> {
    return request.get('/config/apply/status')
  },

  // 获取系统健康状态
  getHealthStatus(): Promise<ApiResponse<{
    database: boolean
    cache: boolean
    email: boolean
    whatsapp: boolean
    storage: boolean
  }>> {
    return request.get('/config/health')
  }
}

// 默认导出所有API
export default {
  systemConfig: systemConfigApi,
  contentModerationConfig: contentModerationConfigApi,
  sensitiveWord: sensitiveWordApi,
  approvalTemplate: approvalTemplateApi,
  history: configHistoryApi,
  ...configApi
}