<template>
  <div class="conversation-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>客户咨询对话记录</h1>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">总对话数</div>
          <div class="stat-value">{{ stats.total_conversations }}</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">咨询用户数</div>
          <div class="stat-value">{{ stats.total_users }}</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">今日对话数</div>
          <div class="stat-value today">{{ stats.today_conversations }}</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">今日用户数</div>
          <div class="stat-value today">{{ stats.today_users }}</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选卡片 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" @submit.prevent="handleFilter">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            @change="handleDateChange"
          />
        </el-form-item>

        <el-form-item label="用户标识">
          <el-input
            v-model="filterForm.user_identifier"
            placeholder="搜索用户标识"
            clearable
            style="width: 200px"
            @clear="handleFilter"
          />
        </el-form-item>

        <el-form-item label="会话ID">
          <el-input
            v-model="filterForm.session_id"
            placeholder="搜索会话ID"
            clearable
            style="width: 200px"
            @clear="handleFilter"
          />
        </el-form-item>

        <el-form-item label="匹配状态">
          <el-select
            v-model="filterForm.is_matched"
            placeholder="选择匹配状态"
            clearable
            style="width: 120px"
            @change="handleFilter"
          >
            <el-option label="已匹配" :value="true" />
            <el-option label="未匹配" :value="false" />
          </el-select>
        </el-form-item>

        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.search"
            placeholder="搜索对话内容"
            clearable
            style="width: 200px"
            @clear="handleFilter"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleFilter"> 搜索 </el-button>
          <el-button :icon="Refresh" @click="handleResetFilter"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 关键词匹配统计 -->
    <el-card class="keyword-stats-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>关键词匹配统计</span>
          <el-button text @click="fetchKeywordStats">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </template>
      <el-table :data="keywordStats" v-loading="keywordStatsLoading" stripe>
        <el-table-column prop="keyword_name" label="关键词" min-width="200" />
        <el-table-column prop="match_count" label="匹配次数" width="120" sortable />
        <el-table-column label="匹配占比" width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="(row.percentage * 100)"
              :format="() => `${(row.percentage * 100).toFixed(1)}%`"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="conversations" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column label="用户标识" width="150">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewSession(row.session_id)">
              {{ row.user_identifier }}
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="用户消息" min-width="200">
          <template #default="{ row }">
            <div class="message-preview">{{ row.user_message }}</div>
          </template>
        </el-table-column>

        <el-table-column label="机器人回复" min-width="250">
          <template #default="{ row }">
            <div class="message-preview">{{ row.bot_reply }}</div>
          </template>
        </el-table-column>

        <el-table-column label="匹配关键词" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.matched_keyword" type="success" size="small">
              {{ row.matched_keyword.keywords.join(', ') }}
            </el-tag>
            <el-tag v-else type="info" size="small">未匹配</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="IP地址" width="140">
          <template #default="{ row }">
            {{ row.ip_address || '-' }}
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 会话详情对话框 -->
    <el-dialog
      v-model="showSessionDialog"
      title="会话详情"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-loading="sessionLoading" class="session-detail">
        <div
          v-for="conv in sessionConversations"
          :key="conv.id"
          class="conversation-item"
        >
          <div class="conversation-time">{{ formatDateTime(conv.created_at) }}</div>
          <div class="user-message">
            <div class="message-label">用户:</div>
            <div class="message-content">{{ conv.user_message }}</div>
          </div>
          <div class="bot-message">
            <div class="message-label">机器人:</div>
            <div class="message-content">{{ conv.bot_reply }}</div>
          </div>
          <div v-if="conv.matched_keyword" class="matched-keyword">
            <el-tag type="success" size="small">
              匹配关键词: {{ conv.matched_keyword.keywords.join(', ') }}
            </el-tag>
          </div>
        </div>
        <el-empty v-if="sessionConversations.length === 0" description="暂无对话记录" />
      </div>
      <template #footer>
        <el-button @click="showSessionDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getConversationList,
  getSessionConversations,
  getConversationStats,
  getKeywordMatchStats
} from '@/api/customer-conversation'
import type {
  CustomerConversation,
  CustomerConversationListParams,
  CustomerConversationStats,
  KeywordMatchStats
} from '@/types/customer-conversation'

