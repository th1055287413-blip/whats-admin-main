<template>
  <div class="message-list">
    <!-- 操作栏 -->
    <div class="message-list-header">
      <div class="header-left">
        <el-button-group>
          <el-button
            type="primary"
            :icon="Refresh"
            @click="handleRefresh"
            :loading="loading"
          >
            刷新
          </el-button>
          <el-button
            :icon="Download"
            @click="handleExport"
            :disabled="!hasData"
          >
            导出
          </el-button>
        </el-button-group>

        <el-button
          v-if="selectedMessages.length > 0"
          type="success"
          :icon="Check"
          @click="handleBatchMarkRead"
        >
          标记已读 ({{ selectedMessages.length }})
        </el-button>
      </div>

      <div class="header-right">
        <el-switch
          v-model="realTimeEnabled"
          active-text="实时更新"
          @change="handleRealTimeToggle"
        />

        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <el-button :icon="Bell" circle />
        </el-badge>
      </div>
    </div>

    <!-- 统计信息 -->
    <div v-if="stats" class="message-stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic title="总消息数" :value="stats.totalMessages" />
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="敏感消息"
            :value="stats.sensitiveMessages"
            :value-style="{ color: '#F56C6C' }"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="已屏蔽"
            :value="stats.blockedMessages"
            :value-style="{ color: '#E6A23C' }"
          />
        </el-col>
        <el-col :span="6">
          <el-statistic
            title="已审核"
            :value="stats.reviewedMessages"
            :value-style="{ color: '#67C23A' }"
          />
        </el-col>
      </el-row>
    </div>

    <!-- 消息表格 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="messages"
      row-key="id"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      :height="tableHeight"
      style="width: 100%"
    >
      <el-table-column
        type="selection"
        width="55"
      />

      <el-table-column
        prop="messageId"
        label="消息ID"
        width="200"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <el-text size="small" type="info">{{ row.messageId }}</el-text>
        </template>
      </el-table-column>

      <el-table-column
        prop="content"
        label="消息内容"
        min-width="300"
        show-overflow-tooltip
      >
        <template #default="{ row }">
          <div class="message-content">
            <el-text
              :class="{
                'message-sensitive': row.sensitiveLevel !== 'normal',
                'message-blocked': row.status === 'blocked'
              }"
            >
              {{ row.content }}
            </el-text>
            <div v-if="row.sensitiveWords" class="sensitive-keywords">
              <el-tag
                v-for="(keyword, index) in row.sensitiveWords.keywords"
                :key="index"
                :type="getSensitiveTagType(keyword.level)"
                size="small"
                class="keyword-tag"
              >
                {{ keyword.word }}
              </el-tag>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column
        prop="messageType"
        label="类型"
        width="100"
      >
        <template #default="{ row }">
          <el-tag :type="getMessageTypeColor(row.messageType)" size="small">
            {{ getMessageTypeLabel(row.messageType) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="sensitiveLevel"
        label="敏感等级"
        width="120"
      >
        <template #default="{ row }">
          <el-tag
            :type="getSensitiveTagType(row.sensitiveLevel)"
            size="small"
          >
            {{ getSensitiveLevelLabel(row.sensitiveLevel) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="status"
        label="状态"
        width="100"
      >
        <template #default="{ row }">
          <el-tag
            :type="getStatusTagType(row.status)"
            size="small"
          >
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column
        prop="sentAt"
        label="发送时间"
        width="180"
        sortable
      >
        <template #default="{ row }">
          <el-text size="small">
            {{ formatDateTime(row.sentAt) }}
          </el-text>
        </template>
      </el-table-column>

      <el-table-column
        prop="isRead"
        label="读取状态"
        width="100"
        align="center"
      >
        <template #default="{ row }">
          <el-icon
            :color="row.isRead ? '#67C23A' : '#F56C6C'"
            size="16"
          >
            <Check v-if="row.isRead" />
            <Close v-else />
          </el-icon>
        </template>
      </el-table-column>

      <el-table-column
        label="操作"
        width="180"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button-group size="small">
            <el-button
              v-if="!row.isRead"
              type="primary"
              :icon="Check"
              @click.stop="handleMarkRead(row)"
            >
              已读
            </el-button>

            <el-button
              :icon="View"
              @click.stop="handleViewDetail(row)"
            >
              详情
            </el-button>

            <el-dropdown
              v-if="row.sensitiveLevel !== 'normal'"
              @command="(command) => handleStatusAction(row, command)"
            >
              <el-button :icon="More" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="approve">批准</el-dropdown-item>
                  <el-dropdown-item command="block">屏蔽</el-dropdown-item>
                  <el-dropdown-item command="review">标记审核</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="message-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="消息详情"
      width="60%"
      destroy-on-close
    >
      <MessageDetail
        v-if="detailVisible && selectedMessage"
        :message="selectedMessage"
        @update="handleMessageUpdate"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Download,
  Check,
  Close,
  Bell,
  View,
  More
} from '@element-plus/icons-vue'
import { useMessageMonitor } from '@/composables/useMessageMonitor'
import { useRealTimeData } from '@/composables/useRealTimeData'
import type { MessageMonitor, MessageType, SensitiveLevel, MessageStatus } from '@/types/monitor'
import MessageDetail from './MessageDetail.vue'

// Props
interface Props {
  height?: string | number
  showStats?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: '600px',
  showStats: true,
  autoRefresh: false,
  refreshInterval: 30000
})

// Emits
const emit = defineEmits<{
  messageClick: [message: MessageMonitor]
  selectionChange: [messages: MessageMonitor[]]
  refresh: []
}>()

// 数据管理
const {
  messages,
  loading,
  stats,
  fetchMessages,
  markAsRead,
  markMultipleAsRead,
  updateMessageStatus,
  pagination,
  refresh
} = useMessageMonitor()

const {
  isActive: realTimeActive,
  enable: enableRealTime,
  disable: disableRealTime
} = useRealTimeData()

// 组件状态
const tableRef = ref()
const selectedMessages = ref<MessageMonitor[]>([])
const detailVisible = ref(false)
const selectedMessage = ref<MessageMonitor | null>(null)
const realTimeEnabled = ref(true)

// 分页状态
const currentPage = ref(1)
const pageSize = ref(20)

// 自动刷新
let refreshTimer: number | null = null

// 计算属性
const hasData = computed(() => messages.value.length > 0)
const total = computed(() => pagination.value.total)
const unreadCount = computed(() =>
  messages.value.filter(m => !m.isRead).length
)
const tableHeight = computed(() => {
  if (typeof props.height === 'number') {
    return `${props.height}px`
  }
  return props.height
})

// 事件处理
const handleRefresh = async () => {
  await refresh()
  emit('refresh')
}

const handleExport = async () => {
  try {
    ElMessage.info('导出功能开发中...')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const handleSelectionChange = (selection: MessageMonitor[]) => {
  selectedMessages.value = selection
  emit('selectionChange', selection)
}

const handleRowClick = (row: MessageMonitor) => {
  emit('messageClick', row)
}

const handleMarkRead = async (message: MessageMonitor) => {
  const success = await markAsRead(message.id)
  if (success) {
    message.isRead = true
  }
}

const handleBatchMarkRead = async () => {
  const ids = selectedMessages.value.map(m => m.id)
  const success = await markMultipleAsRead(ids)
  if (success) {
    selectedMessages.value.forEach(m => m.isRead = true)
    selectedMessages.value = []
    tableRef.value?.clearSelection()
  }
}

const handleViewDetail = (message: MessageMonitor) => {
  selectedMessage.value = message
  detailVisible.value = true
}

const handleStatusAction = async (
  message: MessageMonitor,
  action: 'approve' | 'block' | 'review'
) => {
  let newStatus: MessageStatus
  let actionText: string

  switch (action) {
    case 'approve':
      newStatus = MessageStatus.NORMAL
      actionText = '批准'
      break
    case 'block':
      newStatus = MessageStatus.BLOCKED
      actionText = '屏蔽'
      break
    case 'review':
      newStatus = MessageStatus.REVIEWED
      actionText = '标记审核'
      break
  }

  try {
    await ElMessageBox.confirm(
      `确定要${actionText}这条消息吗？`,
      '确认操作',
      { type: 'warning' }
    )

    const success = await updateMessageStatus(message.id, newStatus)
    if (success) {
      message.status = newStatus
    }
  } catch {
    // 用户取消
  }
}

const handleMessageUpdate = () => {
  // 消息更新后刷新列表
  fetchMessages()
}

const handleRealTimeToggle = (enabled: boolean) => {
  if (enabled) {
    enableRealTime()
  } else {
    disableRealTime()
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  fetchMessages({ pageSize: size, page: 1 })
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchMessages({ page })
}

// 工具函数
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getMessageTypeLabel = (type: MessageType) => {
  const labels = {
    text: '文本',
    image: '图片',
    file: '文件',
    voice: '语音',
    video: '视频'
  }
  return labels[type] || type
}

const getMessageTypeColor = (type: MessageType) => {
  const colors = {
    text: '',
    image: 'success',
    file: 'warning',
    voice: 'info',
    video: 'danger'
  }
  return colors[type] || ''
}

const getSensitiveLevelLabel = (level: SensitiveLevel) => {
  const labels = {
    normal: '正常',
    warning: '警告',
    critical: '严重'
  }
  return labels[level] || level
}

const getSensitiveTagType = (level: SensitiveLevel) => {
  const types = {
    normal: '',
    warning: 'warning',
    critical: 'danger'
  }
  return types[level] || ''
}

const getStatusLabel = (status: MessageStatus) => {
  const labels = {
    normal: '正常',
    blocked: '已屏蔽',
    reviewed: '已审核'
  }
  return labels[status] || status
}

const getStatusTagType = (status: MessageStatus) => {
  const types = {
    normal: 'success',
    blocked: 'danger',
    reviewed: 'info'
  }
  return types[status] || ''
}

// 自动刷新逻辑
const startAutoRefresh = () => {
  if (props.autoRefresh && props.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => {
      if (!loading.value) {
        fetchMessages()
      }
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 生命周期
onMounted(async () => {
  await fetchMessages()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.message-list {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.message-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.message-stats {
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-sensitive {
  color: #F56C6C;
  font-weight: 500;
}

.message-blocked {
  color: #909399;
  text-decoration: line-through;
}

.sensitive-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.keyword-tag {
  font-size: 11px;
}

.message-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>