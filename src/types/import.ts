export interface ImportOptions {
  updateExisting: boolean
  skipErrors: boolean
  batchSize: number
  taskId?: string
}

export interface ImportResult {
  task_id: string
  total_rows: number
  success_count: number
  failure_count: number
  updated_count: number
  created_count: number
  skipped_count: number
  errors: ImportError[]
  processed_at: string
  duration: string
  summary: string
}

export interface ImportError {
  row: number
  field: string
  value: string
  message: string
}

export interface ImportValidationResult {
  valid: boolean
  total_rows: number
  valid_rows: number
  invalid_rows: number
  errors: ImportError[]
  warnings: ImportError[]
}

export interface ImportPreviewResult {
  headers: string[]
  rows: Record<string, string>[]
  total_rows: number
  errors: ImportError[]
  warnings: ImportError[]
}

export interface ImportProgress {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  total: number
  message: string
  error_count: number
  success_count: number
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface ImportHistory {
  id: number
  task_id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_rows: number
  success_count: number
  failure_count: number
  created_at: string
  completed_at?: string
  duration?: string
  error_message?: string
}

export interface ImportTemplate {
  fields: ImportFieldDefinition[]
  format: ImportFormatInfo
  validation_rules: string[]
  import_options: Record<string, ImportOptionDefinition>
}

export interface ImportFieldDefinition {
  name: string
  label: string
  required: boolean
  type: 'string' | 'number' | 'boolean' | 'date'
  description: string
  example?: string
  validation?: string
  max_length?: number
  options?: string[]
  default?: any
}

export interface ImportFormatInfo {
  file_type: string
  max_file_size: string
  max_rows: number
  sheet_name: string
  header_row: number
  data_start: number
}

export interface ImportOptionDefinition {
  default: any
  description: string
  type?: string
  options?: any[]
}

export interface ImportUserData {
  phone: string
  name?: string
  avatar?: string
  country?: string
  city?: string
  language?: string
}