<template>
  <div class="customer-service-chat">
    <!-- 左侧会话列表 -->
    <div class="session-list">
      <div class="session-header">
        <h3>客户会话</h3>
        <el-button :icon="Refresh" circle size="small" @click="fetchSessions" :loading="sessionsLoading" />
      </div>

      <div class="session-items" ref="sessionListEl" v-loading="sessionsLoading" @scroll="onSessionListScroll">
        <div
          v-for="session in sessions"
          :key="session.session_id"
          class="session-item"
          :class="{ active: selectedSession?.session_id === session.session_id }"
          @click="selectSession(session)"
        >
          <div class="session-avatar">
            <el-avatar :size="40">{{ session.user_identifier.slice(-2) }}</el-avatar>
          </div>
          <div class="session-info">
            <div class="session-name">{{ session.user_identifier }}</div>
            <div class="session-preview">{{ session.last_message }}</div>
          </div>
          <div class="session-meta">
            <div class="session-time">{{ formatTime(session.last_time) }}</div>
            <el-tag v-if="session.has_admin_reply" type="success" size="small">已回复</el-tag>
            <span v-else class="unread-dot"></span>
          </div>
        </div>
        <el-empty v-if="!sessionsLoading && sessions.length === 0" description="暂无会话" />
        <div v-if="sessionsLoadingMore" class="load-more-tip">加载中...</div>
        <div v-else-if="sessions.length >= sessionsTotal && sessions.length > 0" class="load-more-tip">已加载全部</div>
      </div>
    </div>

    <!-- 右侧聊天窗口 -->
    <div class="chat-window">
      <template v-if="selectedSession">
        <!-- 聊天头部 -->
        <div class="chat-header">
          <div class="chat-user-info">
            <el-avatar :size="36">{{ selectedSession.user_identifier.slice(-2) }}</el-avatar>
            <div class="chat-user-name">{{ selectedSession.user_identifier }}</div>
          </div>
          <div class="chat-actions">
            <el-button :icon="Refresh" text @click="fetchMessages" :loading="messagesLoading">刷新</el-button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="chat-messages" ref="messagesContainer" v-loading="messagesLoading">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-item"
            :class="{ 'message-admin': msg.is_admin_reply, 'message-user': !msg.is_admin_reply && msg.user_message, 'message-bot': !msg.is_admin_reply && !msg.user_message }"
          >
            <!-- 用户消息 -->
            <template v-if="!msg.is_admin_reply && msg.user_message">
              <div class="message-bubble user">
                <div class="message-content">{{ msg.user_message }}</div>
                <div class="message-time">{{ formatDateTime(msg.created_at) }}</div>
              </div>
            </template>

            <!-- 机器人回复 -->
            <template v-if="!msg.is_admin_reply && msg.bot_reply">
              <div class="message-bubble bot">
                <div class="message-label">
                  <el-tag size="small" type="info">机器人</el-tag>
                </div>
                <div class="message-content" v-html="formatMessage(msg.bot_reply)"></div>
                <div class="message-time">{{ formatDateTime(msg.created_at) }}</div>
              </div>
            </template>

            <!-- 管理员回复 -->
            <template v-if="msg.is_admin_reply">
              <div class="message-bubble admin">
                <div class="message-label">
                  <el-tag size="small" type="success">{{ msg.admin_name || '客服' }}</el-tag>
                </div>
                <div class="message-content">{{ msg.bot_reply }}</div>
                <div class="message-time">{{ formatDateTime(msg.created_at) }}</div>
              </div>
            </template>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="3"
            placeholder="输入回复内容..."
            @keydown.ctrl.enter="sendReply"
          />
          <div class="chat-input-actions">
            <span class="input-hint">Ctrl + Enter 发送</span>
            <el-button type="primary" @click="sendReply" :loading="sending" :disabled="!replyContent.trim()">
              发送
            </el-button>
          </div>
        </div>
      </template>

      <!-- 未选择会话 -->
      <div v-else class="no-session">
        <el-empty description="请选择一个会话开始回复" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import {
  getActiveSessions,
  getSessionConversations,
  sendAdminReply
} from '@/api/customer-conversation'
import type { CustomerSession, CustomerConversation } from '@/types/customer-conversation'

const PAGE_SIZE = 20

// 状态
const sessions = ref<CustomerSession[]>([])
const sessionsTotal = ref(0)
const sessionsOffset = ref(0)
const sessionsLoadingMore = ref(false)
const selectedSession = ref<CustomerSession | null>(null)
const messages = ref<CustomerConversation[]>([])
const replyContent = ref('')
const sessionsLoading = ref(false)
const messagesLoading = ref(false)
const sending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const sessionListEl = ref<HTMLElement | null>(null)

// 轮询定时器
let sessionTimer: number | null = null
let messageTimer: number | null = null

// 获取会话列表（首次或静默刷新第一页）
const fetchSessions = async (silent = false) => {
  if (!silent) sessionsLoading.value = true
  try {
    const response = await getActiveSessions(PAGE_SIZE, 0)
    const data = response.data
    sessions.value = data?.list || []
    sessionsTotal.value = data?.total ?? 0
    sessionsOffset.value = sessions.value.length
  } catch (error) {
    console.error('获取会话列表失败:', error)
  } finally {
    if (!silent) sessionsLoading.value = false
  }
}

