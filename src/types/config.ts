/**
 * 配置管理相关的 TypeScript 类型定义
 */

// 基础响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 配置项基础类型
export type ConfigType = 'string' | 'number' | 'boolean' | 'json'

// 系统配置项
export interface SystemConfig {
  id: number
  configKey: string
  configValue: string
  configType: ConfigType
  label?: string
  description?: string
  isEncrypted: boolean
  isSecret?: boolean
  category: string
  isRequired: boolean
  defaultValue?: string
  validationRule?: string
  updatedBy?: string
  createdAt: string
  updatedAt: string
}

// 系统配置分组
export interface SystemConfigGroup {
  category: string
  categoryName: string
  description?: string
  configs: SystemConfig[]
}

// 配置更新请求
export interface ConfigUpdateRequest {
  configKey: string
  configValue: string
  description?: string
}

// 配置批量更新请求
export interface ConfigBatchUpdateRequest {
  configs: ConfigUpdateRequest[]
}

// 敏感词匹配类型
export type SensitiveWordMatchType = 'exact' | 'fuzzy' | 'regex'

// 敏感词严重等级
export type SensitiveWordSeverity = 'low' | 'medium' | 'high'

// 敏感词状态
export type SensitiveWordStatus = 'active' | 'disabled'

// 敏感词项
export interface SensitiveWord {
  id: number
  word: string
  category: string
  matchType: SensitiveWordMatchType
  severity: SensitiveWordSeverity
  status: SensitiveWordStatus
  description?: string
  createdAt: string
  updatedAt: string
}

// 敏感词分类
export interface SensitiveWordCategory {
  category: string
  categoryName: string
  description?: string
  count: number
  words?: SensitiveWord[]
}

// 敏感词创建/更新请求
export interface SensitiveWordRequest {
  word: string
  category: string
  matchType: SensitiveWordMatchType
  severity: SensitiveWordSeverity
  status?: SensitiveWordStatus
  description?: string
}

// 敏感词批量操作请求
export interface SensitiveWordBatchRequest {
  action: 'create' | 'update' | 'delete' | 'enable' | 'disable'
  words?: SensitiveWordRequest[]
  ids?: number[]
}

// 敏感词导入数据
export interface SensitiveWordImportData {
  word: string
  category?: string
  matchType?: SensitiveWordMatchType
  severity?: SensitiveWordSeverity
  description?: string
}

// 敏感词导入结果
export interface SensitiveWordImportResult {
  total: number
  success: number
  failed: number
  errors: Array<{
    row: number
    word: string
    error: string
  }>
}

// 审批节点类型
export type ApprovalNodeType = 'user' | 'role' | 'condition'

// 审批操作
export type ApprovalAction = 'approve' | 'reject' | 'transfer'

// 审批节点
export interface ApprovalNode {
  id: string
  name: string
  type: ApprovalNodeType
  approvers: string[] // 用户ID或角色ID
  condition?: string // 条件表达式
  timeoutHours?: number
  isRequired: boolean
  description?: string
}

// 审批流程模板
export interface ApprovalTemplate {
  id: number
  name: string
  description?: string
  category: string
  nodes: ApprovalNode[]
  status: 'active' | 'disabled'
  version: number
  createdBy: number
  createdAt: string
  updatedAt: string
}

// 审批流程模板请求
export interface ApprovalTemplateRequest {
  name: string
  description?: string
  category: string
  nodes: ApprovalNode[]
  status?: 'active' | 'disabled'
}

// 配置历史记录
export interface ConfigHistory {
  id: number
  configType: 'system' | 'sensitive_word' | 'approval_template'
  configId: number
  operation: 'create' | 'update' | 'delete'
  oldValue?: any
  newValue?: any
  reason?: string
  operatorId: number
  operatorName: string
  createdAt: string
}

// 配置历史查询参数
export interface ConfigHistoryQuery {
  configType?: string
  configId?: number
  operation?: string
  operatorId?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

// 配置验证结果
export interface ConfigValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// 配置导出数据
export interface ConfigExportData {
  systemConfigs?: SystemConfig[]
  sensitiveWords?: SensitiveWord[]
  approvalTemplates?: ApprovalTemplate[]
  exportTime: string
  version: string
}

// 配置导入结果
export interface ConfigImportResult {
  systemConfigs?: {
    total: number
    success: number
    failed: number
    errors: string[]
  }
  sensitiveWords?: SensitiveWordImportResult
  approvalTemplates?: {
    total: number
    success: number
    failed: number
    errors: string[]
  }
}

// 配置搜索参数
export interface ConfigSearchParams {
  keyword?: string
  category?: string
  configType?: ConfigType
  status?: string
  page?: number
  pageSize?: number
}

// 敏感词搜索参数
export interface SensitiveWordSearchParams {
  keyword?: string
  category?: string
  matchType?: SensitiveWordMatchType
  severity?: SensitiveWordSeverity
  status?: SensitiveWordStatus
  page?: number
  pageSize?: number
}

// 审批模板搜索参数
export interface ApprovalTemplateSearchParams {
  keyword?: string
  category?: string
  status?: 'active' | 'disabled'
  createdBy?: number
  page?: number
  pageSize?: number
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 配置统计信息
export interface ConfigStats {
  systemConfigs: {
    total: number
    byCategory: Record<string, number>
  }
  sensitiveWords: {
    total: number
    byCategory: Record<string, number>
    bySeverity: Record<SensitiveWordSeverity, number>
    byStatus: Record<SensitiveWordStatus, number>
  }
  approvalTemplates: {
    total: number
    active: number
    disabled: number
    byCategory: Record<string, number>
  }
}

// 配置权限
export interface ConfigPermission {
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canExport: boolean
  canImport: boolean
  categories: string[]
}