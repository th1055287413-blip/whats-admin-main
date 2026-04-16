export interface AdvancedSearchParams {
  // 基础搜索
  query?: string
  search_fields?: string[]

  // 用户字段筛选
  phone?: string
  name?: string
  username?: string
  status?: string[]
  is_online?: boolean
  country?: string[]
  city?: string[]
  language?: string[]

  // 标签筛选
  tag_ids?: number[]
  tag_operator?: 'AND' | 'OR' // 标签逻辑操作符

  // 时间范围筛选
  created_date_from?: string
  created_date_to?: string
  last_seen_from?: string
  last_seen_to?: string

  // 消息数量筛选
  message_count_min?: number
  message_count_max?: number

  // 排序
  sort_by?: string
  sort_order?: 'asc' | 'desc'

  // 分页
  page?: number
  page_size?: number
}

export interface SearchCondition {
  id: string
  field: string
  operator: string
  value: any
  label?: string
}

export interface SearchGroup {
  id: string
  name: string
  conditions: SearchCondition[]
  operator: 'AND' | 'OR'
}

export interface SavedSearch {
  id: number
  name: string
  description?: string
  params: AdvancedSearchParams
  is_public: boolean
  created_by: number
  created_at: string
  updated_at: string
  use_count: number
  last_used_at?: string
}

export interface SearchSuggestion {
  type: 'field' | 'value' | 'operator' | 'recent'
  field?: string
  value: string
  label: string
  count?: number
}

export interface SearchHistory {
  id: number
  params: AdvancedSearchParams
  result_count: number
  search_time: string
  execution_time: number // 毫秒
}

export interface SearchFilter {
  field: string
  label: string
  type: 'text' | 'select' | 'multiSelect' | 'dateRange' | 'numberRange' | 'boolean'
  options?: { label: string; value: any }[]
  placeholder?: string
  validation?: {
    required?: boolean
    pattern?: string
    min?: number
    max?: number
  }
}

export interface SearchFieldGroup {
  name: string
  label: string
  fields: SearchFilter[]
}

export interface SearchTemplate {
  id: string
  name: string
  description: string
  groups: SearchFieldGroup[]
  presets?: Array<{
    name: string
    params: Partial<AdvancedSearchParams>
  }>
}

export interface SearchAnalytics {
  popular_fields: Array<{ field: string; count: number; percentage: number }>
  popular_values: Record<string, Array<{ value: string; count: number }>>
  search_trends: Array<{ date: string; count: number }>
  performance_stats: {
    avg_execution_time: number
    avg_result_count: number
    total_searches: number
  }
}