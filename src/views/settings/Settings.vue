<template>
  <div class="settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">系统设置</h1>
      <p class="page-description">管理系统的各项配置参数</p>
    </div>

    <!-- 设置内容 -->
    <el-row :gutter="20">
      <!-- 基础设置 -->
      <el-col :span="12">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>基础设置</span>
            </div>
          </template>

          <el-form :model="basicSettings" label-width="120px">
            <el-form-item label="系统名称">
              <el-input
                v-model="basicSettings.systemName"
                placeholder="输入系统名称"
              />
            </el-form-item>

            <el-form-item label="系统描述">
              <el-input
                v-model="basicSettings.systemDescription"
                type="textarea"
                :rows="3"
                placeholder="输入系统描述"
              />
            </el-form-item>

            <el-form-item label="默认时区">
              <el-select v-model="basicSettings.timezone" placeholder="选择时区">
                <el-option label="Asia/Shanghai" value="Asia/Shanghai" />
                <el-option label="UTC" value="UTC" />
                <el-option label="America/New_York" value="America/New_York" />
              </el-select>
            </el-form-item>

            <el-form-item label="语言设置">
              <el-select v-model="basicSettings.language" placeholder="选择语言">
                <el-option label="中文简体" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- WhatsApp API 设置 -->
      <el-col :span="12">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>WhatsApp API</span>
            </div>
          </template>

          <el-form :model="whatsappSettings" label-width="120px">
            <el-form-item label="API端点">
              <el-input
                v-model="whatsappSettings.apiEndpoint"
                placeholder="https://api.whatsapp.com"
              />
            </el-form-item>

            <el-form-item label="API密钥">
              <el-input
                v-model="whatsappSettings.apiKey"
                type="password"
                placeholder="输入API密钥"
                show-password
              />
            </el-form-item>

            <el-form-item label="Webhook URL">
              <el-input
                v-model="whatsappSettings.webhookUrl"
                placeholder="https://your-domain.com/webhook"
              />
            </el-form-item>

            <el-form-item label="连接状态">
              <el-tag
                :type="whatsappSettings.connectionStatus === 'connected' ? 'success' : 'danger'"
                effect="light"
              >
                {{ whatsappSettings.connectionStatus === 'connected' ? '已连接' : '未连接' }}
              </el-tag>
              <el-button
                type="primary"
                size="small"
                style="margin-left: 10px"
                @click="testConnection"
                :loading="testingConnection"
              >
                测试连接
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 安全设置 -->
      <el-col :span="12">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </div>
          </template>

          <el-form :model="securitySettings" label-width="120px">
            <el-form-item label="密码有效期">
              <el-input-number
                v-model="securitySettings.passwordExpireDays"
                :min="30"
                :max="365"
                controls-position="right"
              />
              <span style="margin-left: 10px; color: #909399;">天</span>
            </el-form-item>

            <el-form-item label="最大登录失败">
              <el-input-number
                v-model="securitySettings.maxLoginAttempts"
                :min="3"
                :max="10"
                controls-position="right"
              />
              <span style="margin-left: 10px; color: #909399;">次</span>
            </el-form-item>

            <el-form-item label="会话超时">
              <el-input-number
                v-model="securitySettings.sessionTimeout"
                :min="30"
                :max="480"
                controls-position="right"
              />
              <span style="margin-left: 10px; color: #909399;">分钟</span>
            </el-form-item>

            <el-form-item label="强制HTTPS">
              <el-switch v-model="securitySettings.forceHttps" />
            </el-form-item>

            <el-form-item label="双因子认证">
              <el-switch v-model="securitySettings.enableTwoFA" />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 通知设置 -->
      <el-col :span="12">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </div>
          </template>

          <el-form :model="notificationSettings" label-width="120px">
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationSettings.emailEnabled" />
            </el-form-item>

            <el-form-item label="短信通知">
              <el-switch v-model="notificationSettings.smsEnabled" />
            </el-form-item>

            <el-form-item label="系统告警">
              <el-switch v-model="notificationSettings.systemAlerts" />
            </el-form-item>

            <el-form-item label="安全事件">
              <el-switch v-model="notificationSettings.securityEvents" />
            </el-form-item>

            <el-form-item label="通知邮箱">
              <el-input
                v-model="notificationSettings.adminEmail"
                placeholder="admin@example.com"
                type="email"
              />
            </el-form-item>

            <el-form-item label="短信号码">
              <el-input
                v-model="notificationSettings.adminPhone"
                placeholder="+86 138 0000 0000"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作按钮 -->
    <div class="settings-actions">
      <el-button type="primary" size="large" @click="saveSettings" :loading="saving">
        <el-icon><Check /></el-icon>
        保存设置
      </el-button>
      <el-button size="large" @click="resetSettings">
        <el-icon><Refresh /></el-icon>
        重置
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting,
  ChatDotRound,
  Lock,
  Bell,
  Check,
  Refresh
} from '@element-plus/icons-vue'