// 滚动加载更多会话
const loadMoreSessions = async () => {
  if (sessionsLoadingMore.value) return
  if (sessions.value.length >= sessionsTotal.value) return

  sessionsLoadingMore.value = true
  try {
    const response = await getActiveSessions(PAGE_SIZE, sessionsOffset.value)
    const data = response.data
    const newItems = data?.list || []
    sessions.value = [...sessions.value, ...newItems]
    sessionsTotal.value = data?.total ?? sessionsTotal.value
    sessionsOffset.value += newItems.length
  } catch (error) {
    console.error('加载更多会话失败:', error)
  } finally {
    sessionsLoadingMore.value = false
  }
}

// 监听会话列表滚动
const onSessionListScroll = (e: Event) => {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
    loadMoreSessions()
  }
}

// 选择会话
const selectSession = async (session: CustomerSession) => {
  selectedSession.value = session
  await fetchMessages(true)
}

// 获取消息列表
const fetchMessages = async (silent = false) => {
  if (!selectedSession.value) return

  if (!silent) messagesLoading.value = true
  try {
    const response = await getSessionConversations(selectedSession.value.session_id)
    const newMessages = response.data || []

    if (silent && messages.value.length > 0) {
      const lastId = messages.value[messages.value.length - 1]?.id
      const newItems = newMessages.filter(m => !messages.value.some(old => old.id === m.id))
      if (newItems.length > 0) {
        messages.value = newMessages
        scrollToBottom()
      }
    } else {
      messages.value = newMessages
      scrollToBottom()
    }
  } catch (error) {
    console.error('获取消息列表失败:', error)
  } finally {
    if (!silent) messagesLoading.value = false
  }
}

// 发送回复
const sendReply = async () => {
  if (!selectedSession.value || !replyContent.value.trim()) return

  sending.value = true
  try {
    await sendAdminReply(selectedSession.value.session_id, replyContent.value.trim())
    replyContent.value = ''
    ElMessage.success('回复成功')
    await fetchMessages()
    await fetchSessions(true)
  } catch (error) {
    ElMessage.error('回复失败')
    console.error('回复失败:', error)
  } finally {
    sending.value = false
  }
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 格式化时间
const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化消息（支持换行）
const formatMessage = (content: string) => {
  return content.replace(/\n/g, '<br>')
}

// 启动轮询
const startPolling = () => {
  // 每 5 秒静默刷新会话列表
  sessionTimer = window.setInterval(() => fetchSessions(true), 5000)

  // 每 3 秒静默刷新当前会话消息
  messageTimer = window.setInterval(() => {
    if (selectedSession.value) {
      fetchMessages(true)
    }
  }, 3000)
}

// 停止轮询
const stopPolling = () => {
  if (sessionTimer) {
    clearInterval(sessionTimer)
    sessionTimer = null
  }
  if (messageTimer) {
    clearInterval(messageTimer)
    messageTimer = null
  }
}

// 生命周期
onMounted(() => {
  fetchSessions()
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped lang="scss">
.customer-service-chat {
  display: flex;
  height: calc(100vh - 120px);
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

// 左侧会话列表
.session-list {
  width: 320px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;

  .session-header {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .session-items {
    flex: 1;
    overflow-y: auto;
  }

  .load-more-tip {
    text-align: center;
    font-size: 12px;
    color: #c0c4cc;
    padding: 10px 0;
  }

  .session-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    transition: background 0.2s;

    &:hover {
      background: #f5f7fa;
    }

    &.active {
      background: #ecf5ff;
    }

    .session-avatar {
      margin-right: 12px;
    }

    .session-info {
      flex: 1;
      min-width: 0;

      .session-name {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .session-preview {
        font-size: 12px;
        color: #909399;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .session-meta {
      text-align: right;
      margin-left: 8px;

      .session-time {
        font-size: 11px;
        color: #c0c4cc;
        margin-bottom: 4px;
      }

      .unread-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #f56c6c;
      }
    }
  }
}

// 右侧聊天窗口
.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;

  .chat-header {
    padding: 12px 20px;
    border-bottom: 1px solid #e4e7ed;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .chat-user-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .chat-user-name {
        font-size: 15px;
        font-weight: 500;
      }
    }
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #f5f7fa;

    .message-item {
      margin-bottom: 16px;

      .message-bubble {
        max-width: 70%;
        padding: 10px 14px;
        border-radius: 8px;
        position: relative;

        .message-label {
          margin-bottom: 6px;
        }

        .message-content {
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }

        .message-time {
          font-size: 11px;
          color: #909399;
          margin-top: 6px;
        }

        &.user {
          background: #95ec69;
          border: 1px solid #95ec69;
          margin-left: auto;
        }

        &.bot {
          background: #fff;
          border: 1px solid #e4e7ed;
          margin-right: auto;
        }

        &.admin {
          background: #fff;
          border: 1px solid #e4e7ed;
          margin-right: auto;
        }
      }
    }
  }

  .chat-input {
    padding: 16px 20px;
    border-top: 1px solid #e4e7ed;
    background: #fff;

    .chat-input-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;

      .input-hint {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .no-session {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
