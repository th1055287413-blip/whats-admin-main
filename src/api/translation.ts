import request from '@/utils/request'

// 语言配置相关接口

export interface LanguageConfig {
  id?: number
  user_id?: number
  language_code: string
  language_name: string
  country_code: string
  country_name: string
  is_default: boolean
  created_at?: string
  updated_at?: string
}

export interface TranslationConfig {
  id?: number
  user_id?: number
  auto_translate_received: boolean
  auto_translate_sent: boolean
  default_target_language_id: number | null
  created_at?: string
  updated_at?: string
}

export interface TranslationRequest {
  text: string
  target_language: string
  source_language?: string
}

export interface TranslationResponse {
  translated_text: string
  source_language?: string
  cached: boolean
}

// 获取语言配置列表
export function getLanguageConfigs() {
  return request({
    url: '/languages',
    method: 'get'
  })
}

// 创建语言配置
export function createLanguageConfig(data: LanguageConfig) {
  return request({
    url: '/languages',
    method: 'post',
    data
  })
}

// 更新语言配置
export function updateLanguageConfig(id: number, data: Partial<LanguageConfig>) {
  return request({
    url: `/languages/${id}`,
    method: 'put',
    data
  })
}

// 删除语言配置
export function deleteLanguageConfig(id: number) {
  return request({
    url: `/languages/${id}`,
    method: 'delete'
  })
}

// 获取翻译配置
export function getTranslationConfig() {
  return request({
    url: '/translation/config',
    method: 'get'
  })
}

// 更新翻译配置
export function updateTranslationConfig(data: Partial<TranslationConfig>) {
  return request({
    url: '/translation/config',
    method: 'put',
    data
  })
}

// 翻译文本
export function translateText(data: TranslationRequest) {
  return request({
    url: '/translation/translate',
    method: 'post',
    data
  })
}

// 批量翻译
export function batchTranslate(texts: string[], targetLanguage: string) {
  return request({
    url: '/translation/batch',
    method: 'post',
    data: {
      texts,
      target_language: targetLanguage
    }
  })
}
