<template>
  <div class="user-list">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="header-content">
        <div class="header-left">
          <h1>
            <el-icon><User /></el-icon> WhatsApp用户管理
          </h1>
          <p>管理通过扫码登录的WhatsApp用户，监控消息和联系人信息</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleCreateUser" :icon="Plus">
            添加WhatsApp用户
          </el-button>
          <el-button @click="handleRefresh" :icon="Refresh" :loading="loading"> 刷新 </el-button>
        </div>
      </div>
    </el-card>

    <!-- 同步詳情對話框 -->
    <el-dialog v-model="syncDetailVisible" title="同步狀態詳情" width="500px">
      <div v-if="selectedAccountForSync" class="sync-detail-content">
        <div class="sync-account-header">
          <el-avatar :size="48" :src="selectedAccountForSync.avatar">
            <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <div>
            <h3>{{ selectedAccountForSync.push_name || selectedAccountForSync.phone_number }}</h3>
            <p>{{ selectedAccountForSync.phone_number }}</p>
          </div>
        </div>
        <el-divider />
        <div v-if="syncDetail && syncDetail.steps" class="sync-steps">
          <div
            v-for="step in syncDetail.steps"
            :key="step.type"
            class="sync-step"
            :class="getSyncStepClass(step)"
          >
            <div class="step-header">
              <el-icon :class="getSyncStepIconClass(step)">
                <component :is="getSyncStepIcon(step)" />
              </el-icon>
              <span class="step-name">{{ step.name }}</span>
              <el-tag
                :type="getSyncStatusType(step.status || 'pending')"
                size="small"
              >
                {{ getSyncStatusText(step.status || 'pending') }}
              </el-tag>
            </div>
            <div class="step-detail">
              <div v-if="step.started_at" class="step-time">
                開始: {{ formatDateTime(step.started_at) }}
              </div>
              <div v-if="step.completed_at" class="step-time">
                完成: {{ formatDateTime(step.completed_at) }}
              </div>
              <div v-if="step.count" class="step-count">
                數量: {{ step.count }}
              </div>
              <div v-if="step.progress" class="step-progress-text">
                進度: {{ step.progress }}
              </div>
              <div v-if="step.error" class="step-error">
                <el-alert :title="step.error" type="error" :closable="false" />
              </div>
            </div>
          </div>
        </div>
        <div v-else class="sync-loading">
          <el-skeleton :rows="4" animated />
        </div>
      </div>
    </el-dialog>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="手机号">
          <el-input
            v-model="filters.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="搜尋">
          <el-input
            v-model="filters.search"
            placeholder="搜尋名稱/手機號"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="已连接" value="connected" />
            <el-option label="已登出" value="logged_out" />
          </el-select>
        </el-form-item>
        <el-form-item label="在线状态">
          <el-select
            v-model="filters.is_online"
            placeholder="请选择在线状态"
            clearable
            style="width: 150px"
          >
            <el-option label="在线" :value="true" />
            <el-option label="离线" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="filters.tag_id"
            placeholder="请选择标签"
            clearable
            style="width: 250px"
            :loading="tagFilterLoading"
          >
            <el-option v-for="tag in filterTags" :key="tag.id" :label="tag.name" :value="tag.id">
              <div style="display: flex; align-items: center; gap: 8px">
                <div
                  style="width: 12px; height: 12px; border-radius: 50%"
                  :style="{ backgroundColor: tag.color }"
                />
                <span>{{ tag.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select
            v-model="filters.channel_id"
            placeholder="请选择渠道"
            clearable
            style="width: 200px"
            :loading="channelFilterLoading"
          >
            <el-option
              v-for="ch in filterChannels"
              :key="ch.id"
              :label="ch.channel_name"
              :value="ch.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="createdDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search"> 搜索 </el-button>
          <el-button @click="handleResetFilter" :icon="RefreshLeft"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作栏 -->
    <el-card v-if="selectedAccounts.length > 0" class="batch-actions-card" shadow="hover">
      <div class="batch-actions">
        <span>已选择 {{ selectedAccounts.length }} 个帳號</span>
        <div class="batch-buttons">
          <el-button type="success" size="small" @click="handleBatchUpdateStatus('active')">
            批量激活
          </el-button>
          <el-button type="warning" size="small" @click="handleBatchUpdateStatus('blocked')">
            批量拉黑
          </el-button>
          <el-button type="danger" size="small" @click="handleBatchDelete"> 批量删除 </el-button>
        </div>
      </div>
    </el-card>

    <!-- 用户统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-item">
            <el-icon class="stats-icon total"><UserFilled /></el-icon>
            <div class="stats-content">
              <div class="stats-value">{{ accountStats?.total || 0 }}</div>
              <div class="stats-label">总帳號数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-item">
            <el-icon class="stats-icon active"><Check /></el-icon>
            <div class="stats-content">
              <div class="stats-value">{{ accountStats?.connected || 0 }}</div>
              <div class="stats-label">已連接帳號</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-item">
            <el-icon class="stats-icon online"><Connection /></el-icon>
            <div class="stats-content">
              <div class="stats-value">{{ accountStats?.online || 0 }}</div>
              <div class="stats-label">在線帳號</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stats-card">
          <div class="stats-item">
            <el-icon class="stats-icon blocked"><CloseBold /></el-icon>
            <div class="stats-content">
              <div class="stats-value">{{ accountStats?.logged_out || 0 }}</div>
              <div class="stats-label">已登出帳號</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 用户列表 -->
    <el-card class="table-card" shadow="hover">
      <el-table
        :data="accounts"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        row-key="id"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" sortable="custom" />

        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar" :size="40">
              <el-icon><UserFilled /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column prop="phone_number" label="手机号" width="140" />

        <el-table-column prop="push_name" label="顯示名稱" min-width="120">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">{{ row.push_name || row.full_name || '未設置' }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="帳號類型" width="110">
          <template #default="{ row }">
            <template v-if="row.platform">
              <el-tag
                :type="isBusinessAccount(row.platform) ? 'warning' : 'info'"
                size="small"
              >
                {{ isBusinessAccount(row.platform) ? '商業號' : '個人號' }}
              </el-tag>
            </template>
            <span v-else class="no-sync-text">--</span>
          </template>
        </el-table-column>

        <el-table-column label="在线状态" width="100" prop="is_online" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="row.is_online ? 'success' : 'info'" size="small">
              {{ row.is_online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="标签" min-width="150">
          <template #default="{ row }">
            <div class="user-tags" v-if="row.tags && row.tags.length > 0">
              <el-tag
                v-for="tag in row.tags"
                :key="tag.id"
                :color="tag.color"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px; flex-wrap: nowrap"
              >
                {{ tag.name }}
              </el-tag>
            </div>
            <span v-else style="color: #999; font-size: 12px">无标签</span>
          </template>
        </el-table-column>

        <el-table-column label="所属渠道" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.channel_name" type="primary" size="small">
              {{ row.channel_name }}
            </el-tag>
            <span v-else style="color: #999; font-size: 12px">无渠道</span>
          </template>
        </el-table-column>

        <el-table-column label="Connector" width="150">
          <template #default="{ row }">
            <span v-if="row.connector_name || row.connector_id">
              {{ row.connector_name || row.connector_id }}
            </span>
            <span v-else style="color: #999; font-size: 12px">-</span>
          </template>
        </el-table-column>

        <el-table-column label="工作組" width="120">
          <template #default="{ row }">
            <span v-if="row.workgroup_name">{{ row.workgroup_name }}</span>
            <span v-else style="color: #999; font-size: 12px">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="message_count" label="消息数量" width="120" sortable="custom" />

        <el-table-column label="最后在线" width="160">
          <template #default="{ row }">
            {{ row.last_seen ? formatDateTime(row.last_seen) : '未知' }}
          </template>
        </el-table-column>

        <el-table-column label="注册时间" width="160" prop="created_at" sortable="custom">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="註冊日期" width="160" prop="referral_registered_at" sortable="custom">
          <template #default="{ row }">
            {{ row.referral_registered_at ? formatDateTime(row.referral_registered_at) : '--' }}
          </template>
        </el-table-column>

        <el-table-column label="同步狀態" width="120">
          <template #default="{ row }">
            <template v-if="row.sync_status">
              <el-tag
                :type="getSyncStatusType(row.sync_status?.overall_status || 'pending')"
                size="small"
                :class="{ 'sync-tag-error': row.sync_status?.has_error }"
              >
                {{ getSyncStatusText(row.sync_status?.overall_status || 'pending') }}
              </el-tag>
            </template>
            <span v-else class="no-sync-text">--</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewAccount(row)"> 詳情 </el-button>
            <el-button
              size="small"
              style="margin-left: 4px; margin-right: 4px"
              @click="handleUserAction('viewMessages', row)"
            >
              对話
            </el-button>
            <el-button
              v-if="canViewAccountContacts"
              size="small"
              type="success"
              style="margin-right: 4px"
              @click="handleUserAction('viewContacts', row)"
            >
              联络人
            </el-button>

            <el-dropdown @command="(command: string) => handleUserAction(command, row)">>
              <el-button size="small">
                更多 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="syncDetail">
                    <el-icon><Connection /></el-icon> 同步詳情
                  </el-dropdown-item>
                  <el-dropdown-item command="toggleStatus" divided>
                    {{ row.admin_status === 'active' ? '停用' : '启用' }}帳號
                  </el-dropdown-item>
                  <el-dropdown-item command="manageTags">管理标签</el-dropdown-item>
                  <el-dropdown-item command="resetPassword">重置密码</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除帳號</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="paginationInfo.current"
          v-model:page-size="paginationInfo.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="paginationInfo.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 用户详情对话框 -->
    <UserDetailDialog
      v-model:visible="userDetailVisible"
      :user="selectedAccount"
    />

    <!-- WhatsApp登录对话框 -->
    <WhatsAppLoginDialog v-model:visible="whatsappLoginVisible" @success="handleUserCreated" />

    <!-- 标签管理对话框 -->
    <el-dialog v-model="tagManagementVisible" title="管理账号标签" width="600px">
      <div class="tag-management-dialog">
        <div class="current-tags" v-if="currentUserTags.length > 0">
          <h4>当前标签</h4>
          <div class="tags-list">
            <el-tag
              v-for="tag in currentUserTags"
              :key="tag.id"
              :color="tag.color"
              closable
              @close="handleRemoveTag(tag.id)"
              style="margin-right: 8px; margin-bottom: 8px"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </div>

        <el-divider />

        <div class="add-tags">
          <h4>添加标签</h4>
          <el-select
            v-model="selectedTagIds"
            multiple
            placeholder="请选择要添加的标签"
            style="width: 100%"
            :loading="tagLoading"
          >
            <el-option v-for="tag in availableTags" :key="tag.id" :label="tag.name" :value="tag.id">
              <div style="display: flex; align-items: center; gap: 8px">
                <div
                  style="width: 16px; height: 16px; border-radius: 50%"
                  :style="{ backgroundColor: tag.color }"
                />
                <span>{{ tag.name }}</span>
                <span style="color: #999; font-size: 12px">({{ tag.account_count }}个账号)</span>
              </div>
            </el-option>
          </el-select>
        </div>
      </div>

      <template #footer>
        <el-button @click="tagManagementVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="tagLoading"
          :disabled="selectedTagIds.length === 0"
          @click="handleAddTags"
        >
          添加标签
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import {
  User,
  Plus,
  Refresh,
  Search,
  RefreshLeft,
  UserFilled,
  Check,
  Connection,
  CloseBold,
  ArrowDown,
  Loading,
  CircleCheck,
  CircleClose,
  Clock
} from '@element-plus/icons-vue'
import { useAccountStore } from '@/stores/account'
import { useAuthStore } from '@/stores/auth'
import type { Account, AccountListParams, AccountStatsResponse } from '@/types/account'
import { accountApi } from '@/api/account'
import { channelApi } from '@/api/channel'
import type { ChannelListItem } from '@/api/channel'
import type { AccountTag } from '@/api/tag'
import * as tagApi from '@/api/tag'
import UserDetailDialog from '@/components/users/UserDetailDialog.vue'
import WhatsAppLoginDialog from '@/components/users/WhatsAppLoginDialog.vue'

// 定义组件名称，用于 keep-alive
defineOptions({
  name: 'UserList'
})

// Store
const accountStore = useAccountStore()
const authStore = useAuthStore()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const selectedAccounts = ref<Account[]>([])
const selectedAccount = ref<Account | null>(null)
const userDetailVisible = ref(false)
const whatsappLoginVisible = ref(false)
const tagManagementVisible = ref(false)

// 帳號同步狀態相關
const syncDetailVisible = ref(false)
const selectedAccountForSync = ref<Account | null>(null)
const syncDetail = ref<any>(null)

// 标签管理相关状态
const currentUserTags = ref<AccountTag[]>([])
const availableTags = ref<AccountTag[]>([])
const selectedTagIds = ref<number[]>([])
const tagLoading = ref(false)
const currentManagingAccount = ref<Account | null>(null)

// 标签筛选相关状态
const filterTags = ref<AccountTag[]>([])
const tagFilterLoading = ref(false)
const filterChannels = ref<ChannelListItem[]>([])
const channelFilterLoading = ref(false)
const createdDateRange = ref<[string, string] | null>(null)
const accountStats = ref<AccountStatsResponse | null>(null)

// 筛选条件
const filters = reactive<AccountListParams>({
  page: 1,
  page_size: 20
})

// 计算属性
const accounts = computed(() => accountStore.accounts)
const paginationInfo = computed(() => accountStore.paginationInfo)
const canViewAccountContacts = computed(() => authStore.hasPermission('message.view'))

// 状态相关方法
const getStatusType = (status: string) => {
  const statusMap = {
    active: 'success',
    pending: 'warning',
    banned: 'danger',
    inactive: 'info',
    connected: 'success',
    disconnected: 'success',
    logged_out: 'danger'
  }
  return statusMap[status as keyof typeof statusMap] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap = {
    active: '正常',
    pending: '待审核',
    banned: '已封禁',
    inactive: '未启用',
    connected: '已连接',
    disconnected: '已连接',
    logged_out: '已登出'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

// 格式化时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 帳號同步狀態相關方法
const getSyncStatusType = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'running':
      return 'primary'
    case 'queued':
      return 'warning'
    case 'failed':
      return 'danger'
    case 'pending':
    default:
      return 'info'
  }
}

const getSyncStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'running':
      return '同步中'
    case 'queued':
      return '等待中'
    case 'failed':
      return '失敗'
    case 'pending':
    default:
      return '待處理'
  }
}

const isBusinessAccount = (platform?: string) => platform === 'smba' || platform === 'smbi'

const showSyncDetail = async (account: Account) => {
  try {
    selectedAccountForSync.value = account
    syncDetail.value = null
    syncDetailVisible.value = true

    syncDetail.value = await accountApi.getSyncStatus(account.id)
  } catch (error) {
    console.error('獲取同步詳情失敗:', error)
    ElMessage.error('獲取同步詳情失敗')
  }
}

const getSyncStepClass = (step: any) => {
  if (!step) return 'step-pending'
  switch (step.status) {
    case 'completed':
      return 'step-completed'
    case 'running':
      return 'step-running'
    case 'failed':
      return 'step-failed'
    case 'queued':
      return 'step-queued'
    default:
      return 'step-pending'
  }
}

const getSyncStepIconClass = (step: any) => {
  if (!step) return ''
  if (step.status === 'running') return 'is-loading'
  return ''
}

const getSyncStepIcon = (step: any) => {
  if (!step) return Clock
  switch (step.status) {
    case 'completed':
      return CircleCheck
    case 'running':
      return Loading
    case 'failed':
      return CircleClose
    default:
      return Clock
  }
}

const handleDateRangeChange = (val: [string, string] | null) => {
  if (val) {
    filters.created_from = val[0]
    filters.created_to = val[1]
  } else {
    filters.created_from = undefined
    filters.created_to = undefined
  }
}

// 事件处理方法
const handleSearch = async () => {
  try {
    loading.value = true
    await accountStore.fetchAccounts(filters)
  } finally {
    loading.value = false
  }
}

const handleResetFilter = () => {
  Object.assign(filters, {
    page: 1,
    page_size: 20,
    sort_by: undefined,
    sort_order: undefined,
    phone: '',
    search: '',
    status: undefined,
    admin_status: '',
    is_online: undefined,
    tag_id: undefined,
    channel_id: undefined,
    created_from: undefined,
    created_to: undefined
  })
  createdDateRange.value = null
  handleSearch()
}

const handleRefresh = () => {
  handleSearch()
  loadAccountStats()
}

const handleSelectionChange = (selection: Account[]) => {
  selectedAccounts.value = selection
}

const handleSortChange = (column: any) => {
  if (column.prop) {
    filters.sort_by = column.prop
    filters.sort_order = column.order === 'ascending' ? 'asc' : 'desc'
    filters.page = 1
    handleSearch()
  }
}

const handleSizeChange = (size: number) => {
  filters.page_size = size
  handleSearch()
}

const handleCurrentChange = (page: number) => {
  filters.page = page
  handleSearch()
}

const handleCreateUser = () => {
  whatsappLoginVisible.value = true
}

const handleViewAccount = (account: Account) => {
  selectedAccount.value = account
  userDetailVisible.value = true
}

const handleViewMessages = (account: Account) => {
  router.push({ name: 'UserMessages', params: { userId: account.id } })
}

const handleViewContacts = (account: Account) => {
  if (!canViewAccountContacts.value) {
    ElMessage.error('您没有查看联络人的权限')
    return
  }
  router.push({ name: 'AccountContacts', params: { id: account.id } })
}

const handleUserAction = async (command: string, user: Account) => {
  switch (command) {
    case 'syncDetail':
      await showSyncDetail(user)
      break
    case 'toggleStatus':
      await handleToggleAdminStatus(user)
      break
    case 'manageTags':
      await handleManageTags(user)
      break
    case 'resetPassword':
      ElMessage.info('重置密码功能即将开放')
      break
    case 'viewMessages':
      await handleViewMessages(user)
      break
    case 'viewContacts':
      await handleViewContacts(user)
      break
    case 'delete':
      await handleDeleteAccount(user)
      break
  }
}

const handleToggleAdminStatus = async (account: Account) => {
  const newStatus = account.admin_status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '停用'

  try {
    await ElMessageBox.confirm(`确定要${action}帳號 ${account.push_name || account.phone_number}?`, '确认操作')
    await accountStore.updateAdminStatus(account.id, newStatus as any)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Toggle admin status error:', error)
    }
  }
}

const handleDeleteAccount = async (account: Account) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除帳號 ${
        account.push_name || account.phone_number
      }? 此操作将删除该帳號的所有数据,包括消息、会话、设备信息等,且不可恢复!`,
      '危险操作',
      {
        type: 'error',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        distinguishCancelAndClose: true
      }
    )

    const loadingInstance = ElLoading.service({
      lock: true,
      text: '正在删除帳號及所有关联数据...',
      background: 'rgba(0, 0, 0, 0.7)',
      spinner: 'el-icon-loading',
      customClass: 'delete-loading'
    })

    try {
      await accountStore.deleteAccount(account.id)
    } finally {
      loadingInstance.close()
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete account error:', error)
      ElMessage.error('删除帳號失败')
    }
  }
}

const handleBatchUpdateStatus = async (status: 'active' | 'blocked') => {
  const accountIds = selectedAccounts.value.map(a => a.id)
  const action = status === 'active' ? '激活' : '拉黑'

  try {
    await ElMessageBox.confirm(`确定要${action}选中的 ${accountIds.length} 个帳號?`, '确认批量操作')

    await accountStore.batchOperation({
      account_ids: accountIds,
      operation: 'update_admin_status',
      data: { admin_status: status as any }
    })

    ElMessage.success(`批量${action}成功`)
    selectedAccounts.value = []
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch update status error:', error)
    }
  }
}

const handleBatchDelete = async () => {
  const accountIds = selectedAccounts.value.map(a => a.id)

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${accountIds.length} 个帳號? 此操作不可逆!`,
      '危险操作',
      { type: 'error' }
    )

    await accountStore.batchOperation({
      account_ids: accountIds,
      operation: 'delete',
      data: {}
    })

    ElMessage.success('批量删除成功')
    selectedAccounts.value = []
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Batch delete error:', error)
    }
  }
}

