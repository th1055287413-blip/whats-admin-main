<template>
  <div class="message-item-content" :class="{ highlight: highlight }">
    <div class="message-meta">
      <el-tag
        :type="message.is_from_me ? 'success' : 'info'"
        size="small"
      >
        {{ message.is_from_me ? '我' : '对方' }}
      </el-tag>
      <span class="message-time">
        {{ formatMessageTime(message.timestamp) }}
      </span>
      <el-tag
        v-if="message.type !== 'text'"
        size="small"
        effect="plain"
      >
        {{ getMessageTypeLabel(message.type) }}
      </el-tag>
    </div>

    <div class="message-body">
      <!-- 文本消息 -->
      <div v-if="message.type === 'text'" class="message-text">
        {{ message.content }}
      </div>

      <!-- 图片消息 -->
      <div v-else-if="message.type === 'image'" class="message-media">
        <el-image
          v-if="message.media_url"
          :src="getMediaUrl(message.media_url)"
          fit="cover"
          class="media-image"
          :preview-src-list="[getMediaUrl(message.media_url)]"
        >
          <template #error>
            <div class="image-error">
              <el-icon><PictureFilled /></el-icon>
              <span>图片加载失败</span>
            </div>
          </template>
        </el-image>
        <div v-else class="media-placeholder">
          <el-icon><Picture /></el-icon>
          <span>图片消息</span>
        </div>
        <div v-if="message.content && message.content !== '[图片消息]'" class="media-caption">
          {{ message.content }}
        </div>
      </div>

      <!-- 视频消息 -->
      <div v-else-if="message.type === 'video'" class="message-media">
        <div v-if="message.media_url" class="media-video">
          <video
            :src="getMediaUrl(message.media_url)"
            controls
            class="media-video-player"
            preload="metadata"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
        <div v-else class="media-placeholder">
          <el-icon><VideoPlay /></el-icon>
          <span>视频消息</span>
        </div>
        <div v-if="message.content && message.content !== '[视频消息]'" class="media-caption">
          {{ message.content }}
        </div>
      </div>

      <!-- 音频消息 -->
      <div v-else-if="message.type === 'audio'" class="message-media">
        <div v-if="message.media_url" class="media-audio">
          <audio
            :src="getMediaUrl(message.media_url)"
            controls
            class="media-audio-player"
            preload="metadata"
          >
            您的浏览器不支持音频播放
          </audio>
        </div>
        <div v-else class="media-placeholder">
          <el-icon><Headset /></el-icon>
          <span>音频消息</span>
        </div>
        <div v-if="message.content && message.content !== '[音频消息]'" class="media-caption">
          {{ message.content }}
        </div>
      </div>

      <!-- 文档消息 -->
      <div v-else-if="message.type === 'document'" class="message-media">
        <a
          v-if="message.media_url"
          :href="getMediaUrl(message.media_url)"
          target="_blank"
          class="media-document"
        >
          <el-icon><Document /></el-icon>
          <span>{{ message.content || '文档' }}</span>
          <el-icon><Download /></el-icon>
        </a>
        <div v-else class="media-placeholder">
          <el-icon><Document /></el-icon>
          <span>文档消息</span>
        </div>
      </div>

      <!-- 其他类型消息 -->
      <div v-else class="message-media">
        <div class="media-placeholder">
          <el-icon><ChatDotRound /></el-icon>
          <span>{{ getMessageTypeLabel(message.type) }}</span>
        </div>
        <div v-if="message.content" class="media-caption">
          {{ message.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Document,
  Picture,
  PictureFilled,
  VideoPlay,
  Headset,
  Download,
  ChatDotRound
} from '@element-plus/icons-vue'
import type { MessageSearchResultItem } from '@/types/message-search'
import { format } from 'date-fns'

// Props
interface Props {
  message: MessageSearchResultItem
  highlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  highlight: false
})

// 获取完整的媒体文件 URL
const getMediaUrl = (mediaUrl: string): string => {
  if (!mediaUrl) return ''

  // 如果已经是完整 URL,直接返回
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) {
    return mediaUrl
  }

  // 拼接服务器地址 (注意: /media 路由在根路径,不在 /api 下)
  const apiBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
  const serverURL = apiBaseURL.replace('/api', '')
  return `${serverURL}${mediaUrl}`
}

// Methods
const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return format(date, 'yyyy-MM-dd HH:mm:ss')
}

const getMessageTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    text: '文本',
    image: '图片',
    video: '视频',
    audio: '音频',
    document: '文档',
    location: '位置',
    contact: '联系人'
  }
  return typeMap[type] || type
}
</script>

<style scoped lang="scss">
.message-item-content {
  padding: 12px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #ebeef5;

  &.highlight {
    background-color: #f0f9ff;
    border-color: #409eff;
  }

  .message-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .message-time {
      color: #909399;
      font-size: 12px;
    }
  }

  .message-body {
    .message-text {
      color: #303133;
      line-height: 1.6;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .message-media {
      .media-image {
        max-width: 300px;
        max-height: 300px;
        border-radius: 4px;
        cursor: pointer;

        .image-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px 20px;
          background-color: #f5f7fa;
          color: #909399;

          .el-icon {
            font-size: 48px;
          }
        }
      }

      .media-video {
        .media-video-player {
          max-width: 400px;
          max-height: 300px;
          border-radius: 4px;
          background-color: #000;
        }
      }

      .media-audio {
        .media-audio-player {
          width: 300px;
          height: 40px;
        }
      }

      .media-document {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background-color: #f5f7fa;
        border-radius: 4px;
        color: #409eff;
        text-decoration: none;
        transition: all 0.3s;

        &:hover {
          background-color: #ecf5ff;
          color: #409eff;
        }

        .el-icon {
          font-size: 20px;
        }
      }

      .media-placeholder {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background-color: #f5f7fa;
        border-radius: 4px;
        color: #606266;
        margin-bottom: 8px;

        .el-icon {
          font-size: 20px;
        }
      }

      .media-caption {
        margin-top: 8px;
        color: #606266;
        line-height: 1.6;
        word-break: break-word;
      }
    }
  }
}
</style>
