import type { ApiResponse, PaginationParams, PaginationResponse } from './api'

// ================================
// 基础枚举和常量
// ================================

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum LoginType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  SESSION_TIMEOUT = 'session_timeout',
  FORCE_LOGOUT = 'force_logout'
}

export enum LoginStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  BLOCKED = 'blocked'
}

export enum AnomalyDetectionType {
  LOGIN_ANOMALY = 'login_anomaly',
  OPERATION_ANOMALY = 'operation_anomaly',
  ACCESS_ANOMALY = 'access_anomaly',
  DATA_ANOMALY = 'data_anomaly'
}

export enum AnomalySeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ArchiveType {
  OPERATION_LOGS = 'operation_logs',
  LOGIN_LOGS = 'login_logs',
  ANOMALY_DETECTIONS = 'anomaly_detections'
}

export enum ArchiveStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum ConfigType {
  RETENTION = 'retention',
  DETECTION = 'detection',
  ARCHIVE = 'archive',
  ALERT = 'alert'
}

// ================================
// 操作日志相关类型
// ================================

export interface OperationLog {
  id: number
  trace_id?: string
  operation_type: string
  operator_id: number
  operator_username: string
  resource_type: string
  resource_id?: string
  resource_name?: string
  before_value?: Record<string, any> | string
  after_value?: Record<string, any> | string
  ip_address: string
  user_agent?: string
  request_path: string
  request_method: string
  status: 'success' | 'failed'
  error_message?: string
  extra_data?: Record<string, any> | string
  created_at: string
  // 保留原有欄位以兼容
  user_id?: number
  user_name?: string
  operation_name?: string
  request_params?: Record<string, any>
  request_body?: Record<string, any>
  response_status?: number
  response_body?: Record<string, any>
  before_data?: Record<string, any>
  after_data?: Record<string, any>
  duration_ms?: number
  is_sensitive?: boolean
  risk_level?: RiskLevel
}

export interface OperationLogQuery extends PaginationParams {
  operation_type?: string
  operator_id?: number
  resource_type?: string
  resource_id?: string
  status?: 'success' | 'failed'
  start_time?: string
  end_time?: string
  // 保留原有欄位以兼容
  user_id?: number
  user_name?: string
  risk_level?: RiskLevel
  keyword?: string
  is_sensitive?: boolean
  ip_address?: string
}

export interface OperationLogStats {
  total_count: number
  operation_type_stats: Record<OperationType, number>
  risk_level_stats: Record<RiskLevel, number>
  hourly_stats: Array<{
    hour: string
    count: number
  }>
  user_stats: Array<{
    user_id: number
    user_name: string
    count: number
    risk_score: number
  }>
}

// ================================
// 登录日志相关类型
// ================================

export interface LocationInfo {
  country?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
}

export interface DeviceInfo {
  device_type?: string
  device_model?: string
  operating_system?: string
  browser?: string
  browser_version?: string
  screen_resolution?: string
}

export interface LoginLog {
  id: number
  user_id: number
  user_name: string
  login_type: LoginType
  login_status: LoginStatus
  failure_reason?: string
  ip_address: string
  location_info?: LocationInfo
  device_info?: DeviceInfo
  user_agent?: string
  session_id?: string
  session_duration?: number
  is_suspicious: boolean
  risk_score: number
  created_at: string
}

export interface LoginLogQuery extends PaginationParams {
  user_id?: number
  user_name?: string
  login_type?: LoginType
  login_status?: LoginStatus
  start_time?: string
  end_time?: string
  ip_address?: string
  is_suspicious?: boolean
  risk_score_min?: number
  risk_score_max?: number
}

export interface LoginLogStats {
  total_logins: number
  success_rate: number
  failure_rate: number
  suspicious_rate: number
  unique_users: number
  unique_ips: number
  login_type_stats: Record<LoginType, number>
  hourly_stats: Array<{
    hour: string
    logins: number
    failures: number
  }>
  location_stats: Array<{
    country: string
    city: string
    count: number
  }>
}

// ================================
// 异常检测相关类型
// ================================

export interface AnomalyDetection {
  id: number
  detection_type: AnomalyDetectionType
  user_id: number
  user_name?: string
  anomaly_description: string
  severity: AnomalySeverity
  evidence: Record<string, any>
  risk_score: number
  is_confirmed: boolean
  is_false_positive: boolean
  handled_by?: number
  handled_at?: string
  handling_note?: string
  related_log_ids?: number[]
  created_at: string
}