const handleUserCreated = () => {
  handleRefresh()
}

const loadAccountStats = async () => {
  try {
    accountStats.value = await accountStore.fetchAccountStats()
  } catch (error) {
    console.error('Load account stats error:', error)
  }
}

// 标签管理方法
const handleManageTags = async (account: Account) => {
  currentManagingAccount.value = account
  tagManagementVisible.value = true
  selectedTagIds.value = []

  await Promise.all([loadAvailableTags(), loadAccountTags(account.id)])
}

const loadAvailableTags = async () => {
  tagLoading.value = true
  try {
    const response = await tagApi.getTagList({ limit: 1000 })
    if (response.data && 'list' in response.data) {
      availableTags.value = response.data.list
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取标签列表失败')
  } finally {
    tagLoading.value = false
  }
}

const loadAccountTags = async (accountId: number) => {
  tagLoading.value = true
  try {
    const response = await tagApi.getAccountTags(accountId)
    if (response.data) {
      currentUserTags.value = Array.isArray(response.data) ? response.data : []
    }
  } catch (error: any) {
    console.error('获取账号标签失败:', error)
    currentUserTags.value = []
  } finally {
    tagLoading.value = false
  }
}

const handleAddTags = async () => {
  if (!currentManagingAccount.value || selectedTagIds.value.length === 0) {
    return
  }

  tagLoading.value = true
  try {
    await tagApi.addAccountTags(currentManagingAccount.value.id, selectedTagIds.value)
    ElMessage.success('添加标签成功')
    selectedTagIds.value = []
    await loadAccountTags(currentManagingAccount.value.id)
  } catch (error: any) {
    ElMessage.error(error.message || '添加标签失败')
  } finally {
    tagLoading.value = false
  }
}

const handleRemoveTag = async (tagId: number) => {
  if (!currentManagingAccount.value) {
    return
  }

  try {
    await ElMessageBox.confirm('确定要移除这个标签吗?', '确认操作')
    tagLoading.value = true

    await tagApi.removeAccountTag(currentManagingAccount.value.id, tagId)
    ElMessage.success('移除标签成功')
    await loadAccountTags(currentManagingAccount.value.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '移除标签失败')
    }
  } finally {
    tagLoading.value = false
  }
}

