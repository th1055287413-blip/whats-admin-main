<template>
  <div class="system-config-container">
    <!-- Header -->
    <div class="page-header">
      <h1>系统配置</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleSave" :loading="saving">
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
      </div>
    </div>

    <!-- Sensitive Word Config -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>敏感词监控配置</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="config"
        :rules="rules"
        label-width="150px"
      >
        <el-form-item label="启用监控">
          <el-switch v-model="config.enabled" />
          <span class="form-item-tip">开启后将自动检测接收到的消息中的敏感词</span>
        </el-form-item>

        <el-divider content-position="left">Telegram 告警通知</el-divider>

        <el-form-item label="启用告警">
          <el-switch v-model="config.telegramEnabled" />
          <span class="form-item-tip">检测到敏感词时通过 Telegram 发送通知</span>
        </el-form-item>

        <template v-if="config.telegramEnabled">
          <el-form-item label="Bot Token" prop="botToken">
            <el-input
              v-model="config.botToken"
              placeholder="请输入 Telegram Bot Token"
              show-password
            />
            <div class="form-item-tip">
              从 @BotFather 获取，格式: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
            </div>
          </el-form-item>

          <el-form-item label="Chat ID" prop="chatID">
            <el-input
              v-model="config.chatID"
              placeholder="请输入 Chat ID"
            />
            <div class="form-item-tip">
              可以是用户ID或群组ID，从 @userinfobot 或 @getidsbot 获取
            </div>
          </el-form-item>

          <el-form-item>
            <el-button @click="handleTestTelegram" :loading="testing">测试连接</el-button>
          </el-form-item>
        </template>
      </el-form>
    </el-card>

    <!-- Test Result Dialog -->
    <el-dialog v-model="showTestResult" title="连接测试结果" width="500px">
      <el-result
        :icon="testResult.success ? 'success' : 'error'"
        :title="testResult.success ? '连接成功' : '连接失败'"
        :sub-title="testResult.message"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { systemConfigApi } from '@/api/sensitive-word'

const formRef = ref<FormInstance>()
const saving = ref(false)
const testing = ref(false)
const showTestResult = ref(false)

const config = reactive({
  enabled: true,
  telegramEnabled: false,
  botToken: '',
  chatID: ''
})

const testResult = reactive({
  success: false,
  message: ''
})

const rules: FormRules = {
  botToken: [
    { required: true, message: '请输入 Bot Token', trigger: 'blur' },
    { pattern: /^\d+:[A-Za-z0-9_-]{35}$/, message: 'Bot Token 格式不正确', trigger: 'blur' }
  ],
  chatID: [
    { required: true, message: '请输入 Chat ID', trigger: 'blur' }
  ]
}

const loadConfig = async () => {
  try {
    const sensitiveRes = await systemConfigApi.getConfig('sensitive_word.enabled')
    if (sensitiveRes.code === 200 && sensitiveRes.data) {
      config.enabled = sensitiveRes.data.value === 'true'
    }

    const telegramRes = await systemConfigApi.getTelegramConfig()
    if (telegramRes.code === 200 && telegramRes.data) {
      config.botToken = telegramRes.data.botToken || ''
      config.chatID = telegramRes.data.chatID || ''
      config.telegramEnabled = telegramRes.data.enabled || false
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载配置失败')
  }
}

const handleSave = async () => {
  if (config.telegramEnabled && formRef.value) {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return
  }

  saving.value = true
  try {
    await systemConfigApi.setConfig('sensitive_word.enabled', String(config.enabled))
    await systemConfigApi.setConfig('telegram.enabled', String(config.telegramEnabled))
    await systemConfigApi.setConfig('telegram.bot_token', config.botToken)
    await systemConfigApi.setConfig('telegram.chat_id', config.chatID)

    ElMessage.success('配置保存成功')
  } catch (error: any) {
    ElMessage.error(error.message || '保存配置失败')
  } finally {
    saving.value = false
  }
}

const handleTestTelegram = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  testing.value = true
  try {
    const res = await systemConfigApi.testTelegram({
      botToken: config.botToken,
      chatID: config.chatID
    })

    if (res.code === 0) {
      testResult.success = true
      testResult.message = '成功发送测试消息到 Telegram'
    } else {
      testResult.success = false
      testResult.message = res.message || '连接失败'
    }
  } catch (error: any) {
    testResult.success = false
    testResult.message = error.message || '连接失败'
  } finally {
    testing.value = false
    showTestResult.value = true
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped lang="scss">
.system-config-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.config-card {
  margin-bottom: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .form-item-tip {
    display: block;
    margin-top: 5px;
    font-size: 12px;
    color: #909399;
    line-height: 1.5;
  }
}

:deep(.el-form-item) {
  margin-bottom: 24px;
}
</style>
