<template>
  <div class="search-results">
    <!-- 结果统计 -->
    <div v-if="results.length > 0" class="results-header">
      <div class="result-stats">
        找到 <strong>{{ total }}</strong> 条匹配的消息
      </div>
    </div>

    <!-- 结果列表 -->
    <el-empty
      v-if="results.length === 0 && !loading"
      description="暂无搜索结果"
      :image-size="120"
    />

    <div v-else class="results-list">
      <div
        v-for="message in results"
        :key="message.id"
        class="result-item"
        @click="handleMessageClick(message)"
      >
        <div class="message-header">
          <div class="message-info">
            <!-- 账号标识 -->
            <el-tag type="warning" size="small">
              <el-icon><Phone /></el-icon>
              {{ message.account_phone }}
            </el-tag>

            <!-- 消息方向 -->
            <el-icon v-if="message.is_from_me" class="direction-icon" color="#67c23a">
              <Right />
            </el-icon>
            <el-icon v-else class="direction-icon" color="#409eff">
              <Back />
            </el-icon>

            <!-- 聊天对象 -->
            <el-tag
              :type="message.is_group_chat ? 'success' : 'info'"
              size="small"
            >
              <el-icon v-if="message.is_group_chat"><ChatDotRound /></el-icon>
              <el-icon v-else><User /></el-icon>
              {{ message.chat_name }}
            </el-tag>

            <!-- 消息类型 -->
            <el-tag
              v-if="message.type !== 'text'"
              size="small"
              effect="plain"
            >
              {{ getMessageTypeLabel(message.type) }}
            </el-tag>
          </div>
          <div class="message-time">
            {{ formatTime(message.timestamp) }}
          </div>
        </div>

        <!-- 发送者信息 -->
        <div class="sender-info">
          <el-avatar
            :size="40"
            class="sender-avatar"
            @click.stop="handleNavigateToChat(message)"
          >
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="sender-details">
            <div
              class="sender-name"
              @click.stop="handleNavigateToChat(message)"
            >
              {{ message.from_name }}
            </div>
          </div>
        </div>

        <div class="message-content">
          <!-- 已删除/撤销消息标识 -->
          <div v-if="message.deleted_at" class="message-deleted">
            <el-icon><Delete /></el-icon>
            <span>此消息已删除</span>
            <span v-if="message.deleted_by" class="deleted-by">（由 {{ message.deleted_by }} 删除）</span>
          </div>
          <div v-else-if="message.is_revoked" class="message-revoked">
            <el-icon><RefreshLeft /></el-icon>
            <span>此消息已撤回</span>
          </div>
          <!-- 消息内容（已删除的消息也显示原始内容） -->
          <div
            v-if="message.type === 'text' && message.content"
            class="message-text"
            :class="{ 'deleted-content': message.deleted_at }"
            v-html="highlightKeyword(message.matched_snippet || message.snippet || message.content)"
          />
          <!-- 媒体消息显示预览 -->
          <div v-else-if="message.type !== 'text'" class="message-media">
            <el-image
              v-if="message.type === 'image' && message.media_url"
              :src="message.media_url"
              fit="cover"
              class="media-preview"
              :preview-src-list="[message.media_url]"
            />
            <div v-else class="media-placeholder">
              <el-icon><Document /></el-icon>
              <span>{{ getMessageTypeLabel(message.type) }}</span>
            </div>
            <div
              v-if="message.content"
              class="media-caption"
              v-html="highlightKeyword(message.snippet || message.content)"
            />
          </div>
        </div>

        <div class="message-footer">
          <div class="footer-left">
            <el-button
              type="primary"
              link
              size="small"
              @click.stop="handleViewContext(message)"
            >
              查看上下文
            </el-button>
          </div>
          <div class="footer-right">
            <!-- 撤销按钮 (仅发送者24小时内可见，且未删除/撤销) -->
            <el-button
              v-if="canRevokeMessage(message) && !message.is_revoked && !message.deleted_at"
              type="warning"
              link
              size="small"
              :icon="RefreshLeft"
              @click.stop="handleRevokeMessage(message)"
            >
              撤回
            </el-button>

            <!-- 仅删除我方按钮 -->
            <el-button
              v-if="canDeleteMessage && !message.deleted_at"
              type="warning"
              link
              size="small"
              :icon="Hide"
              @click.stop="handleDeleteMessageForMe(message)"
            >
              仅删我方
            </el-button>

            <!-- 删除按钮 (管理员可见，且未删除) -->
            <el-button
              v-if="canDeleteMessage && !message.deleted_at"
              type="danger"
              link
              size="small"
              :icon="Delete"
              @click.stop="handleDeleteMessage(message)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>

      <!-- 加载更多 -->
      <div v-if="hasMore" class="load-more">
        <el-button
          @click="handleLoadMore"
          :loading="loading"
        >
          {{ loading ? '加载中...' : '加载更多' }}
        </el-button>
      </div>
    </div>

    <!-- 骨架屏 -->
    <div v-if="loading && results.length === 0" class="results-skeleton">
      <el-skeleton
        v-for="i in 5"
        :key="i"
        :rows="3"
        animated
        class="skeleton-item"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Phone,
  Right,
  Back,
  ChatDotRound,
  User,
  Delete,
  RefreshLeft,
  Hide
} from '@element-plus/icons-vue'
import type { MessageSearchResultItem } from '@/types/message-search'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { deleteMessage, deleteMessageForMe, revokeMessage } from '@/api/message-search'
import { useAuthStore } from '@/stores/auth'

