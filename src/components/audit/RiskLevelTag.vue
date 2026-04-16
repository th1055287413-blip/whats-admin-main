<template>
  <el-tag
    :type="tagType"
    :effect="effect"
    size="small"
    :class="tagClass"
  >
    <el-icon v-if="showIcon"><component :is="riskIcon" /></el-icon>
    {{ displayText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Shield, Warning, CircleClose, InfoFilled } from '@element-plus/icons-vue'
import type { RiskLevel } from '@/types/audit'

interface Props {
  level: RiskLevel | string
  showIcon?: boolean
  effect?: 'light' | 'plain' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: true,
  effect: 'light'
})

const normalizedLevel = computed(() => {
  return props.level?.toLowerCase() as RiskLevel
})

const tagType = computed(() => {
  switch (normalizedLevel.value) {
    case 'critical':
      return 'danger'
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'success'
    default:
      return 'info'
  }
})

const tagClass = computed(() => {
  return `risk-level-${normalizedLevel.value}`
})

const riskIcon = computed(() => {
  switch (normalizedLevel.value) {
    case 'critical':
      return CircleClose
    case 'high':
      return Warning
    case 'medium':
      return Shield
    case 'low':
      return InfoFilled
    default:
      return InfoFilled
  }
})

const displayText = computed(() => {
  switch (normalizedLevel.value) {
    case 'critical':
      return '严重'
    case 'high':
      return '高'
    case 'medium':
      return '中'
    case 'low':
      return '低'
    default:
      return '未知'
  }
})
</script>

<style lang="scss" scoped>
.risk-level-critical {
  --el-tag-bg-color: var(--el-color-danger-light-9);
  --el-tag-border-color: var(--el-color-danger-light-8);
  --el-tag-text-color: var(--el-color-danger);
  font-weight: 600;
}

.risk-level-high {
  --el-tag-bg-color: var(--el-color-danger-light-9);
  --el-tag-border-color: var(--el-color-danger-light-8);
  --el-tag-text-color: var(--el-color-danger);
}

.risk-level-medium {
  --el-tag-bg-color: var(--el-color-warning-light-9);
  --el-tag-border-color: var(--el-color-warning-light-8);
  --el-tag-text-color: var(--el-color-warning);
}

.risk-level-low {
  --el-tag-bg-color: var(--el-color-success-light-9);
  --el-tag-border-color: var(--el-color-success-light-8);
  --el-tag-text-color: var(--el-color-success);
}
</style>