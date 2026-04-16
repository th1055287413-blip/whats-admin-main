/**
 * 文件传输管理类型定义
 */

// 文件传输状态枚举
export enum FileTransferStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

// 文件传输类型枚举
export enum FileTransferType {
  UPLOAD = 'upload',
  DOWNLOAD = 'download'
}

// 安全扫描结果枚举
export enum SecurityScanResult {
  CLEAN = 'clean',
  SUSPICIOUS = 'suspicious',
  MALICIOUS = 'malicious',
  ERROR = 'error',
  PENDING = 'pending'
}

// 安全扫描类型枚举
export enum SecurityScanType {
  VIRUS = 'virus',
  MALWARE = 'malware',
  CONTENT = 'content',
  FORMAT = 'format'
}

// 拦截规则类型枚举
export enum InterceptRuleType {
  FILE_TYPE = 'file_type',
  FILE_SIZE = 'file_size',
  FILE_NAME = 'file_name',
  FILE_CONTENT = 'file_content'
}

// 拦截规则动作枚举
export enum InterceptRuleAction {
  BLOCK = 'block',
  WARN = 'warn',
  REVIEW = 'review'
}

// 白名单类型枚举
export enum WhitelistType {
  USER = 'user',
  FILE_TYPE = 'file_type',
  DOMAIN = 'domain',
  CONTACT = 'contact'
}

