<template>
  <div class="ai-tag-container">
    <div class="page-header">
      <h1>AI 標籤定義</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增標籤
        </el-button>
      </div>
    </div>

    <!-- 篩選 -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-select v-model="filterCategory" placeholder="分類" clearable style="width: 150px">
          <el-option label="關係類型" value="relationship" />
          <el-option label="對話主題" value="topic" />
        </el-select>
        <el-select v-model="filterEnabled" placeholder="狀態" clearable style="width: 120px">
          <el-option label="啟用" :value="true" />
          <el-option label="停用" :value="false" />
        </el-select>
      </div>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="filteredList" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="category" label="分類" width="120">
          <template #default="{ row }">
            <el-tag :type="row.category === 'relationship' ? 'primary' : 'success'" size="small">
              {{ row.category === 'relationship' ? '關係類型' : '對話主題' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="key" label="Key" width="160" />
        <el-table-column prop="label" label="名稱" width="120" />
        <el-table-column prop="description" label="描述（給 LLM）" min-width="250" show-overflow-tooltip />
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column prop="enabled" label="狀態" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '啟用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleEdit(row)">編輯</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row.id)">刪除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增 Dialog -->
    <el-dialog v-model="showCreateDialog" title="新增 AI 標籤定義" width="520px" @close="resetCreateForm">
      <el-form ref="createFormRef" :model="createForm" :rules="formRules" label-width="100px">
        <el-form-item label="分類" prop="category">
          <el-select v-model="createForm.category" placeholder="選擇分類">
            <el-option label="關係類型" value="relationship" />
            <el-option label="對話主題" value="topic" />
          </el-select>
        </el-form-item>
        <el-form-item label="Key" prop="key">
          <el-input v-model="createForm.key" placeholder="英文 key，如 customer" />
        </el-form-item>
        <el-form-item label="名稱" prop="label">
          <el-input v-model="createForm.label" placeholder="顯示名稱" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="給 LLM 看的說明文字" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="createForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="啟用">
          <el-switch v-model="createForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">建立</el-button>
      </template>
    </el-dialog>

    <!-- 編輯 Dialog -->
    <el-dialog v-model="showEditDialog" title="編輯 AI 標籤定義" width="520px">
      <el-form ref="editFormRef" :model="editForm" :rules="formRules" label-width="100px">
        <el-form-item label="分類" prop="category">
          <el-select v-model="editForm.category" placeholder="選擇分類">
            <el-option label="關係類型" value="relationship" />
            <el-option label="對話主題" value="topic" />
          </el-select>
        </el-form-item>
        <el-form-item label="Key" prop="key">
          <el-input v-model="editForm.key" placeholder="英文 key" />
        </el-form-item>
        <el-form-item label="名稱" prop="label">
          <el-input v-model="editForm.label" placeholder="顯示名稱" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="給 LLM 看的說明文字" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="editForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="啟用">
          <el-switch v-model="editForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdate">儲存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { aiTagApi, type AiTagDefinition, type CreateAiTagDefinitionRequest } from '@/api/ai-tag'

// State
const loading = ref(false)
const submitting = ref(false)
const dataList = ref<AiTagDefinition[]>([])
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const currentEditId = ref<number | null>(null)

// Filters
const filterCategory = ref('')
const filterEnabled = ref<boolean | ''>('')

const filteredList = computed(() => {
  return dataList.value.filter(item => {
    if (filterCategory.value && item.category !== filterCategory.value) return false
    if (filterEnabled.value !== '' && item.enabled !== filterEnabled.value) return false
    return true
  })
})

// Forms
const createForm = reactive<CreateAiTagDefinitionRequest>({
  category: 'relationship',
  key: '',
  label: '',
  description: '',
  sort_order: 0,
  enabled: true
})

const editForm = reactive<CreateAiTagDefinitionRequest>({
  category: '',
  key: '',
  label: '',
  description: '',
  sort_order: 0,
  enabled: true
})

const createFormRef = ref()
const editFormRef = ref()

const formRules = {
  category: [{ required: true, message: '請選擇分類', trigger: 'change' }],
  key: [{ required: true, message: '請輸入 Key', trigger: 'blur' }],
  label: [{ required: true, message: '請輸入名稱', trigger: 'blur' }]
}

// Methods
const fetchList = async () => {
  loading.value = true
  try {
    const res = await aiTagApi.list({ page: 1, page_size: 200 })
    const data = res.data
    dataList.value = Array.isArray(data) ? data : (data?.list || [])
  } catch (error) {
    console.error('Failed to fetch AI tag definitions:', error)
    ElMessage.error('載入失敗')
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  try {
    await createFormRef.value.validate()
    submitting.value = true
    await aiTagApi.create(createForm)
    ElMessage.success('建立成功')
    showCreateDialog.value = false
    resetCreateForm()
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '建立失敗')
    }
  } finally {
    submitting.value = false
  }
}

const resetCreateForm = () => {
  createForm.category = 'relationship'
  createForm.key = ''
  createForm.label = ''
  createForm.description = ''
  createForm.sort_order = 0
  createForm.enabled = true
}

const handleEdit = (row: AiTagDefinition) => {
  currentEditId.value = row.id
  editForm.category = row.category
  editForm.key = row.key
  editForm.label = row.label
  editForm.description = row.description
  editForm.sort_order = row.sort_order
  editForm.enabled = row.enabled
  showEditDialog.value = true
}

const handleUpdate = async () => {
  if (!currentEditId.value) return
  try {
    await editFormRef.value.validate()
    submitting.value = true
    await aiTagApi.update(currentEditId.value, editForm)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '更新失敗')
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('確定要刪除此標籤定義？', '提示', {
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await aiTagApi.delete(id)
    ElMessage.success('刪除成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '刪除失敗')
    }
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.ai-tag-container {
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

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.table-card {
  margin-bottom: 20px;
}
</style>
