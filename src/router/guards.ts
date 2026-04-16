import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { ElLoading, ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import { withAdminPrefix, getAdminPrefix } from '@/utils/route'

// 加载实例
let loadingInstance: any = null

/**
 * 显示全局加载
 */
function showGlobalLoading() {
  loadingInstance = ElLoading.service({
    text: '加载中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
}

/**
 * 隐藏全局加载
 */
function hideGlobalLoading() {
  if (loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}

/**
 * 检查路由权限
 */
function checkRoutePermission(
  to: RouteLocationNormalized,
  authStore: ReturnType<typeof useAuthStore>,
  permission: ReturnType<typeof usePermission>
): boolean {
  const { meta } = to

  // 检查权限
  if (meta.permissions) {
    const permissions = Array.isArray(meta.permissions) ? meta.permissions : [meta.permissions]
    if (!permission.hasAnyPermission(permissions) && !permission.isAdmin.value) {
      return false
    }
  }

  // 检查角色
  if (meta.roles) {
    const roles = Array.isArray(meta.roles) ? meta.roles : [meta.roles]
    if (!permission.hasAnyRole(roles) && !permission.isAdmin.value) {
      return false
    }
  }

  // 检查自定义权限函数
  if (meta.checkPermission && typeof meta.checkPermission === 'function') {
    if (!meta.checkPermission(authStore.user)) {
      return false
    }
  }

  return true
}

/**
 * 获取重定向路径
 */
function getRedirectPath(to: RouteLocationNormalized): string {
  const adminPrefix = getAdminPrefix()
  const redirectPath = to.fullPath !== adminPrefix && to.fullPath !== `${adminPrefix}/` ? to.fullPath : ''
  return redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : ''
}

/**
 * 设置路由守卫
 */
export function setupGuards(router: Router) {
  /**
   * 全局前置守卫
   */
  router.beforeEach(async (to, from, next) => {
    showGlobalLoading()

    const authStore = useAuthStore()
    const permission = usePermission()

    try {
      // 设置页面标题
      if (to.meta.title) {
        document.title = `${to.meta.title} - WhatsApp 管理系统`
      }

      // 不需要认证的页面直接通过
      if (to.meta.requiresAuth === false) {
        // 如果已登录且访问登录页，重定向到仪表盘
        if (to.name === 'Login' && authStore.isAuthenticated) {
          const redirect = to.query.redirect as string
          next(redirect || withAdminPrefix('/dashboard'))
          return
        }
        next()
        return
      }

      // 如果 store 中已标记为已认证，直接检查权限并放行
      if (authStore.isAuthenticated) {
        if (!checkRoutePermission(to, authStore, permission)) {
          ElMessage.error('权限不足，无法访问该页面')
          next('/403')
          return
        }
        next()
        return
      }

      // 如果 store 中未认证，尝试从存储中恢复认证状态
      const isAuthenticated = await authStore.checkAuthStatus()

      if (!isAuthenticated) {
        // 未认证，重定向到登录页
        const redirectPath = getRedirectPath(to)
        next(`${withAdminPrefix('/login')}${redirectPath}`)
        return
      }

      // 检查路由权限
      if (!checkRoutePermission(to, authStore, permission)) {
        ElMessage.error('权限不足，无法访问该页面')
        next('/403')
        return
      }

      next()
    } catch (error) {
      console.error('Route guard error:', error)
      ElMessage.error('页面加载失败，请稍后重试')
      next('/404')
    }
  })

  /**
   * 全局后置守卫
   */
  router.afterEach((to, from, failure) => {
    hideGlobalLoading()

    // 导航失败处理
    if (failure) {
      console.error('Navigation failed:', failure)
      // 忽略冗余导航错误
      if (!failure.message?.includes('redundant navigation')) {
        ElMessage.error('页面跳转失败')
      }
      return
    }

    // 记录页面访问日志（可选）
    if (process.env.NODE_ENV === 'development') {
      console.log(`Navigated from ${from.fullPath} to ${to.fullPath}`)
    }
  })

  /**
   * 全局解析守卫
   */
  router.beforeResolve(async (to, from, next) => {
    try {
      // 这里可以添加一些需要在组件加载前执行的逻辑
      // 例如：预加载数据、检查特殊权限等

      next()
    } catch (error) {
      console.error('Route resolve error:', error)
      next(false)
    }
  })
}

/**
 * 权限导航助手
 */
export const navigationHelper = {
  /**
   * 安全导航到指定路由
   */
  async navigateTo(router: Router, path: string): Promise<boolean> {
    const authStore = useAuthStore()
    const permission = usePermission()

    try {
      // 解析路由
      const route = router.resolve(path)

      // 检查是否需要认证
      if (route.meta?.requiresAuth !== false) {
        const isAuthenticated = await authStore.checkAuthStatus()
        if (!isAuthenticated) {
          router.push(`${withAdminPrefix('/login')}?redirect=${encodeURIComponent(path)}`)
          return false
        }

        // 检查权限
        if (!checkRoutePermission(route, authStore, permission)) {
          ElMessage.error('权限不足，无法访问该页面')
          return false
        }
      }

      await router.push(path)
      return true
    } catch (error) {
      console.error('Navigation error:', error)
      ElMessage.error('页面跳转失败')
      return false
    }
  },

  /**
   * 返回上一页（带权限检查）
   */
  async goBack(router: Router): Promise<void> {
    try {
      router.back()
    } catch (error) {
      // 如果返回失败，跳转到仪表盘
      router.push(withAdminPrefix('/dashboard'))
    }
  },

  /**
   * 刷新当前页面
   */
  refresh(router: Router): void {
    const { currentRoute } = router
    router.replace({
      path: '/redirect' + currentRoute.value.fullPath
    })
  }
}

/**
 * 路由元信息类型扩展
 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    permissions?: string | string[]
    roles?: string | string[]
    layout?: string
    keepAlive?: boolean
    checkPermission?: (user: any) => boolean
  }
}