// 文件基本信息接口
export interface FileInfo {
  id: string
  name: string
  original_name: string
  size: number
  type: string
  mime_type?: string
  extension: string
  hash: string
  path: string
  url?: string
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

// 文件传输记录接口
export interface FileTransfer {
  id: string
  user_id: number
  user_name?: string
  file_id: string
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  file_hash: string
  mime_type?: string
  transfer_type: FileTransferType
  status: FileTransferStatus
  is_intercepted: boolean
  intercept_reason?: string
  security_scan_result?: SecurityScanResult
  progress_percent: number
  transfer_speed?: number
  bytes_transferred: number
  estimated_time_remaining?: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  error_message?: string
  metadata?: Record<string, any>
}

// 上传会话接口
export interface UploadSession {
  session_id: string
  file_name: string
  file_size: number
  file_type: string
  mime_type?: string
  total_chunks: number
  chunk_size: number
  uploaded_chunks: number[]
  progress_percent: number
  status: FileTransferStatus
  expires_at: string
  created_at: string
  metadata?: Record<string, any>
}

// 分片上传信息接口
export interface ChunkInfo {
  chunk_index: number
  chunk_size: number
  chunk_hash: string
  uploaded: boolean
  upload_url?: string
}

// 安全扫描结果详情接口
export interface SecurityScanDetails {
  id: string
  file_transfer_id: string
  scan_type: SecurityScanType
  scan_engine: string
  scan_result: SecurityScanResult
  threat_details?: {
    threat_name?: string
    threat_type?: string
    risk_level?: 'low' | 'medium' | 'high' | 'critical'
    description?: string
    suggestions?: string[]
  }
  scan_duration: number
  scanned_at: string
  created_at: string
}

// 拦截规则条件接口
export interface InterceptRuleCondition {
  file_types?: string[]
  max_size?: number
  min_size?: number
  name_pattern?: string
  name_blacklist?: string[]
  content_rules?: string[]
  user_restrictions?: number[]
  time_restrictions?: {
    start_time?: string
    end_time?: string
    days_of_week?: number[]
  }
}

// 拦截规则接口
export interface InterceptRule {
  id: string
  rule_name: string
  rule_type: InterceptRuleType
  rule_condition: InterceptRuleCondition
  action: InterceptRuleAction
  priority: number
  is_active: boolean
  description?: string
  match_count: number
  last_matched_at?: string
  created_by: number
  created_by_name?: string
  created_at: string
  updated_at: string
}

// 白名单条目接口
export interface WhitelistEntry {
  id: string
  whitelist_type: WhitelistType
  whitelist_value: string
  user_id?: number
  user_name?: string
  description?: string
  expires_at?: string
  is_active: boolean
  usage_count: number
  last_used_at?: string
  created_by: number
  created_by_name?: string
  created_at: string
  updated_at: string
}

// 文件存储信息接口
export interface FileStorage {
  id: string
  file_hash: string
  original_name: string
  storage_path: string
  file_size: number
  mime_type?: string
  reference_count: number
  storage_backend: 'local' | 's3' | 'oss' | 'cos'
  storage_config?: Record<string, any>
  is_deleted: boolean
  created_at: string
  deleted_at?: string
}

// 文件传输统计接口
export interface FileTransferStats {
  total_transfers: number
  total_size: number
  successful_transfers: number
  failed_transfers: number
  blocked_transfers: number
  average_speed: number
  peak_speed: number
  transfers_by_type: Record<FileTransferType, number>
  transfers_by_status: Record<FileTransferStatus, number>
  size_distribution: {
    small: number // < 1MB
    medium: number // 1MB - 100MB
    large: number // > 100MB
  }
  time_distribution: {
    hour: number[]
    day: number[]
    week: number[]
    month: number[]
  }
}

// 安全统计接口
export interface SecurityStats {
  total_scans: number
  clean_files: number
  suspicious_files: number
  malicious_files: number
  scan_errors: number
  threats_by_type: Record<string, number>
  average_scan_time: number
  recent_threats: {
    threat_name: string
    file_name: string
    detected_at: string
  }[]
}

// 文件查询参数接口
export interface FileQueryParams {
  page?: number
  page_size?: number
  sort_by?: 'created_at' | 'file_size' | 'transfer_speed' | 'file_name'
  sort_order?: 'asc' | 'desc'
  status?: FileTransferStatus[]
  transfer_type?: FileTransferType
  user_id?: number
  file_type?: string[]
  size_min?: number
  size_max?: number
  date_from?: string
  date_to?: string
  keyword?: string
  is_intercepted?: boolean
  security_status?: SecurityScanResult[]
}

// 上传配置接口
export interface UploadConfig {
  max_file_size: number
  max_files_per_upload: number
  allowed_file_types: string[]
  blocked_file_types: string[]
  chunk_size: number
  max_concurrent_uploads: number
  session_timeout: number
  enable_virus_scan: boolean
  enable_content_scan: boolean
  auto_delete_failed_uploads: boolean
  storage_backend: 'local' | 's3' | 'oss' | 'cos'
  storage_config: Record<string, any>
}

// 文件上传选项接口
export interface FileUploadOptions {
  chunk_size?: number
  enable_resume?: boolean
  enable_virus_scan?: boolean
  enable_content_scan?: boolean
  metadata?: Record<string, any>
  tags?: string[]
  compress?: boolean
  encrypt?: boolean
}

// 文件上传结果接口
export interface FileUploadResult {
  file_id: string
  transfer_id: string
  file_url: string
  thumbnail_url?: string
  security_scan_result?: SecurityScanResult
  is_intercepted: boolean
  intercept_reason?: string
}

// 批量操作结果接口
export interface BatchOperationResult {
  total: number
  success: number
  failed: number
  errors: {
    id: string
    error: string
  }[]
}

// WebSocket事件类型
export type FileWebSocketEventType =
  | 'file_upload_start'
  | 'file_upload_progress'
  | 'file_upload_complete'
  | 'file_upload_failed'
  | 'file_intercepted'
  | 'security_scan_complete'
  | 'threat_detected'

// WebSocket事件数据接口
export interface FileWebSocketEvent {
  type: FileWebSocketEventType
  data: {
    transfer_id?: string
    file_id?: string
    user_id?: number
    file_name?: string
    progress?: number
    status?: FileTransferStatus
    message?: string
    security_scan_result?: SecurityScanDetails
    error?: string
  }
  timestamp: string
}

// 组件状态接口
export interface FileManagementState {
  // 传输相关
  transfers: FileTransfer[]
  activeTransfers: FileTransfer[]
  uploadSessions: UploadSession[]
  currentUpload: UploadSession | null

  // 规则和配置
  interceptRules: InterceptRule[]
  whitelistEntries: WhitelistEntry[]
  uploadConfig: UploadConfig | null

  // 统计数据
  transferStats: FileTransferStats | null
  securityStats: SecurityStats | null

  // UI状态
  loading: boolean
  uploading: boolean
  error: string | null

  // 筛选和分页
  queryParams: FileQueryParams
  pagination: {
    total: number
    current_page: number
    per_page: number
    total_pages: number
  }
}

// 拖拽上传事件接口
export interface DragUploadEvent {
  files: File[]
  position: { x: number; y: number }
  zone: string
}

// 文件预览接口
export interface FilePreview {
  type: 'image' | 'video' | 'audio' | 'document' | 'text' | 'archive' | 'unknown'
  url: string
  thumbnail_url?: string
  metadata?: {
    width?: number
    height?: number
    duration?: number
    pages?: number
    author?: string
    title?: string
  }
}

// 导出相关类型
export type FileExportFormat = 'csv' | 'excel' | 'pdf' | 'json'

export interface FileExportOptions {
  format: FileExportFormat
  date_range?: {
    start: string
    end: string
  }
  filters?: Partial<FileQueryParams>
  include_security_details?: boolean
  include_metadata?: boolean
}