// Tag related types
export interface Tag {
  id: number
  name: string
  description?: string
  color: string
  user_count: number
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface TagUser {
  id: number
  tag_id: number
  user_id: number
  created_at: string
}

// API request/response types
export interface TagListParams {
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
  color?: string
  min_user_count?: number
  max_user_count?: number
}

export interface TagListResponse {
  tags: Tag[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TagCreateRequest {
  name: string
  description?: string
  color: string
}

export interface TagUpdateRequest {
  name?: string
  description?: string
  color?: string
}

export interface TagStatsResponse {
  total_tags: number
  used_tags: number
  unused_tags: number
  avg_users_per_tag: number
  most_popular_tag: Tag | null
  least_popular_tag: Tag | null
  color_distribution: Array<{ color: string; count: number }>
  usage_distribution: Array<{ range: string; count: number }>
}

export interface TagUsersResponse {
  users: Array<{
    id: number
    phone_number: string
    name?: string
    username?: string
    status: string
    created_at: string
  }>
  total: number
  page: number
  page_size: number
}

export interface BatchTagCreateRequest {
  tags: TagCreateRequest[]
}

export interface BatchTagDeleteRequest {
  tag_ids: number[]
}

export interface BatchTagColorUpdateRequest {
  updates: Array<{ id: number; color: string }>
}

export interface BatchTagResponse {
  success: boolean
  created_count?: number
  updated_count?: number
  deleted_count?: number
  errors?: Array<{ tag_id?: number; name?: string; error: string }>
}

// Color management types
export interface TagColor {
  name: string
  hex: string
  rgb: { r: number; g: number; b: number }
  usage_count?: number
}

export interface ColorPalette {
  primary: TagColor[]
  secondary: TagColor[]
  custom: TagColor[]
}

export interface ColorStats {
  total_colors: number
  most_used_color: TagColor
  least_used_color: TagColor
  color_distribution: Array<{ color: string; count: number; percentage: number }>
}

// Form validation types
export interface TagFormData {
  name: string
  description: string
  color: string
}

export interface TagFormRules {
  name: any[]
  description: any[]
  color: any[]
}

// Table column configuration
export interface TagTableColumn {
  prop: string
  label: string
  width?: string | number
  minWidth?: string | number
  sortable?: boolean | string
  formatter?: (row: Tag, column: any, cellValue: any) => string
  fixed?: boolean | string
}

// Filter configuration
export interface TagFilter {
  search: string
  color: string
  user_count_range: [number, number] | null
  date_range: [string, string] | null
  sort_by: string
  sort_order: 'asc' | 'desc'
}

// Search and suggestion types
export interface TagSearchParams {
  query: string
  limit?: number
  include_stats?: boolean
}

export interface TagSuggestion {
  id: number
  name: string
  color: string
  user_count: number
  match_score: number
}

// Chart and analytics types
export interface TagAnalytics {
  usage_trend: Array<{ date: string; count: number }>
  popular_tags: Array<{ tag: Tag; growth_rate: number }>
  color_preferences: Array<{ color: string; popularity: number }>
  user_distribution: Array<{ tag_name: string; user_count: number }>
}

// UI component props
export interface TagSelectProps {
  modelValue: number[]
  multiple?: boolean
  filterable?: boolean
  clearable?: boolean
  placeholder?: string
  disabled?: boolean
  size?: 'large' | 'default' | 'small'
}

export interface TagDisplayProps {
  tag: Tag
  closable?: boolean
  size?: 'large' | 'default' | 'small'
  type?: 'primary' | 'success' | 'info' | 'warning' | 'danger'
  effect?: 'dark' | 'light' | 'plain'
}

// Constants
export const DEFAULT_TAG_COLORS = [
  '#409EFF', '#67C23A', '#E6A23C', '#F56C6C',
  '#909399', '#C0C4CC', '#606266', '#303133',
  '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
  '#EF4444', '#6366F1', '#EC4899', '#84CC16'
] as const

export const TAG_COLOR_CATEGORIES = {
  primary: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'],
  secondary: ['#909399', '#C0C4CC', '#606266', '#303133'],
  modern: ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'],
  vibrant: ['#EF4444', '#6366F1', '#EC4899', '#84CC16']
} as const