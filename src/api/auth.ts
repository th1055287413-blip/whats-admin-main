import { request } from './index'
import type { LoginForm, LoginResponse, User, RefreshTokenResponse } from '@/types/auth'
import type { ApiResponse } from '@/types/api'

/**
 * 认证相关API
 */
export const authApi = {
  /**
   * 用户登录
   */
  login(data: LoginForm): Promise<ApiResponse<LoginResponse>> {
    return request.post<LoginResponse>('/auth/login', data)
  },

  /**
   * 用户登出
   */
  logout(): Promise<ApiResponse> {
    return request.post('/auth/logout')
  },

  /**
   * 刷新Token
   */
  refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponse>> {
    return request.post<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken
    })
  },

  /**
   * 获取用户信息
   */
  getUserProfile(): Promise<ApiResponse<User>> {
    return request.get<User>('/auth/profile')
  },

  /**
   * 获取验证码
   */
  getCaptcha(): Promise<ApiResponse<{ image: string; key: string }>> {
    return request.get<{ image: string; key: string }>('/auth/captcha')
  },

  /**
   * 修改密码
   */
  changePassword(data: {
    old_password: string
    new_password: string
    confirm_password: string
  }): Promise<ApiResponse> {
    return request.post('/auth/change-password', data)
  },

  /**
   * 重置密码 - 发送验证码
   */
  sendResetCode(email: string): Promise<ApiResponse> {
    return request.post('/auth/send-reset-code', { email })
  },

  /**
   * 重置密码 - 验证码确认
   */
  resetPassword(data: {
    email: string
    code: string
    new_password: string
    confirm_password: string
  }): Promise<ApiResponse> {
    return request.post('/auth/reset-password', data)
  },

  /**
   * 验证Token有效性
   */
  verifyToken(): Promise<ApiResponse<{ valid: boolean; user: User }>> {
    return request.get<{ valid: boolean; user: User }>('/auth/verify')
  }
}