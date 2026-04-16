import { request } from '@/utils/request'
import type { ConnectorsStatusResponse } from '@/types/connector'
import type { ProxyConfig } from './proxy'

// 取得所有 Connector 的狀態
export function getConnectorsStatus() {
  return request.get<ConnectorsStatusResponse>('/admin/connectors')
}

// ========== Connector 配置管理 ==========

// Connector 配置類型
export interface ConnectorConfig {
  id: string
  name: string
  proxy_config_id?: number
  country_codes?: string[]
  accept_new_device: boolean
  status: 'running' | 'stopped' | 'error' | 'starting' | 'stopping'
  error_msg?: string
  created_at: string
  updated_at: string
  proxy_config?: ProxyConfig
}

// 列表項
export interface ConnectorConfigListItem extends ConnectorConfig {
  proxy_name?: string
}

// 創建請求
export interface CreateConnectorConfigRequest {
  id: string
  name: string
  proxy_config_id?: number
  country_codes?: string[]
  auto_start?: boolean
}

// 更新請求
export interface UpdateConnectorConfigRequest {
  name?: string
  proxy_config_id?: number
  country_codes?: string[]
  accept_new_device?: boolean
}

// 列表查詢參數
export interface ConnectorConfigListParams {
  page?: number
  page_size?: number
  status?: 'running' | 'stopped' | 'error' | 'starting' | 'stopping'
  proxy_config_id?: number
  keyword?: string
}

// 列表響應
export interface ConnectorConfigListResponse {
  list: ConnectorConfigListItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

// 取得 Connector 配置列表
export function getConnectorConfigList(params?: ConnectorConfigListParams) {
  return request.get<ConnectorConfigListResponse>('/admin/connector-configs', { params })
}

// 取得單一 Connector 配置
export function getConnectorConfig(id: string) {
  return request.get<ConnectorConfig>(`/admin/connector-configs/${id}`)
}

// 創建 Connector 配置
export function createConnectorConfig(data: CreateConnectorConfigRequest) {
  return request.post<ConnectorConfig>('/admin/connector-configs', data)
}

// 更新 Connector 配置
export function updateConnectorConfig(id: string, data: UpdateConnectorConfigRequest) {
  return request.put<void>(`/admin/connector-configs/${id}`, data)
}

// 刪除 Connector 配置
export function deleteConnectorConfig(id: string) {
  return request.delete<void>(`/admin/connector-configs/${id}`)
}

// 綁定代理
export function bindProxy(id: string, proxyConfigId: number) {
  return request.post<void>(`/admin/connector-configs/${id}/bind-proxy`, { proxy_config_id: proxyConfigId })
}

// 解除代理綁定
export function unbindProxy(id: string) {
  return request.post<void>(`/admin/connector-configs/${id}/unbind-proxy`)
}

// 啟動 Connector
export function startConnector(id: string) {
  return request.post<void>(`/admin/connector-configs/${id}/start`)
}

// 停止 Connector
export function stopConnector(id: string) {
  return request.post<void>(`/admin/connector-configs/${id}/stop`)
}

// 重啟 Connector
export function restartConnector(id: string) {
  return request.post<void>(`/admin/connector-configs/${id}/restart`)
}

// ========== 系統監控 ==========

export interface MonitorStreamInfo {
  stream: string
  length: number
  pending?: {
    count: number
    min_id?: string
    max_id?: string
  }
}

export interface MonitorConnectorCommandStreams {
  priority: MonitorStreamInfo
  bulk: MonitorStreamInfo
}

export interface MonitorEventWorkerSummary {
  total: number
  max_queue: number
  total_queued: number
}

export interface MonitorConnector {
  account_count: number
  uptime_seconds: number
  event_worker_summary?: MonitorEventWorkerSummary
  event_worker_queues?: Record<number, number>
}

export interface MonitorResponse {
  event_streams: Record<string, MonitorStreamInfo>
  command_streams: Record<string, MonitorConnectorCommandStreams>
  connectors: Record<string, MonitorConnector>
}

// 取得系統監控資訊
export function getSystemMonitor() {
  return request.get<MonitorResponse>('/admin/monitor')
}

// 取得 Connector 運行狀態
export function getConnectorStatus(id: string) {
  return request.get<{
    running: boolean
    account_count?: number
    account_ids?: number[]
    uptime?: string
    start_time?: string
  }>(`/admin/connector-configs/${id}/status`)
}