export interface AnomalyDetectionQuery extends PaginationParams {
  user_id?: number
  detection_type?: AnomalyDetectionType
  severity?: AnomalySeverity
  is_confirmed?: boolean
  is_false_positive?: boolean
  handled_by?: number
  start_time?: string
  end_time?: string
  risk_score_min?: number
  risk_score_max?: number
}

export interface AnomalyDetectionStats {
  total_anomalies: number
  confirmed_count: number
  false_positive_count: number
  unhandled_count: number
  severity_stats: Record<AnomalySeverity, number>
  detection_type_stats: Record<AnomalyDetectionType, number>
  daily_stats: Array<{
    date: string
    count: number
    confirmed: number
  }>
  user_risk_stats: Array<{
    user_id: number
    user_name: string
    anomaly_count: number
    avg_risk_score: number
  }>
}

// ================================
// 日志归档相关类型
// ================================

export interface LogArchive {
  id: number
  archive_type: ArchiveType
  archive_date: string
  original_table: string
  archive_path: string
  record_count: number
  compressed_size: number
  original_size: number
  compression_ratio: number
  checksum: string
  status: ArchiveStatus
  created_at: string
  completed_at?: string
}

export interface LogArchiveQuery extends PaginationParams {
  archive_type?: ArchiveType
  status?: ArchiveStatus
  start_date?: string
  end_date?: string
}

export interface ArchiveStats {
  total_archives: number
  total_records: number
  total_size_saved: number
  avg_compression_ratio: number
  archive_type_stats: Record<ArchiveType, {
    count: number
    total_size: number
    total_records: number
  }>
}

// ================================
// 审计配置相关类型
// ================================

export interface AuditConfig {
  id: number
  config_key: string
  config_value: Record<string, any>
  config_type: ConfigType
  description?: string
  is_active: boolean
  created_by: number
  updated_by: number
  created_at: string
  updated_at: string
}

export interface AuditConfigQuery extends PaginationParams {
  config_type?: ConfigType
  is_active?: boolean
  config_key?: string
}

// ================================
// 审计报告相关类型
// ================================

export interface AuditReport {
  id: number
  report_name: string
  report_type: ReportType
  report_period_start: string
  report_period_end: string
  report_content: Record<string, any>
  file_path?: string
  file_size?: number
  generated_by: number
  generated_at: string
}

export interface AuditReportQuery extends PaginationParams {
  report_type?: ReportType
  generated_by?: number
  start_date?: string
  end_date?: string
}

export interface ReportGenerateRequest {
  report_name: string
  report_type: ReportType
  period_start: string
  period_end: string
  filters?: {
    user_ids?: number[]
    operation_types?: OperationType[]
    risk_levels?: RiskLevel[]
  }
  include_sections?: string[]
  export_format?: 'pdf' | 'excel' | 'csv'
}

// ================================
// 筛选和搜索相关类型
// ================================

export interface LogFilter {
  time_range?: {
    start: string
    end: string
  }
  users?: Array<{
    id: number
    name: string
  }>
  operation_types?: OperationType[]
  risk_levels?: RiskLevel[]
  resource_types?: string[]
  ip_addresses?: string[]
  is_sensitive?: boolean
  keyword?: string
}

export interface QuickFilter {
  label: string
  value: string
  type: 'time' | 'risk' | 'user' | 'operation'
  active?: boolean
}

// ================================
// 图表和可视化相关类型
// ================================

export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }>
}

export interface TimeSeriesData {
  timestamp: string
  value: number
  category?: string
}

export interface HeatmapData {
  x: string
  y: string
  value: number
  risk_level?: RiskLevel
}

export interface RiskDistribution {
  risk_level: RiskLevel
  count: number
  percentage: number
  trend?: 'up' | 'down' | 'stable'
}

export interface UserBehaviorMetrics {
  user_id: number
  user_name: string
  total_operations: number
  risk_score: number
  anomaly_count: number
  last_login: string
  activity_pattern: Array<{
    hour: number
    activity_count: number
  }>
}

// ================================
// 合规相关类型
// ================================

