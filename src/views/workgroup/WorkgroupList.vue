<template>
  <div class="workgroup-list">
    <!-- 頁面頭部 -->
    <el-card class="header-card" shadow="hover">
      <div class="header-content">
        <div class="header-left">
          <h1><el-icon><Folder /></el-icon> 工作組列表</h1>
          <p>管理工作組的建立、編輯與刪除</p>
        </div>
        <div class="header-right">
          <el-button
            v-if="hasPermission('workgroup.write')"
            type="primary"
            @click="handleCreate"
            :icon="Plus"
          >
            新增工作組
          </el-button>
          <el-button @click="handleRefresh" :icon="Refresh" :loading="loading">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 篩選條件 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="關鍵詞">
          <el-input
            v-model="filters.keyword"
            placeholder="搜尋名稱 / 描述"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="狀態">
          <el-select
            v-model="filters.status"
            placeholder="請選擇狀態"
            clearable
            style="width: 150px"
          >
            <el-option label="啟用" value="active" />
            <el-option label="停用" value="disabled" />
            <el-option label="已封存" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="類型">
          <el-select
            v-model="filters.type"
            placeholder="請選擇類型"
            clearable
            style="width: 150px"
          >
            <el-option label="業務組" value="sales" />
            <el-option label="裂變組" value="marketing" />
            <el-option label="管理員" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜尋</el-button>
          <el-button @click="handleResetFilter" :icon="RefreshLeft">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工作組列表 -->
    <el-card class="table-card" shadow="hover">
      <el-table :data="workgroups" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="名稱" min-width="150" />
        <el-table-column prop="code" label="代碼" width="120" />
        <el-table-column label="類型" width="100">
          <template #default="{ row }">
            <el-tag :type="{ sales: 'primary', marketing: 'warning', admin: 'danger' }[row.type]" size="small">
              {{ { sales: '業務組', marketing: '裂變組', admin: '管理員' }[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作網址" min-width="280">
          <template #default="{ row }">
            <div class="url-cell">
              <span class="url-text">{{ getAgentUrl(row.code) }}</span>
              <el-button link type="primary" size="small" @click="copyUrl(getAgentUrl(row.code))">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="描述" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="建立時間" width="180">
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString('zh-TW') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleDetail(row)" :icon="View">
              詳情
            </el-button>
            <el-button
              v-if="hasPermission('workgroup.write') && row.code !== 'admin'"
              size="small"
              type="warning"
              @click="handleEdit(row)"
              :icon="Edit"
            >
              編輯
            </el-button>
            <el-button
              v-if="hasPermission('workgroup.write') && row.status !== 'archived' && row.code !== 'admin'"
              size="small"
              type="info"
              @click="handleArchive(row)"
              :icon="FolderRemove"
            >
              封存
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分頁 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增 / 編輯對話框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '編輯工作組' : '新增工作組'"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-form-item label="名稱" prop="name">
          <el-input v-model="formData.name" placeholder="請輸入工作組名稱" />
        </el-form-item>
        <el-form-item label="類型" prop="type">
          <el-select v-model="formData.type" :disabled="isEdit" style="width: 100%">
            <el-option label="業務組" value="sales" />
            <el-option label="裂變組" value="marketing" />
            <el-option label="管理員" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="代碼" prop="code">
          <div style="display: flex; gap: 8px; width: 100%;">
            <el-input
              v-model="formData.code"
              placeholder="留空自動生成，或自行輸入代碼"
              style="flex: 1"
            />
            <el-button @click="handleGenerateCode">
              生成
            </el-button>
          </div>
          <div v-if="isEdit" class="form-tip">修改代碼後，業務員需使用新代碼登入</div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="請輸入描述（選填）"
          />
        </el-form-item>
        <el-form-item v-if="isEdit" label="狀態" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">啟用</el-radio>
            <el-radio value="disabled">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          確定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Folder,
  Plus,
  Refresh,
  Search,
  RefreshLeft,
  View,
  Edit,
  FolderRemove,
  CopyDocument
} from '@element-plus/icons-vue'
import { workgroupApi, type Workgroup } from '@/api/workgroup'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const { hasPermission } = usePermission()

// 資料
const loading = ref(false)
const workgroups = ref<Workgroup[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 篩選
const filters = reactive({
  keyword: '',
  status: '',
  type: ''
})

// 對話框
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const formData = reactive({
  name: '',
  code: '',
  type: 'sales' as 'sales' | 'marketing',
  description: '',
  status: 'active' as 'active' | 'disabled'
})

const formRules = reactive<FormRules>({
  name: [
    { required: true, message: '請輸入工作組名稱', trigger: 'blur' },
    { min: 1, max: 100, message: '長度在 1 到 100 個字元', trigger: 'blur' }
  ],
  code: [
    { pattern: /^[a-zA-Z0-9_-]*$/, message: '僅限英文、數字、底線、連字號', trigger: 'blur' }
  ]
})

// 操作網址
const agentBaseUrl = import.meta.env.VITE_AGENT_BASE_URL || window.location.origin

const getAgentUrl = (code: string) => {
  return `${agentBaseUrl}?code=${code}`
}

const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('已複製到剪貼簿')
  } catch {
    ElMessage.error('複製失敗')
  }
}

// 生成代碼
const handleGenerateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  formData.code = code
}

