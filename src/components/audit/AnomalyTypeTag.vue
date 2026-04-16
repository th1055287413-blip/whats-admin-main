<template>
  <el-tag
    :type="tagType"
    size="small"
    :class="tagClass"
  >
    <el-icon><component :is="anomalyIcon" /></el-icon>
    {{ displayText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  User,
  Operation,
  Lock,
  Document,
  Warning
} from '@element-plus/icons-vue'
import type { AnomalyDetection, AnomalyDetectionType } from '@/types/audit'

interface Props {
  anomaly: AnomalyDetection
}

const props = defineProps<Props>()

const tagType = computed(() => {
  switch (props.anomaly.detection_type) {
    case 'login_anomaly':
      return 'warning'
    case 'operation_anomaly':
      return 'danger'
    case 'access_anomaly':
      return 'danger'
    case 'data_anomaly':
      return 'primary'
    default:
      return 'info'
  }
})

const tagClass = computed(() => {
  const baseClass = 'anomaly-type-tag'
  const typeClass = `anomaly-${props.anomaly.detection_type}`
  const severityClass = `severity-${props.anomaly.severity}`
  const statusClass = props.anomaly.is_confirmed ? 'confirmed' :
                     props.anomaly.is_false_positive ? 'false-positive' : 'pending'
  return [baseClass, typeClass, severityClass, statusClass].filter(Boolean).join(' ')
})

const anomalyIcon = computed(() => {
  switch (props.anomaly.detection_type) {
    case 'login_anomaly':
      return User
    case 'operation_anomaly':
      return Operation
    case 'access_anomaly':
      return Lock
    case 'data_anomaly':
      return Document
    default:
      return Warning
  }
})

const displayText = computed(() => {
  const typeMap: Record<AnomalyDetectionType, string> = {
    login_anomaly: '登录异常',
    operation_anomaly: '操作异常',
    access_anomaly: '访问异常',
    data_anomaly: '数据异常'
  }
  return typeMap[props.anomaly.detection_type] || props.anomaly.detection_type
})
</script>

<style lang="scss" scoped>
.anomaly-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.confirmed {
    border: 1px solid var(--el-color-danger);
    background-color: var(--el-color-danger-light-9);
  }

  &.false-positive {
    opacity: 0.6;
    text-decoration: line-through;
  }

  &.pending {
    animation: pending-pulse 3s infinite;
  }

  &.severity-critical {
    font-weight: 600;
    box-shadow: 0 0 4px var(--el-color-danger-light-5);
  }

  .el-icon {
    font-size: 12px;
  }
}

.anomaly-login_anomaly {
  --el-tag-text-color: var(--el-color-warning-dark-2);
}

.anomaly-operation_anomaly {
  --el-tag-text-color: var(--el-color-danger-dark-2);
}

.anomaly-access_anomaly {
  --el-tag-text-color: var(--el-color-danger-dark-2);
}

.anomaly-data_anomaly {
  --el-tag-text-color: var(--el-color-primary-dark-2);
}

@keyframes pending-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>