export interface ComplianceMetrics {
  total_users: number
  active_users_last_30d: number
  total_operations_last_30d: number
  high_risk_operations_last_30d: number
  anomalies_detected_last_30d: number
  data_retention_compliance: boolean
  backup_compliance: boolean
  access_control_compliance: boolean
  audit_trail_completeness: number
}

export interface ComplianceReport {
  report_id: string
  report_type: 'GDPR' | 'ISO27001' | 'SOC2' | 'EQUALBANK_LEVEL2'
  period_start: string
  period_end: string
  compliance_score: number
  findings: Array<{
    category: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    recommendation?: string
  }>
  metrics: ComplianceMetrics
  generated_at: string
}

// ================================
// API 响应类型
// ================================

export type OperationLogsResponse = ApiResponse<PaginationResponse<OperationLog>>
export type OperationLogResponse = ApiResponse<OperationLog>
export type OperationLogStatsResponse = ApiResponse<OperationLogStats>

export type LoginLogsResponse = ApiResponse<PaginationResponse<LoginLog>>
export type LoginLogResponse = ApiResponse<LoginLog>
export type LoginLogStatsResponse = ApiResponse<LoginLogStats>

export type AnomalyDetectionsResponse = ApiResponse<PaginationResponse<AnomalyDetection>>
export type AnomalyDetectionResponse = ApiResponse<AnomalyDetection>
export type AnomalyDetectionStatsResponse = ApiResponse<AnomalyDetectionStats>

export type LogArchivesResponse = ApiResponse<PaginationResponse<LogArchive>>
export type ArchiveStatsResponse = ApiResponse<ArchiveStats>

export type AuditConfigsResponse = ApiResponse<PaginationResponse<AuditConfig>>
export type AuditConfigResponse = ApiResponse<AuditConfig>

export type AuditReportsResponse = ApiResponse<PaginationResponse<AuditReport>>
export type AuditReportResponse = ApiResponse<AuditReport>

export type ComplianceMetricsResponse = ApiResponse<ComplianceMetrics>
export type ComplianceReportResponse = ApiResponse<ComplianceReport>

// ================================
// 状态管理相关类型
// ================================

export interface AuditState {
  // 操作日志状态
  operationLogs: {
    items: OperationLog[]
    total: number
    loading: boolean
    currentQuery: OperationLogQuery
  }

  // 登录日志状态
  loginLogs: {
    items: LoginLog[]
    total: number
    loading: boolean
    currentQuery: LoginLogQuery
  }

  // 异常检测状态
  anomalyDetections: {
    items: AnomalyDetection[]
    total: number
    loading: boolean
    currentQuery: AnomalyDetectionQuery
  }

  // 当前选中的日志
  selectedLog: OperationLog | LoginLog | null

  // 筛选器状态
  filters: LogFilter
  quickFilters: QuickFilter[]

  // 统计数据
  stats: {
    operationStats: OperationLogStats | null
    loginStats: LoginLogStats | null
    anomalyStats: AnomalyDetectionStats | null
    complianceMetrics: ComplianceMetrics | null
  }

  // 实时更新状态
  realTimeEnabled: boolean
  lastUpdateTime: string | null
}

// ================================
// 组件Props相关类型
// ================================

export interface LogTableProps {
  logs: (OperationLog | LoginLog | AnomalyDetection)[]
  loading?: boolean
  type: 'operation' | 'login' | 'anomaly'
  selectable?: boolean
  showDetails?: boolean
  virtualScroll?: boolean
  height?: string | number
}

export interface LogFilterProps {
  modelValue: LogFilter
  type: 'operation' | 'login' | 'anomaly'
  quickFilters?: QuickFilter[]
  compact?: boolean
}

export interface AnomalyChartProps {
  data: AnomalyDetectionStats
  type: 'timeline' | 'distribution' | 'heatmap'
  height?: string | number
  interactive?: boolean
}

export interface ComplianceMetricsProps {
  metrics: ComplianceMetrics
  reportType?: 'GDPR' | 'ISO27001' | 'SOC2' | 'EQUALBANK_LEVEL2'
  period?: {
    start: string
    end: string
  }
}

// ================================
// 工具函数类型
// ================================

export interface DateRange {
  start: Date
  end: Date
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf'
  filename?: string
  includeColumns?: string[]
  filters?: LogFilter
}

export interface SearchOptions {
  query: string
  fields?: string[]
  fuzzy?: boolean
  highlight?: boolean
}