// Props
interface Props {
  results: MessageSearchResultItem[]
  total: number
  loading: boolean
  hasMore: boolean
}

const props = withDefaults(defineProps<Props>(), {
  results: () => [],
  total: 0,
  loading: false,
  hasMore: false
})

// Emits
interface Emits {
  (e: 'messageClick', message: MessageSearchResultItem): void
  (e: 'viewContext', message: MessageSearchResultItem): void
  (e: 'loadMore'): void
  (e: 'messageDeleted', messageId: number): void
  (e: 'messageRevoked', messageId: number): void
}

const emit = defineEmits<Emits>()

// Router
const router = useRouter()

// Stores
const authStore = useAuthStore()

// Methods
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

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
}

const highlightKeyword = (text: string): string => {
  // 清理HTML,只保留安全的<em>标签,防止XSS攻击
  const div = document.createElement('div')
  div.innerHTML = text

  // 递归清理,只保留文本和<em>标签
  const cleanNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element
      if (element.tagName.toLowerCase() === 'em') {
        return `<em>${Array.from(element.childNodes).map(cleanNode).join('')}</em>`
      }
      // 其他标签只保留内容
      return Array.from(element.childNodes).map(cleanNode).join('')
    }
    return ''
  }

  return Array.from(div.childNodes).map(cleanNode).join('')
}

const handleMessageClick = (message: MessageSearchResultItem) => {
  emit('messageClick', message)
}

const handleViewContext = (message: MessageSearchResultItem) => {
  emit('viewContext', message)
}

const handleLoadMore = () => {
  emit('loadMore')
}

const handleNavigateToChat = (message: MessageSearchResultItem) => {
  // 使用 router 跳转到消息页面
  // UserMessages 路由需要 userId 参数,这里使用 account_id
  router.push({
    name: 'UserMessages',
    params: {
      userId: message.account_id.toString()
    },
    query: {
      chat_jid: message.chat_jid
    }
  })
}

// 删除消息操作
const handleDeleteMessage = async (message: MessageSearchResultItem) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条消息吗?删除后消息将对所有人不可见。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteMessage(message.id)
    ElMessage.success('消息已删除')
    emit('messageDeleted', message.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除消息失败:', error)
      ElMessage.error(error.response?.data?.message || '删除消息失败')
    }
  }
}

