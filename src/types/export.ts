export interface ExportOptions {
  type: 'users' | 'tags' | 'stats'
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  filters?: {
    phone?: string
    name?: string
    status?: string
    is_online?: boolean
    country?: string
    city?: string
    language?: string
    tag_id?: number
  }
}

export interface ExportResult {
  filename: string
  content: Blob | ArrayBuffer | string
  mimeType: string
  size: number
}

export interface ExportFormat {
  type: string
  name: string
  description: string
  formats: string[]
  fields?: string[]
  filters?: string[]
  options?: Record<string, any>
}

export interface ExportHistory {
  id: number
  type: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  file_size?: number
  download_count?: number
  error_message?: string
}

export interface ExportProgress {
  task_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  total: number
  message?: string
  download_url?: string
  created_at: string
  completed_at?: string
}