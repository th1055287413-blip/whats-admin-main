<template>
  <div class="sensitive-words">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>敏感词管理</h2>
        <el-text type="info">配置和管理敏感词库，支持关键词和正则表达式</el-text>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button
            type="primary"
            :icon="Plus"
            @click="handleAddWord"
          >
            添加敏感词
          </el-button>
          <el-button
            :icon="Upload"
            @click="handleBatchImport"
          >
            批量导入
          </el-button>
          <el-button
            :icon="Download"
            @click="handleExportWords"
          >
            导出
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 统计面板 -->
    <div class="stats-panel">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="never" class="stat-item">
            <div class="stat-content">
              <div class="stat-number">{{ totalWords }}</div>
              <div class="stat-label">总敏感词</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-item">
            <div class="stat-content">
              <div class="stat-number active">{{ activeWords }}</div>
              <div class="stat-label">已启用</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-item">
            <div class="stat-content">
              <div class="stat-number regex">{{ regexWords }}</div>
              <div class="stat-label">正则表达式</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-item">
            <div class="stat-content">
              <div class="stat-number category">{{ totalCategories }}</div>
              <div class="stat-label">分类数量</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <el-row :gutter="20">
      <!-- 左侧：敏感词管理 -->
      <el-col :span="18">
        <!-- 过滤器 -->
        <el-card shadow="never" class="filter-card">
          <div class="filter-content">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-select
                  v-model="filter.type"
                  placeholder="词类型"
                  clearable
                  @change="handleFilterChange"
                >
                  <el-option label="关键词" value="keyword" />
                  <el-option label="正则表达式" value="regex" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select
                  v-model="filter.level"
                  placeholder="敏感等级"
                  clearable
                  @change="handleFilterChange"
                >
                  <el-option label="警告" value="warning" />
                  <el-option label="严重" value="critical" />
                  <el-option label="屏蔽" value="block" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select
                  v-model="filter.category"
                  placeholder="分类"
                  clearable
                  @change="handleFilterChange"
                >
                  <el-option
                    v-for="category in categories"
                    :key="category"
                    :label="category"
                    :value="category"
                  />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索敏感词..."
                  :prefix-icon="Search"
                  clearable
                  @keyup.enter="handleSearch"
                  @clear="handleSearch"
                />
              </el-col>
            </el-row>
            <el-row style="margin-top: 12px">
              <el-col :span="24">
                <el-checkbox-group v-model="filter.languages" @change="handleFilterChange">
                  <el-checkbox label="zh">中文</el-checkbox>
                  <el-checkbox label="en">英文</el-checkbox>
                  <el-checkbox label="jp">日文</el-checkbox>
                  <el-checkbox label="kr">韩文</el-checkbox>
                </el-checkbox-group>
                <el-checkbox
                  v-model="filter.isActive"
                  :indeterminate="filter.isActive === undefined"
                  style="margin-left: 20px"
                  @change="handleActiveFilterChange"
                >
                  仅显示启用的
                </el-checkbox>
              </el-col>
            </el-row>
          </div>
        </el-card>

        <!-- 敏感词列表 -->
        <el-card shadow="never" class="list-card">
          <template #header>
            <div class="list-header">
              <span>敏感词列表</span>
              <div class="list-actions">
                <el-button
                  size="small"
                  :disabled="selectedWords.length === 0"
                  @click="handleBatchToggle"
                >
                  批量启用/禁用
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  :disabled="selectedWords.length === 0"
                  @click="handleBatchDelete"
                >
                  批量删除
                </el-button>
                <el-button
                  size="small"
                  :icon="Refresh"
                  @click="handleRefresh"
                  :loading="loading"
                />
              </div>
            </div>
          </template>

          <el-table
            ref="tableRef"
            v-loading="loading"
            :data="displayedWords"
            row-key="id"
            @selection-change="handleSelectionChange"
            height="calc(100vh - 600px)"
          >
            <el-table-column type="selection" width="55" />

            <el-table-column prop="word" label="敏感词" min-width="200">
              <template #default="{ row }">
                <div class="word-content">
                  <el-text
                    :class="{
                      'word-regex': row.type === 'regex',
                      'word-disabled': !row.isActive
                    }"
                  >
                    {{ row.word }}
                  </el-text>
                  <el-tag
                    v-if="row.type === 'regex'"
                    type="info"
                    size="small"
                    style="margin-left: 8px"
                  >
                    正则
                  </el-tag>
                </div>
              </template>
            </el-table-column>

            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="row.type === 'regex' ? 'warning' : 'success'" size="small">
                  {{ row.type === 'regex' ? '正则' : '关键词' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="level" label="敏感等级" width="120">
              <template #default="{ row }">
                <el-tag :type="getLevelTagType(row.level)" size="small">
                  {{ getLevelLabel(row.level) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="language" label="语言" width="80">
              <template #default="{ row }">
                <el-tag size="small" effect="plain">
                  {{ getLanguageLabel(row.language) }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column prop="category" label="分类" width="120" />

            <el-table-column prop="isActive" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-switch
                  v-model="row.isActive"
                  @change="handleToggleWord(row)"
                />
              </template>
            </el-table-column>

            <el-table-column prop="createdAt" label="创建时间" width="160">
              <template #default="{ row }">
                <el-text size="small">
                  {{ formatDateTime(row.createdAt) }}
                </el-text>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button-group size="small">
                  <el-button
                    :icon="Edit"
                    @click="handleEditWord(row)"
                  />
                  <el-button
                    :icon="View"
                    @click="handleTestWord(row)"
                  />
                  <el-button
                    type="danger"
                    :icon="Delete"
                    @click="handleDeleteWord(row)"
                  />
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="table-pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[20, 50, 100, 200]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredWords.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：工具面板 -->
      <el-col :span="6">
        <div class="side-panel">
          <!-- 敏感词测试 -->
          <el-card shadow="never" class="test-card">
            <template #header>
              <span>敏感词测试</span>
            </template>
            <div class="test-content">
              <el-input
                v-model="testText"
                type="textarea"
                :rows="4"
                placeholder="输入要测试的文本内容..."
                @input="handleTestInput"
              />
              <el-button
                type="primary"
                @click="handleRunTest"
                :loading="testLoading"
                style="margin-top: 12px"
                block
              >
                开始检测
              </el-button>

              <div v-if="testResult" class="test-result">
                <div class="result-header">
                  <span>检测结果</span>
                  <el-tag
                    :type="testResult.isSensitive ? 'danger' : 'success'"
                    size="small"
                  >
                    {{ testResult.isSensitive ? '包含敏感词' : '安全' }}
                  </el-tag>
                </div>
                <div v-if="testResult.words.keywords.length > 0" class="detected-words">
                  <div class="words-label">检测到的关键词：</div>
                  <el-tag
                    v-for="(keyword, index) in testResult.words.keywords"
                    :key="index"
                    :type="getLevelTagType(keyword.level)"
                    size="small"
                    style="margin: 2px"
                  >
                    {{ keyword.word }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 分类管理 -->
          <el-card shadow="never" class="category-card">
            <template #header>
              <div class="card-header">
                <span>分类管理</span>
                <el-button
                  size="small"
                  text
                  @click="handleAddCategory"
                >
                  添加
                </el-button>
              </div>
            </template>
            <div class="category-list">
              <div
                v-for="category in categories"
                :key="category"
                class="category-item"
              >
                <span class="category-name">{{ category }}</span>
                <span class="category-count">
                  {{ getCategoryCount(category) }}
                </span>
              </div>
            </div>
          </el-card>

          <!-- 缓存状态 -->
          <el-card shadow="never" class="cache-card">
            <template #header>
              <div class="card-header">
                <span>缓存状态</span>
                <el-button
                  size="small"
                  :icon="Refresh"
                  @click="handleRefreshCache"
                  :loading="cacheLoading"
                />
              </div>
            </template>
            <div class="cache-stats">
              <div class="cache-item">
                <div class="cache-label">关键词数量</div>
                <div class="cache-value">{{ cacheStats.keywordCount }}</div>
              </div>
              <div class="cache-item">
                <div class="cache-label">正则数量</div>
                <div class="cache-value">{{ cacheStats.regexCount }}</div>
              </div>
              <div class="cache-item">
                <div class="cache-label">最后刷新</div>
                <div class="cache-value">{{ formatCacheTime(cacheStats.lastRefresh) }}</div>
              </div>
            </div>
          </el-card>

          <!-- 快速操作 -->
          <el-card shadow="never" class="actions-card">
            <template #header>
              <span>快速操作</span>
            </template>
            <div class="quick-actions">
              <el-button
                type="primary"
                :icon="Plus"
                @click="handleQuickAddKeywords"
                block
              >
                快速添加常用词
              </el-button>
              <el-button
                type="success"
                :icon="Check"
                @click="handleValidateAll"
                block
              >
                验证所有正则
              </el-button>
              <el-button
                type="warning"
                :icon="Download"
                @click="handleBackupWords"
                block
              >
                备份敏感词库
              </el-button>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="formVisible"
      :title="editingWord ? '编辑敏感词' : '添加敏感词'"
      width="50%"
      destroy-on-close
    >
      <SensitiveWordForm
        v-if="formVisible"
        :word="editingWord"
        :categories="categories"
        @save="handleSaveWord"
        @cancel="formVisible = false"
      />
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importVisible"
      title="批量导入敏感词"
      width="60%"
      destroy-on-close
    >
      <BatchImportForm
        v-if="importVisible"
        @import="handleImportWords"
        @cancel="importVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Upload,
  Download,
  Search,
  Refresh,
  Edit,
  View,
  Delete,
  Check
} from '@element-plus/icons-vue'
import { useMonitorStore } from '@/stores/monitor'
import { monitorApi } from '@/api/monitor'
import type {
  SensitiveWord,
  SensitiveWordFilter,
  WordType,
  SensitiveWordLevel,
  SensitiveDetectionResult
} from '@/types/monitor'

// 模拟导入组件
// import SensitiveWordForm from '@/components/monitor/SensitiveWordForm.vue'
// import BatchImportForm from '@/components/monitor/BatchImportForm.vue'

// Store
const monitorStore = useMonitorStore()

// 组件状态
const tableRef = ref()
const searchKeyword = ref('')
const selectedWords = ref<SensitiveWord[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const formVisible = ref(false)
const importVisible = ref(false)
const editingWord = ref<SensitiveWord | null>(null)
const testText = ref('')
const testResult = ref<SensitiveDetectionResult | null>(null)
const testLoading = ref(false)
const cacheLoading = ref(false)

// 过滤器
const filter = reactive<SensitiveWordFilter>({
  page: 1,
  pageSize: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

// 从store获取状态
const { sensitiveWords } = monitorStore
const loading = computed(() => sensitiveWords.loading)
const words = computed(() => sensitiveWords.data)

// 模拟数据
const categories = ref([
  '安全风险', '金融诈骗', '联系信息', '违法违规',
  '色情内容', '政治敏感', '广告营销', '其他'
])

const cacheStats = ref({
  keywordCount: 1250,
  regexCount: 85,
  lastRefresh: new Date().toISOString()
})

// 计算属性
const totalWords = computed(() => words.value.length)
const activeWords = computed(() => words.value.filter(w => w.isActive).length)
const regexWords = computed(() => words.value.filter(w => w.type === 'regex').length)
const totalCategories = computed(() => categories.value.length)

const filteredWords = computed(() => {
  let filtered = words.value

  // 应用过滤器
  if (filter.type) {
    filtered = filtered.filter(w => w.type === filter.type)
  }
  if (filter.level) {
    filtered = filtered.filter(w => w.level === filter.level)
  }
  if (filter.category) {
    filtered = filtered.filter(w => w.category === filter.category)
  }
  if (filter.languages && filter.languages.length > 0) {
    filtered = filtered.filter(w => filter.languages!.includes(w.language))
  }
  if (filter.isActive !== undefined) {
    filtered = filtered.filter(w => w.isActive === filter.isActive)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(w =>
      w.word.toLowerCase().includes(keyword) ||
      w.category.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

const displayedWords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredWords.value.slice(start, end)
})

// 事件处理
const handleAddWord = () => {
  editingWord.value = null
  formVisible.value = true
}

const handleEditWord = (word: SensitiveWord) => {
  editingWord.value = word
  formVisible.value = true
}

const handleDeleteWord = async (word: SensitiveWord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除敏感词 "${word.word}" 吗？`,
      '确认删除',
      { type: 'warning' }
    )

    const success = await monitorStore.deleteSensitiveWord(word.id)
    if (success) {
      await handleRefresh()
    }
  } catch {
    // 用户取消
  }
}

const handleToggleWord = async (word: SensitiveWord) => {
  const success = await monitorStore.updateSensitiveWord(word.id, {
    isActive: word.isActive
  })
  if (!success) {
    // 失败时回滚状态
    word.isActive = !word.isActive
  }
}

const handleSaveWord = async (wordData: any) => {
  try {
    if (editingWord.value) {
      await monitorStore.updateSensitiveWord(editingWord.value.id, wordData)
    } else {
      await monitorStore.createSensitiveWord(wordData)
    }
    formVisible.value = false
    await handleRefresh()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleBatchImport = () => {
  importVisible.value = true
}

const handleImportWords = async (wordsData: any[]) => {
  try {
    // 批量创建敏感词
    for (const wordData of wordsData) {
      await monitorStore.createSensitiveWord(wordData)
    }
    importVisible.value = false
    ElMessage.success(`成功导入 ${wordsData.length} 个敏感词`)
    await handleRefresh()
  } catch (error) {
    ElMessage.error('导入失败')
  }
}

const handleExportWords = () => {
  ElMessage.info('导出功能开发中...')
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handleActiveFilterChange = (checked: boolean) => {
  if (checked) {
    filter.isActive = true
  } else {
    filter.isActive = undefined
  }
  handleFilterChange()
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSelectionChange = (selection: SensitiveWord[]) => {
  selectedWords.value = selection
}

const handleBatchToggle = async () => {
  if (selectedWords.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要切换选中的 ${selectedWords.value.length} 个敏感词的启用状态吗？`,
      '确认操作',
      { type: 'warning' }
    )

    for (const word of selectedWords.value) {
      await monitorStore.updateSensitiveWord(word.id, {
        isActive: !word.isActive
      })
    }

    selectedWords.value = []
    tableRef.value?.clearSelection()
    await handleRefresh()
    ElMessage.success('批量操作完成')
  } catch {
    // 用户取消
  }
}

const handleBatchDelete = async () => {
  if (selectedWords.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedWords.value.length} 个敏感词吗？此操作不可撤销。`,
      '确认删除',
      { type: 'warning' }
    )

    for (const word of selectedWords.value) {
      await monitorStore.deleteSensitiveWord(word.id)
    }

    selectedWords.value = []
    tableRef.value?.clearSelection()
    await handleRefresh()
    ElMessage.success('批量删除完成')
  } catch {
    // 用户取消
  }
}

const handleRefresh = async () => {
  await monitorStore.fetchSensitiveWords()
}

const handleTestWord = async (word: SensitiveWord) => {
  testText.value = `测试文本包含${word.word}敏感词`
  await handleRunTest()
}

const handleTestInput = () => {
  testResult.value = null
}

const handleRunTest = async () => {
  if (!testText.value.trim()) {
    ElMessage.warning('请输入要测试的文本')
    return
  }

  testLoading.value = true
  try {
    testResult.value = await monitorApi.testSensitiveDetection(testText.value)
  } catch (error) {
    ElMessage.error('检测失败')
  } finally {
    testLoading.value = false
  }
}

const handleAddCategory = async () => {
  try {
    const { value: categoryName } = await ElMessageBox.prompt(
      '请输入新分类名称',
      '添加分类',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          if (!value) return '分类名称不能为空'
          if (categories.value.includes(value)) return '分类已存在'
          return true
        }
      }
    )

    categories.value.push(categoryName)
    ElMessage.success('分类添加成功')
  } catch {
    // 用户取消
  }
}

const handleRefreshCache = async () => {
  cacheLoading.value = true
  try {
    await monitorApi.refreshSensitiveCache()
    // 更新缓存统计
    const stats = await monitorApi.getSensitiveCacheStats()
    cacheStats.value = stats
    ElMessage.success('缓存刷新成功')
  } catch (error) {
    ElMessage.error('缓存刷新失败')
  } finally {
    cacheLoading.value = false
  }
}

const handleQuickAddKeywords = () => {
  ElMessage.info('快速添加功能开发中...')
}

const handleValidateAll = () => {
  ElMessage.info('正则验证功能开发中...')
}

const handleBackupWords = () => {
  ElMessage.info('备份功能开发中...')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 工具函数
const getLevelLabel = (level: SensitiveWordLevel) => {
  const labels = {
    warning: '警告',
    critical: '严重',
    block: '屏蔽'
  }
  return labels[level] || level
}

const getLevelTagType = (level: SensitiveWordLevel) => {
  const types = {
    warning: 'warning',
    critical: 'danger',
    block: 'danger'
  }
  return types[level] || 'info'
}

const getLanguageLabel = (language: string) => {
  const labels = {
    zh: '中文',
    en: '英文',
    jp: '日文',
    kr: '韩文'
  }
  return labels[language as keyof typeof labels] || language
}

const getCategoryCount = (category: string) => {
  return words.value.filter(w => w.category === category).length
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatCacheTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 生命周期
onMounted(async () => {
  await monitorStore.fetchSensitiveWords()
})
</script>

<style scoped>
.sensitive-words {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-panel {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-number.active {
  color: #67C23A;
}

.stat-number.regex {
  color: #E6A23C;
}

.stat-number.category {
  color: #409EFF;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-content {
  padding: 16px 0;
}

.list-card {
  margin-bottom: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.word-content {
  display: flex;
  align-items: center;
}

.word-regex {
  font-family: 'Courier New', monospace;
  color: #E6A23C;
}

.word-disabled {
  color: #C0C4CC;
  text-decoration: line-through;
}

.table-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-content {
  padding: 0;
}

.test-result {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
}

.detected-words {
  margin-top: 8px;
}

.words-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 6px;
}

.category-list {
  max-height: 200px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.category-item:last-child {
  border-bottom: none;
}

.category-name {
  font-size: 14px;
  color: #303133;
}

.category-count {
  font-size: 12px;
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 10px;
}

.cache-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cache-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cache-label {
  font-size: 14px;
  color: #606266;
}

.cache-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

@media (max-width: 1200px) {
  .sensitive-words {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    align-self: stretch;
    justify-content: flex-end;
  }

  .stats-panel :deep(.el-col) {
    margin-bottom: 16px;
  }
}
</style>