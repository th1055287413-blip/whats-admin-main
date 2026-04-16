import CryptoJS from 'crypto-js'
import type { User } from '@/types/auth'

// 加密密钥
const SECRET_KEY = 'whatsapp-manage-secret-key'

// Token存储键名
const TOKEN_KEY = 'whatsapp_token'
const REFRESH_TOKEN_KEY = 'whatsapp_refresh_token'
const USER_KEY = 'whatsapp_user'
const REMEMBER_KEY = 'whatsapp_remember'

/**
 * 加密数据
 */
export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString()
}

/**
 * 解密数据
 */
export function decrypt(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

/**
 * 获取存储对象（localStorage 或 sessionStorage）
 */
function getStorage(): Storage {
  const remember = localStorage.getItem(REMEMBER_KEY)
  return remember === 'true' ? localStorage : sessionStorage
}

/**
 * 获取存储的token，优先从当前存储位置，然后尝试另一个存储位置
 */
function getStoredValue(key: string): string | null {
  const primaryStorage = getStorage()
  const secondaryStorage = primaryStorage === localStorage ? sessionStorage : localStorage

  return primaryStorage.getItem(key) || secondaryStorage.getItem(key)
}

/**
 * 设置Token
 */
export function setToken(token: string): void {
  const storage = getStorage()
  storage.setItem(TOKEN_KEY, encrypt(token))
}

/**
 * 获取Token
 */
export function getToken(): string | null {
  try {
    const encryptedToken = getStoredValue(TOKEN_KEY)
    if (!encryptedToken) return null
    return decrypt(encryptedToken)
  } catch {
    removeToken()
    return null
  }
}

/**
 * 移除Token
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

/**
 * 设置刷新Token
 */
export function setRefreshToken(refreshToken: string): void {
  const storage = getStorage()
  storage.setItem(REFRESH_TOKEN_KEY, encrypt(refreshToken))
}

/**
 * 获取刷新Token
 */
export function getRefreshToken(): string | null {
  try {
    const encryptedToken = getStoredValue(REFRESH_TOKEN_KEY)
    if (!encryptedToken) return null
    return decrypt(encryptedToken)
  } catch {
    removeRefreshToken()
    return null
  }
}

/**
 * 移除刷新Token
 */
export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

/**
 * 设置用户信息
 */
export function setUserInfo(user: User): void {
  const storage = getStorage()
  storage.setItem(USER_KEY, encrypt(JSON.stringify(user)))
}

/**
 * 获取用户信息
 */
export function getUserInfo(): User | null {
  try {
    const encryptedUser = getStoredValue(USER_KEY)
    if (!encryptedUser) return null
    const userStr = decrypt(encryptedUser)
    return JSON.parse(userStr)
  } catch {
    removeUserInfo()
    return null
  }
}

/**
 * 移除用户信息
 */
export function removeUserInfo(): void {
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(USER_KEY)
}

/**
 * 设置记住登录状态
 */
export function setRememberMe(remember: boolean): void {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, 'true')
  } else {
    localStorage.removeItem(REMEMBER_KEY)
  }
}

/**
 * 获取记住登录状态
 */
export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === 'true'
}

/**
 * 清除所有认证信息
 */
export function clearAuthData(): void {
  removeToken()
  removeRefreshToken()
  removeUserInfo()
  localStorage.removeItem(REMEMBER_KEY)
}

/**
 * 检查Token是否有效
 */
export function isTokenValid(token?: string): boolean {
  const currentToken = token || getToken()
  if (!currentToken) return false

  try {
    // 解析JWT token
    const payload = JSON.parse(atob(currentToken.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)

    // 检查是否过期
    return payload.exp > currentTime
  } catch {
    return false
  }
}

/**
 * 获取Token过期时间
 */
export function getTokenExpiration(token?: string): number | null {
  const currentToken = token || getToken()
  if (!currentToken) return null

  try {
    const payload = JSON.parse(atob(currentToken.split('.')[1]))
    return payload.exp * 1000 // 转换为毫秒
  } catch {
    return null
  }
}

/**
 * 检查Token是否即将过期（5分钟内）
 */
export function isTokenExpiringSoon(token?: string): boolean {
  const expiration = getTokenExpiration(token)
  if (!expiration) return true

  const fiveMinutes = 5 * 60 * 1000
  return Date.now() + fiveMinutes >= expiration
}

/**
 * 格式化请求头
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  if (!token) return {}

  return {
    'Authorization': `Bearer ${token}`
  }
}

/**
 * 生成随机字符串（用于验证码等）
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('密码长度至少8位')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含小写字母')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含大写字母')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含数字')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('需要包含特殊字符')
  }

  return { score, feedback }
}