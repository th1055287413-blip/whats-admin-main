<template>
  <div class="sensitive-words-container">
    <!-- Header -->
    <div class="page-header">
      <h1>敏感词管理</h1>
      <div class="header-actions">
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button type="warning" @click="handleRefreshCache">
          <el-icon><Refresh /></el-icon>
          刷新缓存
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          添加敏感词
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索敏感词"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="searchForm.matchType" placeholder="匹配类型" style="width: 150px" clearable>
          <el-option label="全部类型" value="" />
          <el-option label="精确匹配" value="exact" />
          <el-option label="模糊匹配" value="fuzzy" />
          <el-option label="正则表达式" value="regex" />
        </el-select>

        <el-select v-model="searchForm.category" placeholder="分类" style="width: 150px" clearable>
          <el-option label="全部分类" value="" />
          <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
        </el-select>

        <el-select v-model="searchForm.enabled" placeholder="状态" style="width: 120px" clearable>
          <el-option label="全部状态" :value="null" />
          <el-option label="启用" :value="true" />
          <el-option label="禁用" :value="false" />
        </el-select>

        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- Quick Stats -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ totalCount }}</div>
          <div class="stat-label">总敏感词数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ enabledCount }}</div>
          <div class="stat-label">已启用</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ disabledCount }}</div>
          <div class="stat-label">已禁用</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ categories.length }}</div>
          <div class="stat-label">分类数量</div>
        </div>
      </el-card>
    </div>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="words"
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column prop="word" label="敏感词" min-width="200">
          <template #default="{ row }">
            <el-tag effect="dark">{{ row.word }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="matchType" label="匹配类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getMatchTypeTag(row.matchType)">
              {{ getMatchTypeLabel(row.matchType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <span>{{ row.category || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-rate v-model="row.priority" disabled show-score />
          </template>
        </el-table-column>

        <el-table-column prop="replaceText" label="替换文字" min-width="150">
          <template #default="{ row }">
            <el-tag v-if="row.replaceText" type="warning" effect="plain">{{ row.replaceText }}</el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="enabled" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="createdBy" label="创建人" width="120">
          <template #default="{ row }">
            <span>{{ row.createdBy || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            <span>{{ formatTime(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm
              title="确定删除此敏感词吗?"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingWord ? '编辑敏感词' : '添加敏感词'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="敏感词" prop="word">
          <el-input v-model="formData.word" placeholder="请输入敏感词" />
        </el-form-item>

        <el-form-item label="匹配类型" prop="matchType">
          <el-select v-model="formData.matchType" placeholder="请选择匹配类型" style="width: 100%">
            <el-option label="精确匹配" value="exact" />
            <el-option label="模糊匹配" value="fuzzy" />
            <el-option label="正则表达式" value="regex" />
          </el-select>
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-input v-model="formData.category" placeholder="请输入分类,如:政治、色情等" />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-rate v-model="formData.priority" show-text :texts="['很低', '低', '中', '高', '很高']" />
        </el-form-item>

        <el-form-item label="替换文字" prop="replaceText">
          <el-input v-model="formData.replaceText" placeholder="留空表示仅告警不替换" clearable />
          <div class="text-xs text-gray-400 mt-1">设置后，当检测到敏感词时会自动撤回原消息并发送替换后的内容</div>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>

        <el-form-item label="启用状态" prop="enabled">
          <el-switch v-model="formData.enabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- Batch Import Dialog -->
    <el-dialog v-model="showBatchDialog" title="批量导入" width="600px">
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="敏感词列表">
          <el-input
            v-model="batchForm.words"
            type="textarea"
            :rows="10"
            placeholder="每行一个敏感词,格式:敏感词|匹配类型|分类|优先级&#10;例如:&#10;测试词|exact|测试|3&#10;示例.*|regex|测试|5"
          />
        </el-form-item>
        <el-alert
          title="格式说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <div>每行一个敏感词,使用竖线(|)分隔字段</div>
            <div>格式:敏感词|匹配类型|分类|优先级</div>
            <div>匹配类型:exact(精确)/fuzzy(模糊)/regex(正则)</div>
            <div>优先级:1-5的数字,1最低,5最高</div>
          </template>
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button type="primary" @click="handleBatchImport" :loading="batchImporting">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Download, Refresh, Search } from '@element-plus/icons-vue'
import { sensitiveWordApi } from '@/api/sensitive-word'

// 接口定义
interface SensitiveWord {
  id: number
  word: string
  matchType: string
  category: string
  enabled: boolean
  priority: number
  description: string
  replaceText: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

// 响应式数据
const loading = ref(false)
const words = ref<SensitiveWord[]>([])
const totalCount = ref(0)
const showCreateDialog = ref(false)
const showBatchDialog = ref(false)
const editingWord = ref<SensitiveWord | null>(null)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const batchImporting = ref(false)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  matchType: '',
  category: '',
  enabled: null as boolean | null
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20
})

// 表单数据
const formData = reactive({
  word: '',
  matchType: 'exact',
  category: '',
  priority: 3,
  description: '',
  replaceText: '',
  enabled: true
})

// 批量导入表单
const batchForm = reactive({
  words: ''
})

// 表单验证规则
const formRules: FormRules = {
  word: [
    { required: true, message: '请输入敏感词', trigger: 'blur' },
    { min: 1, max: 200, message: '长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  matchType: [
    { required: true, message: '请选择匹配类型', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

// 计算属性
const enabledCount = computed(() => words.value.filter(w => w.enabled).length)
const disabledCount = computed(() => words.value.filter(w => !w.enabled).length)
const categories = computed(() => {
  const cats = new Set(words.value.map(w => w.category).filter(c => c))
  return Array.from(cats)
})

// 获取敏感词列表
const fetchWords = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      matchType: searchForm.matchType || undefined,
      category: searchForm.category || undefined,
      enabled: searchForm.enabled !== null ? searchForm.enabled : undefined
    }
    const res = await sensitiveWordApi.list(params)
    if (res.code === 0) {
      words.value = res.data.list || []
      totalCount.value = res.data.total || 0
    } else {
      ElMessage.error(res.message || '获取敏感词列表失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取敏感词列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchWords()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.matchType = ''
  searchForm.category = ''
  searchForm.enabled = null
  pagination.page = 1
  fetchWords()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchWords()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchWords()
}

// 编辑
const handleEdit = (row: SensitiveWord) => {
  editingWord.value = row
  Object.assign(formData, {
    word: row.word,
    matchType: row.matchType,
    category: row.category,
    priority: row.priority,
    description: row.description,
    replaceText: row.replaceText || '',
    enabled: row.enabled
  })
  showCreateDialog.value = true
}

// 删除
const handleDelete = async (id: number) => {
  try {
    const res = await sensitiveWordApi.delete(id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchWords()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '删除失败')
  }
}

// 切换状态
const handleToggleStatus = async (row: SensitiveWord) => {
  try {
    const res = await sensitiveWordApi.update(row.id, {
      word: row.word,
      matchType: row.matchType,
      category: row.category,
      priority: row.priority,
      description: row.description,
      enabled: row.enabled
    })
    if (res.code === 0) {
      ElMessage.success(row.enabled ? '已启用' : '已禁用')
    } else {
      ElMessage.error(res.message || '更新失败')
      row.enabled = !row.enabled // 回滚
    }
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
    row.enabled = !row.enabled // 回滚
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const data = {
        ...formData,
        replaceText: formData.replaceText || null // 空字串轉為 null
      }
      let res

      if (editingWord.value) {
        res = await sensitiveWordApi.update(editingWord.value.id, data)
      } else {
        res = await sensitiveWordApi.create(data)
      }

      if (res.code === 0) {
        ElMessage.success(editingWord.value ? '更新成功' : '创建成功')
        showCreateDialog.value = false
        fetchWords()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 对话框关闭
const handleDialogClose = () => {
  editingWord.value = null
  formRef.value?.resetFields()
  Object.assign(formData, {
    word: '',
    matchType: 'exact',
    category: '',
    priority: 3,
    description: '',
    replaceText: '',
    enabled: true
  })
}

// 导出
const handleExport = async () => {
  try {
    const params = {
      keyword: searchForm.keyword || undefined,
      matchType: searchForm.matchType || undefined,
      category: searchForm.category || undefined,
      enabled: searchForm.enabled !== null ? searchForm.enabled : undefined
    }
    const res = await sensitiveWordApi.export(params)

    // 创建下载链接
    const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sensitive_words_${Date.now()}.csv`
    link.click()

    ElMessage.success('导出成功')
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败')
  }
}

// 刷新缓存
const handleRefreshCache = async () => {
  try {
    const res = await sensitiveWordApi.refreshCache()
    if (res.code === 0) {
      ElMessage.success('缓存刷新成功')
    } else {
      ElMessage.error(res.message || '刷新失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '刷新失败')
  }
}

// 批量导入
const handleBatchImport = async () => {
  if (!batchForm.words.trim()) {
    ElMessage.warning('请输入敏感词列表')
    return
  }

  batchImporting.value = true
  try {
    const lines = batchForm.words.trim().split('\n')
    const wordList = lines.map(line => {
      const parts = line.split('|')
      return {
        word: parts[0]?.trim() || '',
        matchType: parts[1]?.trim() || 'exact',
        category: parts[2]?.trim() || '',
        priority: parseInt(parts[3]) || 3,
        enabled: true
      }
    }).filter(w => w.word)

    const res = await sensitiveWordApi.batchCreate(wordList)
    if (res.code === 0) {
      ElMessage.success(`成功导入 ${wordList.length} 个敏感词`)
      showBatchDialog.value = false
      batchForm.words = ''
      fetchWords()
    } else {
      ElMessage.error(res.message || '导入失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    batchImporting.value = false
  }
}

// 工具函数
const getMatchTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    exact: '精确',
    fuzzy: '模糊',
    regex: '正则'
  }
  return map[type] || type
}

const getMatchTypeTag = (type: string) => {
  const map: Record<string, string> = {
    exact: 'success',
    fuzzy: 'warning',
    regex: 'danger'
  }
  return map[type] || ''
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  fetchWords()
})
</script>

<style scoped lang="scss">
.sensitive-words-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.filter-card {
  margin-bottom: 20px;

  .filter-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;

  .stat-card {
    .stat-content {
      text-align: center;
      padding: 10px;

      .stat-value {
        font-size: 32px;
        font-weight: bold;
        color: #409eff;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.table-card {
  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
