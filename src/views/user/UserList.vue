<template>
  <div class="user-list-container">
    <!-- Header -->
    <div class="page-header">
      <h1>帳號管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增帳號
        </el-button>
        <el-button v-if="selectedAccounts.length > 0" @click="showBatchDialog = true">
          批量操作 ({{ selectedAccounts.length }})
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="searchForm.query"
          placeholder="搜索手機號或顯示名稱"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="filterForm.admin_status" placeholder="管理狀態" style="width: 120px" clearable>
          <el-option
            v-for="option in adminStatusOptions.slice(1)"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select v-model="filterForm.is_online" placeholder="在線狀態" style="width: 120px" clearable>
          <el-option label="全部" value="" />
          <el-option label="在線" :value="true" />
          <el-option label="離線" :value="false" />
        </el-select>

        <el-button type="primary" @click="handleFilter">
          <el-icon><Search /></el-icon>
          篩選
        </el-button>
        <el-button @click="handleResetFilter">重置</el-button>
      </div>
    </el-card>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="accounts"
        @selection-change="handleSelectionChange"
        @sort-change="handleSort"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" fixed="left" />

        <el-table-column prop="id" label="ID" width="80" sortable="custom" />

        <el-table-column prop="phone_number" label="手機號" width="140" sortable="custom" />

        <el-table-column prop="push_name" label="顯示名稱" width="120" sortable="custom">
          <template #default="{ row }">
            <span>{{ row.push_name || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="is_online" label="在線狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="formatOnlineStatus(row.is_online).type" size="small">
              {{ formatOnlineStatus(row.is_online).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="admin_status" label="管理狀態" width="100" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="formatAdminStatus(row.admin_status).type" size="small">
              {{ formatAdminStatus(row.admin_status).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="message_count" label="訊息數" width="100" sortable="custom" />

        <el-table-column prop="referral_code" label="推薦碼" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.referral_code" size="small">{{ row.referral_code }}</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="referral_count" label="推薦人數" width="100">
          <template #default="{ row }">
            <span>{{ row.referral_count || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="last_seen" label="最後在線" width="160" sortable="custom">
          <template #default="{ row }">
            <span>{{ formatLastSeen(row.last_seen) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="建立時間" width="160" sortable="custom">
          <template #default="{ row }">
            <span>{{ new Date(row.created_at).toLocaleString() }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="referral_registered_at" label="註冊日期" width="160" sortable="custom">
          <template #default="{ row }">
            <span>{{ row.referral_registered_at ? new Date(row.referral_registered_at).toLocaleString() : '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              編輯
            </el-button>
            <el-button size="small" type="success" @click="handleShowReferralLink(row)">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">
              <el-icon><Delete /></el-icon>
              刪除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="paginationInfo.current"
          v-model:page-size="paginationInfo.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="paginationInfo.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Create Account Dialog -->
    <el-dialog v-model="showCreateDialog" title="新增帳號" width="600px">
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="accountFormRules"
        label-width="100px"
      >
        <el-form-item label="手機號" prop="phone_number">
          <el-input v-model="createForm.phone_number" placeholder="請輸入手機號" />
        </el-form-item>
        <el-form-item label="顯示名稱" prop="push_name">
          <el-input v-model="createForm.push_name" placeholder="請輸入顯示名稱" />
        </el-form-item>
        <el-form-item label="管理狀態" prop="admin_status">
          <el-select v-model="createForm.admin_status" placeholder="請選擇狀態">
            <el-option
              v-for="option in adminStatusOptions.slice(1)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreate">建立</el-button>
      </template>
    </el-dialog>

    <!-- Edit Account Dialog -->
    <el-dialog v-model="showEditDialog" title="編輯帳號" width="600px">
      <el-form
        ref="editFormRef"
        :model="editAccountForm"
        :rules="accountFormRules"
        label-width="100px"
      >
        <el-form-item label="顯示名稱" prop="push_name">
          <el-input v-model="editAccountForm.push_name" placeholder="請輸入顯示名稱" />
        </el-form-item>
        <el-form-item label="管理狀態" prop="admin_status">
          <el-select v-model="editAccountForm.admin_status" placeholder="請選擇狀態">
            <el-option
              v-for="option in adminStatusOptions.slice(1)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleUpdate">更新</el-button>
      </template>
    </el-dialog>

    <!-- Batch Operation Dialog -->
    <el-dialog v-model="showBatchDialog" title="批量操作" width="500px">
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="操作類型">
          <el-select v-model="batchForm.operation" placeholder="請選擇操作">
            <el-option label="更新管理狀態" value="update_admin_status" />
            <el-option label="刪除帳號" value="delete" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="batchForm.operation === 'update_admin_status'" label="新狀態">
          <el-select v-model="batchForm.status" placeholder="請選擇狀態">
            <el-option
              v-for="option in adminStatusOptions.slice(1)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleBatchOperation">執行</el-button>
      </template>
    </el-dialog>

    <!-- Referral Link Dialog -->
    <el-dialog v-model="showReferralDialog" title="分享推薦鏈接" width="600px">
      <div v-loading="referralLoading" class="referral-dialog-content">
        <el-alert
          v-if="referralError"
          :title="referralError"
          type="error"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <template v-if="referralProfile">
          <el-form label-width="100px">
            <el-form-item label="推薦碼">
              <el-tag size="large" type="success">{{ referralProfile.referral_code }}</el-tag>
            </el-form-item>

            <el-form-item label="推廣語言">
              <el-select v-model="selectedReferralLanguage" style="width: 100%">
                <el-option
                  v-for="option in referralLanguageOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="分享鏈接">
              <el-input
                :model-value="finalReferralShareUrl"
                readonly
                :suffix-icon="CopyDocument"
              >
                <template #append>
                  <el-button @click="handleCopyLink">複製</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </template>

        <template v-else-if="!referralLoading && !referralError">
          <el-empty description="尚未生成推薦碼">
            <el-button type="primary" @click="handleGenerateReferralCode">生成推薦碼</el-button>
          </el-empty>
        </template>
      </div>

      <template #footer>
        <el-button @click="showReferralDialog = false">關閉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { CopyDocument, Share } from '@element-plus/icons-vue'
import { useAccount } from '@/composables/useAccount'
import { referralApi } from '@/api/referral'
import { promotionDomainApi } from '@/api/promotion-domain'
import type { Account } from '@/types/account'
import type { ReferralProfile } from '@/types/referral'

const router = useRouter()

// Composables
const {
  accounts,
  loading,
  paginationInfo,
  editAccountForm,
  accountFormRules,
  adminStatusOptions,
  fetchAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  resetEditAccountForm,
  setEditAccountForm,
  setFilters,
  resetFilters,
  handlePageChange,
  handlePageSizeChange,
  handleSort,
  formatAdminStatus,
  formatOnlineStatus,
  formatLastSeen,
  batchOperation
} = useAccount()

// Dialog states
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showBatchDialog = ref(false)
const showReferralDialog = ref(false)

// Form refs
const createFormRef = ref()
const editFormRef = ref()

// Selection
const selectedAccounts = ref<Account[]>([])

// Current editing account
const currentEditingAccount = ref<Account | null>(null)

// Referral state
const currentReferralAccount = ref<Account | null>(null)
const referralProfile = ref<ReferralProfile | null>(null)
const referralLoading = ref(false)
const referralError = ref('')
const selectedReferralLanguage = ref('ms')

const referralLanguageOptions = [
  { label: 'Bahasa Melayu (马来语)', value: 'ms' },
  { label: 'English (英语/新加坡)', value: 'en' },
  { label: '简体中文', value: 'zh' }
]

const finalReferralShareUrl = computed(() => {
  if (!referralProfile.value?.share_url) return ''

  try {
    const url = new URL(referralProfile.value.share_url)
    // whats-shop uses 'ref' parameter for referral code
    url.searchParams.set('lang', selectedReferralLanguage.value)
    return url.toString()
  } catch {
    const separator = referralProfile.value.share_url.includes('?') ? '&' : '?'
    return `${referralProfile.value.share_url}${separator}lang=${selectedReferralLanguage.value}`
  }
})

// Create form
const createForm = reactive({
  phone_number: '',
  push_name: '',
  admin_status: ''
})

// Search and filter forms
const searchForm = reactive({
  query: ''
})

const filterForm = reactive({
  admin_status: '',
  is_online: '' as '' | boolean
})

const batchForm = reactive({
  operation: '',
  status: ''
})

// Methods
const handleSearch = async () => {
  if (searchForm.query.trim()) {
    setFilters({ search: searchForm.query.trim(), page: 1 })
  } else {
    setFilters({ search: undefined, page: 1 })
  }
  await fetchAccounts()
}

const handleFilter = async () => {
  const filters: any = { page: 1 }

  if (filterForm.admin_status) filters.admin_status = filterForm.admin_status
  if (filterForm.is_online !== '') filters.is_online = filterForm.is_online

  setFilters(filters)
  await fetchAccounts()
}

const handleResetFilter = async () => {
  searchForm.query = ''
  filterForm.admin_status = ''
  filterForm.is_online = ''

  resetFilters()
  await fetchAccounts()
}

const handleSelectionChange = (selection: Account[]) => {
  selectedAccounts.value = selection
}

const handleView = (account: Account) => {
  router.push({ name: 'UserDetail', params: { id: account.id } })
}

const handleEdit = (account: Account) => {
  currentEditingAccount.value = account
  setEditAccountForm(account)
  showEditDialog.value = true
}

const handleDelete = async (accountId: number) => {
  try {
    await deleteAccount(accountId)
  } catch (error) {
    console.error('Delete account failed:', error)
  }
}

const handleCreate = async () => {
  try {
    await createFormRef.value.validate()
    await createAccount(createForm as any)
    showCreateDialog.value = false
    createForm.phone_number = ''
    createForm.push_name = ''
    createForm.admin_status = ''
    await fetchAccounts()
  } catch (error) {
    console.error('Create account failed:', error)
  }
}

const handleUpdate = async () => {
  if (!currentEditingAccount.value) return

  try {
    await editFormRef.value.validate()
    await updateAccount(currentEditingAccount.value.id)
    showEditDialog.value = false
    resetEditAccountForm()
    currentEditingAccount.value = null
    await fetchAccounts()
  } catch (error) {
    console.error('Update account failed:', error)
  }
}

const handleBatchOperation = async () => {
  if (!batchForm.operation || selectedAccounts.value.length === 0) return

  try {
    const data: any = {
      account_ids: selectedAccounts.value.map(a => a.id),
      operation: batchForm.operation
    }

    if (batchForm.operation === 'update_admin_status') {
      data.data = { admin_status: batchForm.status }
    }

    await batchOperation(data)
    showBatchDialog.value = false
    selectedAccounts.value = []
    batchForm.operation = ''
    batchForm.status = ''
    await fetchAccounts()
  } catch (error) {
    console.error('Batch operation failed:', error)
  }
}

// Referral methods
const handleShowReferralLink = async (account: Account) => {
  currentReferralAccount.value = account
  showReferralDialog.value = true
  referralProfile.value = null
  referralError.value = ''

  // 加载推荐信息
  await loadReferralProfile(account.id)
}

const loadReferralProfile = async (accountId: number) => {
  referralLoading.value = true
  referralError.value = ''

  try {
    referralProfile.value = await referralApi.getReferralProfile(accountId)
  } catch (error: any) {
    // 如果是 404，说明还没有生成推荐码
    if (error.response?.status === 404 || error.code === 404) {
      referralProfile.value = null
    } else {
      referralError.value = error.message || '加載推薦信息失敗'
    }
  } finally {
    referralLoading.value = false
  }
}

const handleGenerateReferralCode = async () => {
  if (!currentReferralAccount.value) return

  referralLoading.value = true
  referralError.value = ''

  try {
    // 获取第一个可用的推广域名
    const domainsResponse = await promotionDomainApi.getOptions()
    if (!domainsResponse.data || domainsResponse.data.length === 0) {
      ElMessage.error('沒有可用的推廣域名，請先配置推廣域名')
      return
    }

    const firstDomain = domainsResponse.data[0]

    // 生成推荐码
    await referralApi.generateCode(currentReferralAccount.value.id, {
      promotion_domain_id: firstDomain.id,
      landing_path: '/'
    })

    ElMessage.success('推薦碼生成成功')

    // 重新加载推荐信息
    await loadReferralProfile(currentReferralAccount.value.id)

    // 刷新账号列表
    await fetchAccounts()
  } catch (error: any) {
    referralError.value = error.message || '生成推薦碼失敗'
    ElMessage.error(referralError.value)
  } finally {
    referralLoading.value = false
  }
}

const handleCopyLink = async () => {
  if (!finalReferralShareUrl.value) return

  try {
    await navigator.clipboard.writeText(finalReferralShareUrl.value)
    ElMessage.success('鏈接已複製到剪貼板')
  } catch (error) {
    ElMessage.error('複製失敗，請手動複製')
  }
}

// Lifecycle
onMounted(async () => {
  await fetchAccounts()
})
</script>

<style scoped>
.user-list-container {
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

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.referral-dialog-content {
  min-height: 200px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

@media (max-width: 768px) {
  .user-list-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-row > * {
    width: 100% !important;
  }
}
</style>
