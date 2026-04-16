<template>
  <div class="workgroup-agent-tab">
    <!-- 篩選條件 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="關鍵詞">
          <el-input
            v-model="filters.keyword"
            placeholder="搜尋帳號"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="filters.role"
            placeholder="請選擇角色"
            clearable
            style="width: 150px"
          >
            <el-option label="組長" value="leader" />
            <el-option label="組員" value="member" />
          </el-select>
        </el-form-item>
        <el-form-item label="狀態">
          <el-select
            v-model="filters.status"
            placeholder="請選擇狀態"
            clearable
            style="width: 150px"
          >
            <el-option label="啟用" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜尋</el-button>
          <el-button @click="handleResetFilter" :icon="RefreshLeft">重置</el-button>
        </el-form-item>
      </el-form>
      <el-button
        v-if="hasPermission('agent.write')"
        type="primary"
        @click="handleCreate"
        :icon="Plus"
      >
        新增業務員
      </el-button>
    </div>
    <!-- 業務員列表 -->
    <el-table :data="agents" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="username" label="帳號" min-width="120" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          <el-tag :type="row.role === 'leader' ? 'primary' : 'success'" size="small">
            {{ row.role === 'leader' ? '組長' : '組員' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="狀態" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '啟用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最後登入" min-width="180">
        <template #default="{ row }">
          <template v-if="row.last_login_at">
            <div>{{ formatDate(row.last_login_at) }}</div>
            <div v-if="row.last_login_ip" style="color: #999; font-size: 12px">
              {{ row.last_login_ip }}
            </div>
          </template>
          <span v-else style="color: #999">從未登入</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="hasPermission('agent.write')"
            size="small"
            type="primary"
            @click="handleEdit(row)"
            :icon="Edit"
          >
            編輯
          </el-button>
          <el-button
            v-if="hasPermission('agent.write')"
            size="small"
            type="warning"
            @click="handleResetPassword(row)"
            :icon="Key"
          >
            重置密碼
          </el-button>
          <el-button
            v-if="hasPermission('agent.delete')"
            size="small"
            type="danger"
            @click="handleDelete(row)"
            :icon="Delete"
          >
            刪除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分頁 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadAgents"
        @current-change="loadAgents"
      />
    </div>
    <!-- 新增業務員對話框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新增業務員"
      width="600px"
      @close="handleCreateDialogClose"
    >
      <el-form
        ref="createFormRef"
        :model="createFormData"
        :rules="createFormRules"
        label-width="120px"
      >
        <el-form-item label="登入帳號" prop="username">
          <el-input v-model="createFormData.username" placeholder="請輸入登入帳號" />
        </el-form-item>
        <el-form-item label="初始密碼" prop="password">
          <el-input
            v-model="createFormData.password"
            type="password"
            placeholder="請輸入初始密碼"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createFormData.role" placeholder="請選擇角色" style="width: 100%">
            <el-option label="組長" value="leader" />
            <el-option label="組員" value="member" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateSubmit" :loading="submitting">
          確定
        </el-button>
      </template>
    </el-dialog>
    <!-- 編輯業務員對話框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="編輯業務員"
      width="600px"
      @close="handleEditDialogClose"
    >
      <el-form
        ref="editFormRef"
        :model="editFormData"
        :rules="editFormRules"
        label-width="120px"
      >
        <el-form-item label="登入帳號">
          <el-input :model-value="editFormData.username" disabled />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editFormData.role" placeholder="請選擇角色" style="width: 100%">
            <el-option label="組長" value="leader" />
            <el-option label="組員" value="member" />
          </el-select>
        </el-form-item>
        <el-form-item label="狀態" prop="status">
          <el-radio-group v-model="editFormData.status">
            <el-radio value="active">啟用</el-radio>
            <el-radio value="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit" :loading="submitting">
          確定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密碼對話框 -->
    <el-dialog
      v-model="resetPwdDialogVisible"
      title="重置密碼"
      width="450px"
      @close="handleResetPwdDialogClose"
    >
      <el-form
        ref="resetPwdFormRef"
        :model="resetPwdFormData"
        :rules="resetPwdFormRules"
        label-width="100px"
      >
        <el-form-item label="新密碼" prop="new_password">
          <el-input
            v-model="resetPwdFormData.new_password"
            type="password"
            placeholder="請輸入新密碼（至少 6 位）"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPwdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResetPwdSubmit" :loading="submitting">
          確定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search, RefreshLeft, Edit, Delete, Plus, Key } from '@element-plus/icons-vue'
import { agentApi, type Agent, type CreateAgentRequest, type UpdateAgentRequest } from '@/api/agent'
import { usePermission } from '@/composables/usePermission'

const props = defineProps<{ workgroupId: number }>()
const { hasPermission } = usePermission()

// ==================== 資料 ====================

const loading = ref(false)
const submitting = ref(false)
const agents = ref<Agent[]>([])

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// ==================== 篩選 ====================

const filters = reactive({
  keyword: '',
  role: '',
  status: ''
})

// ==================== 新增對話框 ====================

const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const createFormData = reactive({
  username: '',
  password: '',
  role: 'member' as 'leader' | 'member'
})

const createFormRules = reactive<FormRules>({
  username: [{ required: true, message: '請輸入登入帳號', trigger: 'blur' }],
  password: [
    { required: true, message: '請輸入初始密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度不能少於 6 位', trigger: 'blur' }
  ],
  role: [{ required: true, message: '請選擇角色', trigger: 'change' }]
})

// ==================== 編輯對話框 ====================

const editDialogVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editingAgentId = ref<number>(0)
const editFormData = reactive({
  username: '',
  role: 'member' as 'leader' | 'member',
  status: 'active' as 'active' | 'inactive'
})

const editFormRules = reactive<FormRules>({
  role: [{ required: true, message: '請選擇角色', trigger: 'change' }],
  status: [{ required: true, message: '請選擇狀態', trigger: 'change' }]
})

// ==================== 重置密碼對話框 ====================

const resetPwdDialogVisible = ref(false)
const resetPwdFormRef = ref<FormInstance>()
const resetPwdAgentId = ref<number>(0)
const resetPwdFormData = reactive({ new_password: '' })

const resetPwdFormRules = reactive<FormRules>({
  new_password: [
    { required: true, message: '請輸入新密碼', trigger: 'blur' },
    { min: 6, message: '密碼長度不能少於 6 位', trigger: 'blur' }
  ]
})

// ==================== 載入資料 ====================

const loadAgents = async () => {
  loading.value = true
  try {
    const res = await agentApi.getList({
      page: pagination.page,
      page_size: pagination.page_size,
      keyword: filters.keyword || undefined,
      workgroup_id: props.workgroupId,
      role: filters.role || undefined,
      status: filters.status || undefined
    })
    agents.value = res.list || []
    pagination.total = res.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '載入業務員列表失敗')
  } finally {
    loading.value = false
  }
}

