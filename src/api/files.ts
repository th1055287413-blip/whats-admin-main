import { request } from './index'
import type { ApiResponse, PaginationResponse, PaginationParams } from '@/types/api'
import type {
  FileTransfer,
  UploadSession,
  ChunkInfo,
  SecurityScanDetails,
  InterceptRule,
  WhitelistEntry,
  FileStorage,
  FileTransferStats,
  SecurityStats,
  FileQueryParams,
  UploadConfig,
  FileUploadOptions,
  FileUploadResult,
  BatchOperationResult,
  FileExportOptions,
  FilePreview,
  FileInfo,
  InterceptRuleCondition
} from '@/types/files'

/**
 * 文件传输管理API
 */
export const filesApi = {
  // ==================== 文件上传相关 ====================

  /**
   * 初始化文件上传会话
   */
  initUpload(data: {
    file_name: string
    file_size: number
    file_type: string
    mime_type?: string
    chunk_size?: number
    options?: FileUploadOptions
  }): Promise<ApiResponse<UploadSession>> {
    return request.post<UploadSession>('/files/upload/init', data)
  },

  /**
   * 上传文件分片
   */
  uploadChunk(
    sessionId: string,
    chunkIndex: number,
    chunkData: Blob | ArrayBuffer,
    chunkHash?: string
  ): Promise<ApiResponse<{ uploaded: boolean; chunk_index: number }>> {
    const formData = new FormData()
    formData.append('session_id', sessionId)
    formData.append('chunk_index', chunkIndex.toString())
    formData.append('chunk_data', new Blob([chunkData]))
    if (chunkHash) {
      formData.append('chunk_hash', chunkHash)
    }

    return request.post<{ uploaded: boolean; chunk_index: number }>(
      '/files/upload/chunk',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
  },

  /**
   * 完成文件上传
   */
  completeUpload(sessionId: string): Promise<ApiResponse<FileUploadResult>> {
    return request.post<FileUploadResult>('/files/upload/complete', {
      session_id: sessionId
    })
  },

  /**
   * 取消文件上传
   */
  cancelUpload(sessionId: string): Promise<ApiResponse> {
    return request.post('/files/upload/cancel', {
      session_id: sessionId
    })
  },

  /**
   * 暂停文件上传
   */
  pauseUpload(sessionId: string): Promise<ApiResponse> {
    return request.post('/files/upload/pause', {
      session_id: sessionId
    })
  },

  /**
   * 恢复文件上传
   */
  resumeUpload(sessionId: string): Promise<ApiResponse<UploadSession>> {
    return request.post<UploadSession>('/files/upload/resume', {
      session_id: sessionId
    })
  },

  /**
   * 获取上传会话状态
   */
  getUploadSession(sessionId: string): Promise<ApiResponse<UploadSession>> {
    return request.get<UploadSession>(`/files/upload/session/${sessionId}`)
  },

  /**
   * 获取上传配置
   */
  getUploadConfig(): Promise<ApiResponse<UploadConfig>> {
    return request.get<UploadConfig>('/files/upload/config')
  },

  /**
   * 直接文件上传（小文件）
   */
  uploadFile(
    file: File,
    options?: FileUploadOptions
  ): Promise<ApiResponse<FileUploadResult>> {
    const formData = new FormData()
    formData.append('file', file)
    if (options) {
      formData.append('options', JSON.stringify(options))
    }

    return request.post<FileUploadResult>('/files/upload/direct', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // ==================== 文件传输监控 ====================

  /**
   * 获取文件传输列表
   */
  getTransfers(params?: FileQueryParams): Promise<ApiResponse<PaginationResponse<FileTransfer>>> {
    return request.get<PaginationResponse<FileTransfer>>('/files/transfers', params)
  },

  /**
   * 获取单个文件传输详情
   */
  getTransfer(transferId: string): Promise<ApiResponse<FileTransfer>> {
    return request.get<FileTransfer>(`/files/transfers/${transferId}`)
  },

  /**
   * 重试失败的传输
   */
  retryTransfer(transferId: string): Promise<ApiResponse<FileTransfer>> {
    return request.post<FileTransfer>(`/files/transfers/${transferId}/retry`)
  },

  /**
   * 取消传输
   */
  cancelTransfer(transferId: string): Promise<ApiResponse> {
    return request.post(`/files/transfers/${transferId}/cancel`)
  },

  /**
   * 标记传输为已审核
   */
  reviewTransfer(
    transferId: string,
    data: { status: string; comments?: string }
  ): Promise<ApiResponse> {
    return request.post(`/files/transfers/${transferId}/review`, data)
  },

  /**
   * 批量操作传输记录
   */
  batchTransferOperation(data: {
    transfer_ids: string[]
    action: 'cancel' | 'retry' | 'delete' | 'review'
    params?: any
  }): Promise<ApiResponse<BatchOperationResult>> {
    return request.post<BatchOperationResult>('/files/transfers/batch', data)
  },

  /**
   * 获取活跃传输
   */
  getActiveTransfers(): Promise<ApiResponse<FileTransfer[]>> {
    return request.get<FileTransfer[]>('/files/transfers/active')
  },

  // ==================== 文件管理 ====================

  /**
   * 获取文件信息
   */
  getFileInfo(fileId: string): Promise<ApiResponse<FileInfo>> {
    return request.get<FileInfo>(`/files/${fileId}`)
  },

  /**
   * 删除文件
   */
  deleteFile(fileId: string): Promise<ApiResponse> {
    return request.delete(`/files/${fileId}`)
  },

  /**
   * 批量删除文件
   */
  batchDeleteFiles(fileIds: string[]): Promise<ApiResponse<BatchOperationResult>> {
    return request.post<BatchOperationResult>('/files/batch-delete', {
      file_ids: fileIds
    })
  },

  /**
   * 获取文件预览
   */
  getFilePreview(fileId: string): Promise<ApiResponse<FilePreview>> {
    return request.get<FilePreview>(`/files/${fileId}/preview`)
  },

  /**
   * 下载文件
   */
  downloadFile(fileId: string): Promise<Blob> {
    return request.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    })
  },

  /**
   * 获取文件下载链接
   */
  getDownloadUrl(
    fileId: string,
    options?: { expires_in?: number; download_name?: string }
  ): Promise<ApiResponse<{ download_url: string; expires_at: string }>> {
    return request.get<{ download_url: string; expires_at: string }>(
      `/files/${fileId}/download-url`,
      options
    )
  },

  // ==================== 安全扫描 ====================

  /**
   * 获取文件安全扫描结果
   */
  getSecurityScan(fileId: string): Promise<ApiResponse<SecurityScanDetails[]>> {
    return request.get<SecurityScanDetails[]>(`/files/${fileId}/security-scan`)
  },

  /**
   * 重新扫描文件
   */
  rescanFile(
    fileId: string,
    scanTypes?: string[]
  ): Promise<ApiResponse<SecurityScanDetails[]>> {
    return request.post<SecurityScanDetails[]>(`/files/${fileId}/rescan`, {
      scan_types: scanTypes
    })
  },

  /**
   * 获取安全扫描报告
   */
  getSecurityReport(params?: {
    date_from?: string
    date_to?: string
    scan_type?: string
    result?: string
  }): Promise<ApiResponse<SecurityScanDetails[]>> {
    return request.get<SecurityScanDetails[]>('/files/security-report', params)
  },

  /**
   * 标记威胁为误报
   */
  markFalsePositive(
    scanId: string,
    reason?: string
  ): Promise<ApiResponse> {
    return request.post(`/files/security-scan/${scanId}/false-positive`, {
      reason
    })
  },

  // ==================== 拦截规则管理 ====================

  /**
   * 获取拦截规则列表
   */
  getInterceptRules(params?: PaginationParams): Promise<ApiResponse<PaginationResponse<InterceptRule>>> {
    return request.get<PaginationResponse<InterceptRule>>('/files/rules', params)
  },

  /**
   * 获取单个拦截规则
   */
  getInterceptRule(ruleId: string): Promise<ApiResponse<InterceptRule>> {
    return request.get<InterceptRule>(`/files/rules/${ruleId}`)
  },

  /**
   * 创建拦截规则
   */
  createInterceptRule(data: {
    rule_name: string
    rule_type: string
    rule_condition: InterceptRuleCondition
    action: string
    priority?: number
    description?: string
  }): Promise<ApiResponse<InterceptRule>> {
    return request.post<InterceptRule>('/files/rules', data)
  },

  /**
   * 更新拦截规则
   */
  updateInterceptRule(
    ruleId: string,
    data: Partial<InterceptRule>
  ): Promise<ApiResponse<InterceptRule>> {
    return request.put<InterceptRule>(`/files/rules/${ruleId}`, data)
  },

  /**
   * 删除拦截规则
   */
  deleteInterceptRule(ruleId: string): Promise<ApiResponse> {
    return request.delete(`/files/rules/${ruleId}`)
  },

  /**
   * 启用/禁用拦截规则
   */
  toggleInterceptRule(
    ruleId: string,
    isActive: boolean
  ): Promise<ApiResponse<InterceptRule>> {
    return request.post<InterceptRule>(`/files/rules/${ruleId}/toggle`, {
      is_active: isActive
    })
  },

  /**
   * 测试拦截规则
   */
  testInterceptRule(
    ruleData: Partial<InterceptRule>,
    testFile: {
      file_name: string
      file_size: number
      file_type: string
      user_id?: number
    }
  ): Promise<ApiResponse<{ matched: boolean; reason?: string }>> {
    return request.post<{ matched: boolean; reason?: string }>('/files/rules/test', {
      rule: ruleData,
      test_file: testFile
    })
  },

  /**
   * 批量操作拦截规则
   */
  batchRuleOperation(data: {
    rule_ids: string[]
    action: 'enable' | 'disable' | 'delete'
  }): Promise<ApiResponse<BatchOperationResult>> {
    return request.post<BatchOperationResult>('/files/rules/batch', data)
  },

  // ==================== 白名单管理 ====================

  /**
   * 获取白名单条目列表
   */
  getWhitelist(params?: PaginationParams & {
    whitelist_type?: string
    user_id?: number
  }): Promise<ApiResponse<PaginationResponse<WhitelistEntry>>> {
    return request.get<PaginationResponse<WhitelistEntry>>('/files/whitelist', params)
  },

  /**
   * 获取单个白名单条目
   */
  getWhitelistEntry(entryId: string): Promise<ApiResponse<WhitelistEntry>> {
    return request.get<WhitelistEntry>(`/files/whitelist/${entryId}`)
  },

  /**
   * 创建白名单条目
   */
  createWhitelistEntry(data: {
    whitelist_type: string
    whitelist_value: string
    user_id?: number
    description?: string
    expires_at?: string
  }): Promise<ApiResponse<WhitelistEntry>> {
    return request.post<WhitelistEntry>('/files/whitelist', data)
  },

  /**
   * 更新白名单条目
   */
  updateWhitelistEntry(
    entryId: string,
    data: Partial<WhitelistEntry>
  ): Promise<ApiResponse<WhitelistEntry>> {
    return request.put<WhitelistEntry>(`/files/whitelist/${entryId}`, data)
  },

  /**
   * 删除白名单条目
   */
  deleteWhitelistEntry(entryId: string): Promise<ApiResponse> {
    return request.delete(`/files/whitelist/${entryId}`)
  },

  /**
   * 批量导入白名单
   */
  batchImportWhitelist(data: {
    whitelist_type: string
    values: string[]
    user_id?: number
    description?: string
    expires_at?: string
  }): Promise<ApiResponse<BatchOperationResult>> {
    return request.post<BatchOperationResult>('/files/whitelist/batch-import', data)
  },

  /**
   * 导出白名单
   */
  exportWhitelist(params?: {
    whitelist_type?: string
    format?: 'csv' | 'json' | 'excel'
  }): Promise<Blob> {
    return request.get('/files/whitelist/export', {
      ...params,
      responseType: 'blob'
    })
  },

  // ==================== 统计分析 ====================

  /**
   * 获取文件传输统计
   */
  getTransferStats(params?: {
    date_from?: string
    date_to?: string
    group_by?: 'hour' | 'day' | 'week' | 'month'
    user_id?: number
  }): Promise<ApiResponse<FileTransferStats>> {
    return request.get<FileTransferStats>('/files/stats/transfers', params)
  },

  /**
   * 获取安全统计
   */
  getSecurityStats(params?: {
    date_from?: string
    date_to?: string
    scan_type?: string
  }): Promise<ApiResponse<SecurityStats>> {
    return request.get<SecurityStats>('/files/stats/security', params)
  },

  /**
   * 获取存储统计
   */
  getStorageStats(): Promise<ApiResponse<{
    total_size: number
    used_size: number
    available_size: number
    file_count: number
    duplicate_count: number
    compression_ratio: number
    size_by_type: Record<string, number>
  }>> {
    return request.get('/files/stats/storage')
  },

  /**
   * 获取实时统计
   */
  getRealTimeStats(): Promise<ApiResponse<{
    active_uploads: number
    upload_speed: number
    queue_size: number
    error_rate: number
    system_load: number
  }>> {
    return request.get('/files/stats/realtime')
  },

  // ==================== 配置管理 ====================

  /**
   * 更新上传配置
   */
  updateUploadConfig(config: Partial<UploadConfig>): Promise<ApiResponse<UploadConfig>> {
    return request.put<UploadConfig>('/files/config/upload', config)
  },

  /**
   * 获取系统配置
   */
  getSystemConfig(): Promise<ApiResponse<{
    max_storage_size: number
    storage_backends: string[]
    scan_engines: string[]
    supported_file_types: string[]
    default_chunk_size: number
  }>> {
    return request.get('/files/config/system')
  },

  // ==================== 导出功能 ====================

  /**
   * 导出传输记录
   */
  exportTransfers(options: FileExportOptions): Promise<Blob> {
    return request.post('/files/export/transfers', options, {
      responseType: 'blob'
    })
  },

  /**
   * 导出安全报告
   */
  exportSecurityReport(options: FileExportOptions): Promise<Blob> {
    return request.post('/files/export/security', options, {
      responseType: 'blob'
    })
  },

  // ==================== WebSocket连接 ====================

  /**
   * 获取WebSocket连接token
   */
  getWebSocketToken(): Promise<ApiResponse<{ token: string; endpoint: string }>> {
    return request.get<{ token: string; endpoint: string }>('/files/ws-token')
  },

  // ==================== 清理和维护 ====================

  /**
   * 清理过期上传会话
   */
  cleanupExpiredSessions(): Promise<ApiResponse<{ cleaned_count: number }>> {
    return request.post<{ cleaned_count: number }>('/files/cleanup/sessions')
  },

  /**
   * 清理临时文件
   */
  cleanupTempFiles(): Promise<ApiResponse<{ cleaned_size: number; cleaned_count: number }>> {
    return request.post<{ cleaned_size: number; cleaned_count: number }>('/files/cleanup/temp')
  },

  /**
   * 文件去重
   */
  deduplicateFiles(): Promise<ApiResponse<{
    duplicate_count: number
    saved_size: number
    processed_count: number
  }>> {
    return request.post<{
      duplicate_count: number
      saved_size: number
      processed_count: number
    }>('/files/maintenance/deduplicate')
  }
}