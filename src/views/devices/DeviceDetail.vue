<template>
  <div class="device-detail" v-loading="loading">
    <div class="page-header">
      <el-breadcrumb>
        <el-breadcrumb-item :to="{ path: '/devices' }">设备管理</el-breadcrumb-item>
        <el-breadcrumb-item>设备详情</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <el-button @click="handleRefresh" :icon="Refresh">刷新</el-button>
        <el-button
          v-if="device && device.status !== 'disconnected'"
          type="warning"
          @click="handleDisconnect"
          :icon="SwitchButton"
        >
          断开连接
        </el-button>
        <el-button type="danger" @click="handleDelete" :icon="Delete">删除设备</el-button>
      </div>
    </div>

    <div v-if="device" class="device-content">
      <!-- 基本信息 -->
      <el-card class="device-info-card">
        <template #header>
          <div class="card-header">
            <span>设备基本信息</span>
            <el-tag
              :type="getStatusType(device.status)"
              effect="dark"
              size="large"
            >
              {{ getStatusText(device.status) }}
            </el-tag>
          </div>
        </template>

        <div class="device-info-grid">
          <div class="info-section">
            <h3>设备信息</h3>
            <div class="info-row">
              <span class="label">设备名称：</span>
              <span class="value">{{ device.device_name || 'Unknown Device' }}</span>
            </div>
            <div class="info-row">
              <span class="label">设备ID：</span>
              <span class="value">{{ device.device_id }}</span>
            </div>
            <div class="info-row">
              <span class="label">设备类型：</span>
              <span class="value">{{ device.device_type || 'Unknown' }}</span>
            </div>
            <div class="info-row">
              <span class="label">主设备：</span>
              <el-tag :type="device.is_primary ? 'success' : 'info'" size="small">
                {{ device.is_primary ? '是' : '否' }}
              </el-tag>
            </div>
          </div>

          <div class="info-section">
            <h3>系统信息</h3>
            <div class="info-row">
              <span class="label">操作系统：</span>
              <span class="value">{{ device.os_name }} {{ device.os_version }}</span>
            </div>
            <div class="info-row">
              <span class="label">浏览器：</span>
              <span class="value">{{ device.browser_name }} {{ device.browser_version }}</span>
            </div>
            <div class="info-row">
              <span class="label">平台类型：</span>
              <span class="value">{{ device.platform_type || 'Unknown' }}</span>
            </div>
            <div class="info-row">
              <span class="label">应用版本：</span>
              <span class="value">{{ device.app_version || 'Unknown' }}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>网络信息</h3>
            <div class="info-row">
              <span class="label">IP地址：</span>
              <span class="value ip-address">{{ device.ip_address }}</span>
            </div>
            <div class="info-row">
              <span class="label">网络类型：</span>
              <span class="value">{{ device.network_type || 'Unknown' }}</span>
            </div>
            <div class="info-row">
              <span class="label">信号强度：</span>
              <span class="value">{{ device.signal_strength || 'Unknown' }}</span>
            </div>
            <div class="info-row">
              <span class="label">位置：</span>
              <span class="value">{{ formatLocation(device) }}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>时间信息</h3>
            <div class="info-row">
              <span class="label">连接时间：</span>
              <span class="value">{{ formatDateTime(device.connected_at) }}</span>
            </div>
            <div class="info-row">
              <span class="label">最后活跃：</span>
              <span class="value">{{ formatDateTime(device.last_seen_at) }}</span>
            </div>
            <div class="info-row">
              <span class="label">断开时间：</span>
              <span class="value">{{ device.disconnected_at ? formatDateTime(device.disconnected_at) : '未断开' }}</span>
            </div>
            <div class="info-row">
              <span class="label">时区：</span>
              <span class="value">{{ device.timezone || 'Unknown' }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 统计信息 -->
      <div class="stats-grid">
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ device.login_count }}</div>
            <div class="stat-label">登录次数</div>
          </div>
        </el-card>
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ device.message_sent_count }}</div>
            <div class="stat-label">发送消息</div>
          </div>
        </el-card>
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ device.message_received_count }}</div>
            <div class="stat-label">接收消息</div>
          </div>
        </el-card>
        <el-card>
          <div class="stat-item">
            <div class="stat-value">{{ device.battery_level }}%</div>
            <div class="stat-label">电池电量</div>
          </div>
        </el-card>
      </div>

      <!-- 操作记录 -->
      <el-card class="operations-card">
        <template #header>
          <div class="card-header">
            <span>操作记录</span>
            <div class="header-filters">
              <el-select
                v-model="operationFilter.operation_type"
                placeholder="操作类型"
                clearable
                size="small"
                style="width: 120px"
                @change="handleOperationFilter"
              >
                <el-option label="连接" value="connect" />
                <el-option label="断开" value="disconnect" />
                <el-option label="发送消息" value="message_send" />
                <el-option label="接收消息" value="message_receive" />
                <el-option label="登录" value="login" />
                <el-option label="登出" value="logout" />
              </el-select>
              <el-select
                v-model="operationFilter.success"
                placeholder="状态"
                clearable
                size="small"
                style="width: 80px; margin-left: 8px"
                @change="handleOperationFilter"
              >
                <el-option label="成功" :value="true" />
                <el-option label="失败" :value="false" />
              </el-select>
            </div>
          </div>
        </template>

        <el-table
          v-loading="operationsLoading"
          :data="operations"
          row-key="id"
          stripe
        >
          <el-table-column prop="operation_type" label="操作类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getOperationTypeTag(row.operation_type)" size="small">
                {{ getOperationTypeText(row.operation_type) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="operation_detail" label="操作详情" min-width="200" />

          <el-table-column prop="success" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                {{ row.success ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="duration_ms" label="耗时" width="100">
            <template #default="{ row }">
              {{ row.duration_ms }}ms
            </template>
          </el-table-column>

          <el-table-column prop="performed_at" label="操作时间" width="160">
            <template #default="{ row }">
              {{ formatDateTime(row.performed_at) }}
            </template>
          </el-table-column>

          <el-table-column label="详情" width="80">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                @click="handleViewOperationDetail(row)"
              >
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 操作记录分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="operationPage"
            v-model:page-size="operationPageSize"
            :page-sizes="[10, 20, 50]"
            :total="operationTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="handleOperationSizeChange"
            @current-change="handleOperationCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 操作详情对话框 -->
    <el-dialog
      v-model="operationDetailVisible"
      title="操作详情"
      width="800px"
    >
      <div v-if="selectedOperation" class="operation-detail">
        <div class="detail-row">
          <span class="label">操作类型：</span>
          <span class="value">{{ getOperationTypeText(selectedOperation.operation_type) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">操作详情：</span>
          <span class="value">{{ selectedOperation.operation_detail }}</span>
        </div>
        <div class="detail-row">
          <span class="label">状态：</span>
          <el-tag :type="selectedOperation.success ? 'success' : 'danger'">
            {{ selectedOperation.success ? '成功' : '失败' }}
          </el-tag>
        </div>
        <div v-if="!selectedOperation.success && selectedOperation.error_message" class="detail-row">
          <span class="label">错误信息：</span>
          <span class="value error">{{ selectedOperation.error_message }}</span>
        </div>
        <div class="detail-row">
          <span class="label">IP地址：</span>
          <span class="value">{{ selectedOperation.ip_address }}</span>
        </div>
        <div class="detail-row">
          <span class="label">User Agent：</span>
          <span class="value">{{ selectedOperation.user_agent }}</span>
        </div>
        <div class="detail-row">
          <span class="label">耗时：</span>
          <span class="value">{{ selectedOperation.duration_ms }}ms</span>
        </div>
        <div class="detail-row">
          <span class="label">操作时间：</span>
          <span class="value">{{ formatDateTime(selectedOperation.performed_at) }}</span>
        </div>
        <div v-if="selectedOperation.request_data" class="detail-section">
          <h4>请求数据：</h4>
          <pre class="json-data">{{ formatJson(selectedOperation.request_data) }}</pre>
        </div>
        <div v-if="selectedOperation.response_data" class="detail-section">
          <h4>响应数据：</h4>
          <pre class="json-data">{{ formatJson(selectedOperation.response_data) }}</pre>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, SwitchButton, Delete } from '@element-plus/icons-vue'
import { deviceApi } from '@/api/device'
import type { DeviceInfoResponse, DeviceOperation, DeviceOperationListParams, DeviceOperationType, DeviceStatus } from '@/types/device'
import { formatDateTime } from '@/utils/date'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const operationsLoading = ref(false)
const device = ref<DeviceInfoResponse | null>(null)
const operations = ref<DeviceOperation[]>([])
const operationDetailVisible = ref(false)
const selectedOperation = ref<DeviceOperation | null>(null)

// 操作记录分页
const operationPage = ref(1)
const operationPageSize = ref(20)
const operationTotal = ref(0)

// 操作记录筛选
const operationFilter = reactive<DeviceOperationListParams>({
  operation_type: undefined,
  success: undefined
})

// 设备ID
const deviceId = computed(() => parseInt(route.params.id as string))

// 获取状态类型
const getStatusType = (status: DeviceStatus) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'disconnected':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态文本
const getStatusText = (status: DeviceStatus) => {
  switch (status) {
    case 'active':
      return '活跃'
    case 'inactive':
      return '非活跃'
    case 'disconnected':
      return '已断开'
    default:
      return '未知'
  }
}

// 获取操作类型标签
const getOperationTypeTag = (type: DeviceOperationType) => {
  switch (type) {
    case 'connect':
    case 'login':
      return 'success'
    case 'disconnect':
    case 'logout':
      return 'warning'
    case 'message_send':
      return 'primary'
    case 'message_receive':
      return 'info'
    default:
      return ''
  }
}

// 获取操作类型文本
const getOperationTypeText = (type: DeviceOperationType) => {
  switch (type) {
    case 'connect':
      return '连接'
    case 'disconnect':
      return '断开'
    case 'message_send':
      return '发送消息'
    case 'message_receive':
      return '接收消息'
    case 'login':
      return '登录'
    case 'logout':
      return '登出'
    default:
      return type
  }
}

// 格式化位置
const formatLocation = (device: DeviceInfoResponse) => {
  const parts = []
  if (device.city) parts.push(device.city)
  if (device.country) parts.push(device.country)
  return parts.length > 0 ? parts.join(', ') : 'Unknown'
}

// 格式化JSON
const formatJson = (jsonStr: string) => {
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2)
  } catch {
    return jsonStr
  }
}

// 获取设备详情
const fetchDevice = async () => {
  try {
    loading.value = true
    device.value = await deviceApi.getById(deviceId.value)
  } catch (error) {
    ElMessage.error('获取设备详情失败')
    console.error('Failed to fetch device:', error)
  } finally {
    loading.value = false
  }
}

// 获取操作记录
const fetchOperations = async () => {
  try {
    operationsLoading.value = true
    const params = {
      page: operationPage.value,
      size: operationPageSize.value,
      ...operationFilter
    }

    const response = await deviceApi.getOperations(deviceId.value, params)
    operations.value = response.items
    operationTotal.value = response.total
  } catch (error) {
    ElMessage.error('获取操作记录失败')
    console.error('Failed to fetch operations:', error)
  } finally {
    operationsLoading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  fetchDevice()
  fetchOperations()
}

// 断开设备
const handleDisconnect = async () => {
  if (!device.value) return

  try {
    await ElMessageBox.confirm(
      `确定要断开设备 "${device.value.device_name || device.value.device_id}" 的连接吗？`,
      '确认断开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deviceApi.disconnect(deviceId.value)
    ElMessage.success('设备已断开连接')
    fetchDevice()
    fetchOperations()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('断开设备连接失败')
      console.error('Failed to disconnect device:', error)
    }
  }
}

// 删除设备
const handleDelete = async () => {
  if (!device.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${device.value.device_name || device.value.device_id}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deviceApi.delete(deviceId.value)
    ElMessage.success('设备已删除')
    router.push({ name: 'Devices' })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除设备失败')
      console.error('Failed to delete device:', error)
    }
  }
}

// 操作记录筛选
const handleOperationFilter = () => {
  operationPage.value = 1
  fetchOperations()
}

// 操作记录分页
const handleOperationSizeChange = (newSize: number) => {
  operationPageSize.value = newSize
  operationPage.value = 1
  fetchOperations()
}

const handleOperationCurrentChange = (newPage: number) => {
  operationPage.value = newPage
  fetchOperations()
}

// 查看操作详情
const handleViewOperationDetail = (operation: DeviceOperation) => {
  selectedOperation.value = operation
  operationDetailVisible.value = true
}

// 生命周期
onMounted(() => {
  fetchDevice()
  fetchOperations()
})
</script>

<style scoped>
.device-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.device-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.device-info-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-filters {
  display: flex;
  align-items: center;
}

.device-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.info-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.info-row .label {
  min-width: 100px;
  color: #606266;
  font-weight: 500;
}

.info-row .value {
  color: #303133;
}

.ip-address {
  font-family: monospace;
  font-size: 13px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.operations-card {
  min-height: 400px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.operation-detail .detail-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
}

.operation-detail .label {
  min-width: 100px;
  color: #606266;
  font-weight: 500;
}

.operation-detail .value {
  color: #303133;
  flex: 1;
}

.operation-detail .value.error {
  color: #f56c6c;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.json-data {
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  color: #606266;
  max-height: 200px;
  overflow-y: auto;
}
</style>