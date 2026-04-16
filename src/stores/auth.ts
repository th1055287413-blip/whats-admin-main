import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/auth'
import {
  getToken,
  setToken,
  getRefreshToken,
  setRefreshToken,
  getUserInfo,
  setUserInfo,
  getRememberMe,
  setRememberMe,
  clearAuthData,
  isTokenValid
} from '@/utils/auth'
import type { User, LoginForm, AuthState } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const isAuthenticated = ref(false)
  const permissions = ref<string[]>([])
  const roles = ref<string[]>([])
  const isLoading = ref(false)

  // 计算属性
  const hasPermission = computed(() => {
    return (permission: string) => permissions.value.includes(permission)
  })

  const hasRole = computed(() => {
    return (role: string) => roles.value.includes(role)
  })

  const hasAnyPermission = computed(() => {
    return (permissionList: string[]) =>
      permissionList.some(permission => permissions.value.includes(permission))
  })

  const hasAllPermissions = computed(() => {
    return (permissionList: string[]) =>
      permissionList.every(permission => permissions.value.includes(permission))
  })

  const userProfile = computed(() => user.value)
  const isAdmin = computed(() => roles.value.includes('super_admin') || roles.value.includes('admin'))

  /**
   * 初始化认证状态
   */
  async function initAuthState(): Promise<void> {
    const savedToken = getToken()
    const savedUser = getUserInfo()
    const savedRefreshToken = getRefreshToken()

    if (savedToken && isTokenValid(savedToken) && savedUser) {
      token.value = savedToken
      refreshToken.value = savedRefreshToken
      user.value = savedUser
      isAuthenticated.value = true
      // 先用緩存的權限，然後從後端刷新
      permissions.value = savedUser.permissions || []
      roles.value = savedUser.role ? [savedUser.role] : []

      // 從後端重新獲取最新權限
      await fetchUserProfile()
    } else {
      clearAuthData()
    }
  }

  /**
   * 登录
   */
  async function login(loginForm: LoginForm): Promise<boolean> {
    try {
      isLoading.value = true

      const response = await authApi.login(loginForm)
      const { token: access_token, user: userInfo } = response.data

      // 保存认证信息
      setRememberMe(loginForm.remember)
      setToken(access_token)
      setUserInfo(userInfo)

      // 更新状态
      token.value = access_token
      user.value = userInfo
      isAuthenticated.value = true
      permissions.value = userInfo.permissions || []
      roles.value = userInfo.role ? [userInfo.role] : []

      // 不在这里显示成功消息，由调用方处理
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '登录失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 登出
   */
  async function logout(): Promise<void> {
    try {
      isLoading.value = true

      // 调用后端登出接口
      if (token.value) {
        await authApi.logout()
      }
    } catch (error) {
      console.warn('Logout API call failed:', error)
    } finally {
      // 清除本地状态
      clearAuthData()
      resetState()
      isLoading.value = false
      ElMessage.success('已退出登录')
    }
  }

  /**
   * 刷新Token
   */
  async function refreshTokens(): Promise<boolean> {
    try {
      const savedRefreshToken = getRefreshToken()
      if (!savedRefreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await authApi.refreshToken(savedRefreshToken)
      const { access_token } = response.data

      setToken(access_token)
      token.value = access_token

      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      await logout()
      return false
    }
  }

  /**
   * 获取用户信息
   */
  async function fetchUserProfile(): Promise<boolean> {
    try {
      const response = await authApi.getUserProfile()
      const userInfo = response.data

      setUserInfo(userInfo)
      user.value = userInfo
      permissions.value = userInfo.permissions || []
      roles.value = userInfo.role ? [userInfo.role] : []

      return true
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
      return false
    }
  }

  /**
   * 检查认证状态
   */
  async function checkAuthStatus(): Promise<boolean> {
    const savedToken = getToken()

    if (!savedToken || !isTokenValid(savedToken)) {
      clearAuthData()
      resetState()
      return false
    }

    // 如果有有效token但没有用户信息，尝试获取
    if (!user.value) {
      const success = await fetchUserProfile()
      if (!success) {
        await logout()
        return false
      }
    }

    isAuthenticated.value = true
    return true
  }

  /**
   * 验证权限
   */
  function checkPermission(permission: string): boolean {
    return permissions.value.includes(permission) || isAdmin.value
  }

  /**
   * 验证角色
   */
  function checkRole(role: string): boolean {
    return roles.value.includes(role)
  }

  /**
   * 验证多个权限（任一）
   */
  function checkAnyPermission(permissionList: string[]): boolean {
    return permissionList.some(permission => checkPermission(permission)) || isAdmin.value
  }

  /**
   * 验证多个权限（全部）
   */
  function checkAllPermissions(permissionList: string[]): boolean {
    return permissionList.every(permission => checkPermission(permission)) || isAdmin.value
  }

  /**
   * 更新用户信息
   */
  function updateUserInfo(userInfo: Partial<User>): void {
    if (user.value) {
      const updatedUser = { ...user.value, ...userInfo }
      user.value = updatedUser
      setUserInfo(updatedUser)
    }
  }

  /**
   * 重置状态
   */
  function resetState(): void {
    user.value = null
    token.value = null
    refreshToken.value = null
    isAuthenticated.value = false
    permissions.value = []
    roles.value = []
  }

  /**
   * 修改密码
   */
  async function changePassword(data: {
    old_password: string
    new_password: string
    confirm_password: string
  }): Promise<boolean> {
    try {
      isLoading.value = true
      await authApi.changePassword(data)
      ElMessage.success('密码修改成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '密码修改失败')
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 初始化
  initAuthState()

  return {
    // 状态
    user: readonly(user),
    token: readonly(token),
    refreshToken: readonly(refreshToken),
    isAuthenticated: readonly(isAuthenticated),
    permissions: readonly(permissions),
    roles: readonly(roles),
    isLoading: readonly(isLoading),

    // 计算属性
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    userProfile,
    isAdmin,

    // 方法
    login,
    logout,
    refreshTokens,
    fetchUserProfile,
    checkAuthStatus,
    checkPermission,
    checkRole,
    checkAnyPermission,
    checkAllPermissions,
    updateUserInfo,
    changePassword,
    resetState
  }
})