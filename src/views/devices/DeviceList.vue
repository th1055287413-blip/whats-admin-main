<template>
  <div class="device-list">
    <div class="page-header">
      <h1>设备管理</h1>
      <p class="page-description">管理WhatsApp账号设备，查看设备状态和操作记录</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card v-loading="statsLoading">
        <div class="stat-item">
          <div class="stat-value">{{ stats.total_devices }}</div>
          <div class="stat-label">总设备数</div>
        </div>
      </el-card>
      <el-card v-loading="statsLoading">
        <div class="stat-item">
          <div class="stat-value active">{{ stats.active_devices }}</div>
          <div class="stat-label">活跃设备</div>
        </div>
      </el-card>
      <el-card v-loading="statsLoading">
        <div class="stat-item">
          <div class="stat-value inactive">{{ stats.inactive_devices }}</div>
          <div class="stat-label">非活跃设备</div>
        </div>
      </el-card>
      <el-card v-loading="statsLoading">
        <div class="stat-item">
          <div class="stat-value disconnected">{{ stats.disconnected_devices }}</div>
          <div class="stat-label">已断开设备</div>
        </div>
      </el-card>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px" :inline="true">
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.search"
            placeholder="搜索设备名称、ID或IP地址"
            clearable
            style="width: 250px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="searchForm.status"
            placeholder="选择状态"
            clearable
            style="width: 120px"
            @change="handleSearch"
          >
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
            <el-option label="已断开" value="disconnected" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号ID">
          <el-input
            v-model="searchForm.account_id"
            placeholder="账号ID"
            clearable
            style="width: 120px"
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 设备列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>设备列表</span>
          <div class="header-actions">
            <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="devices"
        row-key="id"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="device_name" label="设备名称" min-width="150">
          <template #default="{ row }">
            <div class="device-info">
              <div class="device-name">{{ row.device_name || 'Unknown Device' }}</div>
              <div class="device-id">ID: {{ row.device_id }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              effect="dark"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="device_type" label="设备类型" width="120">
          <template #default="{ row }">
            <div class="device-type">
              <el-icon><Monitor /></el-icon>
              {{ row.device_type || 'Unknown' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="os_name" label="操作系统" width="120">
          <template #default="{ row }">
            {{ row.os_name }} {{ row.os_version }}
          </template>
        </el-table-column>

        <el-table-column prop="browser_name" label="浏览器" width="120">
          <template #default="{ row }">
            {{ row.browser_name }} {{ row.browser_version }}
          </template>
        </el-table-column>

        <el-table-column prop="ip_address" label="IP地址" width="130">
          <template #default="{ row }">
            <span class="ip-address">{{ row.ip_address }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="last_seen_at" label="最后活跃" width="160">
          <template #default="{ row }">
            <el-tooltip :content="formatDateTime(row.last_seen_at)" placement="top">
              <span>{{ formatRelativeTime(row.last_seen_at) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column prop="is_primary" label="主设备" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_primary" type="success" size="small">主</el-tag>
            <el-tag v-else type="info" size="small">副</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>
            <el-dropdown @command="(command) => handleAction(command, row)">
              <el-button size="small" type="info">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="disconnect" :disabled="row.status === 'disconnected'">
                    断开连接
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除设备</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Monitor, ArrowDown } from '@element-plus/icons-vue'
import { deviceApi } from '@/api/device'
import type { Device, DeviceListParams, DeviceStats, DeviceStatus } from '@/types/device'
import { formatDateTime, formatRelativeTime } from '@/utils/date'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const statsLoading = ref(false)
const devices = ref<Device[]>([])
const stats = ref<DeviceStats>({
  total_devices: 0,
  active_devices: 0,
  inactive_devices: 0,
  disconnected_devices: 0,
  primary_devices: 0,
  secondary_devices: 0,
  today_connected: 0,
  today_disconnected: 0,
  total_operations: 0,
  successful_operations: 0,
  failed_operations: 0,
  avg_session_duration: 0
})

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

// 搜索表单
const searchForm = reactive<DeviceListParams>({
  search: '',
  status: undefined,
  account_id: undefined
})

// 计算属性
const pages = computed(() => Math.ceil(total.value / pageSize.value))

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

// 获取设备列表
const fetchDevices = async () => {
  try {
    loading.value = true
    const params: DeviceListParams = {
      page: currentPage.value,
      size: pageSize.value,
      ...searchForm
    }

    const response = await deviceApi.list(params)
    devices.value = response.items
    total.value = response.total
  } catch (error) {
    ElMessage.error('获取设备列表失败')
    console.error('Failed to fetch devices:', error)
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    statsLoading.value = true
    stats.value = await deviceApi.getStats()
  } catch (error) {
    console.error('Failed to fetch device stats:', error)
  } finally {
    statsLoading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchDevices()
}

// 刷新处理
const handleRefresh = () => {
  fetchDevices()
  fetchStats()
}

// 分页处理
const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize
  currentPage.value = 1
  fetchDevices()
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
  fetchDevices()
}

// 查看详情
const handleViewDetail = (device: Device) => {
  router.push({ name: 'DeviceDetail', params: { id: device.id } })
}

// 操作处理
const handleAction = async (command: string, device: Device) => {
  switch (command) {
    case 'disconnect':
      await handleDisconnect(device)
      break
    case 'delete':
      await handleDelete(device)
      break
  }
}

// 断开设备
const handleDisconnect = async (device: Device) => {
  try {
    await ElMessageBox.confirm(
      `确定要断开设备 "${device.device_name || device.device_id}" 的连接吗？`,
      '确认断开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deviceApi.disconnect(device.id)
    ElMessage.success('设备已断开连接')
    fetchDevices()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('断开设备连接失败')
      console.error('Failed to disconnect device:', error)
    }
  }
}

// 删除设备
const handleDelete = async (device: Device) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${device.device_name || device.device_id}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deviceApi.delete(device.id)
    ElMessage.success('设备已删除')
    fetchDevices()
    fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除设备失败')
      console.error('Failed to delete device:', error)
    }
  }
}

// 生命周期
onMounted(() => {
  fetchDevices()
  fetchStats()
})
</script>

<style scoped>
.device-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-value.active {
  color: #67c23a;
}

.stat-value.inactive {
  color: #e6a23c;
}

.stat-value.disconnected {
  color: #f56c6c;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.device-info .device-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.device-info .device-id {
  font-size: 12px;
  color: #909399;
}

.device-type {
  display: flex;
  align-items: center;
  gap: 4px;
}

.ip-address {
  font-family: monospace;
  font-size: 13px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>