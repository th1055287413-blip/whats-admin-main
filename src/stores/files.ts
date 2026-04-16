import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { filesApi } from '@/api/files'
import type {
  FileTransfer,
  UploadSession,
  InterceptRule,
  WhitelistEntry,
  FileTransferStats,
  SecurityStats,
  UploadConfig,
  FileQueryParams,
  FileManagementState,
  FileWebSocketEvent,
  BatchOperationResult,
  FileUploadOptions,
  FileUploadResult,
  SecurityScanDetails,
  FileInfo
} from '@/types/files'

export const useFilesStore = defineStore('files', () => {
  // ==================== 状态定义 ====================

  // 文件传输相关状态
  const transfers = ref<FileTransfer[]>([])
  const activeTransfers = ref<FileTransfer[]>([])
  const uploadSessions = ref<UploadSession[]>([])
  const currentUpload = ref<UploadSession | null>(null)

  // 规则和配置状态
  const interceptRules = ref<InterceptRule[]>([])
  const whitelistEntries = ref<WhitelistEntry[]>([])
  const uploadConfig = ref<UploadConfig | null>(null)

  // 统计数据状态
  const transferStats = ref<FileTransferStats | null>(null)
  const securityStats = ref<SecurityStats | null>(null)

  // UI状态
  const loading = ref(false)
  const uploading = ref(false)
  const error = ref<string | null>(null)

  // 查询和分页状态
  const queryParams = reactive<FileQueryParams>({
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  const pagination = reactive({
    total: 0,
    current_page: 1,
    per_page: 20,
    total_pages: 0
  })

  // WebSocket连接状态
  const wsConnection = ref<WebSocket | null>(null)
  const wsConnected = ref(false)
  const wsReconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  // ==================== 计算属性 ====================

  const activeUploadsCount = computed(() =>
    activeTransfers.value.filter(t =>
      t.transfer_type === 'upload' &&
      ['pending', 'uploading'].includes(t.status)
    ).length
  )

  const totalUploadProgress = computed(() => {
    const uploads = activeTransfers.value.filter(t => t.transfer_type === 'upload')
    if (uploads.length === 0) return 0

    const totalProgress = uploads.reduce((sum, upload) => sum + upload.progress_percent, 0)
    return Math.round(totalProgress / uploads.length)
  })

  const uploadSpeed = computed(() => {
    const uploads = activeTransfers.value.filter(t =>
      t.transfer_type === 'upload' &&
      t.status === 'uploading' &&
      t.transfer_speed
    )

    return uploads.reduce((sum, upload) => sum + (upload.transfer_speed || 0), 0)
  })

  const hasActiveRules = computed(() =>
    interceptRules.value.some(rule => rule.is_active)
  )

  const filteredTransfers = computed(() => {
    let filtered = [...transfers.value]

    if (queryParams.status?.length) {
      filtered = filtered.filter(t => queryParams.status!.includes(t.status))
    }

    if (queryParams.transfer_type) {
      filtered = filtered.filter(t => t.transfer_type === queryParams.transfer_type)
    }

    if (queryParams.keyword) {
      const keyword = queryParams.keyword.toLowerCase()
      filtered = filtered.filter(t =>
        t.file_name.toLowerCase().includes(keyword) ||
        t.user_name?.toLowerCase().includes(keyword)
      )
    }

    return filtered
  })

  // ==================== WebSocket管理 ====================

  /**
   * 连接WebSocket
   */
  async function connectWebSocket(): Promise<void> {
    try {
      const response = await filesApi.getWebSocketToken()
      const { token, endpoint } = response.data

      wsConnection.value = new WebSocket(`${endpoint}?token=${token}`)

      wsConnection.value.onopen = () => {
        wsConnected.value = true
        wsReconnectAttempts.value = 0
        console.log('File management WebSocket connected')
      }

      wsConnection.value.onmessage = (event) => {
        try {
          const message: FileWebSocketEvent = JSON.parse(event.data)
          handleWebSocketMessage(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsConnection.value.onclose = () => {
        wsConnected.value = false
        console.log('File management WebSocket disconnected')

        // 尝试重连
        if (wsReconnectAttempts.value < maxReconnectAttempts) {
          wsReconnectAttempts.value++
          setTimeout(() => {
            connectWebSocket()
          }, Math.pow(2, wsReconnectAttempts.value) * 1000)
        }
      }

      wsConnection.value.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (error) {
      console.error('Failed to connect WebSocket:', error)
    }
  }

  /**
   * 断开WebSocket连接
   */
  function disconnectWebSocket(): void {
    if (wsConnection.value) {
      wsConnection.value.close()
      wsConnection.value = null
      wsConnected.value = false
    }
  }

  /**
   * 处理WebSocket消息
   */
  function handleWebSocketMessage(message: FileWebSocketEvent): void {
    const { type, data } = message

    switch (type) {
      case 'file_upload_start':
        if (data.transfer_id) {
          // 添加到活跃传输列表
          const existingIndex = activeTransfers.value.findIndex(t => t.id === data.transfer_id)
          if (existingIndex === -1) {
            // 需要获取完整的传输信息
            fetchTransfer(data.transfer_id)
          }
        }
        break

      case 'file_upload_progress':
        if (data.transfer_id && data.progress !== undefined) {
          updateTransferProgress(data.transfer_id, data.progress)
        }
        break

      case 'file_upload_complete':
        if (data.transfer_id) {
          updateTransferStatus(data.transfer_id, 'completed')
          ElNotification.success({
            title: '上传完成',
            message: `文件 ${data.file_name} 上传成功`
          })
        }
        break

      case 'file_upload_failed':
        if (data.transfer_id) {
          updateTransferStatus(data.transfer_id, 'failed', data.error)
          ElNotification.error({
            title: '上传失败',
            message: `文件 ${data.file_name} 上传失败: ${data.error}`
          })
        }
        break

      case 'file_intercepted':
        if (data.transfer_id) {
          updateTransferStatus(data.transfer_id, 'blocked', data.message)
          ElNotification.warning({
            title: '文件被拦截',
            message: `文件 ${data.file_name} 被拦截: ${data.message}`
          })
        }
        break

      case 'security_scan_complete':
        if (data.security_scan_result) {
          handleSecurityScanResult(data.security_scan_result)
        }
        break

      case 'threat_detected':
        ElNotification.error({
          title: '安全威胁检测',
          message: `检测到威胁文件: ${data.file_name}`,
          duration: 0
        })
        break
    }
  }

  // ==================== 传输管理方法 ====================

  /**
   * 获取文件传输列表
   */
  async function fetchTransfers(params?: Partial<FileQueryParams>): Promise<void> {
    try {
      loading.value = true
      error.value = null

      const queryData = { ...queryParams, ...params }
      const response = await filesApi.getTransfers(queryData)

      transfers.value = response.data.items
      pagination.total = response.data.total
      pagination.current_page = response.data.page
      pagination.per_page = response.data.page_size
      pagination.total_pages = response.data.total_pages

      // 更新查询参数
      Object.assign(queryParams, queryData)
    } catch (err: any) {
      error.value = err.message || '获取传输列表失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取单个文件传输
   */
  async function fetchTransfer(transferId: string): Promise<FileTransfer | null> {
    try {
      const response = await filesApi.getTransfer(transferId)
      const transfer = response.data

      // 更新本地状态
      const index = transfers.value.findIndex(t => t.id === transferId)
      if (index !== -1) {
        transfers.value[index] = transfer
      } else {
        transfers.value.unshift(transfer)
      }

      // 更新活跃传输列表
      if (['pending', 'uploading'].includes(transfer.status)) {
        const activeIndex = activeTransfers.value.findIndex(t => t.id === transferId)
        if (activeIndex !== -1) {
          activeTransfers.value[activeIndex] = transfer
        } else {
          activeTransfers.value.push(transfer)
        }
      }

      return transfer
    } catch (err: any) {
      console.error('Failed to fetch transfer:', err)
      return null
    }
  }

  /**
   * 获取活跃传输
   */
  async function fetchActiveTransfers(): Promise<void> {
    try {
      const response = await filesApi.getActiveTransfers()
      activeTransfers.value = response.data
    } catch (err: any) {
      console.error('Failed to fetch active transfers:', err)
    }
  }

  /**
   * 更新传输进度
   */
  function updateTransferProgress(transferId: string, progress: number): void {
    // 更新主列表
    const transferIndex = transfers.value.findIndex(t => t.id === transferId)
    if (transferIndex !== -1) {
      transfers.value[transferIndex].progress_percent = progress
    }

    // 更新活跃列表
    const activeIndex = activeTransfers.value.findIndex(t => t.id === transferId)
    if (activeIndex !== -1) {
      activeTransfers.value[activeIndex].progress_percent = progress
    }

    // 更新上传会话
    if (currentUpload.value?.session_id === transferId) {
      currentUpload.value.progress_percent = progress
    }
  }

  /**
   * 更新传输状态
   */
  function updateTransferStatus(transferId: string, status: string, errorMessage?: string): void {
    const updateTransfer = (transfer: FileTransfer) => {
      transfer.status = status as any
      if (errorMessage) {
        transfer.error_message = errorMessage
      }
      if (status === 'completed') {
        transfer.completed_at = new Date().toISOString()
        transfer.progress_percent = 100
      }
    }

    // 更新主列表
    const transferIndex = transfers.value.findIndex(t => t.id === transferId)
    if (transferIndex !== -1) {
      updateTransfer(transfers.value[transferIndex])
    }

    // 更新活跃列表
    const activeIndex = activeTransfers.value.findIndex(t => t.id === transferId)
    if (activeIndex !== -1) {
      updateTransfer(activeTransfers.value[activeIndex])

      // 如果已完成或失败，从活跃列表中移除
      if (['completed', 'failed', 'cancelled', 'blocked'].includes(status)) {
        activeTransfers.value.splice(activeIndex, 1)
      }
    }
  }

  /**
   * 重试传输
   */
  async function retryTransfer(transferId: string): Promise<boolean> {
    try {
      await filesApi.retryTransfer(transferId)
      await fetchTransfer(transferId)
      ElMessage.success('重试成功')
      return true
    } catch (err: any) {
      ElMessage.error(err.message || '重试失败')
      return false
    }
  }

  /**
   * 取消传输
   */
  async function cancelTransfer(transferId: string): Promise<boolean> {
    try {
      await filesApi.cancelTransfer(transferId)
      updateTransferStatus(transferId, 'cancelled')
      ElMessage.success('传输已取消')
      return true
    } catch (err: any) {
      ElMessage.error(err.message || '取消失败')
      return false
    }
  }

  /**
   * 批量操作传输
   */
  async function batchTransferOperation(
    transferIds: string[],
    action: 'cancel' | 'retry' | 'delete' | 'review',
    params?: any
  ): Promise<BatchOperationResult | null> {
    try {
      loading.value = true
      const response = await filesApi.batchTransferOperation({
        transfer_ids: transferIds,
        action,
        params
      })

      const result = response.data
      ElMessage.success(`批量操作完成: 成功 ${result.success} 个，失败 ${result.failed} 个`)

      // 刷新列表
      await fetchTransfers()

      return result
    } catch (err: any) {
      ElMessage.error(err.message || '批量操作失败')
      return null
    } finally {
      loading.value = false
    }
  }

  // ==================== 文件上传方法 ====================

  /**
   * 初始化文件上传
   */
  async function initFileUpload(
    file: File,
    options?: FileUploadOptions
  ): Promise<UploadSession | null> {
    try {
      uploading.value = true
      error.value = null

      const response = await filesApi.initUpload({
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        mime_type: file.type,
        options
      })

      const session = response.data
      currentUpload.value = session
      uploadSessions.value.push(session)

      return session
    } catch (err: any) {
      error.value = err.message || '初始化上传失败'
      ElMessage.error(error.value)
      return null
    } finally {
      uploading.value = false
    }
  }

  /**
   * 直接上传文件（小文件）
   */
  async function uploadFile(
    file: File,
    options?: FileUploadOptions
  ): Promise<FileUploadResult | null> {
    try {
      uploading.value = true
      error.value = null

      const response = await filesApi.uploadFile(file, options)
      const result = response.data

      ElMessage.success('文件上传成功')

      // 刷新传输列表
      await fetchTransfers()

      return result
    } catch (err: any) {
      error.value = err.message || '文件上传失败'
      ElMessage.error(error.value)
      return null
    } finally {
      uploading.value = false
    }
  }

  /**
   * 取消上传
   */
  async function cancelUpload(sessionId: string): Promise<boolean> {
    try {
      await filesApi.cancelUpload(sessionId)

      // 更新会话状态
      const sessionIndex = uploadSessions.value.findIndex(s => s.session_id === sessionId)
      if (sessionIndex !== -1) {
        uploadSessions.value[sessionIndex].status = 'cancelled'
      }

      if (currentUpload.value?.session_id === sessionId) {
        currentUpload.value = null
      }

      ElMessage.success('上传已取消')
      return true
    } catch (err: any) {
      ElMessage.error(err.message || '取消上传失败')
      return false
    }
  }

  // ==================== 规则管理方法 ====================

  /**
   * 获取拦截规则列表
   */
  async function fetchInterceptRules(): Promise<void> {
    try {
      loading.value = true
      const response = await filesApi.getInterceptRules()
      interceptRules.value = response.data.items
    } catch (err: any) {
      error.value = err.message || '获取拦截规则失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建拦截规则
   */
  async function createInterceptRule(ruleData: any): Promise<InterceptRule | null> {
    try {
      const response = await filesApi.createInterceptRule(ruleData)
      const newRule = response.data

      interceptRules.value.unshift(newRule)
      ElMessage.success('拦截规则创建成功')

      return newRule
    } catch (err: any) {
      ElMessage.error(err.message || '创建拦截规则失败')
      return null
    }
  }

  /**
   * 更新拦截规则
   */
  async function updateInterceptRule(ruleId: string, ruleData: any): Promise<boolean> {
    try {
      const response = await filesApi.updateInterceptRule(ruleId, ruleData)
      const updatedRule = response.data

      const index = interceptRules.value.findIndex(r => r.id === ruleId)
      if (index !== -1) {
        interceptRules.value[index] = updatedRule
      }

      ElMessage.success('拦截规则更新成功')
      return true
    } catch (err: any) {
      ElMessage.error(err.message || '更新拦截规则失败')
      return false
    }
  }

  /**
   * 删除拦截规则
   */
  async function deleteInterceptRule(ruleId: string): Promise<boolean> {
    try {
      await filesApi.deleteInterceptRule(ruleId)

      const index = interceptRules.value.findIndex(r => r.id === ruleId)
      if (index !== -1) {
        interceptRules.value.splice(index, 1)
      }

      ElMessage.success('拦截规则删除成功')
      return true
    } catch (err: any) {
      ElMessage.error(err.message || '删除拦截规则失败')
      return false
    }
  }

  /**
   * 切换规则状态
   */
  async function toggleInterceptRule(ruleId: string, isActive: boolean): Promise<boolean> {
    try {
      const response = await filesApi.toggleInterceptRule(ruleId, isActive)
      const updatedRule = response.data

      const index = interceptRules.value.findIndex(r => r.id === ruleId)
      if (index !== -1) {
        interceptRules.value[index] = updatedRule
      }

      ElMessage.success(`规则已${isActive ? '启用' : '禁用'}`)
      return true
    } catch (err: any) {
      ElMessage.error(err.message || '操作失败')
      return false
    }
  }

  // ==================== 白名单管理方法 ====================

  /**
   * 获取白名单列表
   */
  async function fetchWhitelist(): Promise<void> {
    try {
      loading.value = true
      const response = await filesApi.getWhitelist()
      whitelistEntries.value = response.data.items
    } catch (err: any) {
      error.value = err.message || '获取白名单失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建白名单条目
   */
  async function createWhitelistEntry(entryData: any): Promise<WhitelistEntry | null> {
    try {
      const response = await filesApi.createWhitelistEntry(entryData)
      const newEntry = response.data

      whitelistEntries.value.unshift(newEntry)
      ElMessage.success('白名单条目创建成功')

      return newEntry
    } catch (err: any) {
      ElMessage.error(err.message || '创建白名单条目失败')
      return null
    }
  }

  /**
   * 删除白名单条目
   */
  async function deleteWhitelistEntry(entryId: string): Promise<boolean> {
    try {
      await filesApi.deleteWhitelistEntry(entryId)

      const index = whitelistEntries.value.findIndex(e => e.id === entryId)
      if (index !== -1) {
        whitelistEntries.value.splice(index, 1)
      }

      ElMessage.success('白名单条目删除成功')
      return true
    } catch (err: any) {
      ElMessage.error(err.message || '删除白名单条目失败')
      return false
    }
  }

  // ==================== 统计数据方法 ====================

  /**
   * 获取传输统计
   */
  async function fetchTransferStats(params?: any): Promise<void> {
    try {
      const response = await filesApi.getTransferStats(params)
      transferStats.value = response.data
    } catch (err: any) {
      console.error('Failed to fetch transfer stats:', err)
    }
  }

  /**
   * 获取安全统计
   */
  async function fetchSecurityStats(params?: any): Promise<void> {
    try {
      const response = await filesApi.getSecurityStats(params)
      securityStats.value = response.data
    } catch (err: any) {
      console.error('Failed to fetch security stats:', err)
    }
  }

  // ==================== 配置管理方法 ====================

  /**
   * 获取上传配置
   */
  async function fetchUploadConfig(): Promise<void> {
    try {
      const response = await filesApi.getUploadConfig()
      uploadConfig.value = response.data
    } catch (err: any) {
      console.error('Failed to fetch upload config:', err)
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 处理安全扫描结果
   */
  function handleSecurityScanResult(scanResult: SecurityScanDetails): void {
    if (scanResult.scan_result === 'malicious') {
      ElNotification.error({
        title: '安全威胁',
        message: `检测到恶意文件: ${scanResult.threat_details?.threat_name}`,
        duration: 0
      })
    } else if (scanResult.scan_result === 'suspicious') {
      ElNotification.warning({
        title: '可疑文件',
        message: '检测到可疑文件，请谨慎处理',
        duration: 5000
      })
    }
  }

  /**
   * 重置状态
   */
  function resetState(): void {
    transfers.value = []
    activeTransfers.value = []
    uploadSessions.value = []
    currentUpload.value = null
    interceptRules.value = []
    whitelistEntries.value = []
    transferStats.value = null
    securityStats.value = null
    loading.value = false
    uploading.value = false
    error.value = null

    Object.assign(queryParams, {
      page: 1,
      page_size: 20,
      sort_by: 'created_at',
      sort_order: 'desc'
    })

    Object.assign(pagination, {
      total: 0,
      current_page: 1,
      per_page: 20,
      total_pages: 0
    })
  }

  /**
   * 设置查询参数
   */
  function setQueryParams(params: Partial<FileQueryParams>): void {
    Object.assign(queryParams, params)
  }

  // ==================== 返回对象 ====================

  return {
    // 状态
    transfers: readonly(transfers),
    activeTransfers: readonly(activeTransfers),
    uploadSessions: readonly(uploadSessions),
    currentUpload: readonly(currentUpload),
    interceptRules: readonly(interceptRules),
    whitelistEntries: readonly(whitelistEntries),
    uploadConfig: readonly(uploadConfig),
    transferStats: readonly(transferStats),
    securityStats: readonly(securityStats),
    loading: readonly(loading),
    uploading: readonly(uploading),
    error: readonly(error),
    queryParams: readonly(queryParams),
    pagination: readonly(pagination),
    wsConnected: readonly(wsConnected),

    // 计算属性
    activeUploadsCount,
    totalUploadProgress,
    uploadSpeed,
    hasActiveRules,
    filteredTransfers,

    // WebSocket方法
    connectWebSocket,
    disconnectWebSocket,

    // 传输管理方法
    fetchTransfers,
    fetchTransfer,
    fetchActiveTransfers,
    retryTransfer,
    cancelTransfer,
    batchTransferOperation,

    // 文件上传方法
    initFileUpload,
    uploadFile,
    cancelUpload,

    // 规则管理方法
    fetchInterceptRules,
    createInterceptRule,
    updateInterceptRule,
    deleteInterceptRule,
    toggleInterceptRule,

    // 白名单管理方法
    fetchWhitelist,
    createWhitelistEntry,
    deleteWhitelistEntry,

    // 统计数据方法
    fetchTransferStats,
    fetchSecurityStats,

    // 配置管理方法
    fetchUploadConfig,

    // 工具方法
    resetState,
    setQueryParams
  }
})