// 数据状态
const loading = ref(false)
const keywordStatsLoading = ref(false)
const sessionLoading = ref(false)
const conversations = ref<CustomerConversation[]>([])
const sessionConversations = ref<CustomerConversation[]>([])
const keywordStats = ref<KeywordMatchStats[]>([])
const showSessionDialog = ref(false)
const dateRange = ref<[string, string] | null>(null)

// 统计数据
const stats = ref<CustomerConversationStats>({
  total_conversations: 0,
  total_users: 0,
  matched_rate: 0,
  today_conversations: 0,
  today_users: 0
})

// 筛选表单
const filterForm = reactive<CustomerConversationListParams>({
  user_identifier: '',
  session_id: '',
  is_matched: undefined,
  search: '',
  start_date: undefined,
  end_date: undefined
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 获取对话列表
const fetchConversations = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      page: pagination.page,
      limit: pagination.limit
    }
    const response = await getConversationList(params)
    conversations.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取对话列表失败')
  } finally {
    loading.value = false
  }
}

// 获取统计数据
const fetchStats = async () => {
  try {
    const params: { start_date?: string; end_date?: string } = {}
    if (filterForm.start_date) params.start_date = filterForm.start_date
    if (filterForm.end_date) params.end_date = filterForm.end_date
    const response = await getConversationStats(params)
    stats.value = response.data
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

// 获取关键词匹配统计
const fetchKeywordStats = async () => {
  keywordStatsLoading.value = true
  try {
    const params: { start_date?: string; end_date?: string; limit?: number } = { limit: 10 }
    if (filterForm.start_date) params.start_date = filterForm.start_date
    if (filterForm.end_date) params.end_date = filterForm.end_date
    const response = await getKeywordMatchStats(params)
    keywordStats.value = response.data
  } catch (error) {
    ElMessage.error('获取关键词统计失败')
  } finally {
    keywordStatsLoading.value = false
  }
}

// 查看会话详情
const handleViewSession = async (sessionId: string) => {
  sessionLoading.value = true
  showSessionDialog.value = true
  try {
    const response = await getSessionConversations(sessionId)
    sessionConversations.value = response.data
  } catch (error) {
    ElMessage.error('获取会话详情失败')
  } finally {
    sessionLoading.value = false
  }
}

// 日期范围变化
const handleDateChange = () => {
  if (dateRange.value && dateRange.value.length === 2) {
    filterForm.start_date = dateRange.value[0]
    filterForm.end_date = dateRange.value[1]
  } else {
    filterForm.start_date = undefined
    filterForm.end_date = undefined
  }
  handleFilter()
}

// 筛选
const handleFilter = () => {
  pagination.page = 1
  fetchConversations()
  fetchStats()
  fetchKeywordStats()
}

// 重置筛选
const handleResetFilter = () => {
  dateRange.value = null
  Object.assign(filterForm, {
    user_identifier: '',
    session_id: '',
    is_matched: undefined,
    search: '',
    start_date: undefined,
    end_date: undefined
  })
  handleFilter()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchConversations()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchConversations()
}

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化
onMounted(() => {
  fetchConversations()
  fetchStats()
  fetchKeywordStats()
})
</script>

<style scoped lang="scss">
.conversation-management {
  padding: 20px;

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
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;

          &.match-rate {
            color: #409eff;
          }

          &.today {
            color: #67c23a;
          }
        }
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .keyword-stats-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .table-card {
    .message-preview {
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      line-height: 1.5;
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .session-detail {
    max-height: 500px;
    overflow-y: auto;

    .conversation-item {
      padding: 16px;
      border-bottom: 1px solid #ebeef5;

      &:last-child {
        border-bottom: none;
      }

      .conversation-time {
        font-size: 12px;
        color: #909399;
        margin-bottom: 8px;
      }

      .user-message,
      .bot-message {
        display: flex;
        margin-bottom: 8px;

        .message-label {
          font-weight: 600;
          margin-right: 8px;
          min-width: 60px;
        }

        .message-content {
          flex: 1;
          line-height: 1.6;
        }
      }

      .user-message {
        .message-label {
          color: #409eff;
        }
      }

      .bot-message {
        .message-label {
          color: #67c23a;
        }
      }

      .matched-keyword {
        margin-top: 8px;
      }
    }
  }
}
</style>
