<template>
  <div class="batch-operations">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>批量操作</h3>
          <span>对选中的用户执行批量操作</span>
        </div>
      </template>

      <div class="batch-content">
        <!-- 选中用户信息 -->
        <div class="selected-users-info">
          <el-alert
            :title="`已选中 ${selectedUserIds.length} 个用户`"
            :type="selectedUserIds.length > 0 ? 'success' : 'info'"
            :description="getSelectedUsersDescription()"
            show-icon
            :closable="false"
          />
        </div>

        <!-- 操作选择区域 -->
        <div class="operation-section" v-if="selectedUserIds.length > 0">
          <el-form :model="batchForm" label-width="120px" size="default">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="操作类型" required>
                  <el-select
                    v-model="batchForm.operation"
                    placeholder="请选择操作类型"
                    @change="handleOperationChange"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="op in operationTypes"
                      :key="op.value"
                      :label="op.label"
                      :value="op.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8" v-if="batchForm.operation === 'update_status'">
                <el-form-item label="目标状态" required>
                  <el-select v-model="batchForm.data.status" placeholder="请选择状态">
                    <el-option label="活跃" value="active" />
                    <el-option label="非活跃" value="inactive" />
                    <el-option label="已屏蔽" value="blocked" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8" v-if="batchForm.operation === 'add_tags' || batchForm.operation === 'remove_tags'">
                <el-form-item :label="batchForm.operation === 'add_tags' ? '添加标签' : '移除标签'" required>
                  <el-select
                    v-model="batchForm.data.tag_ids"
                    multiple
                    placeholder="请选择标签"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="tag in availableTags"
                      :key="tag.id"
                      :label="tag.name"
                      :value="tag.id"
                    >
                      <span style="float: left">{{ tag.name }}</span>
                      <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                        <el-tag size="small" :color="tag.color" style="margin-left: 8px">{{ tag.user_count }}</el-tag>
                      </span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="16" v-if="batchForm.operation === 'update_fields'">
                <el-row :gutter="10">
                  <el-col :span="8">
                    <el-form-item label="国家">
                      <el-input v-model="batchForm.data.country" placeholder="请输入国家" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="城市">
                      <el-input v-model="batchForm.data.city" placeholder="请输入城市" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="语言">
                      <el-select v-model="batchForm.data.language" placeholder="请选择语言" clearable>
                        <el-option label="简体中文" value="zh-CN" />
                        <el-option label="英语" value="en-US" />
                        <el-option label="日语" value="ja-JP" />
                        <el-option label="韩语" value="ko-KR" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>

            <!-- 高级选项 -->
            <el-collapse v-model="showAdvancedOptions">
              <el-collapse-item title="高级选项" name="advanced">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="批次大小">
                      <el-input-number
                        v-model="batchForm.options.batchSize"
                        :min="10"
                        :max="200"
                        :step="10"
                      />
                      <div class="option-desc">每批处理的用户数量</div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="6">
                    <el-form-item label="并行批次">
                      <el-input-number
                        v-model="batchForm.options.parallelBatches"
                        :min="1"
                        :max="5"
                      />
                      <div class="option-desc">同时处理的批次数量</div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="6">
                    <el-form-item label="错误处理">
                      <el-switch
                        v-model="batchForm.options.continueOnError"
                        active-text="继续处理"
                        inactive-text="停止处理"
                      />
                      <div class="option-desc">遇到错误时的处理方式</div>
                    </el-form-item>
                  </el-col>

                  <el-col :span="6">
                    <el-form-item label="进度通知">
                      <el-switch
                        v-model="batchForm.options.notifyProgress"
                        active-text="开启"
                        inactive-text="关闭"
                      />
                      <div class="option-desc">是否显示处理进度</div>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>
            </el-collapse>

            <!-- 操作按钮 -->
            <div class="operation-buttons">
              <el-button
                type="primary"
                size="large"
                :loading="processing"
                :disabled="!canExecute"
                @click="executeBatchOperation"
              >
                <el-icon><Operation /></el-icon>
                执行批量操作
              </el-button>

              <el-button size="large" @click="resetBatchForm">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>

              <el-button
                type="info"
                size="large"
                @click="previewOperation"
                :disabled="!canExecute"
              >
                <el-icon><View /></el-icon>
                预览操作
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- 操作历史 -->
        <div class="operation-history" v-if="showHistory">
          <el-divider />
          <h4>批量操作历史</h4>

          <el-table :data="operationHistory" border style="width: 100%" max-height="300">
            <el-table-column prop="task_id" label="任务ID" width="180" show-overflow-tooltip />
            <el-table-column prop="operation" label="操作类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getOperationTagType(row.operation)">
                  {{ getOperationName(row.operation) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="total_count" label="总数量" width="80" />
            <el-table-column prop="success_count" label="成功" width="80">
              <template #default="{ row }">
                <span style="color: #67C23A">{{ row.success_count }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="failure_count" label="失败" width="80">
              <template #default="{ row }">
                <span style="color: #F56C6C">{{ row.failure_count }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_time" label="开始时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.start_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="耗时" width="100">
              <template #default="{ row }">
                {{ formatDuration(row.duration) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button
                  type="text"
                  size="small"
                  @click="viewOperationDetails(row)"
                  v-if="row.status !== 'pending'"
                >
                  查看详情
                </el-button>
                <el-button
                  type="text"
                  size="small"
                  @click="cancelOperation(row.task_id)"
                  v-if="row.status === 'processing'"
                >
                  取消
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="history-pagination">
            <el-pagination
              v-model:current-page="historyPagination.page"
              v-model:page-size="historyPagination.limit"
              :page-sizes="[10, 20, 50]"
              :total="historyPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadOperationHistory"
              @current-change="loadOperationHistory"
            />
          </div>
        </div>
      </div>
    </el-card>

    <!-- 进度监控对话框 -->
    <el-dialog
      v-model="showProgressDialog"
      title="批量操作进度"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="progress-content" v-if="currentProgress">
        <div class="progress-summary">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-statistic title="总进度" :value="currentProgress.progress" suffix="%" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="成功数量" :value="currentProgress.success_count" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="失败数量" :value="currentProgress.failure_count" />
            </el-col>
          </el-row>
        </div>

        <div class="progress-bar">
          <el-progress
            :percentage="currentProgress.progress"
            :status="getProgressStatus()"
            :stroke-width="20"
            :text-inside="true"
          />
        </div>

        <div class="progress-details">
          <p><strong>当前状态：</strong>{{ getStatusText(currentProgress.status) }}</p>
          <p><strong>处理进度：</strong>{{ currentProgress.current_batch }}/{{ currentProgress.total_batches }} 批次</p>
          <p><strong>当前信息：</strong>{{ currentProgress.message }}</p>
          <p v-if="currentProgress.estimated_time">
            <strong>预估剩余时间：</strong>{{ formatDuration(currentProgress.estimated_time) }}
          </p>
        </div>
      </div>

      <template #footer>
        <el-button
          v-if="currentProgress && (currentProgress.status === 'processing' || currentProgress.status === 'pending')"
          type="danger"
          @click="cancelCurrentOperation"
        >
          取消操作
        </el-button>
        <el-button
          v-if="currentProgress && (currentProgress.status === 'completed' || currentProgress.status === 'failed' || currentProgress.status === 'cancelled')"
          type="primary"
          @click="showProgressDialog = false"
        >
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 操作预览对话框 -->
    <el-dialog v-model="showPreviewDialog" title="操作预览" width="500px">
      <div class="preview-content" v-if="operationPreview">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="操作类型">
            {{ getOperationName(operationPreview.operation) }}
          </el-descriptions-item>
          <el-descriptions-item label="影响用户数量">
            {{ operationPreview.user_count }}
          </el-descriptions-item>
          <el-descriptions-item label="操作参数">
            <pre>{{ JSON.stringify(operationPreview.data, null, 2) }}</pre>
          </el-descriptions-item>
          <el-descriptions-item label="预估耗时">
            {{ operationPreview.estimated_duration }}
          </el-descriptions-item>
        </el-descriptions>

        <el-alert
          title="请确认操作信息无误后再执行，批量操作一旦开始无法撤销"
          type="warning"
          show-icon
          :closable="false"
          style="margin-top: 20px"
        />
      </div>

      <template #footer>
        <el-button @click="showPreviewDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAndExecute">确认执行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Operation, Refresh, View } from '@element-plus/icons-vue'
import { useBatchOperations } from '@/composables/useBatchOperations'
import { useTagStore } from '@/stores/tag'

// Props
interface Props {
  selectedUserIds: number[]
  selectedUsers?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedUsers: () => []
})

// Stores
const tagStore = useTagStore()

// Composables
const {
  batchOperateUsers,
  getBatchProgress,
  cancelBatchOperation,
  getBatchHistory,
  processing
} = useBatchOperations()

// Reactive data
const batchForm = ref({
  operation: '',
  data: {} as any,
  options: {
    batchSize: 50,
    parallelBatches: 2,
    continueOnError: true,
    notifyProgress: true
  }
})

const showAdvancedOptions = ref([])
const showHistory = ref(true)
const showProgressDialog = ref(false)
const showPreviewDialog = ref(false)

const currentProgress = ref(null)
const operationPreview = ref(null)
const operationHistory = ref([])
const progressTimer = ref(null)

const historyPagination = ref({
  page: 1,
  limit: 10,
  total: 0
})

// Computed
const availableTags = computed(() => tagStore.tags)

const operationTypes = computed(() => [
  { label: '更新状态', value: 'update_status' },
  { label: '添加标签', value: 'add_tags' },
  { label: '移除标签', value: 'remove_tags' },
  { label: '更新字段', value: 'update_fields' },
  { label: '删除用户', value: 'delete' }
])

const canExecute = computed(() => {
  if (props.selectedUserIds.length === 0) return false
  if (!batchForm.value.operation) return false

  switch (batchForm.value.operation) {
    case 'update_status':
      return !!batchForm.value.data.status
    case 'add_tags':
    case 'remove_tags':
      return batchForm.value.data.tag_ids && batchForm.value.data.tag_ids.length > 0
    case 'update_fields':
      return Object.keys(batchForm.value.data).some(key =>
        key !== 'tag_ids' && key !== 'status' && batchForm.value.data[key]
      )
    case 'delete':
      return true
    default:
      return false
  }
})

// Methods
const getSelectedUsersDescription = () => {
  if (props.selectedUserIds.length === 0) {
    return '请先在用户列表中选择要操作的用户'
  }
  return `可以对这些用户执行批量操作`
}

const handleOperationChange = () => {
  // 重置数据
  batchForm.value.data = {}

  // 根据操作类型初始化数据结构
  switch (batchForm.value.operation) {
    case 'add_tags':
    case 'remove_tags':
      batchForm.value.data.tag_ids = []
      break
    case 'update_status':
      batchForm.value.data.status = ''
      break
    case 'update_fields':
      batchForm.value.data = {
        country: '',
        city: '',
        language: ''
      }
      break
  }
}

const resetBatchForm = () => {
  batchForm.value = {
    operation: '',
    data: {},
    options: {
      batchSize: 50,
      parallelBatches: 2,
      continueOnError: true,
      notifyProgress: true
    }
  }
}

const previewOperation = () => {
  const userCount = props.selectedUserIds.length
  const estimatedDuration = Math.ceil(userCount / batchForm.value.options.batchSize) * 2 // 估算每批2秒

  operationPreview.value = {
    operation: batchForm.value.operation,
    user_count: userCount,
    data: { ...batchForm.value.data },
    estimated_duration: `${estimatedDuration} 秒`
  }

  showPreviewDialog.value = true
}

const confirmAndExecute = () => {
  showPreviewDialog.value = false
  executeBatchOperation()
}

const executeBatchOperation = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${props.selectedUserIds.length} 个用户执行${getOperationName(batchForm.value.operation)}吗？`,
      '确认批量操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const request = {
      user_ids: props.selectedUserIds,
      operation: batchForm.value.operation,
      data: { ...batchForm.value.data },
      options: { ...batchForm.value.options }
    }

    const result = await batchOperateUsers(request)

    ElMessage.success('批量操作已开始执行')

    // 显示进度监控
    if (batchForm.value.options.notifyProgress) {
      currentProgress.value = null
      showProgressDialog.value = true
      startProgressPolling(result.task_id)
    }

    // 刷新历史记录
    await loadOperationHistory()

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量操作执行失败：' + error.message)
    }
  }
}

const startProgressPolling = (taskId: string) => {
  const pollProgress = async () => {
    try {
      const progress = await getBatchProgress(taskId)
      currentProgress.value = progress

      if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
        clearInterval(progressTimer.value)

        if (progress.status === 'completed') {
          ElMessage.success('批量操作执行完成')
        } else if (progress.status === 'failed') {
          ElMessage.error('批量操作执行失败')
        } else {
          ElMessage.warning('批量操作已取消')
        }

        // 刷新历史记录
        await loadOperationHistory()
      }
    } catch (error) {
      console.error('Failed to get progress:', error)
      clearInterval(progressTimer.value)
    }
  }

  // 立即执行一次，然后每2秒轮询
  pollProgress()
  progressTimer.value = setInterval(pollProgress, 2000)
}

const cancelCurrentOperation = async () => {
  if (!currentProgress.value) return

  try {
    await ElMessageBox.confirm(
      '确定要取消当前批量操作吗？已处理的数据不会回滚。',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await cancelBatchOperation(currentProgress.value.task_id)
    ElMessage.success('批量操作已取消')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消操作失败：' + error.message)
    }
  }
}

const cancelOperation = async (taskId: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消这个批量操作吗？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await cancelBatchOperation(taskId)
    ElMessage.success('操作已取消')
    await loadOperationHistory()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消操作失败：' + error.message)
    }
  }
}

const loadOperationHistory = async () => {
  try {
    const result = await getBatchHistory({
      page: historyPagination.value.page,
      limit: historyPagination.value.limit
    })

    operationHistory.value = result.items || []
    historyPagination.value.total = result.total || 0
  } catch (error) {
    console.error('Failed to load operation history:', error)
  }
}

const viewOperationDetails = (operation: any) => {
  // TODO: 显示操作详情对话框
  ElMessage.info('功能开发中...')
}

// Utility functions
const getOperationName = (operation: string) => {
  const names = {
    'update_status': '更新状态',
    'add_tags': '添加标签',
    'remove_tags': '移除标签',
    'update_fields': '更新字段',
    'delete': '删除用户'
  }
  return names[operation] || operation
}

const getOperationTagType = (operation: string) => {
  const types = {
    'update_status': 'primary',
    'add_tags': 'success',
    'remove_tags': 'warning',
    'update_fields': 'info',
    'delete': 'danger'
  }
  return types[operation] || 'info'
}

const getStatusText = (status: string) => {
  const texts = {
    'pending': '等待中',
    'processing': '处理中',
    'completed': '已完成',
    'failed': '失败',
    'cancelled': '已取消'
  }
  return texts[status] || status
}

const getStatusTagType = (status: string) => {
  const types = {
    'pending': 'info',
    'processing': 'primary',
    'completed': 'success',
    'failed': 'danger',
    'cancelled': 'warning'
  }
  return types[status] || 'info'
}

const getProgressStatus = () => {
  if (!currentProgress.value) return null

  switch (currentProgress.value.status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'exception'
    case 'cancelled':
      return 'warning'
    default:
      return null
  }
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString()
}

const formatDuration = (duration: string | number) => {
  if (typeof duration === 'string') {
    return duration
  }

  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}时${minutes % 60}分${seconds % 60}秒`
  } else if (minutes > 0) {
    return `${minutes}分${seconds % 60}秒`
  } else {
    return `${seconds}秒`
  }
}

// Lifecycle
onMounted(async () => {
  await tagStore.fetchTags()
  await loadOperationHistory()
})

onUnmounted(() => {
  if (progressTimer.value) {
    clearInterval(progressTimer.value)
  }
})
</script>

<style scoped lang="scss">
.batch-operations {
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

  .batch-content {
    .selected-users-info {
      margin-bottom: 20px;
    }

    .operation-section {
      .option-desc {
        font-size: 12px;
        color: #909399;
        margin-top: 5px;
      }

      .operation-buttons {
        text-align: center;
        margin: 30px 0 20px 0;

        .el-button {
          margin: 0 10px;
        }
      }
    }

    .operation-history {
      h4 {
        margin: 20px 0 15px 0;
        color: #303133;
      }

      .history-pagination {
        margin-top: 15px;
        text-align: right;
      }
    }
  }

  .progress-content {
    .progress-summary {
      margin-bottom: 20px;
    }

    .progress-bar {
      margin: 20px 0;
    }

    .progress-details {
      p {
        margin: 8px 0;
        line-height: 1.5;
      }
    }
  }

  .preview-content {
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      margin: 0;
    }
  }
}
</style>