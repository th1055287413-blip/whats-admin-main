<template>
  <div class="connector-list-container">
    <!-- Header -->
    <div class="page-header">
      <h1>Connector 状态</h1>
      <div class="header-actions">
        <el-tag type="info" class="api-version">API {{ apiVersion }}</el-tag>
        <el-button @click="loadData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ summary.total_connectors }}</div>
          <div class="stat-label">总 Connector</div>
        </div>
      </el-card>
      <el-card class="stat-card alive">
        <div class="stat-content">
          <div class="stat-value">{{ summary.alive_connectors }}</div>
          <div class="stat-label">存活</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ summary.total_accounts }}</div>
          <div class="stat-label">总帐号</div>
        </div>
      </el-card>
      <el-card class="stat-card connected">
        <div class="stat-content">
          <div class="stat-value">{{ summary.connected_accounts }}</div>
          <div class="stat-label">已连线</div>
        </div>
      </el-card>
    </div>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="connectors"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="Connector ID" min-width="180" />

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.alive ? 'success' : 'danger'" size="small">
              {{ row.alive ? '存活' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="帐号统计" width="200">
          <template #default="{ row }">
            <div class="account-stats">
              <span class="total">{{ row.accounts.total }} 总数</span>
              <el-divider direction="vertical" />
              <span class="connected">{{ row.accounts.connected }} 已连线</span>
              <el-divider direction="vertical" />
              <span class="disconnected">{{ row.accounts.disconnected }} 离线</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="version" label="版本" width="120">
          <template #default="{ row }">
            {{ row.version || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="最后心跳" width="180">
          <template #default="{ row }">
            <span v-if="row.last_heartbeat">
              {{ formatTime(row.last_heartbeat) }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { getConnectorsStatus } from '@/api/connector'
import type { ConnectorStatus, ConnectorsSummary } from '@/types/connector'

const loading = ref(false)
const apiVersion = ref('')
const connectors = ref<ConnectorStatus[]>([])
const summary = reactive<ConnectorsSummary>({
  total_connectors: 0,
  alive_connectors: 0,
  total_accounts: 0,
  connected_accounts: 0,
  disconnected_accounts: 0
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await getConnectorsStatus()
    const data = res.data || res
    apiVersion.value = data.api_version || ''
    connectors.value = data.connectors || []
    Object.assign(summary, data.summary || {})
  } catch (error) {
    console.error('Failed to load connector status:', error)
  } finally {
    loading.value = false
  }
}

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.connector-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.api-version {
  font-weight: 500;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card.alive .stat-value {
  color: #67c23a;
}

.stat-card.connected .stat-value {
  color: #409eff;
}

.stat-content {
  padding: 10px 0;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.table-card {
  margin-bottom: 20px;
}

.account-stats {
  font-size: 13px;
}

.account-stats .total {
  color: #606266;
}

.account-stats .connected {
  color: #67c23a;
}

.account-stats .disconnected {
  color: #f56c6c;
}

.text-muted {
  color: #c0c4cc;
}
</style>