// 加载筛选标签列表
const loadFilterTags = async () => {
  tagFilterLoading.value = true
  try {
    const response = await tagApi.getTagList({ limit: 1000 })
    if (response.data && 'list' in response.data) {
      filterTags.value = response.data.list
    }
  } catch (error: any) {
    console.error('获取标签列表失败:', error)
  } finally {
    tagFilterLoading.value = false
  }
}

const loadFilterChannels = async () => {
  channelFilterLoading.value = true
  try {
    const response = await channelApi.getList({ page_size: 1000 })
    const list = response?.data?.list ?? response?.list
    if (list) {
      filterChannels.value = list
    }
  } catch (error: any) {
    console.error('获取渠道列表失败:', error)
  } finally {
    channelFilterLoading.value = false
  }
}

// 生命周期
onMounted(() => {
  handleSearch()
  loadAccountStats()
  loadFilterTags()
  loadFilterChannels()
})
</script>

<style scoped>
.user-list {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left p {
  margin: 0;
  color: #7f8c8d;
}

.header-right {
  display: flex;
  gap: 10px;
}

/* 表格中的同步狀態 */
.sync-tag-error {
  animation: pulse-error 2s infinite;
}

@keyframes pulse-error {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.no-sync-text {
  color: #c0c4cc;
  font-size: 12px;
}

/* 同步詳情對話框 */
.sync-detail-content {
  padding: 10px 0;
}

.sync-account-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sync-account-header h3 {
  margin: 0;
  font-size: 16px;
}

.sync-account-header p {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 13px;
}

.sync-steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sync-step {
  padding: 12px;
  border-radius: 8px;
  background: #f5f7fa;
}

.sync-step.step-completed {
  background: #f0f9ff;
  border-left: 3px solid #67c23a;
}

.sync-step.step-running {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}

.sync-step.step-failed {
  background: #fef0f0;
  border-left: 3px solid #f56c6c;
}

.sync-step.step-queued {
  background: #fdf6ec;
  border-left: 3px solid #e6a23c;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-header .el-icon {
  font-size: 18px;
}

.step-header .el-icon.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.step-name {
  flex: 1;
  font-weight: 500;
}

.step-detail {
  margin-top: 8px;
  padding-left: 26px;
}

.step-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.step-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.step-progress .el-progress {
  flex: 1;
}

.step-progress span {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.step-count {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.step-progress-text {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.step-error {
  margin-top: 8px;
}

.sync-loading {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  margin: 0;
}

.batch-actions-card {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  height: 100px;
}

.stats-item {
  display: flex;
  align-items: center;
  height: 100%;
}

.stats-icon {
  font-size: 40px;
  margin-right: 15px;
}

.stats-icon.total {
  color: #3498db;
}

.stats-icon.active {
  color: #27ae60;
}

.stats-icon.online {
  color: #f39c12;
}

.stats-icon.blocked {
  color: #e74c3c;
}

.stats-content {
  flex: 1;
}

.stats-value {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
}

.stats-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-top: 5px;
}

.table-card {
  margin-bottom: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #2c3e50;
}

.user-username {
  font-size: 12px;
  color: #95a5a6;
  margin-top: 2px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.batch-actions-card .el-card__body) {
  padding: 15px 20px;
}

:deep(.stats-card .el-card__body) {
  padding: 15px;
}

/* 标签管理对话框样式 */
.tag-management-dialog {
  padding: 10px 0;
}

.tag-management-dialog h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.current-tags .tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.add-tags {
  margin-top: 20px;
}

/* 用户标签列样式 */
.user-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* 删除加载动画样式 */
:deep(.delete-loading) {
  background: rgba(0, 0, 0, 0.8) !important;
}

:deep(.delete-loading .el-loading-text) {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  margin-top: 10px;
}

:deep(.delete-loading .el-loading-spinner) {
  font-size: 50px;
}

:deep(.delete-loading .el-loading-spinner .path) {
  stroke: #409eff;
  stroke-width: 3;
}
</style>
