<template>
  <div class="file-upload-item" :class="{ collapsed }">
    <div class="file-header" @click="toggleCollapse">
      <div class="file-info">
        <el-icon class="file-icon" :color="getFileIconColor()">
          <component :is="getFileIcon()" />
        </el-icon>
        <div class="file-details">
          <div class="file-name" :title="file.file.name">
            {{ file.file.name }}
          </div>
          <div class="file-meta">
            {{ formatFileSize(file.file.size) }} • {{ file.file.type || '未知类型' }}
          </div>
        </div>
      </div>

      <div class="file-status">
        <el-tag :type="getStatusType()" size="small">
          {{ getStatusText() }}
        </el-tag>
        <div class="file-progress">
          {{ file.progress }}%
        </div>
      </div>

      <div class="file-actions">
        <el-button-group size="small">
          <el-button
            v-if="file.status === 'failed'"
            type="warning"
            :icon="Refresh"
            @click.stop="$emit('retry', file.id)"
          />
          <el-button
            v-if="canCancel"
            type="danger"
            :icon="Close"
            @click.stop="handleCancel"
          />
          <el-button
            v-if="file.status !== 'uploading'"
            type="danger"
            :icon="Delete"
            @click.stop="$emit('remove', file.id)"
          />
        </el-button-group>

        <el-button
          type="text"
          :icon="collapsed ? ArrowDown : ArrowUp"
          @click.stop="toggleCollapse"
        />
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="file.status === 'uploading' || file.progress > 0" class="progress-section">
      <el-progress
        :percentage="file.progress"
        :status="getProgressStatus()"
        :stroke-width="6"
        :show-text="false"
      />
      <div v-if="file.status === 'uploading'" class="upload-info">
        <span class="upload-speed">{{ formatSpeed(file.speed) }}</span>
        <span class="time-remaining">剩余时间: {{ formatTime(file.timeRemaining) }}</span>
      </div>
    </div>

    <!-- 详细信息 -->
    <div v-if="!collapsed" class="file-details-expanded">
      <!-- 基本信息 -->
      <el-descriptions :column="2" size="small" border>
        <el-descriptions-item label="文件名">
          {{ file.file.name }}
        </el-descriptions-item>
        <el-descriptions-item label="文件大小">
          {{ formatFileSize(file.file.size) }}
        </el-descriptions-item>
        <el-descriptions-item label="文件类型">
          {{ file.file.type || '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="最后修改">
          {{ new Date(file.file.lastModified).toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item label="上传状态">
          <el-tag :type="getStatusType()" size="small">
            {{ getStatusText() }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="进度">
          {{ file.progress }}%
        </el-descriptions-item>
      </el-descriptions>

      <!-- 分片信息 -->
      <div v-if="file.chunks && file.status !== 'pending'" class="chunks-info">
        <h4>分片上传信息</h4>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-statistic title="总分片数" :value="file.chunks.total" />
          </el-col>
          <el-col :span="8">
            <el-statistic
              title="已上传"
              :value="file.chunks.uploaded"
              suffix="个"
              class="text-success"
            />
          </el-col>
          <el-col :span="8">
            <el-statistic
              title="失败"
              :value="file.chunks.failed"
              suffix="个"
              class="text-danger"
            />
          </el-col>
        </el-row>

        <!-- 分片进度可视化 -->
        <div class="chunks-visualization">
          <div class="chunks-grid">
            <div
              v-for="i in Math.min(file.chunks.total, 100)"
              :key="i"
              class="chunk-block"
              :class="{
                'uploaded': i <= file.chunks.uploaded,
                'failed': i > file.chunks.uploaded && i <= file.chunks.uploaded + file.chunks.failed
              }"
              :title="`分片 ${i}: ${i <= file.chunks.uploaded ? '已上传' : i <= file.chunks.uploaded + file.chunks.failed ? '失败' : '等待中'}`"
            />
          </div>
          <div v-if="file.chunks.total > 100" class="chunks-note">
            * 仅显示前100个分片的状态
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="file.error" class="error-info">
        <h4>错误信息</h4>
        <el-alert
          :title="file.error"
          type="error"
          :closable="false"
          show-icon
        />
      </div>

      <!-- 上传完成信息 -->
      <div v-if="file.status === 'completed' && file.url" class="completed-info">
        <h4>上传结果</h4>
        <el-descriptions :column="1" size="small" border>
          <el-descriptions-item label="文件URL">
            <el-link :href="file.url" target="_blank" type="primary">
              {{ file.url }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item v-if="file.thumbnailUrl" label="缩略图">
            <el-image
              :src="file.thumbnailUrl"
              :preview-src-list="[file.url]"
              style="width: 100px; height: 100px"
              fit="cover"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessageBox } from 'element-plus'
import {
  Document,
  Picture,
  VideoCamera,
  Headphone,
  FolderOpened,
  Files,
  Refresh,
  Close,
  Delete,
  ArrowDown,
  ArrowUp
} from '@element-plus/icons-vue'
import type { UploadFile } from '@/composables/useFileUpload'

interface Props {
  file: UploadFile
  collapsed?: boolean
}

interface Emits {
  (e: 'remove', fileId: string): void
  (e: 'retry', fileId: string): void
  (e: 'cancel', fileId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false
})

const emit = defineEmits<Emits>()

// 本地状态
const collapsed = ref(props.collapsed)

// 计算属性
const canCancel = computed(() =>
  ['pending', 'uploading'].includes(props.file.status)
)

// 方法
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消上传吗？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    emit('cancel', props.file.id)
  } catch {
    // 用户取消
  }
}

const getFileIcon = () => {
  const fileType = props.file.file.type.toLowerCase()
  const fileName = props.file.file.name.toLowerCase()

  if (fileType.startsWith('image/')) {
    return Picture
  } else if (fileType.startsWith('video/')) {
    return VideoCamera
  } else if (fileType.startsWith('audio/')) {
    return Headphone
  } else if (
    fileType.includes('pdf') ||
    fileType.includes('document') ||
    fileType.includes('text') ||
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx') ||
    fileName.endsWith('.txt')
  ) {
    return Document
  } else if (
    fileType.includes('zip') ||
    fileType.includes('rar') ||
    fileType.includes('tar') ||
    fileName.endsWith('.zip') ||
    fileName.endsWith('.rar') ||
    fileName.endsWith('.7z')
  ) {
    return FolderOpened
  } else {
    return Files
  }
}

const getFileIconColor = () => {
  const fileType = props.file.file.type.toLowerCase()

  if (fileType.startsWith('image/')) {
    return '#67c23a'
  } else if (fileType.startsWith('video/')) {
    return '#409eff'
  } else if (fileType.startsWith('audio/')) {
    return '#e6a23c'
  } else if (fileType.includes('pdf')) {
    return '#f56c6c'
  } else {
    return '#909399'
  }
}

const getStatusType = () => {
  switch (props.file.status) {
    case 'pending':
      return 'info'
    case 'uploading':
      return 'primary'
    case 'completed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'cancelled':
      return 'info'
    case 'paused':
      return 'warning'
    default:
      return 'info'
  }
}

const getStatusText = () => {
  switch (props.file.status) {
    case 'pending':
      return '等待中'
    case 'uploading':
      return '上传中'
    case 'completed':
      return '已完成'
    case 'failed':
      return '失败'
    case 'cancelled':
      return '已取消'
    case 'paused':
      return '已暂停'
    default:
      return '未知'
  }
}

const getProgressStatus = () => {
  switch (props.file.status) {
    case 'completed':
      return 'success'
    case 'failed':
      return 'exception'
    case 'uploading':
      return undefined
    default:
      return undefined
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

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '--'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}
</script>

<style scoped lang="scss">
.file-upload-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  background-color: #fff;
  transition: all 0.3s ease;

  &:hover {
    border-color: #c0c4cc;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.collapsed {
    .file-details-expanded {
      display: none;
    }
  }

  .file-header {
    display: flex;
    align-items: center;
    padding: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #f5f7fa;
    }

    .file-info {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;

      .file-icon {
        font-size: 32px;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .file-details {
        min-width: 0;

        .file-name {
          font-weight: 500;
          color: #303133;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }

        .file-meta {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .file-status {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-right: 16px;

      .file-progress {
        font-weight: 600;
        color: #606266;
        min-width: 40px;
        text-align: right;
      }
    }

    .file-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .progress-section {
    padding: 0 16px 16px;

    .upload-info {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 12px;
      color: #909399;

      .upload-speed {
        color: #409eff;
        font-weight: 500;
      }
    }
  }

  .file-details-expanded {
    padding: 16px;
    border-top: 1px solid #e4e7ed;
    background-color: #fafafa;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .chunks-info {
      margin: 16px 0;

      .chunks-visualization {
        margin-top: 12px;

        .chunks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(8px, 1fr));
          gap: 2px;
          max-width: 400px;

          .chunk-block {
            width: 8px;
            height: 8px;
            background-color: #e4e7ed;
            border-radius: 2px;
            transition: background-color 0.3s ease;

            &.uploaded {
              background-color: #67c23a;
            }

            &.failed {
              background-color: #f56c6c;
            }
          }
        }

        .chunks-note {
          margin-top: 8px;
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .error-info,
    .completed-info {
      margin: 16px 0;
    }

    .text-success {
      :deep(.el-statistic__number) {
        color: #67c23a;
      }
    }

    .text-danger {
      :deep(.el-statistic__number) {
        color: #f56c6c;
      }
    }
  }
}

@media (max-width: 768px) {
  .file-upload-item {
    .file-header {
      padding: 12px;

      .file-info {
        .file-icon {
          font-size: 24px;
          margin-right: 8px;
        }

        .file-details {
          .file-name {
            font-size: 14px;
          }

          .file-meta {
            font-size: 11px;
          }
        }
      }

      .file-status {
        gap: 8px;
        margin-right: 8px;

        .file-progress {
          font-size: 12px;
          min-width: 35px;
        }
      }
    }

    .file-details-expanded {
      padding: 12px;

      .chunks-visualization .chunks-grid {
        grid-template-columns: repeat(auto-fit, minmax(6px, 1fr));

        .chunk-block {
          width: 6px;
          height: 6px;
        }
      }
    }
  }
}
</style>