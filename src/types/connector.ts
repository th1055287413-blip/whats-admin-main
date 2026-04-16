// Connector 帳號統計
export interface ConnectorAccountStats {
  total: number
  connected: number
  disconnected: number
}

// Connector 狀態
export interface ConnectorStatus {
  id: string
  alive: boolean
  last_heartbeat?: string
  version?: string
  accounts: ConnectorAccountStats
}

// 總覽統計
export interface ConnectorsSummary {
  total_connectors: number
  alive_connectors: number
  total_accounts: number
  connected_accounts: number
  disconnected_accounts: number
}

// API 回應
export interface ConnectorsStatusResponse {
  api_version: string
  connectors: ConnectorStatus[]
  summary: ConnectorsSummary
}
