<template>
  <div class="log-status-indicator">
    <el-tooltip :content="tooltipContent" placement="top">
      <div :class="indicatorClass">
        <el-icon><component :is="statusIcon" /></el-icon>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  CircleCheck,
  Warning,
  CircleClose,
  Clock,
  QuestionFilled,
  Shield
} from '@element-plus/icons-vue'
import type { OperationLog, LoginLog, AnomalyDetection } from '@/types/audit'

interface Props {
  log: OperationLog | LoginLog | AnomalyDetection
  type: 'operation' | 'login' | 'anomaly'
}

const props = defineProps<Props>()

const statusIcon = computed(() => {
  if (props.type === 'operation') {
    const log = props.log as OperationLog
    if (log.response_status >= 200 && log.response_status < 300) {
      return CircleCheck
    } else if (log.response_status >= 400) {
      return CircleClose
    } else {
      return Warning
    }
  } else if (props.type === 'login') {
    const log = props.log as LoginLog
    if (log.login_status === 'success') {
      return log.is_suspicious ? Warning : CircleCheck
    } else if (log.login_status === 'failed') {
      return CircleClose
    } else {
      return Shield
    }
  } else {
    const log = props.log as AnomalyDetection
    if (log.is_confirmed) {
      return Warning
    } else if (log.is_false_positive) {
      return CircleCheck
    } else {
      return QuestionFilled
    }
  }
})

const indicatorClass = computed(() => {
  const baseClass = 'status-indicator'

  if (props.type === 'operation') {
    const log = props.log as OperationLog
    if (log.response_status >= 200 && log.response_status < 300) {
      return `${baseClass} status-success`
    } else if (log.response_status >= 400) {
      return `${baseClass} status-error`
    } else {
      return `${baseClass} status-warning`
    }
  } else if (props.type === 'login') {
    const log = props.log as LoginLog
    if (log.login_status === 'success') {
      return log.is_suspicious ? `${baseClass} status-warning` : `${baseClass} status-success`
    } else if (log.login_status === 'failed') {
      return `${baseClass} status-error`
    } else {
      return `${baseClass} status-info`
    }
  } else {
    const log = props.log as AnomalyDetection
    if (log.is_confirmed) {
      return `${baseClass} status-error`
    } else if (log.is_false_positive) {
      return `${baseClass} status-success`
    } else {
      return `${baseClass} status-warning`
    }
  }
})

const tooltipContent = computed(() => {
  if (props.type === 'operation') {
    const log = props.log as OperationLog
    return `HTTP ${log.response_status} - ${log.request_method} ${log.request_path}`
  } else if (props.type === 'login') {
    const log = props.log as LoginLog
    const status = log.login_status === 'success' ? '成功' :
                  log.login_status === 'failed' ? '失败' : '阻止'
    const suspicious = log.is_suspicious ? ' (可疑)' : ''
    return `登录${status}${suspicious}`
  } else {
    const log = props.log as AnomalyDetection
    if (log.is_confirmed) return '已确认威胁'
    if (log.is_false_positive) return '已标记误报'
    return '待处理异常'
  }
})
</script>

<style lang="scss" scoped>
.log-status-indicator {
  .status-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;

    &.status-success {
      background-color: var(--el-color-success-light-9);
      color: var(--el-color-success);
    }

    &.status-warning {
      background-color: var(--el-color-warning-light-9);
      color: var(--el-color-warning);
    }

    &.status-error {
      background-color: var(--el-color-error-light-9);
      color: var(--el-color-error);
    }

    &.status-info {
      background-color: var(--el-color-info-light-9);
      color: var(--el-color-info);
    }
  }
}
</style>