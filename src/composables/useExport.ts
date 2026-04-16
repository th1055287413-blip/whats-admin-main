import { ref } from 'vue'
import { exportApi } from '@/api/export'
import type { ExportOptions, ExportResult } from '@/types/export'

export function useExport() {
  const exportLoading = ref(false)
  const exportProgress = ref(0)

  // 导出用户数据
  const exportUsers = async (filters: any = {}): Promise<ExportResult> => {
    exportLoading.value = true
    try {
      const response = await exportApi.exportUsers(filters)
      return {
        filename: getFilenameFromResponse(response),
        content: response.data,
        mimeType: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: parseInt(response.headers['content-length'] || '0')
      }
    } finally {
      exportLoading.value = false
    }
  }

  // 导出用户模板
  const exportUserTemplate = async (): Promise<ExportResult> => {
    exportLoading.value = true
    try {
      const response = await exportApi.exportUserTemplate()
      return {
        filename: getFilenameFromResponse(response),
        content: response.data,
        mimeType: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: parseInt(response.headers['content-length'] || '0')
      }
    } finally {
      exportLoading.value = false
    }
  }

  // 导出标签数据
  const exportTags = async (): Promise<ExportResult> => {
    exportLoading.value = true
    try {
      const response = await exportApi.exportTags()
      return {
        filename: getFilenameFromResponse(response),
        content: response.data,
        mimeType: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: parseInt(response.headers['content-length'] || '0')
      }
    } finally {
      exportLoading.value = false
    }
  }

  // 导出用户统计
  const exportUserStats = async (period: string = 'monthly'): Promise<ExportResult> => {
    exportLoading.value = true
    try {
      const response = await exportApi.exportUserStats(period)
      return {
        filename: getFilenameFromResponse(response),
        content: response.data,
        mimeType: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: parseInt(response.headers['content-length'] || '0')
      }
    } finally {
      exportLoading.value = false
    }
  }

  // 获取导出格式信息
  const getExportFormats = async () => {
    try {
      const response = await exportApi.getExportFormats()
      return response.data
    } catch (error) {
      console.error('Failed to get export formats:', error)
      throw error
    }
  }

  // 获取导出历史
  const getExportHistory = async (page: number = 1, limit: number = 20) => {
    try {
      const response = await exportApi.getExportHistory({ page, limit })
      return response.data
    } catch (error) {
      console.error('Failed to get export history:', error)
      throw error
    }
  }

  // 下载文件
  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // 批量导出
  const batchExport = async (exportOptions: ExportOptions[]) => {
    const results: ExportResult[] = []

    for (const options of exportOptions) {
      try {
        let result: ExportResult

        switch (options.type) {
          case 'users':
            result = await exportUsers(options.filters)
            break
          case 'tags':
            result = await exportTags()
            break
          case 'stats':
            result = await exportUserStats(options.period)
            break
          default:
            throw new Error(`Unsupported export type: ${options.type}`)
        }

        results.push(result)

        // 更新进度
        exportProgress.value = (results.length / exportOptions.length) * 100
      } catch (error) {
        console.error(`Export failed for type ${options.type}:`, error)
        throw error
      }
    }

    exportProgress.value = 0
    return results
  }

  // 从响应头中提取文件名
  const getFilenameFromResponse = (response: any): string => {
    const contentDisposition = response.headers['content-disposition']
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (matches && matches[1]) {
        return matches[1].replace(/['"]/g, '')
      }
    }

    // fallback filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    return `export_${timestamp}.xlsx`
  }

  return {
    exportLoading,
    exportProgress,
    exportUsers,
    exportUserTemplate,
    exportTags,
    exportUserStats,
    getExportFormats,
    getExportHistory,
    downloadFile,
    batchExport
  }
}