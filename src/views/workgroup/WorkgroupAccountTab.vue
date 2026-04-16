<template>
  <div class="workgroup-account-tab">
    <!-- Header -->
    <div class="card-header">
      <span>已分配帳號</span>
      <el-button
        v-if="hasPermission('workgroup_account.write') && !isAdmin"
        type="primary"
        :icon="Plus"
        @click="openAssignDialog"
      >
        分配帳號
      </el-button>
    </div>

    <!-- Batch Actions Bar -->
    <div v-if="selectedAccounts.length > 0 && !isAdmin" class="batch-bar">
      <el-button type="danger" :icon="Delete" @click="handleBatchRemove">
        批量移除 ({{ selectedAccounts.length }})
      </el-button>
    </div>

    <el-table
      ref="accountTableRef"
      :data="accounts"
      row-key="id"
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column
        v-if="hasPermission('workgroup_account.write') && !isAdmin"
        type="selection"
        width="50"
      />
      <el-table-column prop="account_id" label="帳號 ID" width="100" />
      <el-table-column prop="phone_number" label="電話號碼" width="150" />
      <el-table-column prop="push_name" label="暱稱" min-width="120" />
      <el-table-column prop="account_status" label="帳號狀態" width="120">
        <template #default="{ row }">
          <el-tag :type="getAccountStatusType(row.account_status)" size="small">
            {{ getAccountStatusLabel(row.account_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="agent_name" label="分配給" width="120">
        <template #default="{ row }">
          {{ row.agent_name || '未分配' }}
        </template>
      </el-table-column>
      <el-table-column prop="assigned_at" label="分配時間" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.assigned_at) }}
        </template>
      </el-table-column>
      <el-table-column
        v-if="hasPermission('workgroup_account.write') && !isAdmin"
        label="操作"
        width="100"
        fixed="right"
      >
        <template #default="{ row }">
          <el-button type="danger" size="small" link @click="handleRemoveAccount(row)">
            移除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="accountPage"
        v-model:page-size="accountPageSize"
        :page-sizes="[10, 20, 50]"
        :total="accountTotal"
        layout="total, sizes, prev, pager, next"
        @size-change="handleAccountSizeChange"
        @current-change="handleAccountPageChange"
      />
    </div>

    <!-- Assign Accounts Dialog -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配帳號"
      width="900px"
      destroy-on-close
      @open="handleAssignDialogOpen"
    >
      <!-- Mode Toggle -->
      <el-radio-group v-model="assignMode" class="assign-mode-toggle">
        <el-radio-button label="manual">手動選取</el-radio-button>
        <el-radio-button label="condition">條件分配</el-radio-button>
      </el-radio-group>
      <!-- Manual Mode -->
      <template v-if="assignMode === 'manual'">
        <el-form :inline="true" :model="assignFilter" class="assign-filter-form">
          <el-form-item label="關鍵字">
            <el-input
              v-model="assignFilter.keyword"
              placeholder="搜尋電話/暱稱"
              clearable
              @keyup.enter="handleAssignFilterSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleAssignFilterSearch">搜尋</el-button>
            <el-button @click="handleAssignFilterReset">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table
          ref="assignTableRef"
          v-loading="assignLoading"
          :data="assignableAccounts"
          row-key="id"
          stripe
          @selection-change="handleAssignSelectionChange"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="phone_number" label="電話號碼" width="150" />
          <el-table-column prop="push_name" label="暱稱" min-width="120" />
          <el-table-column prop="status" label="狀態" width="120">
            <template #default="{ row }">
              <el-tag :type="getAccountStatusType(row.status)" size="small">
                {{ getAccountStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="assignPage"
            v-model:page-size="assignPageSize"
            :page-sizes="[10, 20, 50]"
            :total="assignTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="handleAssignSizeChange"
            @current-change="handleAssignPageChange"
          />
        </div>
      </template>
      <!-- Condition Mode -->
      <template v-if="assignMode === 'condition'">
        <el-form label-width="120px" class="condition-form">
          <el-form-item label="標籤">
            <el-select
              v-model="conditionFilter.tagIds"
              multiple
              placeholder="選擇標籤"
              clearable
              style="width: 100%"
              @change="fetchAssignableCount"
            >
              <el-option
                v-for="tag in tagList"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="已授權時間">
            <el-input-number
              v-model="conditionFilter.authorizedMinutesGt"
              :min="0"
              placeholder="分鐘"
              controls-position="right"
              @change="fetchAssignableCount"
            />
            <span class="condition-unit">分鐘以上</span>
          </el-form-item>
          <el-form-item label="符合數量">
            <span class="condition-match-count">{{ conditionMatchCount }} 筆</span>
            <el-button link type="primary" :loading="conditionCountLoading" @click="fetchAssignableCount">
              重新查詢
            </el-button>
          </el-form-item>
          <el-form-item label="分配數量">
            <el-input-number
              v-model="conditionFilter.count"
              :min="1"
              :max="conditionMatchCount || 1"
              controls-position="right"
            />
            <span class="condition-unit">筆</span>
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button
          v-if="assignMode === 'manual'"
          type="primary"
          :disabled="selectedAssignAccounts.length === 0"
          :loading="assignSubmitting"
          @click="handleAssignSubmit"
        >
          確認分配 ({{ selectedAssignAccounts.length }})
        </el-button>
        <el-button
          v-if="assignMode === 'condition'"
          type="primary"
          :disabled="!conditionFilter.count || conditionFilter.count > conditionMatchCount"
          :loading="assignSubmitting"
          @click="handleConditionAssignSubmit"
        >
          確認分配 ({{ conditionFilter.count || 0 }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { workgroupApi } from '@/api/workgroup'
import type { WorkgroupAccount, AssignableAccount } from '@/api/workgroup'
import { getTagList } from '@/api/tag'
import type { AccountTag } from '@/api/tag'
import { usePermission } from '@/composables/usePermission'

const props = defineProps<{ workgroupId: number; workgroupType?: string }>()
const { hasPermission } = usePermission()
const isAdmin = computed(() => props.workgroupType === 'admin')

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
// --- Assigned accounts ---
const accounts = ref<WorkgroupAccount[]>([])
const accountPage = ref(1)
const accountPageSize = ref(20)
const accountTotal = ref(0)
const selectedAccounts = ref<WorkgroupAccount[]>([])
const accountTableRef = ref()

const fetchAccounts = async () => {
  try {
    const res = await workgroupApi.getAccounts(props.workgroupId, {
      page: accountPage.value,
      page_size: accountPageSize.value,
    })
    accounts.value = res.list
    accountTotal.value = res.total
  } catch (error) {
    ElMessage.error('取得帳號列表失敗')
  }
}

const handleSelectionChange = (rows: WorkgroupAccount[]) => {
  selectedAccounts.value = rows
}

const handleAccountSizeChange = (size: number) => {
  accountPageSize.value = size
  accountPage.value = 1
  fetchAccounts()
}

const handleAccountPageChange = (page: number) => {
  accountPage.value = page
  fetchAccounts()
}

// --- Remove accounts ---
const handleRemoveAccount = async (row: WorkgroupAccount) => {
  try {
    await ElMessageBox.confirm(
      `確定要將帳號「${row.push_name || row.phone_number}」從此工作組移除嗎？`,
      '確認移除',
      { confirmButtonText: '確定', cancelButtonText: '取消', type: 'warning' }
    )
    await workgroupApi.removeAccounts(props.workgroupId, [row.account_id])
    ElMessage.success('已移除帳號')
    fetchAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移除帳號失敗')
    }
  }
}
const handleBatchRemove = async () => {
  if (selectedAccounts.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `確定要將選取的 ${selectedAccounts.value.length} 個帳號從此工作組移除嗎？`,
      '確認批量移除',
      { confirmButtonText: '確定', cancelButtonText: '取消', type: 'warning' }
    )
    const ids = selectedAccounts.value.map((a: WorkgroupAccount) => a.account_id)
    await workgroupApi.removeAccounts(props.workgroupId, ids)
    ElMessage.success(`已移除 ${ids.length} 個帳號`)
    selectedAccounts.value = []
    fetchAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量移除失敗')
    }
  }
}

// --- Assign dialog ---
const assignDialogVisible = ref(false)
const assignLoading = ref(false)
const assignSubmitting = ref(false)
const assignableAccounts = ref<AssignableAccount[]>([])
const assignPage = ref(1)
const assignPageSize = ref(20)
const assignTotal = ref(0)
const selectedAssignAccounts = ref<AssignableAccount[]>([])
const assignTableRef = ref()
const assignMode = ref<'manual' | 'condition'>('manual')
const assignFilter = reactive({ keyword: '' })

// --- Condition mode ---
const tagList = ref<AccountTag[]>([])
const conditionMatchCount = ref(0)
const conditionCountLoading = ref(false)
const conditionFilter = reactive({
  tagIds: [] as number[],
  authorizedMinutesGt: undefined as number | undefined,
  count: 1,
})

const fetchTagList = async () => {
  try {
    const res = await getTagList()
    tagList.value = res.data.list
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}
const fetchAssignableCount = async () => {
  try {
    conditionCountLoading.value = true
    const res = await workgroupApi.getAssignableCount({
      tag_ids: conditionFilter.tagIds.length > 0 ? conditionFilter.tagIds : undefined,
      authorized_minutes_gt: conditionFilter.authorizedMinutesGt,
      workgroup_type: props.workgroupType,
    })
    conditionMatchCount.value = res.count
    if (conditionFilter.count > res.count) {
      conditionFilter.count = res.count
    }
  } catch (error) {
    ElMessage.error('查詢符合數量失敗')
  } finally {
    conditionCountLoading.value = false
  }
}

const handleConditionAssignSubmit = async () => {
  if (!conditionFilter.count || conditionFilter.count > conditionMatchCount.value) return
  try {
    assignSubmitting.value = true
    const res = await workgroupApi.assignByCondition(props.workgroupId, {
      tag_ids: conditionFilter.tagIds.length > 0 ? conditionFilter.tagIds : undefined,
      authorized_minutes_gt: conditionFilter.authorizedMinutesGt,
      count: conditionFilter.count,
    })
    ElMessage.success(`已分配 ${res.assigned_count} 個帳號`)
    assignDialogVisible.value = false
    fetchAccounts()
  } catch (error) {
    ElMessage.error('條件分配失敗')
  } finally {
    assignSubmitting.value = false
  }
}

const handleAssignDialogOpen = () => {
  if (assignMode.value === 'manual') {
    fetchAssignableAccounts()
  } else {
    fetchAssignableCount()
  }
  if (tagList.value.length === 0) {
    fetchTagList()
  }
}

const openAssignDialog = () => {
  resetAssignState()
  assignDialogVisible.value = true
}

const resetAssignState = () => {
  assignMode.value = 'manual'
  assignFilter.keyword = ''
  assignPage.value = 1
  assignableAccounts.value = []
  selectedAssignAccounts.value = []
  assignTotal.value = 0
  conditionFilter.tagIds = []
  conditionFilter.authorizedMinutesGt = undefined
  conditionFilter.count = 1
  conditionMatchCount.value = 0
}

const fetchAssignableAccounts = async () => {
  try {
    assignLoading.value = true
    const res = await workgroupApi.getAssignableAccounts({
      page: assignPage.value,
      page_size: assignPageSize.value,
      keyword: assignFilter.keyword || undefined,
      status: 'connected',
      workgroup_type: props.workgroupType,
    })
    assignableAccounts.value = res.list
    assignTotal.value = res.total
  } catch (error) {
    ElMessage.error('取得可分配帳號失敗')
  } finally {
    assignLoading.value = false
  }
}

const handleAssignSelectionChange = (rows: AssignableAccount[]) => {
  selectedAssignAccounts.value = rows
}

const handleAssignFilterSearch = () => {
  assignPage.value = 1
  fetchAssignableAccounts()
}

const handleAssignFilterReset = () => {
  assignFilter.keyword = ''
  assignPage.value = 1
  fetchAssignableAccounts()
}

const handleAssignSizeChange = (size: number) => {
  assignPageSize.value = size
  assignPage.value = 1
  fetchAssignableAccounts()
}

const handleAssignPageChange = (page: number) => {
  assignPage.value = page
  fetchAssignableAccounts()
}

const handleAssignSubmit = async () => {
  if (selectedAssignAccounts.value.length === 0) return
  try {
    assignSubmitting.value = true
    const ids = selectedAssignAccounts.value.map((a: AssignableAccount) => a.id)
    await workgroupApi.assignAccounts(props.workgroupId, ids)
    ElMessage.success(`已分配 ${ids.length} 個帳號`)
    assignDialogVisible.value = false
    fetchAccounts()
  } catch (error) {
    ElMessage.error('分配帳號失敗')
  } finally {
    assignSubmitting.value = false
  }
}

// --- Helpers ---
const getAccountStatusType = (status: string) => {
  switch (status) {
    case 'connected': return 'success'
    case 'disconnected': return 'danger'
    default: return 'info'
  }
}

const getAccountStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    connected: '已連線',
    disconnected: '已斷線',
    logged_out: '已登出',
  }
  return map[status] || status
}

// --- Init ---
onMounted(() => {
  fetchAccounts()
})
</script>

<style scoped>
.workgroup-account-tab {
  padding: 4px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.batch-bar {
  margin-bottom: 16px;
}

.assign-filter-form {
  margin-bottom: 16px;
}

.assign-mode-toggle {
  margin-bottom: 16px;
}

.condition-form {
  margin-top: 8px;
}

.condition-unit {
  margin-left: 8px;
  color: #606266;
}

.condition-match-count {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-right: 12px;
}
</style>
