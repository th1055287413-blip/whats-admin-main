<template>
  <div class="referral-dashboard-container">
    <!-- Header -->
    <div class="page-header">
      <h1>裂變數據看板</h1>
      <div class="header-actions">
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="stats-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon total">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">總推薦數</div>
            <div class="stat-value">{{ totalStats.total_referrals }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon month">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">本月推薦</div>
            <div class="stat-value">{{ totalStats.this_month_referrals }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon week">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">本週推薦</div>
            <div class="stat-value">{{ totalStats.this_week_referrals }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon today">
            <el-icon><Sunny /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日推薦</div>
            <div class="stat-value">{{ totalStats.today_referrals }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Referral Registrations Table -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>裂變記錄</h3>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="registrations"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column label="來源用戶" width="180">
          <template #default="{ row }">
            <div
              v-if="row.source_account"
              class="user-info clickable"
              @click="handleViewUser(row.source_account_id)"
            >
              <div>{{ row.source_account.push_name || '-' }}</div>
              <div class="phone-number">{{ row.source_account.phone_number }}</div>
            </div>
            <div
              v-else
              class="account-id-fallback clickable"
              @click="handleViewUser(row.source_account_id)"
            >
              <div>用戶 ID: {{ row.source_account_id }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="新用戶" width="180">
          <template #default="{ row }">
            <div
              v-if="row.new_account"
              class="user-info clickable"
              @click="handleViewUser(row.new_account_id)"
            >
              <div>{{ row.new_account.push_name || '-' }}</div>
              <div class="phone-number">{{ row.new_account.phone_number }}</div>
            </div>
            <div
              v-else
              class="account-id-fallback clickable"
              @click="handleViewUser(row.new_account_id)"
            >
              <div>用戶 ID: {{ row.new_account_id }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="referral_code" label="推薦碼" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.referral_code }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作管理員" width="150">
          <template #default="{ row }">
            <div v-if="row.operator_admin">
              <div>{{ row.operator_admin.real_name || row.operator_admin.username }}</div>
              <div class="admin-username">@{{ row.operator_admin.username }}</div>
            </div>
            <span v-else class="text-muted">系統</span>
          </template>
        </el-table-column>

        <el-table-column prop="registered_at" label="註冊時間" width="180">
          <template #default="{ row }">
            {{ new Date(row.registered_at).toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { referralApi } from '@/api/referral'
import type { ReferralRegistration, ReferralStats } from '@/types/referral'

const router = useRouter()

// State
const loading = ref(false)
const registrations = ref<ReferralRegistration[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const totalStats = ref<ReferralStats>({
  total_referrals: 0,
  today_referrals: 0,
  this_week_referrals: 0,
  this_month_referrals: 0
})

// Methods
const loadRegistrations = async () => {
  loading.value = true
  try {
    const response = await referralApi.getRegistrations({
      page: currentPage.value,
      page_size: pageSize.value
    })
    registrations.value = response.items
    total.value = response.total
  } catch (error) {
    console.error('Load registrations failed:', error)
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const stats = await referralApi.getStats({})
    totalStats.value = stats
  } catch (error) {
    console.error('Load stats failed:', error)
  }
}

const handlePageChange = () => {
  loadRegistrations()
}

const handlePageSizeChange = () => {
  currentPage.value = 1
  loadRegistrations()
}

const handleRefresh = () => {
  loadStats()
  loadRegistrations()
}

const handleViewUser = (userId: number) => {
  router.push({ name: 'UserMessages', params: { userId: userId } })
}

// Lifecycle
onMounted(() => {
  loadStats()
  loadRegistrations()
})
</script>

<style scoped>
.referral-dashboard-container {
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
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.month {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.week {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.today {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.phone-number {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.user-info {
  cursor: pointer;
  transition: all 0.2s;
}

.user-info:hover {
  color: #409eff;
}

.account-id-fallback {
  font-size: 13px;
  color: #606266;
}

.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.clickable:hover {
  color: #409eff;
}

.admin-username {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .referral-dashboard-container {
    padding: 10px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