// 仅删除我方装置上的消息
const handleDeleteMessageForMe = async (message: MessageSearchResultItem) => {
  try {
    await ElMessageBox.confirm(
      '仅删除我方所有装置上的消息，对方仍可看到。确定要继续吗？',
      '仅删除我方',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteMessageForMe(message.id)
    ElMessage.success('已从我方装置删除')
    emit('messageDeleted', message.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('DeleteForMe 失败:', error)
      ElMessage.error(error.response?.data?.message || 'DeleteForMe 失败')
    }
  }
}

// 撤销消息操作
const handleRevokeMessage = async (message: MessageSearchResultItem) => {
  try {
    await ElMessageBox.confirm(
      '确定要撤回这条消息吗?撤回后所有人都看不到消息内容。',
      '确认撤回',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await revokeMessage(message.id)
    ElMessage.success('消息已撤回')
    emit('messageRevoked', message.id)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('撤销消息失败:', error)
      ElMessage.error(error.response?.data?.message || '撤销消息失败')
    }
  }
}

// 检查是否可以删除消息(管理员权限)
const canDeleteMessage = computed(() => {
  return authStore.hasPermission('message.delete')
})

// 检查是否可以撤销消息
const canRevokeMessage = (message: MessageSearchResultItem): boolean => {
  // 只能撤销自己发送的消息
  if (!message.is_from_me) {
    return false
  }

  // 检查撤销权限
  if (!authStore.hasPermission('message.revoke')) {
    return false
  }

  // 检查24小时时间限制
  const messageTime = new Date(message.timestamp).getTime()
  const now = Date.now()
  const hoursSinceMessage = (now - messageTime) / (1000 * 60 * 60)

  return hoursSinceMessage <= 24
}
</script>

<style scoped lang="scss">
.search-results {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .results-header {
    padding: 16px;
    border-bottom: 1px solid #ebeef5;

    .result-stats {
      color: #606266;
      font-size: 14px;

      strong {
        color: #409eff;
        font-size: 16px;
      }
    }
  }

  .results-list {
    .result-item {
      padding: 16px;
      border-bottom: 1px solid #ebeef5;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f7fa;
      }

      &:last-child {
        border-bottom: none;
      }

      .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .message-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .direction-icon {
            font-size: 18px;
            font-weight: bold;
          }

          .chat-name {
            font-weight: 500;
            color: #303133;
          }
        }

        .message-time {
          color: #909399;
          font-size: 12px;
        }
      }

      .sender-info {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .sender-avatar {
          cursor: pointer;
          transition: transform 0.2s;

          &:hover {
            transform: scale(1.1);
          }
        }

        .sender-details {
          flex: 1;

          .sender-name {
            font-weight: 500;
            color: #409eff;
            cursor: pointer;
            font-size: 14px;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }

      .message-content {
        margin-bottom: 8px;
        padding-left: 52px; // 对齐头像右侧

        .message-revoked {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #909399;
          font-style: italic;
          padding: 12px;
          background-color: #f5f7fa;
          border-radius: 4px;

          .el-icon {
            font-size: 16px;
          }
        }

        .message-deleted {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f56c6c;
          font-style: italic;
          padding: 12px;
          background-color: #fef0f0;
          border-radius: 4px;

          .el-icon {
            font-size: 16px;
          }

          .deleted-by {
            color: #909399;
            font-size: 12px;
          }
        }

        .message-text {
          color: #606266;
          line-height: 1.6;
          word-break: break-word;

          :deep(em) {
            background-color: #fff3cd;
            color: #856404;
            font-style: normal;
            padding: 2px 4px;
            border-radius: 2px;
          }

          &.deleted-content {
            color: #909399;
            text-decoration: line-through;
            margin-top: 8px;
          }
        }

        .message-media {
          display: flex;
          gap: 12px;
          align-items: flex-start;

          .media-preview {
            width: 100px;
            height: 100px;
            border-radius: 4px;
            flex-shrink: 0;
          }

          .media-placeholder {
            width: 100px;
            height: 100px;
            border-radius: 4px;
            background-color: #f5f7fa;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #909399;
            font-size: 12px;
            flex-shrink: 0;

            .el-icon {
              font-size: 32px;
            }
          }

          .media-caption {
            flex: 1;
            color: #606266;
            line-height: 1.6;
            word-break: break-word;

            :deep(em) {
              background-color: #fff3cd;
              color: #856404;
              font-style: normal;
              padding: 2px 4px;
              border-radius: 2px;
            }
          }
        }
      }

      .message-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .footer-left {
          display: flex;
          gap: 8px;
        }

        .footer-right {
          display: flex;
          gap: 8px;
        }
      }
    }

    .load-more {
      padding: 16px;
      text-align: center;
    }
  }

  .results-skeleton {
    padding: 16px;

    .skeleton-item {
      margin-bottom: 16px;
      padding: 16px;
      background-color: #fff;
      border-radius: 4px;
    }
  }
}
</style>
