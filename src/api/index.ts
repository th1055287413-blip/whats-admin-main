import axios, { type AxiosInstance, type AxiosResponse, type AxiosError } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { ApiResponse, ErrorResponse } from '@/types/api'
import { getToken, getRefreshToken, setToken, clearAuthData, isTokenExpiringSoon } from '@/utils/auth'

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  async (config) => {
    // 添加认证token
    const token = getToken()
    console.log('Request interceptor - token:', token ? 'EXISTS' : 'NULL')
    console.log('Request interceptor - URL:', config.url)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('Request interceptor - Authorization header set')

      // 检查token是否即将过期，如果是则尝试刷新
      if (isTokenExpiringSoon(token)) {
        try {
          await refreshToken()
          // 重新获取新token
          const newToken = getToken()
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`
          }
        } catch (error) {
          console.warn('Token refresh failed:', error)
        }
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // API返回格式检查
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code === 0) {
        return response
      } else {
        // 业务错误
        const message = data.message || '请求失败'
        ElMessage.error(message)
        return Promise.reject(new Error(message))
      }
    }

    return response
  },
  async (error: AxiosError<ErrorResponse>) => {
    const { response, message } = error

    if (response) {
      const { status, data } = response

      switch (status) {
        case 401:
          // 未授权，尝试刷新token
          if (data?.message?.includes('token expired') || data?.message?.includes('token invalid')) {
            try {
              await refreshToken()
              // 重试原始请求
              return api.request(error.config!)
            } catch (refreshError) {
              // 刷新失败，跳转登录
              await handleLogout()
              return Promise.reject(refreshError)
            }
          } else {
            ElMessage.error('登录已过期，请重新登录')
            await handleLogout()
          }
          break

        case 403:
          ElMessage.error('权限不足，无法访问')
          break

        case 404:
          ElMessage.error('请求的资源不存在')
          break

        case 422:
          // 表单验证错误
          if (data?.details && typeof data.details === 'object') {
            const errors = Object.values(data.details).flat()
            ElMessage.error(errors.join(', '))
          } else {
            ElMessage.error(data?.message || '请求参数错误')
          }
          break

        case 500:
          ElMessage.error('服务器内部错误')
          break

        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else {
      // 网络错误
      if (message.includes('timeout')) {
        ElMessage.error('请求超时，请稍后重试')
      } else if (message.includes('Network Error')) {
        ElMessage.error('网络连接失败，请检查网络')
      } else {
        ElMessage.error('请求失败，请稍后重试')
      }
    }

    return Promise.reject(error)
  }
)

/**
 * 刷新Token
 */
async function refreshToken(): Promise<void> {
  const refreshTokenValue = getRefreshToken()
  if (!refreshTokenValue) {
    throw new Error('No refresh token available')
  }

  try {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshTokenValue
    })

    const { access_token } = response.data.data
    setToken(access_token)
  } catch (error) {
    clearAuthData()
    throw error
  }
}

/**
 * 处理登出
 */
async function handleLogout(): Promise<void> {
  clearAuthData()

  // 确认对话框
  try {
    await ElMessageBox.confirm(
      '登录状态已失效，需要重新登录',
      '提示',
      {
        confirmButtonText: '重新登录',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 跳转到登录页
    window.location.href = '/login'
  } catch {
    // 用户取消，仍然跳转到登录页
    window.location.href = '/login'
  }
}

/**
 * 通用请求方法
 */
export const request = {
  get: <T = any>(url: string, params?: any): Promise<ApiResponse<T>> =>
    api.get(url, { params }).then(res => res.data),

  post: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.post(url, data).then(res => res.data),

  put: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.put(url, data).then(res => res.data),

  delete: <T = any>(url: string): Promise<ApiResponse<T>> =>
    api.delete(url).then(res => res.data),

  patch: <T = any>(url: string, data?: any): Promise<ApiResponse<T>> =>
    api.patch(url, data).then(res => res.data)
}

export default api