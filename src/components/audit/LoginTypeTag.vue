<template>
  <el-tag
    :type="tagType"
    size="small"
    :class="tagClass"
  >
    <el-icon><component :is="loginIcon" /></el-icon>
    {{ displayText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Right,
  SwitchButton,
  Clock,
  Close
} from '@element-plus/icons-vue'
import type { LoginLog, LoginType } from '@/types/audit'

interface Props {
  login: LoginLog
}

const props = defineProps<Props>()

const tagType = computed(() => {
  if (props.login.is_suspicious) return 'danger'

  switch (props.login.login_type) {
    case 'login':
      return props.login.login_status === 'success' ? 'success' : 'danger'
    case 'logout':
      return 'info'
    case 'session_timeout':
      return 'warning'
    case 'force_logout':
      return 'danger'
    default:
      return 'info'
  }
})

const tagClass = computed(() => {
  const baseClass = 'login-type-tag'
  const typeClass = `login-${props.login.login_type}`
  const statusClass = `status-${props.login.login_status}`
  const suspiciousClass = props.login.is_suspicious ? 'suspicious' : ''
  return [baseClass, typeClass, statusClass, suspiciousClass].filter(Boolean).join(' ')
})

const loginIcon = computed(() => {
  switch (props.login.login_type) {
    case 'login':
      return Right
    case 'logout':
      return SwitchButton
    case 'session_timeout':
      return Clock
    case 'force_logout':
      return Close
    default:
      return Right
  }
})

const displayText = computed(() => {
  const typeMap: Record<LoginType, string> = {
    login: '登录',
    logout: '登出',
    session_timeout: '超时',
    force_logout: '强制登出'
  }
  return typeMap[props.login.login_type] || props.login.login_type
})
</script>

<style lang="scss" scoped>
.login-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.suspicious {
    position: relative;
    animation: suspicious-pulse 2s infinite;

    &::before {
      content: '⚠';
      font-size: 10px;
      margin-right: 2px;
      color: var(--el-color-danger);
    }
  }

  .el-icon {
    font-size: 12px;
  }
}

.login-login.status-success {
  --el-tag-text-color: var(--el-color-success-dark-2);
}

.login-login.status-failed {
  --el-tag-text-color: var(--el-color-danger-dark-2);
}

.login-logout {
  --el-tag-text-color: var(--el-color-info-dark-2);
}

.login-session_timeout {
  --el-tag-text-color: var(--el-color-warning-dark-2);
}

.login-force_logout {
  --el-tag-text-color: var(--el-color-danger-dark-2);
}

@keyframes suspicious-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>