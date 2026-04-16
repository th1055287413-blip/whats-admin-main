<template>
  <div class="file-upload-container">
    <el-page-header @back="$router.go(-1)" content="文件上传">
      <template #extra>
        <el-space>
          <el-button
            type="primary"
            :icon="Upload"
            @click="triggerFileSelect"
            :disabled="!canAddFiles || uploading"
          >
            选择文件
          </el-button>
          <el-button
            v-if="hasFiles && !allCompleted"
            type="success"
            :icon="VideoPlay"
            @click="startUpload"
            :disabled="uploading"
          >
            开始上传
          </el-button>
          <el-button
            v-if="hasFiles"
            type="danger"
            :icon="Delete"
            @click="clearAllFiles"
            :disabled="uploading"
          >
            清空列表
          </el-button>
        </el-space>
      </template>
    </el-page-header>

    <!-- 拖拽上传区域 -->
    <div
      class="upload-drop-zone"
      :class="{
        'drag-over': dragOver,
        'disabled': !canAddFiles || uploading
      }"
      @click="triggerFileSelect"
    >
      <div class="drop-zone-content">
        <el-icon size="48" class="upload-icon">
          <UploadFilled />
        </el-icon>
        <h3>拖拽文件到此处或点击选择文件</h3>
        <p class="upload-tips">
          支持多文件上传，单个文件最大 {{ formatFileSize(config.maxFileSize) }}，
          最多 {{ config.maxFiles }} 个文件
        </p>
        <p v-if="config.allowedTypes.length > 0" class="allowed-types">
          支持的文件类型：{{ config.allowedTypes.join(', ') }}
        </p>
      </div>
    </div>

    <!-- 上传统计信息 -->
    <el-card v-if="hasFiles" class="upload-stats" shadow="never">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">总文件数</div>
          <div class="stat-value">{{ totalFiles }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">总进度</div>
          <div class="stat-value">{{ totalProgress }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">上传速度</div>
          <div class="stat-value">{{ formatSpeed(totalSpeed) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">已完成</div>
          <div class="stat-value text-success">{{ completedFiles.length }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">失败</div>
          <div class="stat-value text-danger">{{ failedFiles.length }}</div>
        </div>
      </div>
    </el-card>

    <!-- 文件列表 -->
    <el-card v-if="hasFiles" class="file-list-card">
      <template #header>
        <div class="card-header">
          <span>文件列表 ({{ files.length }})</span>
          <el-space>
            <el-button
              v-if="hasErrors"
              type="warning"
              size="small"
              @click="retryAllFailed"
            >
              重试失败文件
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="collapseAll = !collapseAll"
            >
              {{ collapseAll ? '展开' : '折叠' }}全部
            </el-button>
          </el-space>
        </div>
      </template>

      <div class="file-list">
        <file-upload-item
          v-for="file in files"
          :key="file.id"
          :file="file"
          :collapsed="collapseAll"
          @remove="removeFile"
          @retry="retryUpload"
          @cancel="cancelUpload"
        />
      </div>
    </el-card>

    <!-- 上传配置 -->
    <el-card class="config-card">
      <template #header>
        <span>上传配置</span>
      </template>

      <el-form :model="uploadConfig" label-width="120px">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="分片上传">
              <el-switch
                v-model="config.enableChunked"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="断点续传">
              <el-switch
                v-model="config.enableResume"
                active-text="启用"
                inactive-text="禁用"
                :disabled="!config.enableChunked"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="自动上传">
              <el-switch
                v-model="config.autoUpload"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分片大小">
              <el-select v-model="config.chunkSize">
                <el-option label="512KB" :value="512 * 1024" />
                <el-option label="1MB" :value="1024 * 1024" />
                <el-option label="2MB" :value="2 * 1024 * 1024" />
                <el-option label="5MB" :value="5 * 1024 * 1024" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="允许的文件类型">
          <el-select
            v-model="config.allowedTypes"
            multiple
            placeholder="留空表示允许所有类型"
            clearable
            style="width: 100%"
          >
            <el-option-group label="图片">
              <el-option label="JPG/JPEG" value=".jpg,.jpeg" />
              <el-option label="PNG" value=".png" />
              <el-option label="GIF" value=".gif" />
              <el-option label="WebP" value=".webp" />
            </el-option-group>
            <el-option-group label="文档">
              <el-option label="PDF" value=".pdf" />
              <el-option label="Word" value=".doc,.docx" />
              <el-option label="Excel" value=".xls,.xlsx" />
              <el-option label="PPT" value=".ppt,.pptx" />
            </el-option-group>
            <el-option-group label="压缩文件">
              <el-option label="ZIP" value=".zip" />
              <el-option label="RAR" value=".rar" />
              <el-option label="7Z" value=".7z" />
            </el-option-group>
            <el-option-group label="视频">
              <el-option label="MP4" value=".mp4" />
              <el-option label="AVI" value=".avi" />
              <el-option label="MOV" value=".mov" />
            </el-option-group>
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      multiple
      style="display: none"
      @change="handleFileSelect"
      :accept="config.allowedTypes.join(',')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Upload,
  UploadFilled,
  VideoPlay,
  Delete
} from '@element-plus/icons-vue'
import { useFileUpload } from '@/composables/useFileUpload'
import FileUploadItem from '@/components/files/FileUploadItem.vue'

const router = useRouter()

// 文件上传配置
const uploadConfig = reactive({
  maxFileSize: 100 * 1024 * 1024, // 100MB
  maxFiles: 10,
  allowedTypes: [] as string[],
  enableChunked: true,
  chunkSize: 1024 * 1024, // 1MB
  enableResume: true,
  autoUpload: false, // 手动控制上传
  enableDrop: true
})

// 使用文件上传组合式函数
const {
  files,
  uploading,
  dragOver,
  totalFiles,
  uploadingFiles,
  completedFiles,
  failedFiles,
  totalProgress,
  totalSpeed,
  canAddFiles,
  hasFiles,
  allCompleted,
  hasErrors,
  addFiles,
  removeFile,
  clearFiles,
  retryUpload,
  retryAllFailed,
  cancelUpload,
  formatFileSize,
  formatSpeed,
  config
} = useFileUpload(uploadConfig)

// 组件状态
const fileInput = ref<HTMLInputElement>()
const collapseAll = ref(false)

// 计算属性
const isUploading = computed(() => uploadingFiles.value.length > 0)

// 方法
const triggerFileSelect = () => {
  if (!canAddFiles.value || uploading.value) return
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    addFiles(target.files)
    // 清空输入，允许重复选择相同文件
    target.value = ''
  }
}

const startUpload = async () => {
  const pendingFiles = files.value.filter(f => f.status === 'pending')
  if (pendingFiles.length === 0) {
    ElMessage.warning('没有需要上传的文件')
    return
  }

  // 这里可以添加上传前的确认逻辑
  try {
    await ElMessageBox.confirm(
      `确定要上传 ${pendingFiles.length} 个文件吗？`,
      '确认上传',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    // 手动触发上传（通过修改配置）
    config.autoUpload = true

    // 重新添加到队列
    pendingFiles.forEach(file => {
      file.status = 'pending'
    })

    ElMessage.success('开始上传文件')
  } catch {
    // 用户取消
  }
}

const clearAllFiles = async () => {
  if (isUploading.value) {
    try {
      await ElMessageBox.confirm(
        '有文件正在上传中，确定要清空所有文件吗？',
        '确认清空',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }

  clearFiles()
  ElMessage.success('已清空文件列表')
}

// 生命周期
onMounted(() => {
  // 组件挂载时可以从后端获取上传配置
  // 这里先使用默认配置
})
</script>

<style scoped lang="scss">
.file-upload-container {
  padding: 20px;
  min-height: calc(100vh - 80px);
  background-color: #f5f7fa;

  .upload-drop-zone {
    margin: 20px 0;
    padding: 60px 20px;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    background-color: #fafafa;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(.disabled) {
      border-color: #409eff;
      background-color: #f0f9ff;
    }

    &.drag-over {
      border-color: #67c23a;
      background-color: #f0f9ff;
      transform: scale(1.02);
    }

    &.disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .drop-zone-content {
      .upload-icon {
        color: #c0c4cc;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px 0;
        color: #303133;
        font-size: 18px;
        font-weight: 500;
      }

      .upload-tips {
        margin: 8px 0;
        color: #606266;
        font-size: 14px;
      }

      .allowed-types {
        margin: 8px 0 0 0;
        color: #909399;
        font-size: 12px;
      }
    }
  }

  .upload-stats {
    margin: 20px 0;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 20px;

      .stat-item {
        text-align: center;

        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;

          &.text-success {
            color: #67c23a;
          }

          &.text-danger {
            color: #f56c6c;
          }
        }
      }
    }
  }

  .file-list-card {
    margin: 20px 0;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .file-list {
      max-height: 600px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;

        &:hover {
          background: #a8a8a8;
        }
      }
    }
  }

  .config-card {
    margin: 20px 0;
  }
}

@media (max-width: 768px) {
  .file-upload-container {
    padding: 10px;

    .upload-drop-zone {
      padding: 40px 15px;

      .drop-zone-content {
        h3 {
          font-size: 16px;
        }

        .upload-tips {
          font-size: 12px;
        }
      }
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 15px !important;
    }
  }
}
</style>