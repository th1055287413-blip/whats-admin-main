import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * 权限检查组合函数
 */
export function usePermission() {
  const authStore = useAuthStore()

  /**
   * 检查单个权限
   */
  const hasPermission = (permission: string): boolean => {
    return authStore.checkPermission(permission)
  }

  /**
   * 检查多个权限（任一满足）
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return authStore.checkAnyPermission(permissions)
  }

  /**
   * 检查多个权限（全部满足）
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return authStore.checkAllPermissions(permissions)
  }

  /**
   * 检查角色
   */
  const hasRole = (role: string): boolean => {
    return authStore.checkRole(role)
  }

  /**
   * 检查多个角色（任一满足）
   */
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => authStore.checkRole(role))
  }

  /**
   * 检查是否为管理员
   */
  const isAdmin = computed(() => authStore.isAdmin)

  /**
   * 检查是否为当前用户
   */
  const isCurrentUser = (userId: number): boolean => {
    return authStore.user?.id === userId
  }

  /**
   * 检查是否为用户本人或管理员
   */
  const isSelfOrAdmin = (userId: number): boolean => {
    return isCurrentUser(userId) || isAdmin.value
  }

  /**
   * 检查资源访问权限
   */
  const canAccessResource = (resource: string, action: string): boolean => {
    const permission = `${resource}:${action}`
    return hasPermission(permission)
  }

  /**
   * 检查用户管理权限
   */
  const canManageAccounts = computed(() => {
    return hasAnyPermission(['account.write', 'account.delete']) || isAdmin.value
  })

  /**
   * 检查帳號查看权限
   */
  const canViewAccounts = computed(() => {
    return hasPermission('account.read') || canManageAccounts.value
  })

  /**
   * 检查消息管理权限
   */
  const canManageMessages = computed(() => {
    return hasAnyPermission(['message.send', 'message.delete', 'message.revoke']) || isAdmin.value
  })

  /**
   * 检查消息查看权限
   */
  const canViewMessages = computed(() => {
    return hasPermission('message.view') || canManageMessages.value
  })

  /**
   * 检查系统设置权限
   */
  const canManageSettings = computed(() => {
    return hasPermission('system.config_update') || isAdmin.value
  })

  /**
   * 检查数据分析权限
   */
  const canViewAnalytics = computed(() => {
    return hasPermission('dashboard.view') || isAdmin.value
  })

  /**
   * 检查批量发送权限
   */
  const canBatchSend = computed(() => {
    return hasAnyPermission(['batch_send.create', 'batch_send.execute']) || isAdmin.value
  })

  /**
   * 检查内容审核权限
   */
  const canManageContentModeration = computed(() => {
    return hasAnyPermission(['content_moderation.word_view', 'content_moderation.alert_view']) || isAdmin.value
  })

  /**
   * 检查渠道管理权限
   */
  const canManageChannels = computed(() => {
    return hasAnyPermission(['channel.view', 'channel.create', 'channel.update']) || isAdmin.value
  })

  /**
   * 检查标签管理权限
   */
  const canManageTags = computed(() => {
    return hasAnyPermission(['tag.view', 'tag.create', 'tag.update']) || isAdmin.value
  })

  /**
   * 根据权限过滤菜单项
   */
  const filterMenuByPermission = <T extends { permission?: string; role?: string; children?: T[] }>(
    menus: T[]
  ): T[] => {
    return menus.filter(menu => {
      // 检查权限
      if (menu.permission && !hasPermission(menu.permission)) {
        return false
      }

      // 检查角色
      if (menu.role && !hasRole(menu.role)) {
        return false
      }

      // 递归过滤子菜单
      if (menu.children) {
        menu.children = filterMenuByPermission(menu.children)
      }

      return true
    })
  }

  /**
   * 根据权限过滤操作按钮
   */
  const filterActionsByPermission = <T extends { permission?: string; role?: string }>(
    actions: T[]
  ): T[] => {
    return actions.filter(action => {
      if (action.permission && !hasPermission(action.permission)) {
        return false
      }

      if (action.role && !hasRole(action.role)) {
        return false
      }

      return true
    })
  }

  /**
   * 权限装饰器（用于方法权限检查）
   */
  const withPermission = <T extends (...args: any[]) => any>(
    permission: string,
    fn: T,
    fallback?: () => void
  ) => {
    return (...args: Parameters<T>): ReturnType<T> | void => {
      if (hasPermission(permission)) {
        return fn(...args)
      } else {
        if (fallback) {
          fallback()
        } else {
          console.warn(`Permission denied: ${permission}`)
        }
      }
    }
  }

  /**
   * 角色装饰器（用于方法角色检查）
   */
  const withRole = <T extends (...args: any[]) => any>(
    role: string,
    fn: T,
    fallback?: () => void
  ) => {
    return (...args: Parameters<T>): ReturnType<T> | void => {
      if (hasRole(role)) {
        return fn(...args)
      } else {
        if (fallback) {
          fallback()
        } else {
          console.warn(`Role required: ${role}`)
        }
      }
    }
  }

  return {
    // 基础权限检查
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isCurrentUser,
    isSelfOrAdmin,
    canAccessResource,

    // 业务权限检查
    canManageAccounts,
    canViewAccounts,
    canManageMessages,
    canViewMessages,
    canManageSettings,
    canViewAnalytics,
    canBatchSend,
    canManageContentModeration,
    canManageChannels,
    canManageTags,

    // 工具方法
    filterMenuByPermission,
    filterActionsByPermission,
    withPermission,
    withRole
  }
}