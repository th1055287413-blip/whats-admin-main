// 关键词配置类型
export interface KeywordReply {
  id: number
  keywords: string[] // 关键词列表（支持多个同义词）
  reply: string // 回复内容
  priority: number // 优先级 (1-10)
  match_type: 'exact' | 'fuzzy' // 匹配模式
  status: 'active' | 'inactive' // 状态
  language: 'zh-CN' | 'zh-TW' | 'en' | 'id' | 'ms' // 语言
  keyword_type: 'normal' | 'welcome' | 'default' // 关键词类型
  created_at: string
  updated_at: string
}

// 列表查询参数
export interface KeywordListParams {
  page?: number
  limit?: number
  query?: string // 搜索关键词
  match_type?: 'exact' | 'fuzzy'
  status?: 'active' | 'inactive'
  language?: string
  keyword_type?: 'normal' | 'welcome' | 'default' // 关键词类型筛选
}

// 列表响应
export interface KeywordListResponse {
  list: KeywordReply[]
  total: number
  page: number
  limit: number
}

// 创建请求
export interface CreateKeywordRequest {
  keywords: string[]
  reply: string
  priority: number
  match_type: 'exact' | 'fuzzy'
  status: 'active' | 'inactive'
  language: string
  keyword_type?: 'normal' | 'welcome' | 'default' // 关键词类型（可选，默认 normal）
}

// 更新请求
export interface UpdateKeywordRequest extends Partial<CreateKeywordRequest> {}
