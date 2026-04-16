import { request } from './index'
import type { ApiResponse } from '@/types/api'
import type {
  Role,
  Permission,
  RoleWithPermissions,
  PermissionChangeLog,
  PermissionDenyLog,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionsToRoleRequest,
  AssignRolesToUserRequest,
  RoleListParams,
  PermissionListParams,
  PermissionChangeLogParams,
  PermissionDenyLogParams,
  RBACPaginationResponse,
  CheckPermissionParams,
  CheckPermissionResponse
} from '@/types/rbac'

/**
 * RBAC权限管理相关API
 */
export const rbacApi = {
  // ========== 角色管理 ==========

  /**
   * 获取角色列表
   */
  getRoleList(params?: RoleListParams): Promise<ApiResponse<RBACPaginationResponse<Role>>> {
    return request.get<RBACPaginationResponse<Role>>('/rbac/roles', { params })
  },

  /**
   * 获取角色列表（别名方法）
   */
  getRoles(params?: RoleListParams): Promise<ApiResponse<RBACPaginationResponse<Role>>> {
    return this.getRoleList(params)
  },

  /**
   * 创建角色
   */
  createRole(data: CreateRoleRequest): Promise<ApiResponse<Role>> {
    return request.post<Role>('/rbac/roles', data)
  },

  /**
   * 获取角色详情
   */
  getRole(id: number): Promise<ApiResponse<Role>> {
    return request.get<Role>(`/rbac/roles/${id}`)
  },

  /**
   * 更新角色
   */
  updateRole(id: number, data: UpdateRoleRequest): Promise<ApiResponse> {
    return request.put(`/rbac/roles/${id}`, data)
  },

  /**
   * 删除角色
   */
  deleteRole(id: number): Promise<ApiResponse> {
    return request.delete(`/rbac/roles/${id}`)
  },

  /**
   * 获取角色的所有权限
   */
  getRolePermissions(id: number): Promise<ApiResponse<Permission[]>> {
    return request.get<Permission[]>(`/rbac/roles/${id}/permissions`)
  },

  /**
   * 获取角色及其权限
   */
  getRoleWithPermissions(id: number): Promise<ApiResponse<RoleWithPermissions>> {
    return request.get<RoleWithPermissions>(`/rbac/roles/${id}/with-permissions`)
  },

  /**
   * 为角色分配权限
   */
  assignPermissionsToRole(
    id: number,
    data: AssignPermissionsToRoleRequest
  ): Promise<ApiResponse> {
    return request.post(`/rbac/roles/${id}/permissions`, data)
  },

  // ========== 权限管理 ==========

  /**
   * 获取权限列表
   */
  getPermissionList(
    params?: PermissionListParams
  ): Promise<ApiResponse<RBACPaginationResponse<Permission>>> {
    return request.get<RBACPaginationResponse<Permission>>('/rbac/permissions', { params })
  },

  /**
   * 获取所有权限
   */
  getAllPermissions(): Promise<ApiResponse<Permission[]>> {
    return request.get<Permission[]>('/rbac/permissions/all')
  },

  /**
   * 按模块获取权限
   */
  getPermissionsByModule(module: string): Promise<ApiResponse<Permission[]>> {
    return request.get<Permission[]>(`/rbac/permissions/module/${module}`)
  },

  // ========== 管理員角色管理 ==========

  /**
   * 获取管理員的所有角色
   */
  getAdminRoles(adminId: number): Promise<ApiResponse<Role[]>> {
    return request.get<Role[]>(`/rbac/admins/${adminId}/roles`)
  },

  /**
   * 获取管理員的所有权限
   */
  getAdminPermissions(adminId: number): Promise<ApiResponse<Permission[]>> {
    return request.get<Permission[]>(`/rbac/admins/${adminId}/permissions`)
  },

  /**
   * 为管理員分配角色
   */
  assignRolesToAdmin(adminId: number, data: AssignRolesToUserRequest): Promise<ApiResponse> {
    return request.post(`/rbac/admins/${adminId}/roles`, data)
  },

  /**
   * 检查管理員权限
   */
  checkAdminPermission(
    adminId: number,
    params: CheckPermissionParams
  ): Promise<ApiResponse<CheckPermissionResponse>> {
    return request.get<CheckPermissionResponse>(`/rbac/admins/${adminId}/check-permission`, {
      params
    })
  },

  // ========== 日志管理 ==========

  /**
   * 获取权限变更日志
   */
  getPermissionChangeLogs(
    params?: PermissionChangeLogParams
  ): Promise<ApiResponse<RBACPaginationResponse<PermissionChangeLog>>> {
    return request.get<RBACPaginationResponse<PermissionChangeLog>>(
      '/rbac/logs/permission-changes',
      { params }
    )
  },

  /**
   * 获取权限拒绝日志
   */
  getPermissionDenyLogs(
    params?: PermissionDenyLogParams
  ): Promise<ApiResponse<RBACPaginationResponse<PermissionDenyLog>>> {
    return request.get<RBACPaginationResponse<PermissionDenyLog>>(
      '/rbac/logs/permission-denies',
      { params }
    )
  }
}
