<template>
  <el-dialog
    v-model="dialogVisible"
    title="消息上下文"
    width="800px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="message-context">
      <template v-if="!loading && contextData">
        <!-- 上文消息 -->
        <div v-if="contextData.before_messages.length > 0" class="context-section">
          <div class="section-header">
            <el-divider content-position="left">
              <el-icon><Top /></el-icon>
              <span>上文 ({{ contextData.before_messages.length }}条)</span>
            </el-divider>
          </div>
          <div class="messages-list">
            <div
              v-for="msg in contextData.before_messages"
              :key="msg.id"
              class="message-item"
              :class="{ 'is-from-me': msg.is_from_me }"
            >
              <MessageItem :message="msg" />
            </div>
          </div>
        </div>

        <!-- 当前消息 -->
        <div class="context-section current-message-section">
          <div class="section-header">
            <el-divider content-position="left">
              <el-icon><Message /></el-icon>
              <span>当前消息 - {{ contextData.chat_info.chat_name }}</span>
            </el-divider>
          </div>
          <div class="messages-list">
            <div
              class="message-item current-message"
              :class="{ 'is-from-me': contextData.target_message.is_from_me }"
            >
              <MessageItem :message="contextData.target_message" :highlight="true" />
            </div>
          </div>
        </div>

        <!-- 下文消息 -->
        <div v-if="contextData.after_messages.length > 0" class="context-section">
          <div class="section-header">
            <el-divider content-position="left">
              <el-icon><Bottom /></el-icon>
              <span>下文 ({{ contextData.after_messages.length }}条)</span>
            </el-divider>
          </div>
          <div class="messages-list">
            <div
              v-for="msg in contextData.after_messages"
              :key="msg.id"
              class="message-item"
              :class="{ 'is-from-me': msg.is_from_me }"
            >
              <MessageItem :message="msg" />
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <el-empty
        v-if="!loading && !contextData"
        description="无法加载消息上下文"
        :image-size="120"
      />
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Top, Bottom, Message } from '@element-plus/icons-vue'
import { getMessageContext } from '@/api/message-search'
import type { MessageContextResponse, MessageSearchResultItem } from '@/types/message-search'
import { ElMessage } from 'element-plus'
import MessageItem from './MessageItem.vue'

// Props
interface Props {
  visible: boolean
  messageId: number | null
  accountId: number
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'update:visible', value: boolean): void
}

const emit = defineEmits<Emits>()

// State
const dialogVisible = ref(false)
const loading = ref(false)
const contextData = ref<MessageContextResponse | null>(null)

// Watch
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal && props.messageId) {
    loadContext()
  }
})

watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// Methods
const loadContext = async () => {
  if (!props.messageId || !props.accountId) {
    return
  }

  loading.value = true
  try {
    const response = await getMessageContext(props.messageId, {
      account_id: props.accountId,
      before_count: 5,
      after_count: 5
    })
    contextData.value = response.data
  } catch (error: any) {
    ElMessage.error(error.message || '加载消息上下文失败')
    contextData.value = null
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleClosed = () => {
  contextData.value = null
}
</script>

<style scoped lang="scss">
.message-context {
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;

  .context-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      .el-divider {
        margin: 16px 0;

        :deep(.el-divider__text) {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #606266;
        }
      }
    }

    &.current-message-section {
      .section-header {
        .el-divider {
          :deep(.el-divider__text) {
            color: #409eff;
          }
        }
      }
    }

    .messages-list {
      .message-item {
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        &.current-message {
          background-color: #ecf5ff;
          border-left: 3px solid #409eff;
          padding-left: 12px;
          border-radius: 4px;
        }
      }
    }
  }
}
</style>
