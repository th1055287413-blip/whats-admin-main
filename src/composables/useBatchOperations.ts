import { ref } from 'vue'
import { batchApi } from '@/api/batch'
import type {
  BatchOperationRequest,
  BatchOperationResult,
  BatchProgress,
  BatchHistoryParams
} from '@/types/batch'

export function useBatchOperations() {
  const processing = ref(false)
  const currentTaskId = ref<string | null>(null)

  // 执行批量操作
  const batchOperateUsers = async (request: BatchOperationRequest): Promise<BatchOperationResult> => {
    processing.value = true
    try {
      const response = await batchApi.batchOperateUsers(request)
      currentTaskId.value = response.data.data.task_id
      return response.data.data
    } finally {
      processing.value = false
    }
  }

  // 获取批量操作进度
  const getBatchProgress = async (taskId: string): Promise<BatchProgress> => {
    try {
      const response = await batchApi.getBatchProgress(taskId)
      return response.data.data
    } catch (error) {
      console.error('Failed to get batch progress:', error)
      throw error
    }
  }

  // 取消批量操作
  const cancelBatchOperation = async (taskId: string): Promise<void> => {
    try {
      await batchApi.cancelBatchOperation(taskId)
    } catch (error) {
      console.error('Failed to cancel batch operation:', error)
      throw error
    }
  }

  // 获取批量操作历史
  const getBatchHistory = async (params: BatchHistoryParams = {}) => {
    try {
      const response = await batchApi.getBatchHistory(params)
      return response.data.data
    } catch (error) {
      console.error('Failed to get batch history:', error)
      throw error
    }
  }

  // 获取支持的批量操作类型
  const getBatchOperationTypes = async () => {
    try {
      const response = await batchApi.getBatchOperationTypes()
      return response.data.data
    } catch (error) {
      console.error('Failed to get batch operation types:', error)
      throw error
    }
  }

  // 轮询进度更新
  const pollBatchProgress = async (
    taskId: string,
    onProgress: (progress: BatchProgress) => void,
    interval: number = 2000
  ): Promise<BatchProgress> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const progress = await getBatchProgress(taskId)
          onProgress(progress)

          if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
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

  // 验证批量操作请求
  const validateBatchRequest = (request: BatchOperationRequest): string[] => {
    const errors: string[] = []

    if (!request.user_ids || request.user_ids.length === 0) {
      errors.push('用户ID列表不能为空')
    }

    if (request.user_ids && request.user_ids.length > 1000) {
      errors.push('单次操作用户数量不能超过1000个')
    }

    if (!request.operation) {
      errors.push('操作类型不能为空')
    }

    const validOperations = ['update_status', 'add_tags', 'remove_tags', 'delete', 'update_fields']
    if (request.operation && !validOperations.includes(request.operation)) {
      errors.push('不支持的操作类型')
    }

    // 验证操作数据
    switch (request.operation) {
      case 'update_status':
        if (!request.data?.status) {
          errors.push('更新状态操作需要提供目标状态')
        }
        break

      case 'add_tags':
      case 'remove_tags':
        if (!request.data?.tag_ids || !Array.isArray(request.data.tag_ids) || request.data.tag_ids.length === 0) {
          errors.push('标签操作需要提供标签ID列表')
        }
        break

      case 'update_fields':
        if (!request.data || Object.keys(request.data).length === 0) {
          errors.push('更新字段操作需要提供要更新的字段')
        }
        break

      case 'delete':
        // 删除操作不需要额外数据
        break
    }

    return errors
  }

  // 估算操作时间
  const estimateOperationTime = (userCount: number, batchSize: number = 50): number => {
    const batchCount = Math.ceil(userCount / batchSize)
    // 假设每批次平均需要2秒
    return batchCount * 2
  }

  // 格式化操作摘要
  const formatOperationSummary = (result: BatchOperationResult): string => {
    const operationNames = {
      'update_status': '状态更新',
      'add_tags': '添加标签',
      'remove_tags': '移除标签',
      'delete': '删除用户',
      'update_fields': '字段更新'
    }

    const opName = operationNames[result.operation] || result.operation

    let summary = `${opName}完成：总计 ${result.total_count} 个用户`

    if (result.success_count > 0) {
      summary += `，成功 ${result.success_count} 个`
    }

    if (result.failure_count > 0) {
      summary += `，失败 ${result.failure_count} 个`
    }

    if (result.skipped_count > 0) {
      summary += `，跳过 ${result.skipped_count} 个`
    }

    return summary
  }

  // 生成操作确认消息
  const generateConfirmMessage = (request: BatchOperationRequest): string => {
    const operationNames = {
      'update_status': '更新状态',
      'add_tags': '添加标签',
      'remove_tags': '移除标签',
      'delete': '删除用户',
      'update_fields': '更新字段'
    }

    const opName = operationNames[request.operation] || request.operation
    let message = `确定要对选中的 ${request.user_ids.length} 个用户执行${opName}操作吗？`

    // 添加具体操作详情
    switch (request.operation) {
      case 'update_status':
        message += `\n\n目标状态：${request.data.status}`
        break

      case 'add_tags':
        message += `\n\n将添加 ${request.data.tag_ids.length} 个标签`
        break

      case 'remove_tags':
        message += `\n\n将移除 ${request.data.tag_ids.length} 个标签`
        break

      case 'delete':
        message += '\n\n注意：删除操作不可恢复！'
        break

      case 'update_fields':
        const fields = Object.keys(request.data).filter(key => request.data[key])
        message += `\n\n将更新字段：${fields.join(', ')}`
        break
    }

    const estimatedTime = estimateOperationTime(request.user_ids.length, request.options?.batch_size)
    message += `\n\n预估耗时：${estimatedTime} 秒`

    return message
  }

  return {
    // 状态
    processing,
    currentTaskId,

    // 方法
    batchOperateUsers,
    getBatchProgress,
    cancelBatchOperation,
    getBatchHistory,
    getBatchOperationTypes,
    pollBatchProgress,

    // 工具方法
    validateBatchRequest,
    estimateOperationTime,
    formatOperationSummary,
    generateConfirmMessage
  }
}