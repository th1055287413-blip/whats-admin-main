<template>
  <div class="import-export-container">
    <!-- 导出功能区域 -->
    <el-card class="export-section" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>数据导出</h3>
          <span>支持将用户数据导出为Excel文件</span>
        </div>
      </template>

      <div class="export-content">
        <div class="export-options">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form :model="exportForm" label-width="120px" size="default">
                <el-form-item label="导出类型">
                  <el-select v-model="exportForm.type" @change="handleExportTypeChange">
                    <el-option label="用户数据" value="users" />
                    <el-option label="标签数据" value="tags" />
                    <el-option label="统计报告" value="stats" />
                  </el-select>
                </el-form-item>

                <el-form-item v-if="exportForm.type === 'stats'" label="统计周期">
                  <el-select v-model="exportForm.period">
                    <el-option label="日报表" value="daily" />
                    <el-option label="周报表" value="weekly" />
                    <el-option label="月报表" value="monthly" />
                    <el-option label="年报表" value="yearly" />
                  </el-select>
                </el-form-item>

                <el-form-item v-if="exportForm.type === 'users'" label="筛选条件">
                  <el-button size="small" @click="showFilterDialog = true">
                    设置筛选条件
                    <span v-if="hasActiveFilters" class="filter-count">({{ activeFilterCount }})</span>
                  </el-button>
                </el-form-item>
              </el-form>
            </el-col>

            <el-col :span="12">
              <div class="export-actions">
                <el-button
                  type="primary"
                  :loading="exportLoading"
                  @click="handleExport"
                  size="large"
                >
                  <el-icon><Download /></el-icon>
                  开始导出
                </el-button>

                <el-button
                  v-if="exportForm.type === 'users'"
                  type="success"
                  @click="downloadTemplate"
                  size="large"
                >
                  <el-icon><Document /></el-icon>
                  下载模板
                </el-button>
              </div>

              <div class="export-tips">
                <el-alert
                  :title="exportTips"
                  type="info"
                  show-icon
                  :closable="false"
                />
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 导入功能区域 -->
    <el-card class="import-section" shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>数据导入</h3>
          <span>支持从Excel文件批量导入用户数据</span>
        </div>
      </template>

      <div class="import-content">
        <el-tabs v-model="importActiveTab" @tab-click="handleTabClick">
          <!-- 文件上传标签页 -->
          <el-tab-pane label="上传文件" name="upload">
            <div class="upload-section">
              <el-upload
                ref="uploadRef"
                class="upload-demo"
                drag
                :action="uploadAction"
                :headers="uploadHeaders"
                :before-upload="beforeUpload"
                :on-success="handleUploadSuccess"
                :on-error="handleUploadError"
                :file-list="fileList"
                :auto-upload="false"
                accept=".xlsx,.xls"
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">
                  将Excel文件拖拽到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    只能上传 .xlsx/.xls 文件，且不超过 10MB
                  </div>
                </template>
              </el-upload>

              <div class="import-options" v-if="fileList.length > 0">
                <el-form :model="importForm" label-width="140px" size="default">
                  <el-form-item label="更新已存在用户">
                    <el-switch v-model="importForm.updateExisting" />
                    <span class="option-desc">开启后会更新已存在的用户信息</span>
                  </el-form-item>

                  <el-form-item label="跳过错误行">
                    <el-switch v-model="importForm.skipErrors" />
                    <span class="option-desc">开启后会跳过有错误的行继续导入</span>
                  </el-form-item>

                  <el-form-item label="批次大小">
                    <el-input-number v-model="importForm.batchSize" :min="50" :max="1000" :step="50" />
                    <span class="option-desc">单次处理的数据行数</span>
                  </el-form-item>
                </el-form>

                <div class="import-actions">
                  <el-button type="info" @click="validateFile" :loading="validating">
                    <el-icon><DocumentChecked /></el-icon>
                    验证文件
                  </el-button>

                  <el-button type="warning" @click="previewData" :loading="previewing">
                    <el-icon><View /></el-icon>
                    预览数据
                  </el-button>

                  <el-button
                    type="primary"
                    @click="startImport"
                    :loading="importing"
                    :disabled="!canImport"
                  >
                    <el-icon><Upload /></el-icon>
                    开始导入
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 预览数据标签页 -->
          <el-tab-pane label="预览数据" name="preview" :disabled="!previewResult">
            <div class="preview-section" v-if="previewResult">
              <div class="preview-summary">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-statistic title="总行数" :value="previewResult.total_rows" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="预览行数" :value="previewResult.rows.length" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic
                      title="错误数"
                      :value="previewResult.errors.length"
                      :value-style="{ color: '#F56C6C' }"
                    />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic
                      title="警告数"
                      :value="previewResult.warnings.length"
                      :value-style="{ color: '#E6A23C' }"
                    />
                  </el-col>
                </el-row>
              </div>

              <el-table :data="previewResult.rows" border style="width: 100%" max-height="400">
                <el-table-column
                  v-for="header in previewResult.headers"
                  :key="header"
                  :prop="header"
                  :label="header"
                  show-overflow-tooltip
                />
              </el-table>

              <!-- 错误和警告信息 -->
              <div class="validation-messages" v-if="previewResult.errors.length > 0 || previewResult.warnings.length > 0">
                <el-collapse>
                  <el-collapse-item v-if="previewResult.errors.length > 0" title="错误信息" name="errors">
                    <el-alert
                      v-for="(error, index) in previewResult.errors"
                      :key="index"
                      :title="`第${error.row}行 - ${error.field}: ${error.message}`"
                      type="error"
                      show-icon
                      :closable="false"
                      style="margin-bottom: 8px;"
                    />
                  </el-collapse-item>

                  <el-collapse-item v-if="previewResult.warnings.length > 0" title="警告信息" name="warnings">
                    <el-alert
                      v-for="(warning, index) in previewResult.warnings"
                      :key="index"
                      :title="`第${warning.row}行 - ${warning.field}: ${warning.message}`"
                      type="warning"
                      show-icon
                      :closable="false"
                      style="margin-bottom: 8px;"
                    />
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </el-tab-pane>

          <!-- 导入结果标签页 -->
          <el-tab-pane label="导入结果" name="result" :disabled="!importResult">
            <div class="result-section" v-if="importResult">
              <div class="result-summary">
                <el-row :gutter="20">
                  <el-col :span="4">
                    <el-statistic title="总行数" :value="importResult.total_rows" />
                  </el-col>
                  <el-col :span="4">
                    <el-statistic
                      title="成功"
                      :value="importResult.success_count"
                      :value-style="{ color: '#67C23A' }"
                    />
                  </el-col>
                  <el-col :span="4">
                    <el-statistic
                      title="失败"
                      :value="importResult.failure_count"
                      :value-style="{ color: '#F56C6C' }"
                    />
                  </el-col>
                  <el-col :span="4">
                    <el-statistic
                      title="新建"
                      :value="importResult.created_count"
                      :value-style="{ color: '#409EFF' }"
                    />
                  </el-col>
                  <el-col :span="4">
                    <el-statistic
                      title="更新"
                      :value="importResult.updated_count"
                      :value-style="{ color: '#E6A23C' }"
                    />
                  </el-col>
                  <el-col :span="4">
                    <el-statistic title="跳过" :value="importResult.skipped_count" />
                  </el-col>
                </el-row>
              </div>

              <el-alert
                :title="importResult.summary"
                :type="importResult.failure_count > 0 ? 'warning' : 'success'"
                show-icon
                :closable="false"
                style="margin: 20px 0;"
              />

              <!-- 错误详情 -->
              <div v-if="importResult.errors && importResult.errors.length > 0" class="error-details">
                <h4>错误详情：</h4>
                <el-table :data="importResult.errors" border max-height="300">
                  <el-table-column prop="row" label="行号" width="80" />
                  <el-table-column prop="field" label="字段" width="120" />
                  <el-table-column prop="value" label="值" show-overflow-tooltip />
                  <el-table-column prop="message" label="错误信息" show-overflow-tooltip />
                </el-table>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>

    <!-- 筛选条件对话框 -->
    <el-dialog v-model="showFilterDialog" title="设置导出筛选条件" width="600px">
      <el-form :model="exportFilters" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户状态">
              <el-select v-model="exportFilters.status" clearable placeholder="全部">
                <el-option label="活跃" value="active" />
                <el-option label="非活跃" value="inactive" />
                <el-option label="已屏蔽" value="blocked" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="在线状态">
              <el-select v-model="exportFilters.isOnline" clearable placeholder="全部">
                <el-option label="在线" :value="true" />
                <el-option label="离线" :value="false" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="国家">
              <el-input v-model="exportFilters.country" placeholder="请输入国家" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="城市">
              <el-input v-model="exportFilters.city" placeholder="请输入城市" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="语言">
              <el-select v-model="exportFilters.language" clearable placeholder="全部">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="英语" value="en-US" />
                <el-option label="日语" value="ja-JP" />
                <el-option label="韩语" value="ko-KR" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标签">
              <el-select v-model="exportFilters.tagId" clearable placeholder="全部">
                <el-option
                  v-for="tag in availableTags"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="resetFilters">重置</el-button>
        <el-button @click="showFilterDialog = false">取消</el-button>
        <el-button type="primary" @click="applyFilters">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload, Document, DocumentChecked, View, UploadFilled } from '@element-plus/icons-vue'
