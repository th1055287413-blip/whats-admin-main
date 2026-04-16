import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken } from '@/utils/auth'

// Response data format
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// Create axios instance
const request: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000, // 30秒超时,用于处理删除等耗时操作
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add auth token
    const token = getToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
request.interceptors.response.use(
  (response: AxiosResponse<any>) => {
    const responseData = response.data

    // Handle new backend format with "success" field
    if (responseData && typeof responseData === 'object') {
      // New format: { success: true, message: "...", data: {...} }
      if (responseData.hasOwnProperty('success')) {
        if (responseData.success === true) {
          return Promise.resolve({
            ...response,
            data: responseData.data
          })
        } else {
          // Business error with success: false
          ElMessage.error(responseData.message || '请求失败')
          return Promise.reject(new Error(responseData.message || 'API Error'))
        }
      }

      // Legacy format: { code: 200, message: "...", data: {...} }
      const { code, message } = responseData
      if (code === 200 || code === 0) {
        // 返回完整的响应数据,保留 code, message, data
        return Promise.resolve(responseData)
      }

      // Business error with code format
      ElMessage.error(message || '请求失败')
      return Promise.reject(new Error(message || 'API Error'))
    }

    // Direct data response (fallback)
    return Promise.resolve(response)
  },
  (error) => {
    const { response } = error

    if (response) {
      const { status, data } = response

      switch (status) {
        case 401:
          ElMessageBox.confirm('登录已过期，请重新登录', '提示', {
            confirmButtonText: '重新登录',
            cancelButtonText: '取消',
            type: 'warning'
          }).then(() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          })
          break

        case 403:
          ElMessage.error('权限不足')
          break

        case 404:
          ElMessage.error('请求的资源不存在')
          break

        case 429:
          ElMessage({
            type: 'warning',
            duration: 6000,
            message: data?.message || 'API 请求过于频繁，请稍后再试',
            showClose: true
          })
          break

        case 500:
          ElMessage.error(data?.message || '服务器内部错误')
          break

        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请重试')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }

    return Promise.reject(error)
  }
)

// Request methods
export const api = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.get(url, config).then(res => res.data)
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.post(url, data, config).then(res => res.data)
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.put(url, data, config).then(res => res.data)
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return request.delete(url, config).then(res => res.data)
  },

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return request.patch(url, data, config).then(res => res.data)
  }
}

export { request }
export default request