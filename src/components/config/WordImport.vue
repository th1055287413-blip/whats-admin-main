<template>
  <div class="word-import">
    <el-steps :active="currentStep" align-center>
      <el-step title="选择导入方式" />
      <el-step title="数据预览" />
      <el-step title="导入结果" />
    </el-steps>

    <!-- 步骤1: 选择导入方式 -->
    <div v-if="currentStep === 0" class="import-step">
      <el-tabs v-model="importMethod" type="card">
        <!-- 文件上传 -->
        <el-tab-pane label="文件上传" name="file">
          <div class="upload-area">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :accept="'.csv,.txt,.xlsx'"
              :limit="1"
              :on-change="handleFileChange"
              :on-exceed="handleExceed"
              drag
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 CSV、TXT、Excel 格式文件，文件大小不超过 10MB
                </div>
              </template>
            </el-upload>

            <div v-if="selectedFile" class="file-info">
              <el-card shadow="never">
                <div class="file-details">
                  <el-icon><Document /></el-icon>
                  <div class="file-meta">
                    <div class="file-name">{{ selectedFile.name }}</div>
                    <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
                  </div>
                  <el-button
                    type="danger"
                    text
                    @click="removeFile"
                  >
                    移除
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 手动输入 -->
        <el-tab-pane label="手动输入" name="manual">
          <div class="manual-input">
            <el-form :model="manualForm" label-width="100px">
              <el-form-item label="批量输入">
                <el-input
                  v-model="manualForm.words"
                  type="textarea"
                  :rows="10"
                  placeholder="每行一个敏感词，格式：敏感词,分类,匹配类型,风险等级,描述&#10;例如：&#10;测试词1,政治,exact,high,这是一个测试词&#10;测试词2,广告,fuzzy,medium&#10;测试词3,色情,regex,high,正则表达式示例"
                  show-word-limit
                  maxlength="50000"
                />
              </el-form-item>
              <el-form-item label="默认分类">
                <el-select
                  v-model="manualForm.defaultCategory"
                  placeholder="选择默认分类"
                  style="width: 200px"
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
              <el-form-item label="默认匹配">
                <el-select
                  v-model="manualForm.defaultMatchType"
                  style="width: 150px"
                >
                  <el-option label="精确匹配" value="exact" />
                  <el-option label="模糊匹配" value="fuzzy" />
                  <el-option label="正则表达式" value="regex" />
                </el-select>
              </el-form-item>
              <el-form-item label="默认风险">
                <el-select
                  v-model="manualForm.defaultSeverity"
                  style="width: 150px"
                >
                  <el-option label="低风险" value="low" />
                  <el-option label="中风险" value="medium" />
                  <el-option label="高风险" value="high" />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 在线词库 -->
        <el-tab-pane label="在线词库" name="online">
          <div class="online-library">
            <el-alert
              title="在线词库功能"
              description="从预设的在线词库中选择导入敏感词，包含常见的政治敏感词、广告词、色情词汇等"
              type="info"
              :closable="false"
              show-icon
            />

            <div class="library-list">
              <el-row :gutter="16">
                <el-col :span="8" v-for="library in onlineLibraries" :key="library.id">
                  <el-card
                    shadow="hover"
                    class="library-card"
                    :class="{ selected: selectedLibraries.includes(library.id) }"
                    @click="toggleLibrary(library.id)"
                  >
                    <div class="library-info">
                      <div class="library-header">
                        <h4>{{ library.name }}</h4>
                        <el-tag size="small">{{ library.count }} 词</el-tag>
                      </div>
                      <p class="library-desc">{{ library.description }}</p>
                      <div class="library-meta">
                        <span class="update-time">更新: {{ library.updateTime }}</span>
                        <el-checkbox
                          :model-value="selectedLibraries.includes(library.id)"
                          @change="toggleLibrary(library.id)"
                        />
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="step-actions">
        <el-button @click="$emit('close')">取消</el-button>
        <el-button
          type="primary"
          :disabled="!canProceed"
          @click="parseData"
          :loading="parsing"
        >
          下一步
        </el-button>
      </div>
    </div>

    <!-- 步骤2: 数据预览 -->
    <div v-if="currentStep === 1" class="preview-step">
      <div class="preview-header">
        <div class="data-summary">
          <el-statistic title="总计" :value="previewData.length" />
          <el-statistic title="有效" :value="validCount" />
          <el-statistic title="错误" :value="errorCount" />
        </div>

        <div class="preview-options">
          <el-checkbox v-model="skipErrors">跳过错误数据</el-checkbox>
          <el-checkbox v-model="updateExisting">更新已存在的词汇</el-checkbox>
        </div>
      </div>

      <el-table
        :data="previewData"
        max-height="400"
        stripe
      >
        <el-table-column type="index" label="#" width="60" />

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-icon
              :class="row.isValid ? 'text-green-500' : 'text-red-500'"
              size="16"
            >
              <Check v-if="row.isValid" />
              <Close v-else />
            </el-icon>
          </template>
        </el-table-column>

        <el-table-column label="敏感词" prop="word" min-width="120">
          <template #default="{ row }">
            <el-text :type="row.isValid ? 'primary' : 'danger'">
              {{ row.word }}
            </el-text>
          </template>
        </el-table-column>

        <el-table-column label="分类" prop="category" width="120" />

        <el-table-column label="匹配类型" prop="matchType" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getMatchTypeColor(row.matchType)">
              {{ getMatchTypeLabel(row.matchType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="风险等级" prop="severity" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getSeverityType(row.severity)">
              {{ getSeverityLabel(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="错误信息" min-width="200">
          <template #default="{ row }">
            <el-text v-if="!row.isValid" type="danger" size="small">
              {{ row.error }}
            </el-text>
            <el-text v-else type="success" size="small">
              验证通过
            </el-text>
          </template>
        </el-table-column>
      </el-table>

      <div class="step-actions">
        <el-button @click="currentStep = 0">上一步</el-button>
        <el-button
          type="primary"
          :disabled="!canImport"
          @click="performImport"
          :loading="importing"
        >
          开始导入
        </el-button>
      </div>
    </div>

    <!-- 步骤3: 导入结果 -->
    <div v-if="currentStep === 2" class="result-step">
      <div class="result-summary">
        <el-result
          :icon="importResult.success > 0 ? 'success' : 'error'"
          :title="getResultTitle()"
          :sub-title="getResultSubtitle()"
        >
          <template #extra>
            <div class="result-stats">
              <el-row :gutter="16">
                <el-col :span="8">
                  <el-card class="stat-card">
                    <el-statistic title="总计" :value="importResult.total" />
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="stat-card success">
                    <el-statistic title="成功" :value="importResult.success" />
                  </el-card>
                </el-col>
                <el-col :span="8">
                  <el-card class="stat-card error">
                    <el-statistic title="失败" :value="importResult.failed" />
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </template>
        </el-result>
      </div>

      <!-- 错误详情 -->
      <div v-if="importResult.errors && importResult.errors.length > 0" class="error-details">
        <el-card>
          <template #header>
            <div class="error-header">
              <span>错误详情</span>
              <el-button
                type="primary"
                size="small"
                @click="downloadErrorReport"
              >
                下载错误报告
              </el-button>
            </div>
          </template>

          <el-table :data="importResult.errors" max-height="300">
            <el-table-column label="行号" prop="row" width="80" />
            <el-table-column label="敏感词" prop="word" min-width="120" />
            <el-table-column label="错误信息" prop="error" min-width="200" />
          </el-table>
        </el-card>
      </div>

      <div class="step-actions">
        <el-button @click="resetImport">重新导入</el-button>
        <el-button type="primary" @click="$emit('success')">完成</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Upload,
  Document,
  Check,
  Close
} from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import { useConfig } from '@/composables/useConfig'
import type {
  SensitiveWordImportData,
  SensitiveWordImportResult
} from '@/types/config'

// ============= Props & Emits =============
interface Emits {
  success: []
  close: []
}

const emit = defineEmits<Emits>()

// ============= 响应式数据 =============
const configStore = useConfigStore()
const configUseConfig = useConfig()

const currentStep = ref(0)
const importMethod = ref('file')
const parsing = ref(false)
const importing = ref(false)

// 文件上传相关
const uploadRef = ref()
const selectedFile = ref<File | null>(null)

// 手动输入相关
const manualForm = reactive({
  words: '',
  defaultCategory: '',
  defaultMatchType: 'exact',
  defaultSeverity: 'medium'
})

// 在线词库相关
const selectedLibraries = ref<string[]>([])
const onlineLibraries = ref([
  {
    id: 'political',
    name: '政治敏感词库',
    description: '包含政治相关的敏感词汇，适用于内容审核',
    count: 2156,
    updateTime: '2024-01-15'
  },
  {
    id: 'advertisement',
    name: '广告词库',
    description: '常见的广告推广相关词汇，防止垃圾信息',
    count: 1834,
    updateTime: '2024-01-10'
  },
  {
    id: 'violence',
    name: '暴力词库',
    description: '暴力、血腥相关词汇，维护平台秩序',
    count: 892,
    updateTime: '2024-01-08'
  },
  {
    id: 'gambling',
    name: '赌博词库',
    description: '赌博、博彩相关词汇，防范违法内容',
    count: 567,
    updateTime: '2024-01-05'
  }
])

// 预览数据
const previewData = ref<Array<SensitiveWordImportData & { isValid: boolean; error?: string }>>([])
const skipErrors = ref(true)
const updateExisting = ref(false)

// 导入结果
const importResult = ref<SensitiveWordImportResult>({
  total: 0,
  success: 0,
  failed: 0,
  errors: []
})

// ============= 计算属性 =============
const canProceed = computed(() => {
  switch (importMethod.value) {
    case 'file':
      return selectedFile.value !== null
    case 'manual':
      return manualForm.words.trim().length > 0
    case 'online':
      return selectedLibraries.value.length > 0
    default:
      return false
  }
})

const validCount = computed(() => {
  return previewData.value.filter(item => item.isValid).length
})

const errorCount = computed(() => {
  return previewData.value.filter(item => !item.isValid).length
})

const canImport = computed(() => {
  if (skipErrors.value) {
    return validCount.value > 0
  }
  return errorCount.value === 0
})

// ============= 方法 =============

/**
 * 处理文件变化
 */
function handleFileChange(file: any) {
  selectedFile.value = file.raw
}

/**
 * 处理文件超出限制
 */
function handleExceed() {
  ElMessage.warning('只能上传一个文件')
}

/**
 * 移除文件
 */
function removeFile() {
  selectedFile.value = null
  uploadRef.value.clearFiles()
}

/**
 * 切换在线词库选择
 */
function toggleLibrary(libraryId: string) {
  const index = selectedLibraries.value.indexOf(libraryId)
  if (index > -1) {
    selectedLibraries.value.splice(index, 1)
  } else {
    selectedLibraries.value.push(libraryId)
  }
}

/**
 * 解析数据
 */
async function parseData() {
  parsing.value = true
  try {
    let rawData: SensitiveWordImportData[] = []

    switch (importMethod.value) {
      case 'file':
        rawData = await parseFile()
        break
      case 'manual':
        rawData = parseManualInput()
        break
      case 'online':
        rawData = await fetchOnlineLibraries()
        break
    }

    // 验证数据
    previewData.value = rawData.map(item => validateImportItem(item))
    currentStep.value = 1
  } catch (error) {
    console.error('解析数据失败:', error)
    ElMessage.error('解析数据失败，请检查数据格式')
  } finally {
    parsing.value = false
  }
}

/**
 * 解析文件
 */
async function parseFile(): Promise<SensitiveWordImportData[]> {
  if (!selectedFile.value) return []

  const fileContent = await readFileContent(selectedFile.value)
  const extension = selectedFile.value.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'csv':
    case 'txt':
      return parseCSV(fileContent)
    case 'xlsx':
      // 这里应该使用专门的Excel解析库，如 xlsx
      throw new Error('Excel文件解析功能待实现')
    default:
      throw new Error('不支持的文件格式')
  }
}

/**
 * 读取文件内容
 */
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * 解析CSV内容
 */
function parseCSV(content: string): SensitiveWordImportData[] {
  const lines = content.split('\n').filter(line => line.trim())
  const data: SensitiveWordImportData[] = []

  lines.forEach((line, index) => {
    // 跳过表头
    if (index === 0 && (line.includes('敏感词') || line.includes('word'))) {
      return
    }

    const columns = line.split(',').map(col => col.trim().replace(/^"(.*)"$/, '$1'))

    if (columns.length >= 1) {
      data.push({
        word: columns[0],
        category: columns[1] || manualForm.defaultCategory || '其他',
        matchType: (columns[2] as any) || manualForm.defaultMatchType,
        severity: (columns[3] as any) || manualForm.defaultSeverity,
        description: columns[4] || ''
      })
    }
  })

  return data
}

/**
 * 解析手动输入
 */
function parseManualInput(): SensitiveWordImportData[] {
  const lines = manualForm.words.split('\n').filter(line => line.trim())
  const data: SensitiveWordImportData[] = []

  lines.forEach(line => {
    const columns = line.split(',').map(col => col.trim())

    if (columns.length >= 1) {
      data.push({
        word: columns[0],
        category: columns[1] || manualForm.defaultCategory || '其他',
        matchType: (columns[2] as any) || manualForm.defaultMatchType,
        severity: (columns[3] as any) || manualForm.defaultSeverity,
        description: columns[4] || ''
      })
    }
  })

  return data
}

/**
 * 获取在线词库数据
 */
async function fetchOnlineLibraries(): Promise<SensitiveWordImportData[]> {
  // 这里应该调用真实的API获取在线词库数据
  // 现在使用模拟数据
  const mockData: SensitiveWordImportData[] = []

  selectedLibraries.value.forEach(libraryId => {
    const library = onlineLibraries.value.find(lib => lib.id === libraryId)
    if (library) {
      // 生成一些模拟数据
      for (let i = 0; i < Math.min(library.count, 100); i++) {
        mockData.push({
          word: `${library.name}词汇${i + 1}`,
          category: library.id,
          matchType: 'exact',
          severity: 'medium',
          description: `来自${library.name}的敏感词`
        })
      }
    }
  })

  return mockData
}

/**
 * 验证导入项
 */
function validateImportItem(item: SensitiveWordImportData) {
  const result = { ...item, isValid: true, error: '' }

  // 验证必填字段
  if (!item.word || item.word.trim().length === 0) {
    result.isValid = false
    result.error = '敏感词不能为空'
    return result
  }

  if (item.word.length > 200) {
    result.isValid = false
    result.error = '敏感词长度不能超过200个字符'
    return result
  }

  // 验证匹配类型
  if (!['exact', 'fuzzy', 'regex'].includes(item.matchType || '')) {
    result.isValid = false
    result.error = '匹配类型必须是 exact、fuzzy 或 regex'
    return result
  }

  // 验证风险等级
  if (!['low', 'medium', 'high'].includes(item.severity || '')) {
    result.isValid = false
    result.error = '风险等级必须是 low、medium 或 high'
    return result
  }

  // 验证正则表达式
  if (item.matchType === 'regex') {
    try {
      new RegExp(item.word)
    } catch (error) {
      result.isValid = false
      result.error = '正则表达式格式不正确'
      return result
    }
  }

  return result
}

/**
 * 执行导入
 */
async function performImport() {
  importing.value = true
  try {
    const dataToImport = skipErrors.value
      ? previewData.value.filter(item => item.isValid)
      : previewData.value

    if (dataToImport.length === 0) {
      ElMessage.warning('没有有效数据可导入')
      return
    }

    importResult.value = await configUseConfig.importSensitiveWords(dataToImport)
    currentStep.value = 2
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败，请稍后重试')
  } finally {
    importing.value = false
  }
}

/**
 * 重置导入
 */
function resetImport() {
  currentStep.value = 0
  selectedFile.value = null
  uploadRef.value?.clearFiles()
  manualForm.words = ''
  selectedLibraries.value = []
  previewData.value = []
  importResult.value = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  }
}

/**
 * 下载错误报告
 */
function downloadErrorReport() {
  if (!importResult.value.errors || importResult.value.errors.length === 0) {
    return
  }

  const headers = ['行号', '敏感词', '错误信息']
  const csvContent = [
    headers.join(','),
    ...importResult.value.errors.map(error =>
      [error.row, error.word, error.error].map(cell => `"${cell}"`).join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `import-errors-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ============= 工具方法 =============

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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

function getResultTitle(): string {
  if (importResult.value.success === 0) {
    return '导入失败'
  } else if (importResult.value.failed === 0) {
    return '导入成功'
  } else {
    return '部分导入成功'
  }
}

function getResultSubtitle(): string {
  const { total, success, failed } = importResult.value
  return `共 ${total} 条数据，成功 ${success} 条，失败 ${failed} 条`
}
</script>

<style scoped>
.word-import {
  padding: 20px 0;
}

.import-step,
.preview-step,
.result-step {
  margin-top: 30px;
}

.upload-area {
  margin: 20px 0;
}

.file-info {
  margin-top: 16px;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-meta {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #303133;
}

.file-size {
  font-size: 12px;
  color: #909399;
}

.manual-input {
  margin: 20px 0;
}

.online-library {
  margin: 20px 0;
}

.library-list {
  margin-top: 20px;
}

.library-card {
  cursor: pointer;
  transition: all 0.3s;
}

.library-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.library-card.selected {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.library-info {
  padding: 8px 0;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.library-header h4 {
  margin: 0;
  color: #303133;
}

.library-desc {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
}

.library-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-time {
  font-size: 12px;
  color: #909399;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.data-summary {
  display: flex;
  gap: 32px;
}

.preview-options {
  display: flex;
  gap: 16px;
  align-items: center;
}

.result-summary {
  margin-bottom: 30px;
}

.result-stats {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
}

.stat-card.success :deep(.el-statistic__number) {
  color: #67c23a;
}

.stat-card.error :deep(.el-statistic__number) {
  color: #f56c6c;
}

.error-details {
  margin-bottom: 30px;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.text-green-500 {
  color: #67c23a;
}

.text-red-500 {
  color: #f56c6c;
}
</style>