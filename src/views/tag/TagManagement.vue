<template>
  <div class="tag-management-container">
    <!-- Header -->
    <div class="page-header">
      <h1>标签管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          添加标签
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="searchForm.query"
          placeholder="搜索标签名称或描述"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="filterForm.color" placeholder="颜色" style="width: 150px" clearable>
          <el-option label="全部颜色" value="" />
          <el-option
            v-for="color in colorOptions"
            :key="color"
            :label="color"
            :value="color"
          >
            <div style="display: flex; align-items: center; gap: 8px;">
              <div
                style="width: 16px; height: 16px; border-radius: 50%; border: 1px solid #ddd;"
                :style="{ backgroundColor: color }"
              />
              <span>{{ color }}</span>
            </div>
          </el-option>
        </el-select>

        <el-input-number
          v-model="filterForm.minAccountCount"
          :min="0"
          placeholder="最小账号数"
          style="width: 150px"
        />

        <el-button type="primary" @click="handleFilter">
          <el-icon><Search /></el-icon>
          筛选
        </el-button>
        <el-button @click="handleResetFilter">重置</el-button>
      </div>
    </el-card>

    <!-- Quick Stats -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ tags.length }}</div>
          <div class="stat-label">总标签数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ usedTags.length }}</div>
          <div class="stat-label">已使用标签</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ emptyTags.length }}</div>
          <div class="stat-label">未使用标签</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ Object.keys(colorGroups).length }}</div>
          <div class="stat-label">使用颜色数</div>
        </div>
      </el-card>
    </div>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tags"
        @sort-change="handleSort"
        stripe
        style="width: 100%"
      >

        <el-table-column prop="id" label="ID" width="80" sortable="custom" />

        <el-table-column prop="name" label="标签名称" width="150" sortable="custom">
          <template #default="{ row }">
            <el-tag :color="row.color" size="default">
              {{ row.name }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="source_key" label="来源代码" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.source_key" type="success" effect="plain" size="small">
              {{ row.source_key }}
            </el-tag>
            <span v-else style="color: #999; font-size: 12px">未设置</span>
          </template>
        </el-table-column>

        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span>{{ row.description || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="color" label="颜色" width="120">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div
                style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid #ddd;"
                :style="{ backgroundColor: row.color }"
              />
              <span style="font-family: monospace; font-size: 12px;">{{ row.color }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="account_count" label="账号数量" width="100" sortable="custom">
          <template #default="{ row }">
            <el-tag :type="formatUserCount(row.account_count).type" size="small">
              {{ formatUserCount(row.account_count).text }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160" sortable="custom">
          <template #default="{ row }">
            <span>{{ new Date(row.created_at).toLocaleString() }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="updated_at" label="更新时间" width="160" sortable="custom">
          <template #default="{ row }">
            <span>{{ new Date(row.updated_at).toLocaleString() }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row.id)">
              <el-icon><Delete /></el-icon>
              删除
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

    <!-- Create Tag Dialog -->
    <el-dialog v-model="showCreateDialog" title="添加标签" width="500px">
      <el-form
        ref="createFormRef"
        :model="tagForm"
        :rules="tagFormRules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="来源代码" prop="source_key">
          <el-input
            v-model="tagForm.source_key"
            placeholder="如: FB_AD_2024 (用于 ?source=xxx)"
            maxlength="50"
          >
            <template #prepend>source=</template>
          </el-input>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            用户通过 ?source=此代码 访问时，自动获得该标签
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="tagForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签描述"
          />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <div class="color-picker-container">
            <el-color-picker v-model="tagForm.color" />
            <el-input
              v-model="tagForm.color"
              placeholder="#ffffff"
              style="margin-left: 12px; width: 200px;"
            />
          </div>
          <div class="color-presets">
            <div
              v-for="color in colorOptions"
              :key="color"
              class="color-preset"
              :class="{ active: tagForm.color === color }"
              :style="{ backgroundColor: color }"
              @click="tagForm.color = color"
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- Edit Tag Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑标签" width="500px">
      <el-form
        ref="editFormRef"
        :model="editTagForm"
        :rules="tagFormRules"
        label-width="80px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="editTagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="来源代码" prop="source_key">
          <el-input
            v-model="editTagForm.source_key"
            placeholder="如: FB_AD_2024 (用于 ?source=xxx)"
            maxlength="50"
          >
            <template #prepend>source=</template>
          </el-input>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            用户通过 ?source=此代码 访问时，自动获得该标签
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editTagForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签描述"
          />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <div class="color-picker-container">
            <el-color-picker v-model="editTagForm.color" />
            <el-input
              v-model="editTagForm.color"
              placeholder="#ffffff"
              style="margin-left: 12px; width: 200px;"
            />
          </div>
          <div class="color-presets">
            <div
              v-for="color in colorOptions"
              :key="color"
              class="color-preset"
              :class="{ active: editTagForm.color === color }"
              :style="{ backgroundColor: color }"
              @click="editTagForm.color = color"
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleUpdate">更新</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAccountTag } from '@/composables/useAccountTag'
import type { AccountTag } from '@/api/tag'

// Composables
const {
  tags,
  loading,
  paginationInfo,
  tagForm,
  editTagForm,
  usedTags,
  emptyTags,
  colorGroups,
  tagFormRules,
  colorOptions,
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  resetTagForm,
  resetEditTagForm,
  setEditTagForm,
  setFilters,
  resetFilters,
  handlePageChange,
  handlePageSizeChange,
  handleSort,
  formatUserCount
} = useAccountTag()

// Dialog states
const showCreateDialog = ref(false)
const showEditDialog = ref(false)

// Form refs
const createFormRef = ref()
const editFormRef = ref()

// Current editing tag
const currentEditingTag = ref<AccountTag | null>(null)

// Search and filter forms
const searchForm = reactive({
  query: ''
})

const filterForm = reactive({
  color: '',
  minAccountCount: undefined as number | undefined
})

// Methods
const handleSearch = async () => {
  const newFilters: any = {}

  if (searchForm.query.trim()) {
    newFilters.query = searchForm.query.trim()
  }

  // 保留现有的颜色和账号数筛选条件
  if (filterForm.color) newFilters.color = filterForm.color
  if (filterForm.minAccountCount !== undefined) newFilters.min_account_count = filterForm.minAccountCount

  setFilters(newFilters)
  paginationInfo.value.current = 1
  await fetchTags(newFilters)
}

const handleFilter = async () => {
  const filters: any = {}

  // 保留搜索查询
  if (searchForm.query.trim()) filters.query = searchForm.query.trim()

  if (filterForm.color) filters.color = filterForm.color
  if (filterForm.minAccountCount !== undefined) filters.min_account_count = filterForm.minAccountCount

  setFilters(filters)
  paginationInfo.value.current = 1
  await fetchTags(filters)
}

const handleResetFilter = async () => {
  searchForm.query = ''
  filterForm.color = ''
  filterForm.minAccountCount = undefined

  resetFilters()
  await fetchTags({})
}

const handleEdit = (tag: AccountTag) => {
  currentEditingTag.value = tag
  setEditTagForm(tag)
  showEditDialog.value = true
}

const handleDelete = async (tagId: number) => {
  const success = await deleteTag(tagId)
  if (success) {
    await fetchTags()
  }
}

const handleCreate = async () => {
  try {
    await createFormRef.value.validate()
    const success = await createTag()
    if (success) {
      showCreateDialog.value = false
      resetTagForm()
    }
  } catch (error) {
    console.error('Create tag validation failed:', error)
  }
}

const handleUpdate = async () => {
  if (!currentEditingTag.value) return

  try {
    await editFormRef.value.validate()
    const success = await updateTag(currentEditingTag.value.id)
    if (success) {
      showEditDialog.value = false
      resetEditTagForm()
      currentEditingTag.value = null
    }
  } catch (error) {
    console.error('Update tag validation failed:', error)
  }
}

// Lifecycle
onMounted(async () => {
  await fetchTags({})
})
</script>

<style scoped>
.tag-management-container {
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.color-picker-container {
  display: flex;
  align-items: center;
}

.color-presets {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.color-preset {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ddd;
  cursor: pointer;
  transition: all 0.2s;
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.batch-create-container {
  max-height: 400px;
  overflow-y: auto;
}

.batch-header {
  margin-bottom: 16px;
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.batch-item {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 16px;
}

.batch-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
}

.batch-item-form {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.empty-batch {
  text-align: center;
  padding: 20px;
}

@media (max-width: 768px) {
  .tag-management-container {
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

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .batch-item-form {
    flex-direction: column;
    align-items: stretch;
  }

  .batch-item-form > * {
    width: 100% !important;
  }
}
</style>