// 載入工作組列表
const loadWorkgroups = async () => {
  loading.value = true
  try {
    const res = await workgroupApi.getList({
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: filters.keyword,
      status: filters.status,
      type: filters.type
    })
    workgroups.value = res.list || []
    pagination.total = res.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '載入工作組列表失敗')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadWorkgroups()
}

const handleSearch = () => {
  pagination.page = 1
  loadWorkgroups()
}

const handleResetFilter = () => {
  filters.keyword = ''
  filters.status = ''
  filters.type = ''
  handleSearch()
}

const handleSizeChange = () => {
  loadWorkgroups()
}

const handleCurrentChange = () => {
  loadWorkgroups()
}

// 詳情
const handleDetail = (row: Workgroup) => {
  router.push({ name: 'WorkgroupDetail', params: { id: row.id } })
}

// 新增
const handleCreate = () => {
  isEdit.value = false
  editingId.value = null
  Object.assign(formData, {
    name: '',
    code: '',
    type: 'sales',
    description: '',
    status: 'active'
  })
  dialogVisible.value = true
}

// 編輯
const handleEdit = (row: Workgroup) => {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(formData, {
    name: row.name,
    code: row.code,
    description: row.description || '',
    status: row.status
  })
  dialogVisible.value = true
}

// 提交表單
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    submitting.value = true
    try {
      if (isEdit.value && editingId.value) {
        await workgroupApi.update(editingId.value, {
          name: formData.name,
          code: formData.code,
          description: formData.description,
          status: formData.status
        })
        ElMessage.success('更新成功')
      } else {
        await workgroupApi.create({
          name: formData.name,
          code: formData.code || undefined,
          type: formData.type,
          description: formData.description || undefined
        })
        ElMessage.success('建立成功')
      }
      dialogVisible.value = false
      loadWorkgroups()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失敗')
    } finally {
      submitting.value = false
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 封存
const handleArchive = async (row: Workgroup) => {
  try {
    await ElMessageBox.confirm(
      `確定要封存工作組「${row.name}」嗎？封存後帳號分配將保留。`,
      '確認封存',
      {
        type: 'warning',
        confirmButtonText: '確定封存',
        cancelButtonText: '取消'
      }
    )

    await workgroupApi.archive(row.id)
    ElMessage.success('封存成功')
    loadWorkgroups()
  } catch (error: any) {
    if (error === 'cancel') return
  }
}

const statusTagType = (status: string) => {
  const map: Record<string, string> = { active: 'success', disabled: 'info', archived: 'warning' }
  return map[status] || 'info'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = { active: '啟用', disabled: '停用', archived: '已封存' }
  return map[status] || status
}

onMounted(() => {
  loadWorkgroups()
})
</script>

<style scoped lang="scss">
.workgroup-list {
  padding: 20px;

  .header-card {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      }

      .header-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .url-cell {
    display: flex;
    align-items: center;
    gap: 4px;

    .url-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
      color: #606266;
    }
  }

  .form-tip {
    color: #e6a23c;
    font-size: 12px;
    line-height: 1.4;
    margin-top: 4px;
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
