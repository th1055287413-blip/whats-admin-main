export interface BatchOperationRequest {
  task_id?: string
  user_ids: number[]
  operation: 'update_status' | 'add_tags' | 'remove_tags' | 'delete' | 'update_fields'
  data?: Record<string, any>
  options?: BatchOptions
  operator_id?: number
}

export interface BatchOptions {
  batch_size?: number
  parallel_batches?: number
  continue_on_error?: boolean
  notify_progress?: boolean
}

export interface BatchOperationResult {
  task_id: string
  operation: string
  total_count: number
  success_count: number
  failure_count: number
  skipped_count: number
  errors: BatchOperationError[]
  start_time: string
  end_time?: string
  duration?: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  summary: string
}

export interface BatchOperationError {
  user_id: number
  message: string
  code?: string
}

export interface BatchProgress {
  task_id: string
  operation: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  total: number
  success_count: number
  failure_count: number
  current_batch: number
  total_batches: number
  message: string
  estimated_time?: number
  start_time: string
  last_update_time: string
}

export interface BatchHistoryItem {
  id: number
  task_id: string
  operation: string
  operator_id?: number
  operator_name?: string
  total_count: number
  success_count: number
  failure_count: number
  status: string
  summary: string
  start_time: string
  end_time?: string
  duration?: string
}

export interface BatchHistoryResponse {
  items: BatchHistoryItem[]
  total: number
  page: number
  limit: number
}

export interface BatchHistoryParams {
  page?: number
  limit?: number
}

export interface BatchOperationType {
  name: string
  description: string
  data_schema: Record<string, any>
  example: Record<string, any>
}

export interface BatchOperationTypes {
  operations: Record<string, BatchOperationType>
  options: Record<string, any>
  limits: {
    max_users_per_batch: number
    max_batch_size: number
    max_parallel_batches: number
  }
}