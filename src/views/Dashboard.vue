<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <el-card class="welcome-card">
        <div class="welcome-content">
          <div class="welcome-info">
            <h1 class="welcome-title">欢迎回来，{{ userStore.user?.username }}</h1>
            <p class="welcome-subtitle">WhatsApp 管理系统 - 统一管理和监控您的WhatsApp业务</p>
            <div class="welcome-stats">
              <span class="last-login">上次登录：{{ formatLastLogin }}</span>
            </div>
          </div>
          <div class="welcome-avatar">
            <el-avatar
              :size="80"
              :src="userStore.user?.avatar"
              :icon="UserFilled"
              class="user-avatar"
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6" v-for="stat in stats" :key="stat.key">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon :size="32" :color="stat.color">
                  <component :is="stat.icon" />
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-trend" :class="stat.trendClass">
                  <el-icon :size="14">
                    <component :is="stat.trendIcon" />
                  </el-icon>
                  {{ stat.trend }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要功能区域 -->
    <el-row :gutter="20" class="main-section">
      <!-- 快捷操作 -->
      <el-col :span="8">
        <el-card class="quick-actions">
          <template #header>
            <div class="card-header">
              <el-icon><Operation /></el-icon>
              <span>快捷操作</span>
            </div>
          </template>
          <div class="action-list">
            <el-button
              v-for="action in quickActions"
              :key="action.key"
              :type="action.type"
              :icon="action.icon"
              class="action-btn"
              @click="handleQuickAction(action.action)"
            >
              {{ action.label }}
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 系统状态 -->
      <el-col :span="8">
        <el-card class="system-status">
          <template #header>
            <div class="card-header">
              <el-icon><Monitor /></el-icon>
              <span>系统状态</span>
            </div>
          </template>
          <div class="status-list">
            <div
              v-for="status in systemStatus"
              :key="status.key"
              class="status-item"
            >
              <div class="status-info">
                <span class="status-name">{{ status.name }}</span>
                <el-tag
                  :type="status.type"
                  :effect="status.effect"
                  size="small"
                >
                  {{ status.status }}
                </el-tag>
              </div>
              <div class="status-detail">{{ status.detail }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 近期活动 -->
      <el-col :span="8">
        <el-card class="recent-activity">
          <template #header>
            <div class="card-header">
              <el-icon><Clock /></el-icon>
              <span>近期活动</span>
            </div>
          </template>
          <div class="activity-list">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon">
                <el-icon :color="activity.color">
                  <component :is="activity.icon" />
                </el-icon>
              </div>
              <div class="activity-content">
                <div class="activity-title">{{ activity.title }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>用户活跃度趋势</span>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-empty description="图表功能开发中" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <el-icon><PieChart /></el-icon>
              <span>消息类型分布</span>
            </div>
          </template>
          <div class="chart-placeholder">
            <el-empty description="图表功能开发中" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminUserApi } from '@/api/admin'
import { ElMessage } from 'element-plus'
import {
  UserFilled,
  User,
  ChatDotRound,
  Warning,
  Document,
  Operation,
  Monitor,
  Clock,
  TrendCharts,
  PieChart,
  ArrowUp,
  ArrowDown,
  Setting,
  View,
  Plus,
  Search
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useAuthStore()

// 统计数据
const stats = ref([
  {
    key: 'conversations',
    label: '今日对话人数',
    value: '0',
    color: '#409EFF',
    icon: User,
    trend: '-',
    trendIcon: ArrowUp,
    trendClass: 'trend-up'
  },
  {
    key: 'messages',
    label: '今日发送消息',
    value: '0',
    color: '#67C23A',
    icon: ChatDotRound,
    trend: '-',
    trendIcon: ArrowUp,
    trendClass: 'trend-up'
  },
  {
    key: 'alerts',
    label: '活跃告警',
    value: '23',
    color: '#F56C6C',
    icon: Warning,
    trend: '-8%',
    trendIcon: ArrowDown,
    trendClass: 'trend-down'
  },
  {
    key: 'reports',
    label: '待处理审批',
    value: '15',
    color: '#E6A23C',
    icon: Document,
    trend: '+3',
    trendIcon: ArrowUp,
    trendClass: 'trend-neutral'
  }
])

// 快捷操作
const quickActions = ref([
  { key: 'users', label: '用户管理', type: 'primary', icon: User, action: 'users' },
  { key: 'monitor', label: '消息监控', type: 'success', icon: Monitor, action: 'monitor' },
  { key: 'settings', label: '系统设置', type: 'warning', icon: Setting, action: 'settings' },
  { key: 'search', label: '高级搜索', type: 'info', icon: Search, action: 'search' }
])

// 系统状态
const systemStatus = ref([
  {
    key: 'whatsapp',
    name: 'WhatsApp API',
    status: '正常',
    type: 'success',
    effect: 'light',
    detail: '响应时间: 120ms'
  },
  {
    key: 'database',
    name: '数据库连接',
    status: '正常',
    type: 'success',
    effect: 'light',
    detail: '连接池: 8/20'
  },
  {
    key: 'redis',
    name: 'Redis缓存',
    status: '正常',
    type: 'success',
    effect: 'light',
    detail: '内存使用: 45%'
  },
  {
    key: 'storage',
    name: '存储空间',
    status: '良好',
    type: 'warning',
    effect: 'light',
    detail: '使用量: 78%'
  }
])

// 近期活动
const recentActivities = ref([
  {
    id: 1,
    title: '新增用户 John Doe',
    time: '5分钟前',
    icon: User,
    color: '#409EFF'
  },
  {
    id: 2,
    title: '检测到敏感消息',
    time: '10分钟前',
    icon: Warning,
    color: '#F56C6C'
  },
  {
    id: 3,
    title: '系统备份完成',
    time: '1小时前',
    icon: Document,
    color: '#67C23A'
  },
  {
    id: 4,
    title: '管理员登录',
    time: '2小时前',
    icon: UserFilled,
    color: '#909399'
  }
])

// 格式化最后登录时间
const formatLastLogin = computed(() => {
  const lastLogin = userStore.user?.last_login_at
  if (!lastLogin) return '首次登录'

  const date = new Date(lastLogin)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
})

// 快捷操作处理
function handleQuickAction(action: string) {
  switch (action) {
    case 'users':
      router.push({ name: 'Users' })
      break
    case 'monitor':
      router.push({ name: 'MessageMonitor' })
      break
    case 'settings':
      router.push({ name: 'Settings' })
      break
    case 'search':
      // TODO: 实现高级搜索功能
      break
  }
}

onMounted(() => {
  // 组件挂载时可以加载实际数据
  loadDashboardData()
})

// 加载仪表盘数据
async function loadDashboardData() {
  try {
    // 获取当前管理员今日统计
    const todayStats = await adminUserApi.getMyTodayStats()

    // 更新统计卡片数据
    const conversationsStat = stats.value.find(s => s.key === 'conversations')
    if (conversationsStat) {
      conversationsStat.value = todayStats.today_conversations.toString()
    }

    const messagesStat = stats.value.find(s => s.key === 'messages')
    if (messagesStat) {
      messagesStat.value = todayStats.today_messages.toString()
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载统计数据失败')
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}

/* 欢迎横幅 */
.welcome-banner {
  margin-bottom: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.welcome-card :deep(.el-card__body) {
  padding: 30px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: white;
}

.welcome-subtitle {
  font-size: 16px;
  margin: 0 0 16px 0;
  opacity: 0.9;
}

.welcome-stats {
  display: flex;
  gap: 24px;
}

.last-login {
  font-size: 14px;
  opacity: 0.8;
}

.user-avatar {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

/* 统计卡片 */
.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s;
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
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 4px 0;
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

/* 主要功能区域 */
.main-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

/* 快捷操作 */
.action-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-weight: 500;
}

/* 系统状态 */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.status-name {
  font-weight: 500;
  color: #303133;
}

.status-detail {
  font-size: 12px;
  color: #909399;
}

/* 近期活动 */
.activity-list {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f7fa;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 2px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

/* 图表区域 */
.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  min-height: 400px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-section .el-col {
    margin-bottom: 20px;
  }

  .charts-section .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 12px;
  }

  .welcome-content {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .stats-section .el-col {
    margin-bottom: 16px;
  }

  .action-list {
    grid-template-columns: 1fr;
  }
}
</style>