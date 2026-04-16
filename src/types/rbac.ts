/**
 * RBAC权限管理相关类型定义
 */

/**
 * 角色
 */
export interface Role {
  id: number
  name: string
  code: string
  description: string
  is_system: boolean
  status: 'active' | 'disabled'
  created_at: string
  updated_at: string
  deleted_at?: string
  user_count?: number
}

/**
 * 权限
 */
export interface Permission {
  id: number
  name: string
  code: string
  resource: string
  action: string
  description: string
  module: string
  created_at: string
  updated_at: string
}

/**
 * 角色权限关联
 */
export interface RolePermission {
  id: number
  role_id: number
  permission_id: number
  created_at: string
}

/**
 * 用户角色关联
 */
export interface UserRole {
  id: number
  user_id: number
  role_id: number
  is_primary: boolean
  data_scope?: string
  created_at: string
  updated_at: string
}

/**
 * 数据权限范围配置
 */
export interface DataScopeConfig {
  type: 'all' | 'custom' | 'dept' | 'self'
  countries?: string[]
  tags?: number[]
  expression?: string
}

/**
 * 权限变更日志
 */
export interface PermissionChangeLog {
  id: number
  change_type: string
  operator_id: number
  target_id: number
  before_value?: string
  after_value?: string
  reason?: string
  ip_address?: string
  created_at: string
}

/**
 * 权限拒绝日志
 */
export interface PermissionDenyLog {
  id: number
  user_id: number
  resource: string
  action: string
  reason?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

/**
 * 角色及其权限
 */
export interface RoleWithPermissions extends Role {
  permissions?: Permission[]
  permission_ids?: number[]
}

/**
 * 用户及其角色
 */
export interface UserWithRoles {
  user_id: number
  username: string
  roles: Role[]
  data_scope?: DataScopeConfig
}

/**
 * 创建角色请求
 */
export interface CreateRoleRequest {
  name: string
  description?: string
  status?: 'active' | 'disabled'
}

/**
 * 更新角色请求
 */
export interface UpdateRoleRequest {
  name?: string
  description?: string
  status?: 'active' | 'disabled'
}

/**
 * 分配权限到角色请求
 */
export interface AssignPermissionsToRoleRequest {
  permission_ids: number[]
}

/**
 * 分配角色到用户请求
 */
export interface AssignRolesToUserRequest {
  role_ids: number[]
  is_primary?: boolean
}

/**
 * 角色列表查询参数
 */
export interface RoleListParams {
  page?: number
  limit?: number
  status?: 'active' | 'disabled'
  is_system?: boolean
  keyword?: string
}

/**
 * 权限列表查询参数
 */
export interface PermissionListParams {
  page?: number
  limit?: number
  module?: string
  resource?: string
  keyword?: string
}

/**
 * 权限变更日志查询参数
 */
export interface PermissionChangeLogParams {
  page?: number
  limit?: number
  change_type?: string
  operator_id?: number
}

/**
 * 权限拒绝日志查询参数
 */
export interface PermissionDenyLogParams {
  page?: number
  limit?: number
  user_id?: number
  resource?: string
}

/**
 * 分页响应
 */
export interface RBACPaginationResponse<T> {
  list: T[]
  total: number
  page: number
  limit: number
}

/**
 * 权限检查请求
 */
export interface CheckPermissionParams {
  resource: string
  action: string
}

/**
 * 权限检查响应
 */
export interface CheckPermissionResponse {
  has_permission: boolean
  resource: string
  action: string
}