// ==================== 篩選與分頁 ====================

const handleSearch = () => {
  pagination.page = 1
  loadAgents()
}

const handleResetFilter = () => {
  filters.keyword = ''
  filters.role = ''
  filters.status = ''
  handleSearch()
}

// ==================== 新增 ====================

const handleCreate = () => {
  createDialogVisible.value = true
  Object.assign(createFormData, { username: '', password: '', role: 'member' })
}

const handleCreateSubmit = async () => {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      const data: CreateAgentRequest = {
        ...createFormData,
        workgroup_id: props.workgroupId
      }
      await agentApi.create(data)
      ElMessage.success('新增成功')
      createDialogVisible.value = false
      loadAgents()
    } catch (error: any) {
      ElMessage.error(error.message || '新增失敗')
    } finally {
      submitting.value = false
    }
  })
}

const handleCreateDialogClose = () => {
  createFormRef.value?.resetFields()
}

// ==================== 編輯 ====================

const handleEdit = (row: Agent) => {
  editingAgentId.value = row.id
  Object.assign(editFormData, {
    username: row.username,
    role: row.role,
    status: row.status
  })
  editDialogVisible.value = true
}

const handleEditSubmit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      const data: UpdateAgentRequest = {
        role: editFormData.role,
        status: editFormData.status
      }
      await agentApi.update(editingAgentId.value, data)
      ElMessage.success('更新成功')
      editDialogVisible.value = false
      loadAgents()
    } catch (error: any) {
      ElMessage.error(error.message || '更新失敗')
    } finally {
      submitting.value = false
    }
  })
}

const handleEditDialogClose = () => {
  editFormRef.value?.resetFields()
}

// ==================== 重置密碼 ====================

const handleResetPassword = (row: Agent) => {
  resetPwdAgentId.value = row.id
  resetPwdFormData.new_password = ''
  resetPwdDialogVisible.value = true
}

const handleResetPwdSubmit = async () => {
  if (!resetPwdFormRef.value) return
  await resetPwdFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      await agentApi.resetPassword(resetPwdAgentId.value, resetPwdFormData.new_password)
      ElMessage.success('密碼重置成功')
      resetPwdDialogVisible.value = false
    } catch (error: any) {
      ElMessage.error(error.message || '密碼重置失敗')
    } finally {
      submitting.value = false
    }
  })
}

const handleResetPwdDialogClose = () => {
  resetPwdFormRef.value?.resetFields()
}

// ==================== 刪除 ====================

const handleDelete = async (row: Agent) => {
  try {
    await ElMessageBox.confirm(
      `確定要刪除業務員「${row.username}」嗎？此操作不可恢復。`,
      '警告',
      { type: 'error', confirmButtonText: '確定刪除', cancelButtonText: '取消' }
    )
    await agentApi.delete(row.id)
    ElMessage.success('刪除成功')
    loadAgents()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '刪除失敗')
    }
  }
}

// ==================== 工具函式 ====================

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-TW')
}

// ==================== 生命週期 ====================

onMounted(() => {
  loadAgents()
})
</script>

<style scoped>
.workgroup-agent-tab {
  padding: 4px 0;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.filter-form {
  flex: 1;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
