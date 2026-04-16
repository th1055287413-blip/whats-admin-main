import { ref } from 'vue'
import { importApi } from '@/api/import'
import type {
  ImportOptions,
  ImportResult,
  ImportValidationResult,
  ImportPreviewResult,
  ImportProgress
} from '@/types/import'

export function useImport() {
  const importing = ref(false)
  const validating = ref(false)
  const previewing = ref(false)
  const importProgress = ref(0)

  // 导入用户数据
  const importUsers = async (formData: FormData): Promise<ImportResult> => {
    importing.value = true
    try {
      const response = await importApi.importUsers(formData)
      return response.data.data
    } finally {
      importing.value = false
    }
  }

  // 验证导入文件
  const validateImportFile = async (file: File): Promise<ImportValidationResult> => {
    validating.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await importApi.validateImportFile(formData)
      return response.data.data
    } finally {
      validating.value = false
    }
  }

  // 预览导入数据
  const previewImportData = async (file: File, limit: number = 10): Promise<ImportPreviewResult> => {
    previewing.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('limit', limit.toString())

      const response = await importApi.previewImportData(formData)
      return response.data.data
    } finally {
      previewing.value = false
    }
  }

  // 查询导入进度
  const getImportProgress = async (taskId: string): Promise<ImportProgress> => {
    try {
      const response = await importApi.getImportProgress(taskId)
      return response.data.data
    } catch (error) {
      console.error('Failed to get import progress:', error)
      throw error
    }
  }

  // 获取导入历史
  const getImportHistory = async (page: number = 1, limit: number = 20) => {
    try {
      const response = await importApi.getImportHistory({ page, limit })
      return response.data.data
    } catch (error) {
      console.error('Failed to get import history:', error)
      throw error
    }
  }

  // 获取导入模板信息
  const getImportTemplate = async () => {
    try {
      const response = await importApi.getImportTemplate()
      return response.data.data
    } catch (error) {
      console.error('Failed to get import template:', error)
      throw error
    }
  }

  // 轮询导入进度
  const pollImportProgress = async (
    taskId: string,
    onProgress: (progress: ImportProgress) => void,
    interval: number = 2000
  ): Promise<ImportProgress> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const progress = await getImportProgress(taskId)
          onProgress(progress)

          if (progress.status === 'completed' || progress.status === 'failed') {
            resolve(progress)
          } else {
            setTimeout(poll, interval)
          }
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  }

  // 批量导入处理
  const batchImport = async (
    files: File[],
    options: ImportOptions,
    onProgress?: (current: number, total: number, currentResult?: ImportResult) => void
  ): Promise<ImportResult[]> => {
    const results: ImportResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('update_existing', options.updateExisting.toString())
        formData.append('skip_errors', options.skipErrors.toString())
        formData.append('batch_size', options.batchSize.toString())

        const result = await importUsers(formData)
        results.push(result)

        if (onProgress) {
          onProgress(i + 1, files.length, result)
        }
      } catch (error) {
        console.error(`Import failed for file ${file.name}:`, error)
        // 根据选项决定是否继续
        if (!options.skipErrors) {
          throw error
        }
      }
    }

    return results
  }

  // 验证文件格式
  const validateFileFormat = (file: File): { valid: boolean; error?: string } => {
    // 检查文件类型
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]

    const isValidType = validTypes.includes(file.type) ||
                       file.name.endsWith('.xlsx') ||
                       file.name.endsWith('.xls')

    if (!isValidType) {
      return {
        valid: false,
        error: '文件格式不支持，请上传 Excel 文件 (.xlsx 或 .xls)'
      }
    }

    // 检查文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        error: '文件大小超出限制，最大支持 10MB'
      }
    }

    return { valid: true }
  }

  // 生成导入摘要
  const generateImportSummary = (results: ImportResult[]): string => {
    const totals = results.reduce((acc, result) => ({
      totalRows: acc.totalRows + result.total_rows,
      successCount: acc.successCount + result.success_count,
      failureCount: acc.failureCount + result.failure_count,
      createdCount: acc.createdCount + result.created_count,
      updatedCount: acc.updatedCount + result.updated_count,
      skippedCount: acc.skippedCount + result.skipped_count
    }), {
      totalRows: 0,
      successCount: 0,
      failureCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0
    })

    return `批量导入完成：共处理 ${totals.totalRows} 行数据，` +
           `成功 ${totals.successCount} 行，失败 ${totals.failureCount} 行，` +
           `新建 ${totals.createdCount} 个，更新 ${totals.updatedCount} 个，跳过 ${totals.skippedCount} 行`
  }

  return {
    // 状态
    importing,
    validating,
    previewing,
    importProgress,

    // 方法
    importUsers,
    validateImportFile,
    previewImportData,
    getImportProgress,
    getImportHistory,
    getImportTemplate,
    pollImportProgress,
    batchImport,
    validateFileFormat,
    generateImportSummary
  }
}