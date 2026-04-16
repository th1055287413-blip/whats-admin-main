<template>
  <el-dialog
    v-model="visible"
    title="导出日志"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="export-config">
      <!-- 基础配置 -->
      <el-form
        ref="formRef"
        :model="exportForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="文件名" prop="filename">
          <el-input
            v-model="exportForm.filename"
            placeholder="请输入文件名"
            :suffix-icon="Document"
          >
            <template #append>.{{ exportForm.format }}</template>
          </el-input>
        </el-form-item>

        <el-form-item label="导出格式" prop="format">
          <el-select v-model="exportForm.format" style="width: 100%">
            <el-option label="Excel (.xlsx)" value="excel" />
            <el-option label="CSV (.csv)" value="csv" />
            <el-option label="PDF (.pdf)" value="pdf" />
          </el-select>
        </el-form-item>

        <el-form-item label="数据范围">
          <el-radio-group v-model="exportForm.range">
            <el-radio label="current">当前页数据 ({{ currentPageCount }} 条)</el-radio>
            <el-radio label="filtered">筛选结果 ({{ totalCount }} 条)</el-radio>
            <el-radio label="all">全部数据</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="包含列">
          <el-select
            v-model="exportForm.includeColumns"
            multiple
            placeholder="选择要导出的列"
            style="width: 100%"
          >
            <el-option
              v-for="column in availableColumns"
              :key="column.value"
              :label="column.label"
              :value="column.value"
            />
          </el-select>
          <div class="column-actions">
            <el-button size="small" link @click="selectAllColumns">全选</el-button>
            <el-button size="small" link @click="selectBasicColumns">基础字段</el-button>
            <el-button size="small" link @click="clearColumns">清空</el-button>
          </div>
        </el-form-item>

        <!-- PDF特殊配置 -->
        <template v-if="exportForm.format === 'pdf'">
          <el-form-item label="页面方向">
            <el-radio-group v-model="exportForm.pdfOptions.orientation">
              <el-radio label="portrait">纵向</el-radio>
              <el-radio label="landscape">横向</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="包含图表">
            <el-switch v-model="exportForm.pdfOptions.includeCharts" />
          </el-form-item>
        </template>

        <!-- 高级选项 -->
        <el-collapse>
          <el-collapse-item title="高级选项" name="advanced">
            <el-form-item label="时间格式">
              <el-select v-model="exportForm.advanced.dateFormat" style="width: 100%">
                <el-option label="YYYY-MM-DD HH:mm:ss" value="datetime" />
                <el-option label="YYYY-MM-DD" value="date" />
                <el-option label="时间戳" value="timestamp" />
                <el-option label="相对时间" value="relative" />
              </el-select>
            </el-form-item>

            <el-form-item label="数据脱敏">
              <el-switch v-model="exportForm.advanced.maskSensitiveData" />
              <div class="help-text">启用后将对敏感信息进行脱敏处理</div>
            </el-form-item>

            <el-form-item label="包含元数据">
              <el-switch v-model="exportForm.advanced.includeMetadata" />
              <div class="help-text">包含导出时间、筛选条件等元数据</div>
            </el-form-item>

            <el-form-item label="压缩文件">
              <el-switch
                v-model="exportForm.advanced.compress"
                :disabled="exportForm.format === 'pdf'"
              />
              <div class="help-text">大文件建议开启压缩</div>
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form>

      <!-- 预览信息 -->
      <el-card class="preview-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon><View /></el-icon>
            <span>导出预览</span>
          </div>
        </template>
        <div class="preview-content">
          <div class="preview-item">
            <span class="label">预计记录数:</span>
            <span class="value">{{ estimatedRecords }} 条</span>
          </div>
          <div class="preview-item">
            <span class="label">预计文件大小:</span>
            <span class="value">{{ estimatedSize }}</span>
          </div>
          <div class="preview-item">
            <span class="label">预计处理时间:</span>
            <span class="value">{{ estimatedTime }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="exporting"
          @click="handleConfirm"
        >
          {{ exporting ? '导出中...' : '开始导出' }}
        </el-button>
      </div>
    </template>

    <!-- 导出进度对话框 -->
    <el-dialog
      v-model="progressVisible"
      title="导出进度"
      width="400px"
      :close-on-click-modal="false"
      :closable="false"
    >
      <div class="export-progress">
        <el-progress
          :percentage="exportProgress"
          :status="progressStatus"
          stroke-width="8"
          text-inside
        />
        <div class="progress-text">{{ progressText }}</div>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, View } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ExportOptions } from '@/types/audit'

