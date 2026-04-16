<template>
  <div class="file-transfer-table">
    <el-table
      :data="transfers"
      :loading="loading"
      @selection-change="$emit('selection-change', $event)"
      @sort-change="$emit('sort-change', $event)"
      stripe
      border
      style="width: 100%"
    >
      <!-- 选择列 -->
      <el-table-column type="selection" width="55" />

      <!-- 文件信息 -->
      <el-table-column label="文件信息" min-width="300">
        <template #default="{ row }">
          <div class="file-info">
            <el-icon class="file-icon" :color="getFileIconColor(row.file_type)">
              <component :is="getFileIcon(row.file_type)" />
            </el-icon>
            <div class="file-details">
              <div class="file-name" :title="row.file_name">
                {{ row.file_name }}
              </div>
              <div class="file-meta">
                {{ formatFileSize(row.file_size) }} • {{ row.file_type }}
              </div>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 用户 -->
      <el-table-column label="用户" prop="user_name" width="120" sortable>
        <template #default="{ row }">
          <div class="user-info">
            <el-avatar :size="24" :src="row.user_avatar">
              <el-icon><User /></el-icon>
            </el-avatar>
            <span class="user-name">{{ row.user_name || '未知用户' }}</span>
          </div>
        </template>
      </el-table-column>

      <!-- 传输类型 -->
      <el-table-column label="类型" prop="transfer_type" width="80">
        <template #default="{ row }">
          <el-tag
            :type="row.transfer_type === 'upload' ? 'primary' : 'success'"
            size="small"
          >
            {{ row.transfer_type === 'upload' ? '上传' : '下载' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 状态 -->
      <el-table-column label="状态" prop="status" width="100" sortable>
        <template #default="{ row }">
          <div class="status-cell">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
            <div v-if="row.is_intercepted" class="intercept-indicator">
              <el-icon color="#e6a23c" :title="row.intercept_reason">
                <Warning />
              </el-icon>
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 进度 -->
      <el-table-column label="进度" width="120">
        <template #default="{ row }">
          <div class="progress-cell">
            <el-progress
              :percentage="row.progress_percent"
              :status="getProgressStatus(row.status)"
              :stroke-width="6"
              :show-text="false"
            />
            <span class="progress-text">{{ row.progress_percent }}%</span>
          </div>
        </template>
      </el-table-column>

      <!-- 传输速度 -->
      <el-table-column label="速度" width="100">
        <template #default="{ row }">
          <span v-if="row.transfer_speed && row.status === 'uploading'">
            {{ formatSpeed(row.transfer_speed) }}
          </span>
          <span v-else class="text-muted">--</span>
        </template>
      </el-table-column>

      <!-- 安全扫描 -->
      <el-table-column label="安全" width="80">
        <template #default="{ row }">
          <div class="security-cell">
            <el-icon
              v-if="row.security_scan_result"
              :color="getSecurityColor(row.security_scan_result)"
              :title="getSecurityText(row.security_scan_result)"
            >
              <component :is="getSecurityIcon(row.security_scan_result)" />
            </el-icon>
            <span v-else class="text-muted">--</span>
          </div>
        </template>
      </el-table-column>

      <!-- 创建时间 -->
      <el-table-column label="开始时间" prop="created_at" width="160" sortable>
        <template #default="{ row }">
          <div class="time-cell">
            <div>{{ formatDateTime(row.created_at) }}</div>
            <div v-if="row.completed_at" class="duration">
              耗时: {{ formatDuration(row.created_at, row.completed_at) }}
            </div>
          </div>
        </template>
      </el-table-column>

      <!-- 操作 -->
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-space>
            <el-button
              v-if="row.status === 'failed'"
              type="warning"
              size="small"
              :icon="Refresh"
              @click="$emit('retry', row.id)"
              title="重试"
            />
            <el-button
              v-if="['pending', 'uploading'].includes(row.status)"
              type="danger"
              size="small"
              :icon="Close"
              @click="$emit('cancel', row.id)"
              title="取消"
            />
            <el-dropdown trigger="click">
              <el-button type="primary" size="small" :icon="More" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="viewDetails(row)">
                    <el-icon><View /></el-icon> 查看详情
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 'completed'"
                    @click="downloadFile(row)"
                  >
                    <el-icon><Download /></el-icon> 下载文件
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.security_scan_result"
                    @click="viewSecurityReport(row)"
                  >
                    <el-icon><Shield /></el-icon> 安全报告
                  </el-dropdown-item>
                  <el-dropdown-item
                    divided
                    @click="deleteTransfer(row)"
                  >
                    <el-icon><Delete /></el-icon> 删除记录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-space>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div v-if="pagination.total > 0" class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.current_page"
        :page-size="pagination.per_page"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="$emit('page-change', $event)"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 文件详情对话框 -->
    <file-transfer-details
      v-model="showDetailsDialog"
      :transfer="selectedTransfer"
    />

    <!-- 安全报告对话框 -->
    <security-report-dialog
      v-model="showSecurityDialog"
      :transfer="selectedTransfer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Warning,
  Refresh,
  Close,
  More,
  View,
  Download,
  Shield,
  Delete,
  Document,
  Picture,
  VideoCamera,
  Headphone,
  FolderOpened,
  Files,
  CircleCheck,
  CircleClose,
  QuestionFilled
} from '@element-plus/icons-vue'
import FileTransferDetails from './FileTransferDetails.vue'
import SecurityReportDialog from './SecurityReportDialog.vue'
import type { FileTransfer } from '@/types/files'

interface Props {
  transfers: FileTransfer[]
  loading?: boolean
  pagination: {
    total: number
    current_page: number
    per_page: number
    total_pages: number
  }
}

interface Emits {
  (e: 'selection-change', selection: FileTransfer[]): void
  (e: 'sort-change', sort: any): void
  (e: 'page-change', page: number): void
  (e: 'size-change', size: number): void
  (e: 'retry', transferId: string): void
  (e: 'cancel', transferId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

// 组件状态
const showDetailsDialog = ref(false)
const showSecurityDialog = ref(false)
const selectedTransfer = ref<FileTransfer | null>(null)

// 方法
const handleSizeChange = (size: number) => {
  emit('size-change', size)
}

const viewDetails = (transfer: FileTransfer) => {
  selectedTransfer.value = transfer
  showDetailsDialog.value = true
}

const viewSecurityReport = (transfer: FileTransfer) => {
  selectedTransfer.value = transfer
  showSecurityDialog.value = true
}

const downloadFile = async (transfer: FileTransfer) => {
  try {
    // 这里应该调用下载API
    ElMessage.success('开始下载文件')
  } catch (error: any) {
    ElMessage.error(error.message || '下载失败')
  }
}

const deleteTransfer = async (transfer: FileTransfer) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除传输记录 "${transfer.file_name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 这里应该调用删除API
    ElMessage.success('传输记录已删除')
  } catch {
    // 用户取消
  }
}

const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase()

  if (type.includes('image')) {
    return Picture
  } else if (type.includes('video')) {
    return VideoCamera
  } else if (type.includes('audio')) {
    return Headphone
  } else if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
    return Document
  } else if (type.includes('zip') || type.includes('rar') || type.includes('archive')) {
    return FolderOpened
  } else {
    return Files
  }
}

