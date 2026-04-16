<template>
  <div class="login-container">
    <div class="login-background">
      <!-- 背景动画元素 -->
      <div class="animated-bg">
        <div class="circle"></div>
        <div class="circle"></div>
        <div class="circle"></div>
      </div>
    </div>

    <div class="login-content">
      <!-- 登录卡片 -->
      <el-card class="login-card" shadow="hover">
        <!-- 头部logo和标题 -->
        <div class="login-header">
          <div class="logo">
            <el-icon size="48" color="#409EFF">
              <ChatDotRound />
            </el-icon>
          </div>
          <h1 class="title">WhatsApp 管理系统</h1>
          <p class="subtitle">安全、高效的WhatsApp管理平台</p>
        </div>

        <!-- 登录表单 -->
        <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          size="large"
          @keyup.enter="handleLogin"
        >
          <!-- 用户名/邮箱 -->
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              :prefix-icon="User"
              placeholder="请输入用户名或邮箱"
              clearable
              :disabled="loading"
            />
          </el-form-item>

          <!-- 密码 -->
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              :prefix-icon="Lock"
              placeholder="请输入密码"
              show-password
              clearable
              :disabled="loading"
            />
          </el-form-item>

          <!-- 验证码已移除 -->

          <!-- 记住登录 -->
          <el-form-item>
            <div class="login-options">
              <el-checkbox v-model="loginForm.remember" :disabled="loading">
                记住登录状态
              </el-checkbox>
              <el-link type="primary" @click="showForgotPassword">
                忘记密码？
              </el-link>
            </div>
          </el-form-item>

          <!-- 登录按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              class="login-button"
              :loading="loading"
              :disabled="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 底部信息 -->
        <div class="login-footer">
          <el-divider>
            <span class="divider-text">安全提示</span>
          </el-divider>
          <div class="security-tips">
            <el-alert
              title="为了您的账户安全，请定期更换密码"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
        </div>
      </el-card>

      <!-- 密码强度指示器 -->
      <transition name="fade">
        <div class="password-strength">
          <div class="strength-label">密码强度：</div>
          <div class="strength-bars">
            <div
              v-for="(item, index) in 5"
              :key="index"
              class="strength-bar"
              :class="getStrengthClass(index)"
            />
          </div>
          <div class="strength-text">{{ strengthText }}</div>
        </div>
      </transition>
    </div>

    <!-- 忘记密码对话框 -->
    <el-dialog
      v-model="forgotPasswordVisible"
      title="重置密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form ref="forgotFormRef" :model="forgotForm" :rules="forgotRules">
        <el-form-item label="邮箱地址" prop="email">
          <el-input
            v-model="forgotForm.email"
            placeholder="请输入注册时的邮箱地址"
            :prefix-icon="Message"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="forgotPasswordVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="forgotLoading"
          @click="handleForgotPassword"
        >
          发送重置链接
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElNotification } from 'element-plus'
import {
  User,
  Lock,
  Message,
  ChatDotRound
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'
import { validatePasswordStrength } from '@/utils/auth'
import { withAdminPrefix } from '@/utils/route'
import type { LoginForm } from '@/types/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 表单引用
const loginFormRef = ref<FormInstance>()
const forgotFormRef = ref<FormInstance>()

// 状态
const loading = ref(false)
const forgotPasswordVisible = ref(false)
const forgotLoading = ref(false)

// 登录表单
const loginForm = reactive<LoginForm>({
  username: '',
  password: '',
  remember: true
})

// 忘记密码表单
const forgotForm = reactive({
  email: ''
})

// 密码强度
const passwordStrength = ref(0)
const strengthFeedback = ref<string[]>([])

// 表单验证规则
const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const forgotRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

// 计算属性
const showPasswordStrength = computed(() => {
  return loginForm.password.length > 0 && passwordStrength.value > 0
})

const strengthText = computed(() => {
  const texts = ['很弱', '弱', '一般', '强', '很强']
  return texts[passwordStrength.value - 1] || ''
})

// 监听密码变化
watch(
  () => loginForm.password,
  (newPassword) => {
    if (newPassword) {
      const result = validatePasswordStrength(newPassword)
      passwordStrength.value = result.score
      strengthFeedback.value = result.feedback
    } else {
      passwordStrength.value = 0
      strengthFeedback.value = []
    }
  }
)


/**
 * 处理登录
 */
async function handleLogin(): Promise<void> {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    loading.value = true

    // 构建登录数据
    const loginData: LoginForm = {
      ...loginForm
    }

    const success = await authStore.login(loginData)

    if (success) {
      ElNotification({
        title: '登录成功',
        message: `欢迎回来，${authStore.user?.username}！`,
        type: 'success',
        duration: 3000
      })

      // 获取重定向路径,默认跳转到 dashboard
      const redirect = (route.query.redirect as string) || withAdminPrefix('/dashboard')
      try {
        await router.push(redirect)
      } catch (error: any) {
        // 忽略冗余导航错误
        if (!error.message?.includes('redundant navigation')) {
          throw error
        }
      }
    } else {
      ElMessage.error('用户名或密码错误')
    }
  } catch (error: any) {
    console.error('Login error:', error)
    ElMessage.error(error.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

/**
 * 显示忘记密码对话框
 */
function showForgotPassword(): void {
  forgotPasswordVisible.value = true
}

/**
 * 处理忘记密码
 */
async function handleForgotPassword(): Promise<void> {
  if (!forgotFormRef.value) return

  try {
    const valid = await forgotFormRef.value.validate()
    if (!valid) return

    forgotLoading.value = true

    await authApi.sendResetCode(forgotForm.email)

    ElMessage.success('重置密码邮件已发送，请查收邮箱')
    forgotPasswordVisible.value = false
    forgotForm.email = ''
  } catch (error: any) {
    ElMessage.error(error.message || '发送重置邮件失败')
  } finally {
    forgotLoading.value = false
  }
}

/**
 * 获取密码强度样式类
 */
function getStrengthClass(index: number): string {
  if (index < passwordStrength.value) {
    const classes = ['very-weak', 'weak', 'fair', 'good', 'strong']
    return classes[passwordStrength.value - 1] || ''
  }
  return ''
}

// 组件挂载时检查是否已登录
onMounted(async () => {
  if (authStore.isAuthenticated) {
    const redirect = (route.query.redirect as string) || withAdminPrefix('/dashboard')
    try {
      await router.push(redirect)
    } catch (error: any) {
      // 忽略冗余导航错误
      if (!error.message?.includes('redundant navigation')) {
        console.error('Navigation error:', error)
      }
    }
  }
})
</script>

<style scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  z-index: 0;
}

.animated-bg {
  position: absolute;
  width: 100%;
  height: 100%;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.circle:nth-child(1) {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle:nth-child(2) {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.circle:nth-child(3) {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.login-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.login-card {
  border-radius: 16px;
  border: none;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  margin-bottom: 16px;
}

.title {
  font-size: 28px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

.login-form {
  padding: 0 8px;
}


.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(45deg, #409eff, #67c23a);
  border: none;
  transition: all 0.3s;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.3);
}

.login-footer {
  margin-top: 24px;
}

.divider-text {
  font-size: 12px;
  color: #909399;
}

.security-tips {
  margin-top: 16px;
}

.password-strength {
  margin-top: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.strength-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.strength-bars {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strength-bar {
  height: 4px;
  flex: 1;
  background: #f0f0f0;
  border-radius: 2px;
  transition: background-color 0.3s;
}

.strength-bar.very-weak {
  background: #f56c6c;
}

.strength-bar.weak {
  background: #e6a23c;
}

.strength-bar.fair {
  background: #f7ba2a;
}

.strength-bar.good {
  background: #67c23a;
}

.strength-bar.strong {
  background: #409eff;
}

.strength-text {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-content {
    padding: 16px;
  }

  .title {
    font-size: 24px;
  }

  .login-card {
    border-radius: 12px;
  }


  .password-strength {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .strength-bars {
    width: 100%;
  }
}
</style>