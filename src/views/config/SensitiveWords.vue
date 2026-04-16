<template>
  <div class="sensitive-words">
    <!-- 页面头部 -->
    <div class="words-header">
      <div class="header-main">
        <h2>敏感词管理</h2>
        <p class="description">管理敏感词库，配置检测规则和分类</p>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          :icon="Plus"
          @click="showCreateDialog"
          v-if="configStore.hasPermission('canWrite')"
        >
          添加敏感词
        </el-button>
        <el-button
          type="success"
          :icon="Upload"
          @click="showImportDialog"
          v-if="configStore.hasPermission('canImport')"
        >
          批量导入
        </el-button>
        <el-button
          type="info"
          :icon="Download"
          @click="exportWords"
          v-if="configStore.hasPermission('canExport')"
        >
          导出词库
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="words-stats" v-if="stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">总敏感词数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-value active-count">{{ stats.byStatus?.active || 0 }}</div>
              <div class="stat-label">启用中</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-value high-count">{{ stats.bySeverity?.high || 0 }}</div>
              <div class="stat-label">高风险</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-content">
              <div class="stat-value">{{ Object.keys(stats.byCategory || {}).length }}</div>
              <div class="stat-label">分类数量</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选 -->
    <div class="words-search">
      <el-card shadow="never">
        <el-form :model="searchForm" inline>
          <el-form-item label="搜索词汇">
            <el-input
              v-model="searchForm.keyword"
              placeholder="输入敏感词内容"
              :prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="分类">
            <el-select
              v-model="searchForm.category"
              placeholder="选择分类"
              clearable
              style="width: 150px"
              @change="handleSearch"
            >
              <el-option
                v-for="category in configStore.sensitiveWordCategories"
                :key="category.category"
                :label="category.categoryName"
                :value="category.category"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="匹配类型">
            <el-select
              v-model="searchForm.matchType"
              placeholder="匹配类型"
              clearable
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="精确匹配" value="exact" />
              <el-option label="模糊匹配" value="fuzzy" />
              <el-option label="正则表达式" value="regex" />
            </el-select>
          </el-form-item>
          <el-form-item label="风险等级">
            <el-select
              v-model="searchForm.severity"
              placeholder="风险等级"
              clearable
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="低风险" value="low" />
              <el-option label="中风险" value="medium" />
              <el-option label="高风险" value="high" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="状态"
              clearable
              style="width: 100px"
              @change="handleSearch"
            >
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 敏感词检测测试 -->
    <div class="detection-test">
      <el-card shadow="never">
        <template #header>
          <div class="test-header">
            <span>敏感词检测测试</span>
            <el-button
              type="primary"
              size="small"
              :loading="testLoading"
              @click="testDetection"
              :disabled="!testText.trim()"
            >
              检测
            </el-button>
          </div>
        </template>
        <div class="test-content">
          <el-input
            v-model="testText"
            type="textarea"
            :rows="3"
            placeholder="请输入要检测的文本内容..."
            @keyup.ctrl.enter="testDetection"
          />
          <div v-if="testResult" class="test-result">
            <div class="result-header">
              <span>检测结果:</span>
              <el-tag
                :type="testResult.hasViolation ? 'danger' : 'success'"
                size="small"
              >
                {{ testResult.hasViolation ? '发现敏感内容' : '未发现敏感内容' }}
              </el-tag>
            </div>
            <div v-if="testResult.matches.length > 0" class="matches">
              <div
                v-for="(match, index) in testResult.matches"
                :key="index"
                class="match-item"
              >
                <el-tag :type="getSeverityType(match.severity)" size="small">
                  {{ match.word }}
                </el-tag>
                <span class="match-info">
                  {{ match.category }} - {{ getSeverityLabel(match.severity) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 敏感词列表 -->
    <div class="words-table">
      <el-card shadow="never">
        <template #header>
          <div class="table-header">
            <span>敏感词列表</span>
            <div class="header-actions">
              <el-button
                v-if="selectedWords.length > 0"
                type="success"
                size="small"
                @click="batchOperation('enable')"
              >
                批量启用
              </el-button>
              <el-button
                v-if="selectedWords.length > 0"
                type="warning"
                size="small"
                @click="batchOperation('disable')"
              >
                批量禁用
              </el-button>
              <el-button
                v-if="selectedWords.length > 0"
                type="danger"
                size="small"
                @click="batchOperation('delete')"
              >
                批量删除
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          v-loading="configStore.sensitiveWordsLoading"
          :data="configStore.sensitiveWords"
          @selection-change="handleSelectionChange"
          stripe
        >
          <el-table-column type="selection" width="55" />

          <el-table-column label="敏感词" prop="word" min-width="120">
            <template #default="{ row }">
              <el-text class="word-content" :type="getStatusType(row.status)">
                {{ row.word }}
              </el-text>
            </template>
          </el-table-column>

          <el-table-column label="分类" prop="category" width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">
                {{ getCategoryName(row.category) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="匹配类型" prop="matchType" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getMatchTypeColor(row.matchType)"
                size="small"
                effect="plain"
              >
                {{ getMatchTypeLabel(row.matchType) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="风险等级" prop="severity" width="100">
            <template #default="{ row }">
              <el-tag
                :type="getSeverityType(row.severity)"
                size="small"
              >
                {{ getSeverityLabel(row.severity) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="状态" prop="status" width="80">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                active-value="active"
                inactive-value="disabled"
                :disabled="!configStore.hasPermission('canWrite')"
                @change="toggleWordStatus(row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="描述" prop="description" min-width="150">
            <template #default="{ row }">
              <el-text class="description-text" line-clamp="2">
                {{ row.description || '-' }}
              </el-text>
            </template>
          </el-table-column>

          <el-table-column label="更新时间" prop="updatedAt" width="160">
            <template #default="{ row }">
              {{ formatDate(row.updatedAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                text
                @click="showEditDialog(row)"
                v-if="configStore.hasPermission('canWrite')"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="deleteWord(row)"
                v-if="configStore.hasPermission('canDelete')"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="searchForm.page"
            v-model:page-size="searchForm.pageSize"
            :total="configStore.pagination.sensitiveWord.total"
            :page-sizes="[20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 创建/编辑敏感词对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editingWord ? '编辑敏感词' : '添加敏感词'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="敏感词" prop="word">
          <el-input
            v-model="editForm.word"
            placeholder="请输入敏感词"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select
            v-model="editForm.category"
            placeholder="选择分类"
            style="width: 100%"
            filterable
            allow-create
          >
            <el-option
              v-for="category in configStore.sensitiveWordCategories"
              :key="category.category"
              :label="category.categoryName"
              :value="category.category"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="匹配类型" prop="matchType">
          <el-select v-model="editForm.matchType" style="width: 100%">
            <el-option label="精确匹配" value="exact" />
            <el-option label="模糊匹配" value="fuzzy" />
            <el-option label="正则表达式" value="regex" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级" prop="severity">
          <el-select v-model="editForm.severity" style="width: 100%">
            <el-option label="低风险" value="low" />
            <el-option label="中风险" value="medium" />
            <el-option label="高风险" value="high" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="editForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="editLoading"
          @click="submitEdit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="批量导入敏感词"
      width="800px"
      :close-on-click-modal="false"
    >
      <WordImport
        v-if="importDialogVisible"
        @success="handleImportSuccess"
        @close="importDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Upload,
  Download,
  Search
} from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import { useConfig } from '@/composables/useConfig'
import WordImport from '@/components/config/WordImport.vue'
import type {
  SensitiveWord,
  SensitiveWordRequest,
  SensitiveWordSearchParams
} from '@/types/config'

// ============= 响应式数据 =============
const configStore = useConfigStore()
const configUseConfig = useConfig()

// 搜索表单
const searchForm = ref<SensitiveWordSearchParams>({
  keyword: '',
  category: '',
  matchType: undefined,
  severity: undefined,
  status: undefined,
  page: 1,
  pageSize: 20
})

// 检测测试
const testText = ref('')
const testLoading = ref(false)
const testResult = ref<any>(null)

// 列表选择
const selectedWords = ref<SensitiveWord[]>([])

// 编辑对话框
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editFormRef = ref()
const editingWord = ref<SensitiveWord | null>(null)
const editForm = ref<SensitiveWordRequest>({
  word: '',
  category: '',
  matchType: 'exact',
  severity: 'medium',
  status: 'active',
  description: ''
})

// 导入对话框
const importDialogVisible = ref(false)

// 统计信息
const stats = ref<any>(null)

// ============= 计算属性 =============

// 编辑表单验证规则
const editRules = computed(() => ({
  word: [
    { required: true, message: '请输入敏感词', trigger: 'blur' },
    { min: 1, max: 200, message: '长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  matchType: [
    { required: true, message: '请选择匹配类型', trigger: 'change' }
  ],
  severity: [
    { required: true, message: '请选择风险等级', trigger: 'change' }
  ]
}))

// ============= 生命周期 =============
onMounted(async () => {
  await initData()
})

// ============= 方法 =============

/**
 * 初始化数据
 */
async function initData() {
  await Promise.all([
    configUseConfig.initSensitiveWords(),
    fetchStats()
  ])
}

/**
 * 获取统计信息
 */
async function fetchStats() {
  try {
    const response = await configStore.configApi.sensitiveWord.getStats()
    stats.value = response.data
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

/**
 * 处理搜索
 */
async function handleSearch() {
  await configStore.searchSensitiveWords(searchForm.value)
}

/**
 * 重置搜索
 */
async function resetSearch() {
  searchForm.value = {
    keyword: '',
    category: '',
    matchType: undefined,
    severity: undefined,
    status: undefined,
    page: 1,
    pageSize: 20
  }
  await configStore.searchSensitiveWords({})
}

/**
 * 敏感词检测测试
 */
async function testDetection() {
  if (!testText.value.trim()) {
    ElMessage.warning('请输入要检测的文本')
    return
  }

  testLoading.value = true
  try {
    testResult.value = await configUseConfig.testSensitiveWordDetection(
      testText.value,
      searchForm.value.category ? [searchForm.value.category] : undefined
    )
  } catch (error) {
    console.error('检测失败:', error)
  } finally {
    testLoading.value = false
  }
}

/**
 * 处理选择变化
 */
function handleSelectionChange(selection: SensitiveWord[]) {
  selectedWords.value = selection
}

/**
 * 分页处理
 */
async function handlePageSizeChange(pageSize: number) {
  searchForm.value.pageSize = pageSize
  await handleSearch()
}

async function handleCurrentChange(page: number) {
  searchForm.value.page = page
  await handleSearch()
}

/**
 * 显示创建对话框
 */
function showCreateDialog() {
  editingWord.value = null
  editForm.value = {
    word: '',
    category: '',
    matchType: 'exact',
    severity: 'medium',
    status: 'active',
    description: ''
  }
  editDialogVisible.value = true
}

/**
 * 显示编辑对话框
 */
function showEditDialog(word: SensitiveWord) {
  editingWord.value = word
  editForm.value = {
    word: word.word,
    category: word.category,
    matchType: word.matchType,
    severity: word.severity,
    status: word.status,
    description: word.description || ''
  }
  editDialogVisible.value = true
}

/**
 * 提交编辑
 */
async function submitEdit() {
  try {
    await editFormRef.value.validate()

    editLoading.value = true

    if (editingWord.value) {
      await configStore.updateSensitiveWord(editingWord.value.id, editForm.value)
    } else {
      await configStore.createSensitiveWord(editForm.value)
    }

    editDialogVisible.value = false
    await handleSearch()
    await fetchStats()
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    editLoading.value = false
  }
}

/**
 * 切换词汇状态
 */
async function toggleWordStatus(word: SensitiveWord) {
  try {
    await configStore.updateSensitiveWord(word.id, {
      status: word.status
    })
    await fetchStats()
  } catch (error) {
    console.error('状态切换失败:', error)
    // 恢复原状态
    word.status = word.status === 'active' ? 'disabled' : 'active'
  }
}

/**
 * 删除敏感词
 */
async function deleteWord(word: SensitiveWord) {
  try {
    await ElMessageBox.confirm(
      `确定要删除敏感词 "${word.word}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )

    await configStore.deleteSensitiveWord(word.id)
    await handleSearch()
    await fetchStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

/**
 * 批量操作
 */
async function batchOperation(action: 'enable' | 'disable' | 'delete') {
  const ids = selectedWords.value.map(word => word.id)
  const success = await configUseConfig.batchOperateSensitiveWords(action, ids)

  if (success) {
    selectedWords.value = []
    await handleSearch()
    await fetchStats()
  }
}

/**
 * 显示导入对话框
 */
function showImportDialog() {
  importDialogVisible.value = true
}

/**
 * 处理导入成功
 */
async function handleImportSuccess() {
  importDialogVisible.value = false
  await handleSearch()
  await fetchStats()
}

/**
 * 导出敏感词
 */
async function exportWords() {
  try {
    const words = await configUseConfig.exportSensitiveWords(searchForm.value.category)

    // 创建下载链接
    const csvContent = generateCSV(words)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const filename = searchForm.value.category
      ? `sensitive-words-${searchForm.value.category}-${new Date().toISOString().slice(0, 10)}.csv`
      : `sensitive-words-${new Date().toISOString().slice(0, 10)}.csv`
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出失败:', error)
  }
}

/**
 * 生成CSV内容
 */
function generateCSV(words: SensitiveWord[]): string {
  const headers = ['敏感词', '分类', '匹配类型', '风险等级', '状态', '描述']
  const rows = words.map(word => [
    word.word,
    word.category,
    getMatchTypeLabel(word.matchType),
    getSeverityLabel(word.severity),
    word.status === 'active' ? '启用' : '禁用',
    word.description || ''
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

// ============= 工具方法 =============

function getCategoryName(category: string): string {
  const categoryObj = configStore.sensitiveWordCategories.find(c => c.category === category)
  return categoryObj?.categoryName || category
}

function getMatchTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    exact: '精确',
    fuzzy: '模糊',
    regex: '正则'
  }
  return labels[type] || type
}

function getMatchTypeColor(type: string): string {
  const colors: Record<string, string> = {
    exact: 'success',
    fuzzy: 'warning',
    regex: 'danger'
  }
  return colors[type] || 'info'
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }
  return labels[severity] || severity
}

function getSeverityType(severity: string): string {
  const types: Record<string, string> = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  }
  return types[severity] || 'info'
}

function getStatusType(status: string): string {
  return status === 'active' ? 'primary' : 'info'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped>
.sensitive-words {
  padding: 20px;
}

.words-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-main h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-main .description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.words-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 8px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-value.active-count {
  color: #67c23a;
}

.stat-value.high-count {
  color: #f56c6c;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.words-search {
  margin-bottom: 20px;
}

.words-search :deep(.el-card__body) {
  padding: 16px 20px;
}

.detection-test {
  margin-bottom: 20px;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.test-result {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-weight: 500;
}

.matches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.match-info {
  font-size: 12px;
  color: #909399;
}

.words-table {
  background: white;
  border-radius: 4px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.word-content {
  font-family: monospace;
  font-weight: 500;
}

.description-text {
  font-size: 13px;
  color: #606266;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>