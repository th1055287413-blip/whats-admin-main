import { request } from '@/utils/request'

// 代理配置類型
export interface ProxyConfig {
  id: number
  name: string
  host: string
  port: number
  type: 'socks5' | 'http'
  username?: string
  status: 'enabled' | 'disabled'
  remark?: string
  created_at: string
  updated_at: string
}

// 列表項（包含 Connector 使用數量）
export interface ProxyConfigListItem extends ProxyConfig {
  connector_count: number
}

// 創建請求
export interface CreateProxyConfigRequest {
  name: string
  host: string
  port: number
  type?: 'socks5' | 'http'
  username?: string
  password?: string
  remark?: string
}

// 更新請求
export interface UpdateProxyConfigRequest {
  name?: string
  host?: string
  port?: number
  type?: 'socks5' | 'http'
  username?: string
  password?: string
  remark?: string
}

// 列表查詢參數
export interface ProxyConfigListParams {
  page?: number
  page_size?: number
  status?: 'enabled' | 'disabled'
  keyword?: string
}

// 列表響應
export interface ProxyConfigListResponse {
  list: ProxyConfigListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// 取得代理配置列表
export function getProxyConfigList(params?: ProxyConfigListParams) {
  return request.get<ProxyConfigListResponse>('/admin/proxy-configs', { params })
}

// 取得啟用的代理配置（下拉選單用）
export function getEnabledProxyConfigs() {
  return request.get<ProxyConfig[]>('/admin/proxy-configs/options')
}

// 取得單一代理配置
export function getProxyConfig(id: number) {
  return request.get<ProxyConfig>(`/admin/proxy-configs/${id}`)
}

// 創建代理配置
export function createProxyConfig(data: CreateProxyConfigRequest) {
  return request.post<ProxyConfig>('/admin/proxy-configs', data)
}

// 更新代理配置
export function updateProxyConfig(id: number, data: UpdateProxyConfigRequest) {
  return request.put<void>(`/admin/proxy-configs/${id}`, data)
}

// 更新代理狀態
export function updateProxyConfigStatus(id: number, status: 'enabled' | 'disabled') {
  return request.put<void>(`/admin/proxy-configs/${id}/status`, { status })
}

// 刪除代理配置
export function deleteProxyConfig(id: number) {
  return request.delete<void>(`/admin/proxy-configs/${id}`)
}
