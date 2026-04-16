<template>
  <div class="batch-send-container">
    <el-card class="batch-send-card">
      <template #header>
        <div class="card-header">
          <el-icon size="20"><ChatDotRound /></el-icon>
          <span class="title">批量发送消息</span>
        </div>
      </template>

      <!-- 步骤条 -->
      <el-steps :active="store.currentStep - 1" align-center finish-status="success">
        <el-step title="选择账号" />
        <el-step title="选择好友" />
        <el-step title="编辑消息" />
        <el-step title="确认发送" />
      </el-steps>

      <!-- 步骤内容 -->
      <div class="step-content">
        <!-- 步骤1: 选择账号 -->
        <div v-show="store.currentStep === 1" class="step-1">
          <el-form label-width="100px">
            <el-form-item label="发送账号">
              <el-select
                v-model="store.selectedAccountId"
                placeholder="请选择发送账号"
                size="large"
                style="width: 100%"
              >
                <el-option
                  v-for="account in connectedAccounts"
                  :key="account.id"
                  :label="account.phone_number || account.push_name"
                  :value="account.id"
                >
                  <div class="account-option">
                    <el-avatar :src="account.avatar" size="small">
                      <el-icon><User /></el-icon>
                    </el-avatar>
                    <span>{{ account.push_name || account.phone_number }}</span>
                    <el-tag size="small" type="success">在线</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤2: 选择好友 -->
        <div v-show="store.currentStep === 2" class="step-2">
          <div class="search-bar">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索联系人..."
              prefix-icon="Search"
              clearable
            />
            <el-checkbox v-model="selectAll" @change="handleSelectAll">
              全选
            </el-checkbox>
          </div>

          <el-scrollbar height="400px">
            <el-checkbox-group v-model="store.selectedRecipients">
              <div
                v-for="chat in filteredChats"
                :key="chat.jid"
                class="chat-item"
              >
                <el-checkbox :label="chat.jid" :value="chat.jid">
                  <div class="chat-info">
                    <el-avatar :src="chat.avatar" size="small">
                      <el-icon><UserFilled /></el-icon>
                    </el-avatar>
                    <span>{{ chat.name || chat.jid }}</span>
                  </div>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </el-scrollbar>

          <div class="selected-count">
            已选择: <strong>{{ store.selectedRecipients.length }}</strong> 人
          </div>
        </div>

        <!-- 步骤3: 编辑消息 -->
        <div v-show="store.currentStep === 3" class="step-3">
          <el-form label-width="120px">
            <el-form-item label="消息内容">
              <el-input
                v-model="store.messageContent"
                type="textarea"
                :rows="10"
                placeholder="请输入要发送的消息内容..."
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="发送间隔(秒)">
              <el-input-number
                v-model="store.sendInterval"
                :min="1"
                :max="10"
                :step="1"
              />
              <span class="hint">建议2-3秒,避免被限制</span>
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤4: 确认发送 -->
        <div v-show="store.currentStep === 4" class="step-4">
          <el-descriptions border :column="2">
            <el-descriptions-item label="发送账号">
              {{ selectedAccount?.push_name || selectedAccount?.phone_number }}
            </el-descriptions-item>
            <el-descriptions-item label="接收人数">
              {{ store.selectedRecipients.length }} 人
            </el-descriptions-item>
            <el-descriptions-item label="发送间隔">
              {{ store.sendInterval }} 秒/条
            </el-descriptions-item>
            <el-descriptions-item label="预计耗时">
              约 {{ estimatedTime }} 分钟
            </el-descriptions-item>
          </el-descriptions>

          <el-card header="消息预览" style="margin-top: 20px">
            <div class="message-preview">{{ store.messageContent }}</div>
          </el-card>

          <!-- 发送进度 -->
          <div v-if="store.taskStatus === 'running' || store.taskStatus === 'completed'" class="progress-section">
            <el-progress
              :percentage="store.progressPercentage"
              :status="progressStatus"
            />
            <div class="progress-info">
              <span>成功: <strong>{{ store.progressInfo.success }}</strong></span>
              <span>失败: <strong>{{ store.progressInfo.failed }}</strong></span>
              <span>总计: <strong>{{ store.progressInfo.total }}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="step-actions">
        <el-button
          v-if="store.currentStep > 1"
          @click="handlePrevStep"
          :disabled="sending"
        >
          上一步
        </el-button>
        <el-button
          v-if="store.currentStep < 4"
          type="primary"
          @click="handleNextStep"
          :disabled="!canNextStep"
        >
          下一步
        </el-button>
        <el-button
          v-if="store.currentStep === 4 && store.taskStatus === 'pending'"
          type="primary"
          size="large"
          :loading="sending"
          @click="handleSend"
        >
          {{ sending ? '发送中...' : '开始发送' }}
        </el-button>
        <el-button
          v-if="store.taskStatus === 'completed'"
          @click="handleReset"
        >
          重新开始
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, UserFilled, User } from '@element-plus/icons-vue'
import { useBatchSendStore } from '@/stores/batchSend'
import { accountApi } from '@/api/account'
import { createBatchTask, executeBatchTask } from '@/api/batch-send'

