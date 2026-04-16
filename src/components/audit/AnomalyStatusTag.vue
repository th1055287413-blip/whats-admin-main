<template>
  <el-tag
    :type="tagType"
    size="small"
    :class="tagClass"
  >
    <el-icon><component :is="statusIcon" /></el-icon>
    {{ displayText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Check,
  Close,
  Clock,
  QuestionFilled
} from '@element-plus/icons-vue'
import type { AnomalyDetection } from '@/types/audit'

interface Props {
  anomaly: AnomalyDetection
}

const props = defineProps<Props>()

const tagType = computed(() => {
  if (props.anomaly.is_confirmed) return 'danger'
  if (props.anomaly.is_false_positive) return 'success'
  return 'warning'
})

const tagClass = computed(() => {
  const baseClass = 'anomaly-status-tag'
  let statusClass = ''

  if (props.anomaly.is_confirmed) {
    statusClass = 'confirmed'
  } else if (props.anomaly.is_false_positive) {
    statusClass = 'false-positive'
  } else {
    statusClass = 'pending'
  }

  return `${baseClass} ${statusClass}`
})

const statusIcon = computed(() => {
  if (props.anomaly.is_confirmed) return Check
  if (props.anomaly.is_false_positive) return Close
  return Clock
})

const displayText = computed(() => {
  if (props.anomaly.is_confirmed) return '已确认'
  if (props.anomaly.is_false_positive) return '误报'
  return '待处理'
})
</script>

<style lang="scss" scoped>
.anomaly-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.confirmed {
    --el-tag-bg-color: var(--el-color-danger-light-9);
    --el-tag-border-color: var(--el-color-danger-light-8);
    --el-tag-text-color: var(--el-color-danger);
  }

  &.false-positive {
    --el-tag-bg-color: var(--el-color-success-light-9);
    --el-tag-border-color: var(--el-color-success-light-8);
    --el-tag-text-color: var(--el-color-success);
  }

  &.pending {
    --el-tag-bg-color: var(--el-color-warning-light-9);
    --el-tag-border-color: var(--el-color-warning-light-8);
    --el-tag-text-color: var(--el-color-warning);
    animation: pending-blink 2s infinite;
  }

  .el-icon {
    font-size: 12px;
  }
}

@keyframes pending-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>