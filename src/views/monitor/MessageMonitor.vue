<template>
  <div class="message-monitor">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">消息监控</h1>
      <p class="page-description">实时监控WhatsApp消息收发情况</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon :size="32" color="#409EFF">
                  <ChatDotRound />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ todayMessageCount }}</div>
                <div class="stat-label">今日消息</div>
                <div class="stat-trend trend-up">
                  <el-icon :size="14"><ArrowUp /></el-icon>
                  +12%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon :size="32" color="#F56C6C">
                  <Warning />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ todaySensitiveCount }}</div>
                <div class="stat-label">敏感消息</div>
                <div class="stat-trend trend-down">
                  <el-icon :size="14"><ArrowDown /></el-icon>
                  -5%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon :size="32" color="#67C23A">
                  <User />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ activeUsersCount }}</div>
                <div class="stat-label">活跃用户</div>
                <div class="stat-trend trend-up">
                  <el-icon :size="14"><ArrowUp /></el-icon>
                  +8%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon :size="32" color="#E6A23C">
                  <Bell />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ unreadCount }}</div>
                <div class="stat-label">未读告警</div>
                <div class="stat-trend trend-neutral">
                  <el-icon :size="14"><ArrowUp /></el-icon>
                  +3
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 监控内容 -->
    <el-row :gutter="20" class="main-section">
      <!-- 实时监控状态 -->
      <el-col :span="8">
        <el-card class="monitor-status">
          <template #header>
            <div class="card-header">
              <el-icon><Monitor /></el-icon>
              <span>实时监控状态</span>
            </div>
          </template>

          <div class="status-content">
            <div class="connection-indicator">
              <el-switch
                v-model="realTimeEnabled"
                active-text="实时监控"
                @change="handleRealTimeToggle"
              />
              <el-tag
                :type="realTimeEnabled ? 'success' : 'info'"
                effect="light"
              >
                {{ realTimeEnabled ? '监控中' : '已暂停' }}
              </el-tag>
            </div>

            <div class="monitor-stats">
              <div class="stat-row">
                <span>WebSocket连接</span>
                <el-tag type="success" size="small">正常</el-tag>
              </div>
              <div class="stat-row">
                <span>消息处理速度</span>
                <span class="stat-number">125 msg/s</span>
              </div>
              <div class="stat-row">
                <span>缓冲区大小</span>
                <span class="stat-number">{{ realTimeBufferSize }}</span>
              </div>
              <div class="stat-row">
                <span>上次更新</span>
                <span class="last-update">2秒前</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 最新敏感消息 -->
      <el-col :span="8">
        <el-card class="recent-messages">
          <template #header>
            <div class="card-header">
              <el-icon><Warning /></el-icon>
              <span>最新敏感消息</span>
            </div>
          </template>

          <div class="message-list">
            <div
              v-for="message in sampleSensitiveMessages"
              :key="message.id"
              class="message-item"
              @click="handleMessageClick(message)"
            >
              <div class="message-header">
                <el-tag
                  :type="message.level === 'high' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ message.level === 'high' ? '严重' : '警告' }}
                </el-tag>
                <span class="message-time">{{ message.time }}</span>
              </div>
              <div class="message-content">
                {{ message.content }}
              </div>
              <div class="message-keywords">
                <el-tag
                  v-for="keyword in message.keywords.slice(0, 2)"
                  :key="keyword"
                  size="small"
                  type="danger"
                  effect="plain"
                >
                  {{ keyword }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 快速操作 -->
      <el-col :span="8">
        <el-card class="quick-actions">
          <template #header>
            <div class="card-header">
              <el-icon><Operation /></el-icon>
              <span>快速操作</span>
            </div>
          </template>

          <div class="action-list">
            <el-button
              type="primary"
              :icon="Download"
              @click="handleQuickExport"
              block
            >
              导出监控数据
            </el-button>
            <el-button
              type="success"
              :icon="Check"
              @click="handleMarkAllRead"
              block
            >
              标记全部已读
            </el-button>
            <el-button
              type="warning"
              :icon="View"
              @click="handleViewSensitiveOnly"
              block
            >
              查看敏感消息
            </el-button>
            <el-button
              type="info"
              :icon="Setting"
              @click="handleSettings"
              block
            >
              监控设置
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 消息历史表格 -->
    <el-card class="message-table" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>消息历史记录</span>
          <div class="header-actions">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索消息..."
              style="width: 200px"
              @input="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="messageHistoryData" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="sender" label="发送者" width="120" />
        <el-table-column prop="content" label="消息内容" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getMessageTypeTag(row.type)" size="small">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sensitive" label="敏感级别" width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.sensitive !== 'normal'"
              :type="row.sensitive === 'high' ? 'danger' : 'warning'"
              size="small"
            >
              {{ row.sensitive === 'high' ? '严重' : '警告' }}
            </el-tag>
            <span v-else>正常</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  Warning,
  User,
  Bell,
  ArrowUp,
  ArrowDown,
  Monitor,
  Operation,
  Download,
  Check,
  View,
  Setting,
  Document,
  Search,
  Refresh
} from '@element-plus/icons-vue'

