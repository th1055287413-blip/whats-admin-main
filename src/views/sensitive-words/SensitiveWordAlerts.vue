<template>
  <div class="alerts-container">
    <!-- Header -->
    <div class="page-header">
      <h1>敏感词告警日志</h1>
      <div class="header-actions">
        <el-button type="danger" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索敏感词或消息内容"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 280px"
        />

        <el-select v-model="searchForm.status" placeholder="通知状态" style="width: 150px" clearable>
          <el-option label="全部状态" value="" />
          <el-option label="待发送" value="pending" />
          <el-option label="已发送" value="sent" />
          <el-option label="发送失败" value="failed" />
        </el-select>

        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- Stats -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总告警数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.today }}</div>
          <div class="stat-label">今日告警</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.sent }}</div>
          <div class="stat-label">已发送通知</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.failed }}</div>
          <div class="stat-label">发送失败</div>
        </div>
      </el-card>
    </div>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="alerts"
        @selection-change="handleSelectionChange"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column prop="senderName" label="发送者" width="150">
          <template #default="{ row }">
            <div class="sender-info">
              <el-avatar :size="32" :src="row.senderAvatar">
                {{ row.senderName?.substring(0, 1) }}
              </el-avatar>
              <span>{{ row.senderName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="senderJID" label="发送者 JID" width="200" show-overflow-tooltip />

        <el-table-column prop="matchedWord" label="命中敏感词" width="150">
          <template #default="{ row }">
            <el-tag type="danger" effect="dark">{{ row.matchedWord }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.category" type="info">{{ row.category }}</el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="messageContent" label="消息内容" min-width="300">
          <template #default="{ row }">
            <div class="message-content">
              {{ row.messageContent }}
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="notificationStatus" label="通知状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.notificationStatus)">
              {{ getStatusLabel(row.notificationStatus) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="触发时间" width="180">
          <template #default="{ row }">
            <span>{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.notificationStatus === 'failed'"
              size="small"
              type="warning"
              @click="handleResend(row.id)"
            >
              重发
            </el-button>
            <el-button size="small" @click="handleViewDetail(row)">详情</el-button>
            <el-popconfirm
              title="确定删除此告警记录吗?"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Detail Dialog -->
    <el-dialog v-model="showDetailDialog" title="告警详情" width="700px">
      <el-descriptions :column="1" border v-if="currentAlert">
        <el-descriptions-item label="ID">{{ currentAlert.id }}</el-descriptions-item>
        <el-descriptions-item label="发送者">{{ currentAlert.senderName }}</el-descriptions-item>
        <el-descriptions-item label="发送者 JID">{{ currentAlert.senderJID }}</el-descriptions-item>
        <el-descriptions-item label="命中敏感词">
          <el-tag type="danger" effect="dark">{{ currentAlert.matchedWord }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="分类">
          <el-tag v-if="currentAlert.category" type="info">{{ currentAlert.category }}</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="消息 ID">{{ currentAlert.messageID }}</el-descriptions-item>
        <el-descriptions-item label="会话 ID">{{ currentAlert.chatID }}</el-descriptions-item>
        <el-descriptions-item label="完整消息">
          <div class="full-message">{{ currentAlert.messageContent }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="通知状态">
          <el-tag :type="getStatusTagType(currentAlert.notificationStatus)">
            {{ getStatusLabel(currentAlert.notificationStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="通知错误" v-if="currentAlert.notificationError">
          <el-text type="danger">{{ currentAlert.notificationError }}</el-text>
        </el-descriptions-item>
        <el-descriptions-item label="通知时间" v-if="currentAlert.notifiedAt">
          {{ formatTime(currentAlert.notifiedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="触发时间">
          {{ formatTime(currentAlert.createdAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Search } from '@element-plus/icons-vue'
import { sensitiveWordAlertApi } from '@/api/sensitive-word'

// 接口定义
interface SensitiveWordAlert {
  id: number
  accountID: number
  messageID: string
  chatID: string
  senderJID: string
  senderName: string
  senderAvatar?: string
  matchedWord: string
  category: string
  messageContent: string
  notificationStatus: string
  notificationError?: string
  notifiedAt?: string
  createdAt: string
}

// 响应式数据
const loading = ref(false)
const alerts = ref<SensitiveWordAlert[]>([])
const totalCount = ref(0)
const selectedRows = ref<SensitiveWordAlert[]>([])
const showDetailDialog = ref(false)
const currentAlert = ref<SensitiveWordAlert | null>(null)
const dateRange = ref<string[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  startDate: '',
  endDate: ''
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 统计数据
const stats = reactive({
  total: 0,
  today: 0,
  sent: 0,
  failed: 0
})

// 获取告警列表
const fetchAlerts = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      startDate: searchForm.startDate || undefined,
      endDate: searchForm.endDate || undefined
    }
    const res = await sensitiveWordAlertApi.list(params)
    if (res.code === 0) {
      alerts.value = res.data.list || []
      totalCount.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取告警列表失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取告警列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const res = await sensitiveWordAlertApi.getStats()
    if (res.code === 0) {
      Object.assign(stats, res.data)
    }
  } catch (error: any) {
    console.error('获取统计数据失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    searchForm.startDate = dateRange.value[0]
    searchForm.endDate = dateRange.value[1]
  } else {
    searchForm.startDate = ''
    searchForm.endDate = ''
  }
  pagination.page = 1
  fetchAlerts()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.startDate = ''
  searchForm.endDate = ''
  dateRange.value = []
  pagination.page = 1
  fetchAlerts()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchAlerts()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchAlerts()
}

// 选择变化
const handleSelectionChange = (selection: SensitiveWordAlert[]) => {
  selectedRows.value = selection
}

// 查看详情
const handleViewDetail = (row: SensitiveWordAlert) => {
  currentAlert.value = row
  showDetailDialog.value = true
}

// 删除
const handleDelete = async (id: number) => {
  try {
    const res = await sensitiveWordAlertApi.delete(id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchAlerts()
      fetchStats()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 条记录吗?`,
      '批量删除',
      {
        type: 'warning'
      }
    )

    const ids = selectedRows.value.map(row => row.id)
    for (const id of ids) {
      await sensitiveWordAlertApi.delete(id)
    }

    ElMessage.success('批量删除成功')
    fetchAlerts()
    fetchStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 重发通知
const handleResend = async (id: number) => {
  try {
    const res = await sensitiveWordAlertApi.resend(id)
    if (res.code === 0) {
      ElMessage.success('重发成功')
      fetchAlerts()
    } else {
      ElMessage.error(res.message || '重发失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '重发失败')
  }
}

// 工具函数
const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待发送',
    sent: '已发送',
    failed: '发送失败'
  }
  return map[status] || status
}

const getStatusTagType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    sent: 'success',
    failed: 'danger'
  }
  return map[status] || ''
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  fetchAlerts()
  fetchStats()
})
</script>

<style scoped lang="scss">
.alerts-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.filter-card {
  margin-bottom: 20px;

  .filter-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;

  .stat-card {
    .stat-content {
      text-align: center;
      padding: 10px;

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #f56c6c;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.table-card {
  .sender-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .message-content {
    max-height: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    line-height: 1.5;
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

.full-message {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
