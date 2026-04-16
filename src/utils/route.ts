/**
 * 路由工具函数
 */

/**
 * 获取管理后台路径前缀
 * @returns 路径前缀,默认为 /admin
 */
export function getAdminPrefix(): string {
  const prefix = import.meta.env.VITE_ADMIN_PREFIX || '/admin'
  // 确保前缀以 / 开头但不以 / 结尾
  return prefix.startsWith('/') ? prefix.replace(/\/$/, '') : `/${prefix}`.replace(/\/$/, '')
}

/**
 * 添加管理后台前缀到路径
 * @param path 原始路径
 * @returns 添加前缀后的完整路径
 */
export function withAdminPrefix(path: string): string {
  const prefix = getAdminPrefix()
  // 处理根路径
  if (path === '/' || path === '') {
    return prefix
  }
  // 确保路径以 / 开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${prefix}${normalizedPath}`
}

/**
 * 从完整路径中移除管理后台前缀
 * @param fullPath 完整路径
 * @returns 移除前缀后的路径
 */
export function removeAdminPrefix(fullPath: string): string {
  const prefix = getAdminPrefix()
  if (fullPath.startsWith(prefix)) {
    const path = fullPath.slice(prefix.length)
    return path || '/'
  }
  return fullPath
}
