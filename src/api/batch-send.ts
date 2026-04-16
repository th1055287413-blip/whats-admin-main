import { request } from '@/utils/request'

// 批量发送任务类型
export interface BatchSendTask {
  id: number
  account_id: number
  account_name?: string
  message_content: string
  send_interval: number
  total_count: number
  success_count: number
  failed_count: number
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed'
  created_by?: string
  created_at: string
  updated_at: string
}

// 接收人类型
export interface BatchSendRecipient {
  id: number
  task_id: number
  chat_jid: string
  chat_name: string
  send_status: 'pending' | 'sent' | 'failed'
  error_message?: string
  sent_at?: string
  created_at: string
}

// 创建任务请求参数
export interface CreateTaskParams {
  account_id: number
  message_content: string
  send_interval?: number
  recipients: Array<{
    chat_jid: string
    chat_name: string
  }>
}

// 任务列表响应
export interface TaskListResponse {
  items: BatchSendTask[]
  total: number
  page: number
  size: number
  pages: number
}

// 任务详情响应
export interface TaskDetailResponse {
  task: BatchSendTask
  recipients: BatchSendRecipient[]
}

/**
 * 创建批量发送任务
 */
export const createBatchTask = (params: CreateTaskParams): Promise<any> => {
  return request.post('/batch-send/tasks', params)
}

/**
 * 执行批量发送任务
 */
export const executeBatchTask = (taskId: number): Promise<any> => {
  return request.post(`/batch-send/tasks/${taskId}/execute`)
}

/**
 * 获取任务列表
 */
export const getBatchTaskList = (page = 1, pageSize = 10): Promise<any> => {
  return request.get('/batch-send/tasks', {
    params: { page, page_size: pageSize }
  })
}

/**
 * 获取任务详情
 */
export const getBatchTaskDetail = (taskId: number): Promise<any> => {
  return request.get(`/batch-send/tasks/${taskId}`)
}

/**
 * 删除任务
 */
export const deleteBatchTask = (taskId: number): Promise<any> => {
  return request.delete(`/batch-send/tasks/${taskId}`)
}

/**
 * 暂停任务
 */
export const pauseBatchTask = (taskId: number): Promise<any> => {
  return request.post(`/batch-send/tasks/${taskId}/pause`)
}

/**
 * 恢复任务
 */
export const resumeBatchTask = (taskId: number): Promise<any> => {
  return request.post(`/batch-send/tasks/${taskId}/resume`)
}