import { useExport } from '@/composables/useExport'
import { useImport } from '@/composables/useImport'
import { useTagStore } from '@/stores/tag'

// Stores
const tagStore = useTagStore()

// Composables
const { exportUsers, exportUserTemplate, exportTags, exportUserStats, exportLoading } = useExport()
const {
  importUsers,
  validateImportFile,
  previewImportData,
  importing,
  validating,
  previewing
} = useImport()

// Reactive data
const exportForm = ref({
  type: 'users',
  period: 'monthly'
})

const importForm = ref({
  updateExisting: true,
  skipErrors: true,
  batchSize: 100
})

const importActiveTab = ref('upload')
const showFilterDialog = ref(false)
const fileList = ref([])
const uploadRef = ref()

const exportFilters = ref({
  status: '',
  isOnline: null,
  country: '',
  city: '',
  language: '',
  tagId: null
})

const previewResult = ref(null)
const importResult = ref(null)
const validationResult = ref(null)

// Computed
const availableTags = computed(() => tagStore.tags)

const exportTips = computed(() => {
  const tips = {
    users: '导出当前筛选条件下的所有用户数据',
    tags: '导出系统中的所有标签数据',
    stats: '导出用户统计分析报告'
  }
  return tips[exportForm.value.type] || ''
})

const hasActiveFilters = computed(() => {
  return Object.values(exportFilters.value).some(value =>
    value !== '' && value !== null && value !== undefined
  )
})

