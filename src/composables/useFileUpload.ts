import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import CryptoJS from 'crypto-js'
import { useFilesStore } from '@/stores/files'
import type {
  FileUploadOptions,
  UploadSession,
  FileUploadResult,
  DragUploadEvent,
  FileTransferStatus
} from '@/types/files'

export interface UseFileUploadOptions {
  maxFileSize?: number
  maxFiles?: number
  allowedTypes?: string[]
  enableChunked?: boolean
  chunkSize?: number
  enableResume?: boolean
  autoUpload?: boolean
  enableDrop?: boolean
  dropZone?: string
}

export interface UploadFile {
  id: string
  file: File
  status: FileTransferStatus
  progress: number
  speed: number
  timeRemaining: number
  error?: string
  sessionId?: string
  url?: string
  thumbnailUrl?: string
  chunks?: {
    total: number
    uploaded: number
    failed: number
  }
}

/**
 * 文件上传组合式函数
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const filesStore = useFilesStore()

  // 默认配置
  const config = {
    maxFileSize: options.maxFileSize || 100 * 1024 * 1024, // 100MB
    maxFiles: options.maxFiles || 10,
    allowedTypes: options.allowedTypes || [],
    enableChunked: options.enableChunked ?? true,
    chunkSize: options.chunkSize || 1024 * 1024, // 1MB
    enableResume: options.enableResume ?? true,
    autoUpload: options.autoUpload ?? true,
    enableDrop: options.enableDrop ?? true,
    dropZone: options.dropZone || 'body'
  }

  // 状态
  const files = ref<UploadFile[]>([])
  const uploading = ref(false)
  const dragOver = ref(false)
  const isDropSupported = ref(false)

  // 上传队列管理
  const uploadQueue = ref<string[]>([])
  const maxConcurrentUploads = ref(3)
  const activeUploads = ref(new Set<string>())

  // 计算属性
  const totalFiles = computed(() => files.value.length)
  const uploadingFiles = computed(() => files.value.filter(f => f.status === 'uploading'))
  const completedFiles = computed(() => files.value.filter(f => f.status === 'completed'))
  const failedFiles = computed(() => files.value.filter(f => f.status === 'failed'))

  const totalProgress = computed(() => {
    if (files.value.length === 0) return 0
    const totalProgress = files.value.reduce((sum, file) => sum + file.progress, 0)
    return Math.round(totalProgress / files.value.length)
  })

  const totalSpeed = computed(() =>
    uploadingFiles.value.reduce((sum, file) => sum + file.speed, 0)
  )

  const canAddFiles = computed(() =>
    files.value.length < config.maxFiles
  )

  const hasFiles = computed(() => files.value.length > 0)
  const allCompleted = computed(() => files.value.every(f => f.status === 'completed'))
  const hasErrors = computed(() => files.value.some(f => f.status === 'failed'))

  // ==================== 文件验证 ====================

  /**
   * 验证文件
   */
  function validateFile(file: File): { valid: boolean; error?: string } {
    // 文件大小验证
    if (file.size > config.maxFileSize) {
      return {
        valid: false,
        error: `文件大小超过限制 (${formatFileSize(config.maxFileSize)})`
      }
    }

    // 文件类型验证
    if (config.allowedTypes.length > 0) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const mimeType = file.type.toLowerCase()

      const isAllowed = config.allowedTypes.some(type =>
        type.startsWith('.') ? type.toLowerCase() === fileExtension :
        mimeType.includes(type.toLowerCase())
      )

      if (!isAllowed) {
        return {
          valid: false,
          error: `不支持的文件类型: ${file.type || fileExtension}`
        }
      }
    }

    return { valid: true }
  }

  /**
   * 验证文件列表
   */
  function validateFiles(fileList: File[]): { valid: File[]; invalid: { file: File; error: string }[] } {
    const valid: File[] = []
    const invalid: { file: File; error: string }[] = []

    for (const file of fileList) {
      if (files.value.length + valid.length >= config.maxFiles) {
        invalid.push({ file, error: `超过最大文件数量限制 (${config.maxFiles})` })
        continue
      }

      const validation = validateFile(file)
      if (validation.valid) {
        valid.push(file)
      } else {
        invalid.push({ file, error: validation.error! })
      }
    }

    return { valid, invalid }
  }

  // ==================== 文件操作 ====================

  /**
   * 添加文件
   */
  function addFiles(fileList: FileList | File[]): void {
    const filesArray = Array.from(fileList)
    const { valid, invalid } = validateFiles(filesArray)

    // 显示验证错误
    invalid.forEach(({ file, error }) => {
      ElMessage.error(`${file.name}: ${error}`)
    })

    // 添加有效文件
    valid.forEach(file => {
      const uploadFile: UploadFile = {
        id: generateFileId(file),
        file,
        status: 'pending',
        progress: 0,
        speed: 0,
        timeRemaining: 0
      }

      files.value.push(uploadFile)

      // 自动上传
      if (config.autoUpload) {
        addToQueue(uploadFile.id)
      }
    })

    // 处理上传队列
    processQueue()
  }

  /**
   * 移除文件
   */
  function removeFile(fileId: string): void {
    const index = files.value.findIndex(f => f.id === fileId)
    if (index === -1) return

    const file = files.value[index]

    // 如果正在上传，先取消
    if (file.status === 'uploading' && file.sessionId) {
      cancelUpload(fileId)
    }

    // 从队列中移除
    removeFromQueue(fileId)

    // 从列表中移除
    files.value.splice(index, 1)
  }

  /**
   * 清空文件列表
   */
  function clearFiles(): void {
    // 取消所有上传
    uploadingFiles.value.forEach(file => {
      if (file.sessionId) {
        cancelUpload(file.id)
      }
    })

    files.value = []
    uploadQueue.value = []
    activeUploads.value.clear()
  }

  /**
   * 重试上传
   */
  function retryUpload(fileId: string): void {
    const file = files.value.find(f => f.id === fileId)
    if (!file) return

    file.status = 'pending'
    file.progress = 0
    file.error = undefined

    addToQueue(fileId)
    processQueue()
  }

  /**
   * 重试所有失败的上传
   */
  function retryAllFailed(): void {
    failedFiles.value.forEach(file => {
      retryUpload(file.id)
    })
  }

  // ==================== 上传队列管理 ====================

  /**
   * 添加到上传队列
   */
  function addToQueue(fileId: string): void {
    if (!uploadQueue.value.includes(fileId)) {
      uploadQueue.value.push(fileId)
    }
  }

  /**
   * 从队列移除
   */
  function removeFromQueue(fileId: string): void {
    const index = uploadQueue.value.indexOf(fileId)
    if (index !== -1) {
      uploadQueue.value.splice(index, 1)
    }
    activeUploads.value.delete(fileId)
  }

  /**
   * 处理上传队列
   */
  async function processQueue(): Promise<void> {
    while (
      uploadQueue.value.length > 0 &&
      activeUploads.value.size < maxConcurrentUploads.value
    ) {
      const fileId = uploadQueue.value.shift()!
      activeUploads.value.add(fileId)

      // 异步执行上传，不等待完成
      uploadFile(fileId).finally(() => {
        activeUploads.value.delete(fileId)
        // 继续处理队列
        processQueue()
      })
    }
  }

  // ==================== 文件上传逻辑 ====================

  /**
   * 上传文件
   */
  async function uploadFile(fileId: string): Promise<void> {
    const uploadFile = files.value.find(f => f.id === fileId)
    if (!uploadFile) return

    try {
      uploading.value = true
      uploadFile.status = 'uploading'

      // 小文件直接上传
      if (uploadFile.file.size <= config.chunkSize * 2 || !config.enableChunked) {
        await uploadSmallFile(uploadFile)
      } else {
        // 大文件分片上传
        await uploadLargeFile(uploadFile)
      }

      uploadFile.status = 'completed'
      uploadFile.progress = 100

      ElNotification.success({
        title: '上传完成',
        message: `${uploadFile.file.name} 上传成功`
      })
    } catch (error: any) {
      uploadFile.status = 'failed'
      uploadFile.error = error.message || '上传失败'

      ElNotification.error({
        title: '上传失败',
        message: `${uploadFile.file.name}: ${uploadFile.error}`
      })
    } finally {
      uploading.value = false
    }
  }

  /**
   * 上传小文件
   */
  async function uploadSmallFile(uploadFile: UploadFile): Promise<void> {
    const result = await filesStore.uploadFile(uploadFile.file)
    if (result) {
      uploadFile.url = result.file_url
      uploadFile.thumbnailUrl = result.thumbnail_url
    }
  }

  /**
   * 上传大文件（分片）
   */
  async function uploadLargeFile(uploadFile: UploadFile): Promise<void> {
    // 初始化上传会话
    const session = await filesStore.initFileUpload(uploadFile.file, {
      chunk_size: config.chunkSize,
      enable_resume: config.enableResume
    })

    if (!session) {
      throw new Error('初始化上传会话失败')
    }

    uploadFile.sessionId = session.session_id
    uploadFile.chunks = {
      total: session.total_chunks,
      uploaded: session.uploaded_chunks.length,
      failed: 0
    }

    // 上传分片
    await uploadChunks(uploadFile, session)
  }

  /**
   * 上传分片
   */
  async function uploadChunks(uploadFile: UploadFile, session: UploadSession): Promise<void> {
    const file = uploadFile.file
    const chunkSize = config.chunkSize
    const totalChunks = Math.ceil(file.size / chunkSize)

    const startTime = Date.now()
    let uploadedBytes = 0

    for (let i = 0; i < totalChunks; i++) {
      // 检查是否已经上传过这个分片
      if (session.uploaded_chunks.includes(i)) {
        uploadedBytes += Math.min(chunkSize, file.size - i * chunkSize)
        continue
      }

      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      // 计算分片哈希
      const chunkHash = await calculateChunkHash(chunk)

      try {
        // 上传分片
        await filesStore.uploadChunk(session.session_id, i, chunk, chunkHash)

        uploadedBytes += chunk.size
        uploadFile.chunks!.uploaded++

        // 更新进度
        uploadFile.progress = Math.round((uploadedBytes / file.size) * 100)

        // 计算上传速度
        const elapsed = (Date.now() - startTime) / 1000
        uploadFile.speed = uploadedBytes / elapsed

        // 计算剩余时间
        const remainingBytes = file.size - uploadedBytes
        uploadFile.timeRemaining = remainingBytes / uploadFile.speed
      } catch (error) {
        uploadFile.chunks!.failed++
        throw error
      }
    }

    // 完成上传
    const result = await filesStore.completeUpload(session.session_id)
    if (result) {
      uploadFile.url = result.file_url
      uploadFile.thumbnailUrl = result.thumbnail_url
    }
  }

  /**
   * 取消上传
   */
  async function cancelUpload(fileId: string): Promise<void> {
    const uploadFile = files.value.find(f => f.id === fileId)
    if (!uploadFile) return

    try {
      if (uploadFile.sessionId) {
        await filesStore.cancelUpload(uploadFile.sessionId)
      }

      uploadFile.status = 'cancelled'
      removeFromQueue(fileId)
    } catch (error) {
      console.error('Cancel upload failed:', error)
    }
  }

  // ==================== 拖拽上传 ====================

  /**
   * 设置拖拽上传
   */
  function setupDragUpload(): void {
    if (!config.enableDrop) return

    // 检测拖拽支持
    isDropSupported.value = (
      'draggable' in document.createElement('div') &&
      'FileReader' in window &&
      'File' in window
    )

    if (!isDropSupported.value) return

    const dropZone = config.dropZone === 'body' ?
      document.body :
      document.querySelector(config.dropZone)

    if (!dropZone) return

    // 阻止默认拖拽行为
    const preventDefault = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // 拖拽事件处理
    const handleDragEnter = (e: DragEvent) => {
      preventDefault(e)
      dragOver.value = true
    }

    const handleDragLeave = (e: DragEvent) => {
      preventDefault(e)
      // 只有当鼠标离开dropZone时才设置为false
      if (!dropZone.contains(e.relatedTarget as Node)) {
        dragOver.value = false
      }
    }

    const handleDragOver = (e: DragEvent) => {
      preventDefault(e)
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
    }

    const handleDrop = (e: DragEvent) => {
      preventDefault(e)
      dragOver.value = false

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        const dragEvent: DragUploadEvent = {
          files: Array.from(files),
          position: { x: e.clientX, y: e.clientY },
          zone: config.dropZone!
        }

        onDrop(dragEvent)
      }
    }

    // 添加事件监听器
    dropZone.addEventListener('dragenter', handleDragEnter)
    dropZone.addEventListener('dragleave', handleDragLeave)
    dropZone.addEventListener('dragover', handleDragOver)
    dropZone.addEventListener('drop', handleDrop)

    // 清理函数
    onUnmounted(() => {
      dropZone.removeEventListener('dragenter', handleDragEnter)
      dropZone.removeEventListener('dragleave', handleDragLeave)
      dropZone.removeEventListener('dragover', handleDragOver)
      dropZone.removeEventListener('drop', handleDrop)
    })
  }

  /**
   * 处理拖拽放下
   */
  function onDrop(event: DragUploadEvent): void {
    addFiles(event.files)
  }

  // ==================== 工具函数 ====================

  /**
   * 生成文件ID
   */
  function generateFileId(file: File): string {
    return `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 计算分片哈希
   */
  async function calculateChunkHash(chunk: Blob): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer)
        const hash = CryptoJS.SHA256(wordArray).toString()
        resolve(hash)
      }
      reader.readAsArrayBuffer(chunk)
    })
  }

  /**
   * 格式化文件大小
   */
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
  }

  /**
   * 格式化时间
   */
  function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '--'

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  /**
   * 格式化上传速度
   */
  function formatSpeed(bytesPerSecond: number): string {
    return `${formatFileSize(bytesPerSecond)}/s`
  }

  // ==================== 生命周期 ====================

  onMounted(() => {
    setupDragUpload()
  })

  // ==================== 返回对象 ====================

  return {
    // 状态
    files,
    uploading,
    dragOver,
    isDropSupported,

    // 计算属性
    totalFiles,
    uploadingFiles,
    completedFiles,
    failedFiles,
    totalProgress,
    totalSpeed,
    canAddFiles,
    hasFiles,
    allCompleted,
    hasErrors,

    // 方法
    addFiles,
    removeFile,
    clearFiles,
    retryUpload,
    retryAllFailed,
    cancelUpload,

    // 工具函数
    formatFileSize,
    formatTime,
    formatSpeed,
    validateFile,

    // 配置
    config
  }
}