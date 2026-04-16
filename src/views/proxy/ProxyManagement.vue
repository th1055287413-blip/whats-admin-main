<template>
  <div class="proxy-management-container">
    <!-- Header -->
    <div class="page-header">
      <h1>代理配置管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增代理
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索代理名称或主机"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="searchForm.status" placeholder="状态" style="width: 150px" clearable>
          <el-option label="全部状态" value="" />
          <el-option label="启用" value="enabled" />
          <el-option label="禁用" value="disabled" />
        </el-select>

        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="proxyList" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column prop="name" label="名称" width="150" />

        <el-table-column prop="host" label="主机" width="200">
          <template #default="{ row }">
            <span style="font-family: monospace;">{{ row.host }}:{{ row.port }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'socks5' ? 'primary' : 'success'" size="small">
              {{ row.type.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="username" label="用户名" width="120">
          <template #default="{ row }">
            {{ row.username || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'danger'" size="small">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="connector_count" label="使用中" width="100">
          <template #default="{ row }">
            <el-tag :type="row.connector_count > 0 ? 'warning' : 'info'" size="small">
              {{ row.connector_count }} 个
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="备注" min-width="150">
          <template #default="{ row }">
            {{ row.remark || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleToggleStatus(row)">
              {{ row.status === 'enabled' ? '禁用' : '启用' }}
            </el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="row.connector_count > 0"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Create Dialog -->
    <el-dialog v-model="showCreateDialog" title="新增代理配置" width="500px">
      <el-form ref="createFormRef" :model="createForm" :rules="formRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入代理名称" />
        </el-form-item>
        <el-form-item label="主机" prop="host">
          <el-input v-model="createForm.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="createForm.port" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="createForm.type" style="width: 100%">
            <el-option label="SOCKS5" value="socks5" />
            <el-option label="HTTP" value="http" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" placeholder="可选" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="可选" show-password />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑代理配置" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="formRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入代理名称" />
        </el-form-item>
        <el-form-item label="主机" prop="host">
          <el-input v-model="editForm.host" placeholder="请输入主机地址" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="editForm.port" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="editForm.type" style="width: 100%">
            <el-option label="SOCKS5" value="socks5" />
            <el-option label="HTTP" value="http" />
          </el-select>
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" placeholder="可选" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="editForm.password" type="password" placeholder="留空保持不变" show-password />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdate">更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import {
  getProxyConfigList,
  createProxyConfig,
  updateProxyConfig,
  updateProxyConfigStatus,
  deleteProxyConfig,
  type ProxyConfigListItem,
  type CreateProxyConfigRequest,
  type UpdateProxyConfigRequest
} from '@/api/proxy'

// State
const loading = ref(false)
const submitting = ref(false)
const proxyList = ref<ProxyConfigListItem[]>([])
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const currentEditId = ref<number | null>(null)

// Pagination
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// Search form
const searchForm = reactive({
  keyword: '',
  status: '' as '' | 'enabled' | 'disabled'
})

// Create form
const createForm = reactive<CreateProxyConfigRequest>({
  name: '',
  host: '',
  port: 1080,
  type: 'socks5',
  username: '',
  password: '',
  remark: ''
})

// Edit form
const editForm = reactive<UpdateProxyConfigRequest>({
  name: '',
  host: '',
  port: 1080,
  type: 'socks5',
  username: '',
  password: '',
  remark: ''
})

// Form refs
const createFormRef = ref()
const editFormRef = ref()

// Form rules
const formRules = {
  name: [{ required: true, message: '请输入代理名称', trigger: 'blur' }],
  host: [{ required: true, message: '请输入主机地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }]
}

// Methods
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const fetchList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.page_size
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status

    const res = await getProxyConfigList(params)
    proxyList.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('Failed to fetch proxy list:', error)
    ElMessage.error('获取代理列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  pagination.page = 1
  fetchList()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchList()
}

const handlePageSizeChange = (size: number) => {
  pagination.page_size = size
  pagination.page = 1
  fetchList()
}

const resetCreateForm = () => {
  createForm.name = ''
  createForm.host = ''
  createForm.port = 1080
  createForm.type = 'socks5'
  createForm.username = ''
  createForm.password = ''
  createForm.remark = ''
}

const handleCreate = async () => {
  try {
    await createFormRef.value.validate()
    submitting.value = true
    await createProxyConfig(createForm)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    resetCreateForm()
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to create proxy:', error)
      ElMessage.error(error?.response?.data?.error || '创建失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleEdit = (row: ProxyConfigListItem) => {
  currentEditId.value = row.id
  editForm.name = row.name
  editForm.host = row.host
  editForm.port = row.port
  editForm.type = row.type
  editForm.username = row.username || ''
  editForm.password = ''
  editForm.remark = row.remark || ''
  showEditDialog.value = true
}

const handleUpdate = async () => {
  if (!currentEditId.value) return
  try {
    await editFormRef.value.validate()
    submitting.value = true

    const updateData: UpdateProxyConfigRequest = {
      name: editForm.name,
      host: editForm.host,
      port: editForm.port,
      type: editForm.type,
      username: editForm.username,
      remark: editForm.remark
    }
    if (editForm.password) {
      updateData.password = editForm.password
    }

    await updateProxyConfig(currentEditId.value, updateData)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to update proxy:', error)
      ElMessage.error(error?.response?.data?.error || '更新失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleToggleStatus = async (row: ProxyConfigListItem) => {
  const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
  const statusText = newStatus === 'enabled' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${statusText}代理 "${row.name}" 吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await updateProxyConfigStatus(row.id, newStatus)
    ElMessage.success(`${statusText}成功`)
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to toggle proxy status:', error)
      ElMessage.error(error?.response?.data?.error || `${statusText}失败`)
    }
  }
}

const handleDelete = async (row: ProxyConfigListItem) => {
  try {
    await ElMessageBox.confirm(`确定要删除代理 "${row.name}" 吗？此操作不可恢复。`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'danger'
    })

    await deleteProxyConfig(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete proxy:', error)
      ElMessage.error(error?.response?.data?.error || '删除失败')
    }
  }
}

// Lifecycle
onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.proxy-management-container {
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

@media (max-width: 768px) {
  .proxy-management-container {
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
