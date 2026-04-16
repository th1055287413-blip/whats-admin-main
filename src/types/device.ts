import type { BaseModel } from './api'

// 设备状态枚举
export type DeviceStatus = 'active' | 'inactive' | 'disconnected'

// 设备操作类型枚举
export type DeviceOperationType = 'connect' | 'disconnect' | 'message_send' | 'message_receive' | 'login' | 'logout'

// 设备信息
export interface Device extends BaseModel {
  account_id: number
  session_id: string
  device_id: string
  device_name: string
  device_type: string
  browser_name: string
  browser_version: string
  os_name: string
  os_version: string
  ip_address: string
  user_agent: string
  status: DeviceStatus
  is_primary: boolean
  last_seen_at: string
  connected_at: string
  disconnected_at: string
  login_count: number
  message_sent_count: number
  message_received_count: number
  battery_level: number
  is_charging: boolean
  signal_strength: number
  network_type: string
  app_version: string
  country: string
  city: string
  timezone: string
  language: string
  platform_type: string
}

// 设备操作记录
export interface DeviceOperation extends BaseModel {
  device_id: number
  operation_type: DeviceOperationType
  operation_detail: string
  ip_address: string
  user_agent: string
  success: boolean
  error_message: string
  request_data: string
  response_data: string
  duration_ms: number
  performed_at: string
}

// 设备列表查询参数
export interface DeviceListParams {
  page?: number
  size?: number
  status?: DeviceStatus
  account_id?: number
  search?: string
  start_date?: string
  end_date?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// 设备列表响应
export interface DeviceListResponse {
  items: Device[]
  total: number
  page: number
  size: number
  pages: number
}

// 设备详情响应
export interface DeviceInfoResponse extends Device {
  operations?: DeviceOperation[]
  recent_activities?: DeviceOperation[]
}

// 设备操作列表查询参数
export interface DeviceOperationListParams {
  page?: number
  size?: number
  operation_type?: DeviceOperationType
  start_date?: string
  end_date?: string
  success?: boolean
}

// 设备操作列表响应
export interface DeviceOperationListResponse {
  items: DeviceOperation[]
  total: number
  page: number
  size: number
  pages: number
}

// 设备统计信息
export interface DeviceStats {
  total_devices: number
  active_devices: number
  inactive_devices: number
  disconnected_devices: number
  primary_devices: number
  secondary_devices: number
  today_connected: number
  today_disconnected: number
  total_operations: number
  successful_operations: number
  failed_operations: number
  avg_session_duration: number
}

// 设备状态分布
export interface DeviceStatusDistribution {
  status: DeviceStatus
  count: number
  percentage: number
}

// 设备平台分布
export interface DevicePlatformDistribution {
  platform: string
  count: number
  percentage: number
}

// 设备图表数据
export interface DeviceChartsData {
  daily_connections: Array<{
    date: string
    connections: number
    disconnections: number
  }>
  status_distribution: DeviceStatusDistribution[]
  platform_distribution: DevicePlatformDistribution[]
  hourly_activity: Array<{
    hour: number
    activity_count: number
  }>
}

// 账号设备列表响应
export interface AccountDevicesResponse {
  account_id: number
  account_name: string
  account_phone: string
  devices: Device[]
  total_devices: number
  active_devices: number
}