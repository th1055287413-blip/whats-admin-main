<template>
  <el-tag
    :type="tagType"
    :effect="effect"
    size="small"
    :class="tagClass"
  >
    <el-icon v-if="showIcon"><component :is="severityIcon" /></el-icon>
    {{ displayText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  InfoFilled,
  Warning,
  CircleClose,
  Close
} from '@element-plus/icons-vue'
import type { AnomalySeverity } from '@/types/audit'

interface Props {
  severity: AnomalySeverity | string
  showIcon?: boolean
  effect?: 'light' | 'plain' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: true,
  effect: 'light'
})

const normalizedSeverity = computed(() => {
  return props.severity?.toLowerCase() as AnomalySeverity
})

const tagType = computed(() => {
  switch (normalizedSeverity.value) {
    case 'critical':
      return 'danger'
    case 'error':
      return 'danger'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'info'
  }
})

const tagClass = computed(() => {
  const baseClass = 'severity-tag'
  const severityClass = `severity-${normalizedSeverity.value}`
  return [baseClass, severityClass].filter(Boolean).join(' ')
})

const severityIcon = computed(() => {
  switch (normalizedSeverity.value) {
    case 'critical':
      return Close
    case 'error':
      return CircleClose
    case 'warning':
      return Warning
    case 'info':
      return InfoFilled
    default:
      return InfoFilled
  }
})

const displayText = computed(() => {
  switch (normalizedSeverity.value) {
    case 'critical':
      return '严重'
    case 'error':
      return '错误'
    case 'warning':
      return '警告'
    case 'info':
      return '信息'
    default:
      return '未知'
  }
})
</script>

<style lang="scss" scoped>
.severity-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .el-icon {
    font-size: 12px;
  }
}

.severity-critical {
  --el-tag-bg-color: var(--el-color-danger);
  --el-tag-border-color: var(--el-color-danger);
  --el-tag-text-color: #fff;
  font-weight: 600;
  animation: critical-pulse 2s infinite;
}

.severity-error {
  --el-tag-bg-color: var(--el-color-danger-light-9);
  --el-tag-border-color: var(--el-color-danger-light-8);
  --el-tag-text-color: var(--el-color-danger);
}

.severity-warning {
  --el-tag-bg-color: var(--el-color-warning-light-9);
  --el-tag-border-color: var(--el-color-warning-light-8);
  --el-tag-text-color: var(--el-color-warning);
}

.severity-info {
  --el-tag-bg-color: var(--el-color-info-light-9);
  --el-tag-border-color: var(--el-color-info-light-8);
  --el-tag-text-color: var(--el-color-info);
}

@keyframes critical-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 var(--el-color-danger-light-5);
  }
  50% {
    box-shadow: 0 0 0 4px transparent;
  }
}
</style>