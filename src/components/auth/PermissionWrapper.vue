<template>
  <div v-if="hasAccess" :class="wrapperClass">
    <slot />
  </div>
  <div v-else-if="showFallback" :class="fallbackClass">
    <slot name="fallback">
      <el-empty
        v-if="showEmptyState"
        :description="fallbackText || '暂无权限访问'"
        :image-size="80"
      />
      <span v-else-if="fallbackText">{{ fallbackText }}</span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePermission } from '@/composables/usePermission'

interface Props {
  // 权限控制
  permission?: string | string[]
  role?: string | string[]

  // 逻辑操作符
  operator?: 'and' | 'or' // 默认为 'or'

  // 用户ID检查（用于检查是否为当前用户）
  userId?: number

  // 是否允许当前用户访问（配合userId使用）
  allowSelf?: boolean

  // 是否允许管理员访问
  allowAdmin?: boolean

  // 自定义权限检查函数
  customCheck?: () => boolean

  // 反转权限检查结果
  not?: boolean

  // 样式控制
  wrapperClass?: string
  fallbackClass?: string

  // 无权限时的显示
  showFallback?: boolean
  fallbackText?: string
  showEmptyState?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  operator: 'or',
  allowSelf: false,
  allowAdmin: true,
  not: false,
  showFallback: false,
  showEmptyState: false
})

const {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  isAdmin,
  isCurrentUser,
  isSelfOrAdmin
} = usePermission()

/**
 * 检查权限访问
 */
const hasAccess = computed(() => {
  let result = true

  // 自定义检查函数优先
  if (props.customCheck) {
    result = props.customCheck()
  } else {
    // 权限检查
    if (props.permission) {
      const permissions = Array.isArray(props.permission) ? props.permission : [props.permission]

      if (props.operator === 'and') {
        result = hasAllPermissions(permissions)
      } else {
        result = hasAnyPermission(permissions)
      }
    }

    // 角色检查
    if (props.role && result) {
      const roles = Array.isArray(props.role) ? props.role : [props.role]

      if (props.operator === 'and') {
        result = roles.every(role => hasRole(role))
      } else {
        result = hasAnyRole(roles)
      }
    }

    // 用户ID检查
    if (props.userId !== undefined) {
      const userCheck = props.allowSelf ? isCurrentUser(props.userId) : false
      const adminCheck = props.allowAdmin ? isAdmin.value : false

      if (props.operator === 'and') {
        result = result && (userCheck || adminCheck)
      } else {
        result = result || userCheck || adminCheck
      }
    }

    // 管理员检查
    if (props.allowAdmin && !result) {
      result = isAdmin.value
    }
  }

  // 反转结果
  return props.not ? !result : result
})
</script>

<style scoped>
.permission-wrapper {
  display: contents;
}

.permission-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>