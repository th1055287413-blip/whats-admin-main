<template>
  <el-tag
    :type="tagType"
    size="small"
    :class="tagClass"
  >
    <el-icon><component :is="operationIcon" /></el-icon>
    {{ displayText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Plus,
  Edit,
  Delete,
  View,
  Lightning,
  Operation
} from '@element-plus/icons-vue'
import type { OperationLog, OperationType } from '@/types/audit'

interface Props {
  operation: OperationLog
}

const props = defineProps<Props>()

const tagType = computed(() => {
  switch (props.operation.operation_type) {
    case 'create':
      return 'success'
    case 'update':
      return 'warning'
    case 'delete':
      return 'danger'
    case 'read':
      return 'info'
    case 'execute':
      return 'primary'
    default:
      return 'info'
  }
})

const tagClass = computed(() => {
  const baseClass = 'operation-type-tag'
  const typeClass = `operation-${props.operation.operation_type}`
  const sensitiveClass = props.operation.is_sensitive ? 'sensitive' : ''
  return [baseClass, typeClass, sensitiveClass].filter(Boolean).join(' ')
})

const operationIcon = computed(() => {
  switch (props.operation.operation_type) {
    case 'create':
      return Plus
    case 'update':
      return Edit
    case 'delete':
      return Delete
    case 'read':
      return View
    case 'execute':
      return Lightning
    default:
      return Operation
  }
})

const displayText = computed(() => {
  const typeMap: Record<OperationType, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    read: '查看',
    execute: '执行'
  }
  return typeMap[props.operation.operation_type] || props.operation.operation_type
})
</script>

<style lang="scss" scoped>
.operation-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.sensitive {
    position: relative;
    font-weight: 600;

    &::after {
      content: '🔒';
      font-size: 10px;
      margin-left: 2px;
    }
  }

  .el-icon {
    font-size: 12px;
  }
}

.operation-create {
  --el-tag-text-color: var(--el-color-success-dark-2);
}

.operation-update {
  --el-tag-text-color: var(--el-color-warning-dark-2);
}

.operation-delete {
  --el-tag-text-color: var(--el-color-danger-dark-2);
}

.operation-read {
  --el-tag-text-color: var(--el-color-info-dark-2);
}

.operation-execute {
  --el-tag-text-color: var(--el-color-primary-dark-2);
}
</style>