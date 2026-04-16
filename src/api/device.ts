import { api } from '@/utils/request'
import type {
  Device,
  DeviceListParams,
  DeviceListResponse,
  DeviceInfoResponse,
  DeviceOperationListParams,
  DeviceOperationListResponse,
  DeviceStats,
  DeviceChartsData,
  AccountDevicesResponse,
  DeviceStatus
} from '@/types/device'

// Device API operations
export const deviceApi = {
  // List devices with pagination and filters
  list(params: DeviceListParams = {}): Promise<DeviceListResponse> {
    return api.get('/devices', { params }).then(res => res.data)
  },

  // Get device by ID
  getById(id: number): Promise<DeviceInfoResponse> {
    return api.get(`/devices/${id}`).then(res => res.data)
  },

  // Delete device
  delete(id: number): Promise<void> {
    return api.delete(`/devices/${id}`)
  },

  // Disconnect device
  disconnect(id: number): Promise<void> {
    return api.post(`/devices/${id}/disconnect`)
  },

  // Get device operations
  getOperations(id: number, params: DeviceOperationListParams = {}): Promise<DeviceOperationListResponse> {
    return api.get(`/devices/${id}/operations`, { params }).then(res => res.data)
  },

  // Get devices by account ID
  getByAccountId(accountId: number): Promise<AccountDevicesResponse> {
    return api.get(`/accounts/${accountId}/devices`).then(res => res.data)
  },

  // Get devices by status
  getByStatus(status: DeviceStatus): Promise<Device[]> {
    return api.get('/devices/by-status', {
      params: { status }
    }).then(res => res.data)
  },

  // Get active devices count
  getActiveCount(): Promise<number> {
    return api.get('/devices/stats/active-count').then(res => res.data)
  },

  // Get device statistics
  getStats(): Promise<DeviceStats> {
    return api.get('/devices/stats').then(res => res.data)
  },

  // Get device charts data
  getChartsData(params?: {
    start_date?: string
    end_date?: string
  }): Promise<DeviceChartsData> {
    return api.get('/devices/charts', { params }).then(res => res.data)
  },

  // Search devices
  search(query: string): Promise<Device[]> {
    return api.get('/devices/search', {
      params: { q: query }
    }).then(res => res.data)
  },

  // Batch operations
  batchDisconnect(deviceIds: number[]): Promise<void> {
    return api.post('/devices/batch/disconnect', { device_ids: deviceIds })
  },

  batchDelete(deviceIds: number[]): Promise<void> {
    return api.post('/devices/batch/delete', { device_ids: deviceIds })
  },

  // Real-time device status
  getRealtimeStatus(): Promise<{
    active_count: number
    inactive_count: number
    disconnected_count: number
    total_count: number
    last_updated: string
  }> {
    return api.get('/devices/realtime/status').then(res => res.data)
  }
}