// 数据状态
const realTimeEnabled = ref(true)
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(100)

// 统计数据
const todayMessageCount = ref(8392)
const todaySensitiveCount = ref(23)
const activeUsersCount = ref(156)
const unreadCount = ref(8)
const realTimeBufferSize = ref(1024)

// 示例敏感消息数据
const sampleSensitiveMessages = ref([
  {
    id: 1,
    content: '这是一条包含敏感词的消息示例...',
    level: 'high',
    time: '2分钟前',
    keywords: ['敏感词1', '敏感词2', '敏感词3']
  },
  {
    id: 2,
    content: '另一条需要注意的消息内容...',
    level: 'medium',
    time: '5分钟前',
    keywords: ['关键词', '警告']
  },
  {
    id: 3,
    content: '第三条敏感消息的内容展示...',
    level: 'high',
    time: '8分钟前',
    keywords: ['危险', '违规', '举报']
  }
])

// 示例消息历史数据
const messageHistoryData = ref([
  {
    id: 1001,
    timestamp: '2024-09-25 14:30:25',
    sender: '用户A',
    content: '这是一条普通的消息内容',
    type: '文本',
    sensitive: 'normal'
  },
  {
    id: 1002,
    timestamp: '2024-09-25 14:28:15',
    sender: '用户B',
    content: '包含敏感信息的消息内容...',
    type: '文本',
    sensitive: 'high'
  },
  {
    id: 1003,
    timestamp: '2024-09-25 14:25:10',
    sender: '用户C',
    content: '发送了一张图片',
    type: '图片',
    sensitive: 'normal'
  }
])

// 事件处理函数
const handleRealTimeToggle = (enabled: boolean) => {
  realTimeEnabled.value = enabled
  if (enabled) {
    ElMessage.success('实时监控已启用')
  } else {
    ElMessage.info('实时监控已禁用')
  }
}

const handleMessageClick = (message: any) => {
  ElMessage.info(`查看消息详情: ${message.id}`)
}

const handleQuickExport = () => {
  ElMessage.success('开始导出监控数据...')
}

const handleMarkAllRead = async () => {
  try {
    await ElMessageBox.confirm('确定要标记所有消息为已读吗？', '确认操作', { type: 'warning' })
    unreadCount.value = 0
    ElMessage.success('已标记所有消息为已读')
  } catch {
    // 用户取消
  }
}

const handleViewSensitiveOnly = () => {
  ElMessage.info('切换到敏感消息视图')
}

const handleSettings = () => {
  ElMessage.info('打开监控设置')
}

const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success(`搜索关键词: ${searchKeyword.value}`)
  }, 1000)
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 800)
}

const handleViewDetail = (row: any) => {
  ElMessage.info(`查看消息 ${row.id} 的详细信息`)
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除消息 ${row.id} 吗？`, '确认删除', { type: 'warning' })
    ElMessage.success('消息已删除')
  } catch {
    // 用户取消
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 工具函数
const formatDateTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const getMessageTypeTag = (type: string) => {
  const typeMap: { [key: string]: string } = {
    '文本': '',
    '图片': 'success',
    '视频': 'warning',
    '文件': 'info'
  }
  return typeMap[type] || ''
}

onMounted(() => {
  // 模拟数据加载
  ElMessage.success('消息监控系统已启动')
})
</script>

<style scoped>
.message-monitor {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-description {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

/* 统计卡片样式 */
.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: rgba(64, 158, 255, 0.1);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.trend-up {
  color: #67C23A;
}

.trend-down {
  color: #F56C6C;
}

.trend-neutral {
  color: #E6A23C;
}

/* 主要内容区域 */
.main-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 监控状态卡片 */
.status-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.connection-indicator {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.monitor-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 14px;
}

.stat-number {
  font-weight: 600;
  color: #303133;
}

.last-update {
  color: #909399;
  font-size: 12px;
}

/* 消息列表 */
.message-list {
  max-height: 300px;
  overflow-y: auto;
}

.message-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.2s;
}

.message-item:hover {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 12px 8px;
}

.message-item:last-child {
  border-bottom: none;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.message-time {
  font-size: 12px;
  color: #909399;
}

.message-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
  margin-bottom: 6px;
}

.message-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 快速操作 */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 消息历史表格 */
.message-table {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

/* Element Plus 样式覆盖 */
:deep(.el-card__header) {
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
  padding: 16px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  border-radius: 0;
}

:deep(.el-table th.el-table__cell) {
  background-color: #fafafa;
  color: #606266;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .message-monitor {
    padding: 16px;
  }

  .main-section .el-col,
  .stats-section .el-col {
    margin-bottom: 20px;
  }

  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .message-monitor {
    padding: 12px;
  }

  .stat-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .connection-indicator {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