const activeFilterCount = computed(() => {
  return Object.values(exportFilters.value).filter(value =>
    value !== '' && value !== null && value !== undefined
  ).length
})

const canImport = computed(() => {
  return fileList.value.length > 0 && (!validationResult.value || validationResult.value.valid || importForm.value.skipErrors)
})

const uploadAction = computed(() => {
  return import.meta.env.VITE_API_BASE_URL + '/api/v1/import/users'
})

const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token')}` || ''
  }
})

// Methods
const handleExportTypeChange = () => {
  // 重置筛选条件
  if (exportForm.value.type !== 'users') {
    resetFilters()
  }
}

const handleExport = async () => {
  try {
    let blob
    let filename

    switch (exportForm.value.type) {
      case 'users':
        const result = await exportUsers(exportFilters.value)
        blob = new Blob([result.content], { type: result.mimeType })
        filename = result.filename
        break
      case 'tags':
        const tagsResult = await exportTags()
        blob = new Blob([tagsResult.content], { type: tagsResult.mimeType })
        filename = tagsResult.filename
        break
      case 'stats':
        const statsResult = await exportUserStats(exportForm.value.period)
        blob = new Blob([statsResult.content], { type: statsResult.mimeType })
        filename = statsResult.filename
        break
    }

    // 下载文件
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  }
}