interface Props {
  modelValue: boolean
  type: 'operation' | 'login' | 'anomaly'
  totalCount: number
  currentPageCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentPageCount: 0
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [options: ExportOptions]
}>()

// 响应式数据
const formRef = ref<FormInstance>()
const exporting = ref(false)
const progressVisible = ref(false)
const exportProgress = ref(0)
const progressStatus = ref<'success' | 'exception' | undefined>()
const progressText = ref('')

// 表单数据
const exportForm = reactive({
  filename: '',
  format: 'excel' as 'excel' | 'csv' | 'pdf',
  range: 'filtered' as 'current' | 'filtered' | 'all',
  includeColumns: [] as string[],
  pdfOptions: {
    orientation: 'landscape' as 'portrait' | 'landscape',
    includeCharts: true
  },
  advanced: {
    dateFormat: 'datetime' as 'datetime' | 'date' | 'timestamp' | 'relative',
    maskSensitiveData: true,
    includeMetadata: true,
    compress: false
  }
})

// 表单验证规则
const formRules: FormRules = {
  filename: [
    { required: true, message: '请输入文件名', trigger: 'blur' },
    { min: 1, max: 100, message: '文件名长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  format: [
    { required: true, message: '请选择导出格式', trigger: 'change' }
  ]
}

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const availableColumns = computed(() => {
  const baseColumns = [
    { label: '时间', value: 'created_at' },
    { label: '用户', value: 'user_name' },
    { label: 'IP地址', value: 'ip_address' },
    { label: '风险等级', value: 'risk_level' }
  ]

  if (props.type === 'operation') {
    return [
      ...baseColumns,
      { label: '操作类型', value: 'operation_type' },
      { label: '资源类型', value: 'resource_type' },
      { label: '操作名称', value: 'operation_name' },
      { label: '请求方法', value: 'request_method' },
      { label: '请求路径', value: 'request_path' },
      { label: '响应状态', value: 'response_status' },
      { label: '处理时间', value: 'duration_ms' },
      { label: '敏感操作', value: 'is_sensitive' }
    ]
  } else if (props.type === 'login') {
    return [
      ...baseColumns,
      { label: '登录类型', value: 'login_type' },
      { label: '登录状态', value: 'login_status' },
      { label: '失败原因', value: 'failure_reason' },
      { label: '会话时长', value: 'session_duration' },
      { label: '风险评分', value: 'risk_score' },
      { label: '可疑登录', value: 'is_suspicious' }
    ]
  } else {
    return [
      ...baseColumns,
      { label: '检测类型', value: 'detection_type' },
      { label: '严重程度', value: 'severity' },
      { label: '异常描述', value: 'anomaly_description' },
      { label: '风险评分', value: 'risk_score' },
      { label: '已确认', value: 'is_confirmed' },
      { label: '误报', value: 'is_false_positive' }
    ]
  }
})

const estimatedRecords = computed(() => {
  switch (exportForm.range) {
    case 'current':
      return props.currentPageCount
    case 'filtered':
      return props.totalCount
    case 'all':
      return props.totalCount * 2 // 估算值
    default:
      return 0
  }
})

const estimatedSize = computed(() => {
  const records = estimatedRecords.value
  const columns = exportForm.includeColumns.length || 10

  // 估算每条记录的平均大小
  let avgRecordSize = 200 // 基础大小

  if (props.type === 'operation') {
    avgRecordSize = 500 // 操作日志包含更多数据
  } else if (props.type === 'anomaly') {
    avgRecordSize = 400 // 异常检测数据
  }

  const totalBytes = records * avgRecordSize * (columns / 10)

  if (totalBytes < 1024) return `${totalBytes}B`
  if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)}KB`
  return `${(totalBytes / (1024 * 1024)).toFixed(1)}MB`
})

const estimatedTime = computed(() => {
  const records = estimatedRecords.value

  if (records < 1000) return '< 10秒'
  if (records < 10000) return '10-30秒'
  if (records < 100000) return '1-3分钟'
  return '> 3分钟'
})

// 方法
function initForm() {
  const typeMap = {
    operation: '操作日志',
    login: '登录日志',
    anomaly: '异常检测'
  }

  exportForm.filename = `${typeMap[props.type]}_${new Date().toISOString().split('T')[0]}`
  selectBasicColumns()
}

function selectAllColumns() {
  exportForm.includeColumns = availableColumns.value.map(col => col.value)
}

function selectBasicColumns() {
  exportForm.includeColumns = [
    'created_at',
    'user_name',
    'ip_address',
    'risk_level'
  ]

  // 添加类型特定的基础字段
  if (props.type === 'operation') {
    exportForm.includeColumns.push('operation_type', 'operation_name', 'response_status')
  } else if (props.type === 'login') {
    exportForm.includeColumns.push('login_type', 'login_status')
  } else if (props.type === 'anomaly') {
    exportForm.includeColumns.push('detection_type', 'severity', 'anomaly_description')
  }
}

function clearColumns() {
  exportForm.includeColumns = []
}

async function handleConfirm() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    if (exportForm.includeColumns.length === 0) {
      ElMessage.warning('请至少选择一个导出列')
      return
    }

    exporting.value = true
    progressVisible.value = true
    exportProgress.value = 0
    progressStatus.value = undefined
    progressText.value = '准备导出...'

    // 模拟导出进度
    const progressTimer = setInterval(() => {
      exportProgress.value += 10

      if (exportProgress.value <= 30) {
        progressText.value = '正在查询数据...'
      } else if (exportProgress.value <= 60) {
        progressText.value = '正在处理数据...'
      } else if (exportProgress.value <= 90) {
        progressText.value = '正在生成文件...'
      } else {
        progressText.value = '即将完成...'
      }

      if (exportProgress.value >= 100) {
        clearInterval(progressTimer)
        progressStatus.value = 'success'
        progressText.value = '导出完成！'

        setTimeout(() => {
          progressVisible.value = false
          exporting.value = false
          visible.value = false

          // 发送导出配置
          emit('confirm', {
            filename: exportForm.filename,
            format: exportForm.format,
            includeColumns: exportForm.includeColumns,
            filters: {} // 实际项目中应该传递当前筛选条件
          })
        }, 1000)
      }
    }, 200)

  } catch (error) {
    console.error('Export validation failed:', error)
    exporting.value = false
    progressVisible.value = false
  }
}

function handleClose() {
  if (exporting.value) return
  visible.value = false
}

// 监听器
watch(visible, (newVal) => {
  if (newVal) {
    initForm()
  }
})

watch(() => exportForm.format, (newFormat) => {
  // 根据格式调整默认设置
  if (newFormat === 'pdf') {
    exportForm.advanced.compress = false
  }
})
</script>

<style lang="scss" scoped>
.export-config {
  .column-actions {
    margin-top: 8px;
    display: flex;
    gap: 12px;
  }

  .help-text {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
  }

  .preview-card {
    margin-top: 16px;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .preview-content {
      .preview-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          color: var(--el-text-color-secondary);
        }

        .value {
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }
    }
  }
}

.export-progress {
  text-align: center;

  .progress-text {
    margin-top: 16px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-collapse-item__header) {
  font-size: 14px;
  font-weight: 500;
}

:deep(.el-collapse-item__content) {
  padding-bottom: 8px;
}
</style>