const getFileIconColor = (fileType: string) => {
  const type = fileType.toLowerCase()

  if (type.includes('image')) {
    return '#67c23a'
  } else if (type.includes('video')) {
    return '#409eff'
  } else if (type.includes('audio')) {
    return '#e6a23c'
  } else if (type.includes('pdf')) {
    return '#f56c6c'
  } else {
    return '#909399'
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'pending':
      return 'info'
    case 'uploading':
      return 'primary'
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'blocked':
      return 'danger'
    case 'cancelled':
      return 'info'
    case 'paused':
      return 'warning'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return '等待中'
    case 'uploading':
      return '上传中'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    case 'blocked':
      return '已拦截'
    case 'cancelled':
      return '已取消'
    case 'paused':
      return '已暂停'
    default:
      return '未知'
  }
}

const getProgressStatus = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'failed':
    case 'blocked':
      return 'exception'
    default:
      return undefined
  }
}

const getSecurityIcon = (result: string) => {
  switch (result) {
    case 'clean':
      return CircleCheck
    case 'malicious':
    case 'suspicious':
      return CircleClose
    case 'error':
      return QuestionFilled
    default:
      return QuestionFilled
  }
}

const getSecurityColor = (result: string) => {
  switch (result) {
    case 'clean':
      return '#67c23a'
    case 'malicious':
      return '#f56c6c'
    case 'suspicious':
      return '#e6a23c'
    case 'error':
      return '#909399'
    default:
      return '#909399'
  }
}

const getSecurityText = (result: string) => {
  switch (result) {
    case 'clean':
      return '安全'
    case 'malicious':
      return '恶意'
    case 'suspicious':
      return '可疑'
    case 'error':
      return '扫描错误'
    default:
      return '未知'
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

const formatSpeed = (bytesPerSecond: number): string => {
  return `${formatFileSize(bytesPerSecond)}/s`
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDuration = (startTime: string, endTime: string): string => {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const duration = end.getTime() - start.getTime()

  const seconds = Math.floor(duration / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}
</script>

<style scoped lang="scss">
.file-transfer-table {
  .file-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .file-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .file-details {
      min-width: 0;
      flex: 1;

      .file-name {
        font-weight: 500;
        color: #303133;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 2px;
      }

      .file-meta {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .user-name {
      font-size: 12px;
      color: #606266;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .status-cell {
    display: flex;
    align-items: center;
    gap: 4px;

    .intercept-indicator {
      cursor: help;
    }
  }

  .progress-cell {
    .progress-text {
      font-size: 12px;
      color: #606266;
      margin-top: 2px;
      display: block;
      text-align: center;
    }
  }

  .security-cell {
    text-align: center;

    .el-icon {
      font-size: 18px;
      cursor: help;
    }
  }

  .time-cell {
    .duration {
      font-size: 11px;
      color: #909399;
      margin-top: 2px;
    }
  }

  .text-muted {
    color: #c0c4cc;
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .file-transfer-table {
    :deep(.el-table) {
      font-size: 12px;

      .el-table__cell {
        padding: 8px 0;
      }
    }

    .file-info {
      gap: 8px;

      .file-icon {
        font-size: 20px;
      }

      .file-details {
        .file-name {
          font-size: 12px;
        }

        .file-meta {
          font-size: 11px;
        }
      }
    }

    .user-info {
      gap: 6px;

      .user-name {
        font-size: 11px;
      }
    }

    .pagination-wrapper {
      :deep(.el-pagination) {
        .btn-prev,
        .btn-next,
        .el-pager li {
          font-size: 12px;
        }
      }
    }
  }
}
</style>