const store = useBatchSendStore()

// 数据
const connectedAccounts = ref<any[]>([])
const chats = ref<any[]>([])
const searchKeyword = ref('')
const selectAll = ref(false)
const sending = ref(false)

// 计算属性
const selectedAccount = computed(() => {
  return connectedAccounts.value.find(a => a.id === store.selectedAccountId)
})

const filteredChats = computed(() => {
  if (!searchKeyword.value) return chats.value
  return chats.value.filter(chat =>
    chat.name?.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    chat.jid.includes(searchKeyword.value)
  )
})

const canNextStep = computed(() => {
  switch (store.currentStep) {
    case 1:
      return store.selectedAccountId !== null
    case 2:
      return store.selectedRecipients.length > 0
    case 3:
      return store.messageContent.trim().length > 0
    default:
      return true
  }
})

const estimatedTime = computed(() => {
  const totalSeconds = store.selectedRecipients.length * store.sendInterval
  return Math.ceil(totalSeconds / 60)
})

const progressStatus = computed(() => {
  if (store.progressPercentage === 100) return 'success'
  if (store.progressInfo.failed > 0) return 'warning'
  return undefined
})

// 方法
async function loadAccounts() {
  try {
    const res = await accountApi.list({ page: 1, page_size: 50, status: 'connected' })
    connectedAccounts.value = res.items || []
  } catch (error: any) {
    ElMessage.error('加载账号失败: ' + (error.message || error))
  }
}

async function loadChats() {
  if (!store.selectedAccountId) return

  try {
    const res = await accountApi.getChats(store.selectedAccountId)
    if (res && Array.isArray(res)) {
      chats.value = res
    } else if (res && res.data) {
      chats.value = res.data
    }
  } catch (error: any) {
    ElMessage.error('加载聊天列表失败: ' + (error.message || error))
  }
}

function handleSelectAll(value: boolean) {
  if (value) {
    store.selectedRecipients = filteredChats.value.map(chat => chat.jid)
  } else {
    store.selectedRecipients = []
  }
}

function handlePrevStep() {
  if (store.currentStep > 1) {
    store.currentStep--
  }
}

function handleNextStep() {
  if (canNextStep.value && store.currentStep < 4) {
    store.currentStep++

    // 进入步骤2时加载聊天列表
    if (store.currentStep === 2) {
      loadChats()
    }
  }
}

async function handleSend() {
  try {
    await ElMessageBox.confirm(
      `确定要向 ${store.selectedRecipients.length} 个联系人发送消息吗？`,
      '确认发送',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    sending.value = true

    // 创建任务
    const recipients = store.selectedRecipients.map(jid => {
      const chat = chats.value.find(c => c.jid === jid)
      return {
        chat_jid: jid,
        chat_name: chat?.name || jid
      }
    })

    const taskRes = await createBatchTask({
      account_id: store.selectedAccountId!,
      message_content: store.messageContent,
      send_interval: store.sendInterval,
      recipients
    })

    if (taskRes.code !== 0) {
      throw new Error(taskRes.message || '创建任务失败')
    }

    store.currentTaskId = taskRes.data.id
    store.progressInfo.total = store.selectedRecipients.length

    // 执行任务
    const execRes = await executeBatchTask(taskRes.data.id)
    if (execRes.code !== 0) {
      throw new Error(execRes.message || '执行任务失败')
    }

    store.taskStatus = 'running'
    ElMessage.success('批量发送已开始')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('发送失败: ' + (error.message || error))
    }
  } finally {
    sending.value = false
  }
}

function handleReset() {
  store.reset()
  searchKeyword.value = ''
  selectAll.value = false
}

// 生命周期
onMounted(() => {
  loadAccounts()
})

// 监听账号切换
watch(() => store.selectedAccountId, () => {
  store.selectedRecipients = []
  chats.value = []
})
</script>

<style scoped>
.batch-send-container {
  padding: 20px;
}

.batch-send-card {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.step-content {
  margin: 40px 0;
  min-height: 400px;
}

.account-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.chat-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.chat-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-count {
  margin-top: 20px;
  text-align: right;
  font-size: 14px;
  color: #606266;
}

.hint {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}

.message-preview {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.progress-section {
  margin-top: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.progress-info {
  margin-top: 15px;
  display: flex;
  justify-content: space-around;
  font-size: 14px;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}
</style>