// 基础设置
const basicSettings = reactive({
  systemName: 'WhatsApp 管理系统',
  systemDescription: '统一管理和监控WhatsApp业务通信的综合管理平台',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN'
})

// WhatsApp API 设置
const whatsappSettings = reactive({
  apiEndpoint: '',
  apiKey: '',
  webhookUrl: '',
  connectionStatus: 'disconnected'
})

// 安全设置
const securitySettings = reactive({
  passwordExpireDays: 90,
  maxLoginAttempts: 5,
  sessionTimeout: 120,
  forceHttps: true,
  enableTwoFA: false
})

// 通知设置
const notificationSettings = reactive({
  emailEnabled: true,
  smsEnabled: false,
  systemAlerts: true,
  securityEvents: true,
  adminEmail: '',
  adminPhone: ''
})

// 状态控制
const saving = ref(false)
const testingConnection = ref(false)

// 测试WhatsApp连接
async function testConnection() {
  testingConnection.value = true
  try {
    // 模拟连接测试
    await new Promise(resolve => setTimeout(resolve, 2000))
    whatsappSettings.connectionStatus = 'connected'
    ElMessage.success('连接测试成功')
  } catch (error) {
    whatsappSettings.connectionStatus = 'disconnected'
    ElMessage.error('连接测试失败')
  } finally {
    testingConnection.value = false
  }
}

// 保存设置
async function saveSettings() {
  try {
    await ElMessageBox.confirm(
      '确定要保存这些设置吗？',
      '保存确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    saving.value = true

    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1500))

    ElMessage.success('设置保存成功')
  } catch {
    // 用户取消操作
  } finally {
    saving.value = false
  }
}

// 重置设置
async function resetSettings() {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置为默认值吗？',
      '重置确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 重置为默认值
    Object.assign(basicSettings, {
      systemName: 'WhatsApp 管理系统',
      systemDescription: '统一管理和监控WhatsApp业务通信的综合管理平台',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN'
    })

    Object.assign(whatsappSettings, {
      apiEndpoint: '',
      apiKey: '',
      webhookUrl: '',
      connectionStatus: 'disconnected'
    })

    Object.assign(securitySettings, {
      passwordExpireDays: 90,
      maxLoginAttempts: 5,
      sessionTimeout: 120,
      forceHttps: true,
      enableTwoFA: false
    })

    Object.assign(notificationSettings, {
      emailEnabled: true,
      smsEnabled: false,
      systemAlerts: true,
      securityEvents: true,
      adminEmail: '',
      adminPhone: ''
    })

    ElMessage.success('设置已重置为默认值')
  } catch {
    // 用户取消操作
  }
}

// 组件挂载时加载设置
onMounted(async () => {
  try {
    // TODO: 从API加载实际设置数据
    // const settings = await settingsApi.getSettings()
    // 应用设置数据到各个reactive对象
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
})
</script>

<style scoped>
.settings {
  padding: 20px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.page-header {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-description {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.settings-card {
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #303133;
}

.settings-actions {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.settings-actions .el-button {
  margin: 0 10px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-card__header) {
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .settings .el-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .settings {
    padding: 12px;
  }

  .settings .el-col {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    width: 100px !important;
  }
}
</style>