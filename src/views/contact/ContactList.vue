<template>
  <div class="contact-list-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="goBack">返回</el-button>
        <h1>联络人列表</h1>
        <el-tag v-if="accountInfo" type="info" size="large">
          {{ accountInfo.push_name || accountInfo.phone_number }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button @click="loadContacts" :loading="loading" :icon="Refresh">刷新</el-button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ total }}</div>
          <div class="stat-label">总联络人</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ onlineCount }}</div>
          <div class="stat-label">在线</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ totalMessages }}</div>
          <div class="stat-label">总消息数</div>
        </div>
      </el-card>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索联络人名称或电话"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="onlineFilter" placeholder="在线状态" style="width: 150px" clearable>
          <el-option label="全部" value="" />
          <el-option label="在线" value="online" />
          <el-option label="离线" value="offline" />
        </el-select>

        <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
        <el-button @click="handleResetFilter">重置</el-button>
      </div>
    </el-card>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="filteredContacts" stripe style="width: 100%">
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>

        <el-table-column prop="full_name" label="名称" min-width="150">
          <template #default="{ row }">
            <div class="contact-name">
              <span>{{ row.full_name || row.push_name || row.phone || row.jid }}</span>
              <el-tag v-if="row.business_name" type="success" size="small">商家</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="phone" label="电话号码" width="150">
          <template #default="{ row }">
            <span>{{ row.phone || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="push_name" label="推送名称" width="120">
          <template #default="{ row }">
            <span>{{ row.push_name || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="is_online" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_online ? 'success' : 'info'" size="small">
              {{ row.is_online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="message_count" label="消息数" width="100">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.message_count }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="jid" label="JID" min-width="220">
          <template #default="{ row }">
            <el-text type="info" size="small" truncated>{{ row.jid }}</el-text>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadContacts"
          @size-change="loadContacts"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Refresh, Search, User } from '@element-plus/icons-vue'
import { accountApi } from '@/api/account'
import type { Account } from '@/types/account'

interface Contact {
  id: number
  account_id: number
  jid: string
  phone: string
  push_name: string
  first_name: string
  full_name: string
  business_name: string
  avatar: string
  avatar_id: string
  status: string
  is_online: boolean
  last_seen: string
  message_count: number
  created_at: string
  updated_at: string
}

const route = useRoute()
const router = useRouter()

const accountId = computed(() => Number(route.params.id))
const accountInfo = ref<Account | null>(null)

const loading = ref(false)
const contacts = ref<Contact[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(50)

const searchKeyword = ref('')
const onlineFilter = ref('')

const onlineCount = computed(() => contacts.value.filter(c => c.is_online).length)
const totalMessages = computed(() => contacts.value.reduce((sum, c) => sum + c.message_count, 0))

const filteredContacts = computed(() => {
  let result = contacts.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(c =>
      (c.full_name?.toLowerCase().includes(keyword)) ||
      (c.push_name?.toLowerCase().includes(keyword)) ||
      (c.phone?.includes(keyword)) ||
      (c.jid?.toLowerCase().includes(keyword))
    )
  }

  if (onlineFilter.value === 'online') {
    result = result.filter(c => c.is_online)
  } else if (onlineFilter.value === 'offline') {
    result = result.filter(c => !c.is_online)
  }

  return result
})

async function loadContacts() {
  if (!accountId.value) {
    return
  }
  loading.value = true
  try {
    const response = await accountApi.getContacts(accountId.value, {
      page: currentPage.value,
      page_size: pageSize.value
    })
    contacts.value = response.items || []
    total.value = response.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载联络人列表失败')
  } finally {
    loading.value = false
  }
}

async function loadAccountInfo() {
  try {
    const account = await accountApi.getById(accountId.value)
    accountInfo.value = account
  } catch (error: any) {
    console.error('加载帳號信息失败:', error)
  }
}

function handleSearch() {
  currentPage.value = 1
}

function handleResetFilter() {
  searchKeyword.value = ''
  onlineFilter.value = ''
  currentPage.value = 1
}

function goBack() {
  router.push({ name: 'Users' })
}

onMounted(async () => {
  await loadAccountInfo()
  await loadContacts()
})
</script>

<style scoped>
.contact-list-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 16px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.filter-card {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.table-card {
  margin-bottom: 24px;
}

.contact-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