const downloadTemplate = async () => {
  try {
    const result = await exportUserTemplate()
    const blob = new Blob([result.content], { type: result.mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败：' + error.message)
  }
}

const beforeUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel'
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isExcel) {
    ElMessage.error('只能上传 Excel 文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
    return false
  }

  // 重置结果
  previewResult.value = null
  importResult.value = null
  validationResult.value = null

  return true
}

const handleUploadSuccess = (response) => {
  ElMessage.success('文件上传成功')
  importResult.value = response.data
  importActiveTab.value = 'result'
}

const handleUploadError = (error) => {
  ElMessage.error('文件上传失败：' + error.message)
}

const validateFile = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    const file = fileList.value[0].raw
    const result = await validateImportFile(file)
    validationResult.value = result

    if (result.valid) {
      ElMessage.success('文件验证通过')
    } else {
      ElMessage.warning(`文件验证失败，发现 ${result.errors.length} 个错误`)
    }
  } catch (error) {
    ElMessage.error('文件验证失败：' + error.message)
  }
}

const previewData = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    const file = fileList.value[0].raw
    const result = await previewImportData(file, 10)
    previewResult.value = result
    importActiveTab.value = 'preview'
    ElMessage.success('数据预览生成成功')
  } catch (error) {
    ElMessage.error('数据预览失败：' + error.message)
  }
}

const startImport = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要开始导入数据吗？此操作不可撤销。',
      '确认导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 使用上传组件提交文件
    const formData = new FormData()
    formData.append('file', fileList.value[0].raw)
    formData.append('update_existing', importForm.value.updateExisting.toString())
    formData.append('skip_errors', importForm.value.skipErrors.toString())
    formData.append('batch_size', importForm.value.batchSize.toString())

    const result = await importUsers(formData)
    importResult.value = result
    importActiveTab.value = 'result'

    if (result.failure_count === 0) {
      ElMessage.success('数据导入成功')
    } else {
      ElMessage.warning(`数据导入完成，但有 ${result.failure_count} 行数据导入失败`)
    }
  } catch (error) {
    ElMessage.error('数据导入失败：' + error.message)
  }
}

const handleTabClick = (tab) => {
  if (tab.name === 'preview' && !previewResult.value) {
    previewData()
  }
}

const applyFilters = () => {
  showFilterDialog.value = false
  ElMessage.success('筛选条件已应用')
}

const resetFilters = () => {
  exportFilters.value = {
    status: '',
    isOnline: null,
    country: '',
    city: '',
    language: '',
    tagId: null
  }
}

// Lifecycle
onMounted(async () => {
  await tagStore.fetchTags()
})
</script>

<style scoped lang="scss">
.import-export-container {
  padding: 20px;

  .export-section,
  .import-section {
    margin-bottom: 20px;

    .card-header {
      h3 {
        margin: 0 0 5px 0;
        color: #303133;
      }
      span {
        color: #909399;
        font-size: 14px;
      }
    }
  }

  .export-content {
    .export-actions {
      text-align: center;
      margin-bottom: 20px;

      .el-button {
        margin: 0 10px;
      }
    }

    .export-tips {
      .el-alert {
        border: none;
        background-color: #f4f4f5;
      }
    }
  }

  .import-content {
    .upload-section {
      .upload-demo {
        width: 100%;
      }

      .import-options {
        margin-top: 20px;
        padding: 20px;
        background-color: #fafafa;
        border-radius: 6px;

        .option-desc {
          margin-left: 10px;
          color: #909399;
          font-size: 12px;
        }

        .import-actions {
          text-align: center;
          margin-top: 20px;

          .el-button {
            margin: 0 10px;
          }
        }
      }
    }

    .preview-section,
    .result-section {
      .preview-summary,
      .result-summary {
        margin-bottom: 20px;
        padding: 20px;
        background-color: #fafafa;
        border-radius: 6px;
      }

      .validation-messages {
        margin-top: 20px;
      }

      .error-details {
        margin-top: 20px;

        h4 {
          margin-bottom: 10px;
          color: #F56C6C;
        }
      }
    }
  }

  .filter-count {
    background-color: #409EFF;
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 12px;
    margin-left: 5px;
  }
}
</style>