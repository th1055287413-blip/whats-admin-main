<template>
  <div class="user-role-assignment">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="header-content">
        <div class="header-left">
          <h1><el-icon><User /></el-icon> 后管用户角色分配</h1>
          <p>为后台管理员账号分配角色和权限</p>
        </div>
        <div class="header-right">
          <el-button @click="handleRefresh" :icon="Refresh" :loading="loading">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="用户名">
          <el-input
            v-model="filters.username"
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="filters.role_id"
            placeholder="请选择角色"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="role in allRoles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          <el-button @click="handleResetFilter" :icon="RefreshLeft">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card" shadow="hover">
      <el-table :data="users" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="用户ID" width="100" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column label="当前角色" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="role in getUserRoles(row.id)"
              :key="role.id"
              :type="role.is_system ? 'info' : 'primary'"
              size="small"
              style="margin-right: 8px"
            >
              {{ role.name }}
            </el-tag>
            <el-tag v-if="getUserRoles(row.id).length === 0" type="warning" size="small">
              未分配
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleAssignRole(row)" :icon="Edit">
              分配角色
            </el-button>
            <el-button size="small" @click="handleViewPermissions(row)" :icon="View">
              查看权限
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 分配角色对话框 -->
    <el-dialog
      v-model="roleDialogVisible"
      title="分配角色"
      width="600px"
      @close="handleRoleDialogClose"
    >
      <div v-loading="roleLoading">
        <el-alert
          title="提示"
          type="info"
          description="请为用户选择一个或多个角色"
          :closable="false"
          style="margin-bottom: 16px"
        />

        <el-form label-width="100px">
          <el-form-item label="用户名">
            <el-input :value="currentUser?.username" disabled />
          </el-form-item>
          <el-form-item label="选择角色">
            <el-checkbox-group v-model="selectedRoleIds">
              <div
                v-for="role in allRoles"
                :key="role.id"
                style="margin-bottom: 12px; display: flex; align-items: flex-start"
              >
                <el-checkbox :value="role.id" :label="role.id">
                  <div>
                    <div style="font-weight: 500">
                      {{ role.name }}
                      <el-tag v-if="role.is_system" type="info" size="small" style="margin-left: 8px">
                        系统
                      </el-tag>
                      <el-tag
                        :type="role.status === 'active' ? 'success' : 'danger'"
                        size="small"
                        style="margin-left: 8px"
                      >
                        {{ role.status === 'active' ? '启用' : '禁用' }}
                      </el-tag>
                    </div>
                    <div style="color: #999; font-size: 12px; margin-top: 4px">
                      {{ role.description }}
                    </div>
                  </div>
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRoles" :loading="roleSubmitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看权限对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="用户权限"
      width="700px"
      @close="handlePermissionDialogClose"
    >
      <div v-loading="permissionLoading">
        <el-alert
          title="提示"
          type="info"
          :description="`用户: ${currentUser?.username}`"
          :closable="false"
          style="margin-bottom: 16px"
        />

        <el-tabs v-model="activeTab">
          <el-tab-pane label="按角色" name="roles">
            <div v-for="role in userRoles" :key="role.id" class="role-section">
              <div class="role-header">
                <el-tag :type="role.is_system ? 'info' : 'primary'" size="large">
                  {{ role.name }}
                </el-tag>
                <span class="role-desc">{{ role.description }}</span>
              </div>
              <div class="role-permissions">
                <el-tag
                  v-for="permission in getRolePermissions(role.id)"
                  :key="permission.id"
                  size="small"
                  style="margin: 4px"
                >
                  {{ permission.name }}
                </el-tag>
                <el-empty
                  v-if="getRolePermissions(role.id).length === 0"
                  description="该角色暂无权限"
                  :image-size="60"
                />
              </div>
            </div>
            <el-empty
              v-if="userRoles.length === 0"
              description="用户暂无角色"
              :image-size="80"
            />
          </el-tab-pane>

          <el-tab-pane label="按模块" name="modules">
            <div v-for="module in permissionModules" :key="module.name" class="module-section">
              <div class="module-header">{{ module.label }}</div>
              <div class="module-permissions">
                <el-tag
                  v-for="permission in getModuleUserPermissions(module.name)"
                  :key="permission.id"
                  size="small"
                  style="margin: 4px"
                >
                  {{ permission.name }}
                </el-tag>
                <el-empty
                  v-if="getModuleUserPermissions(module.name).length === 0"
                  description="该模块暂无权限"
                  :image-size="60"
                />
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="全部权限" name="all">
            <div class="all-permissions">
              <el-tag
                v-for="permission in userPermissions"
                :key="permission.id"
                size="small"
                style="margin: 4px"
              >
                {{ permission.name }}
              </el-tag>
              <el-empty
                v-if="userPermissions.length === 0"
                description="用户暂无权限"
                :image-size="80"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Refresh, Search, RefreshLeft, Edit, View } from '@element-plus/icons-vue'
import { rbacApi } from '@/api/rbac'
import { adminUserApi, type AdminUser } from '@/api/admin'
import type { Role, Permission } from '@/types/rbac'

// 数据
const loading = ref(false)
const users = ref<AdminUser[]>([])
const allRoles = ref<Role[]>([])
const userRolesMap = ref<Map<number, Role[]>>(new Map())
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 筛选
const filters = reactive({
  username: '',
  role_id: undefined as number | undefined
})

// 角色分配对话框
const roleDialogVisible = ref(false)
const roleLoading = ref(false)
const roleSubmitting = ref(false)
const currentUser = ref<AdminUser | null>(null)
const selectedRoleIds = ref<number[]>([])

// 权限查看对话框
const permissionDialogVisible = ref(false)
const permissionLoading = ref(false)
const activeTab = ref('roles')
const userRoles = ref<Role[]>([])
const userPermissions = ref<Permission[]>([])
const rolePermissionsMap = ref<Map<number, Permission[]>>(new Map())

// 权限模块（需与数据库中的module字段保持一致）
const permissionModules = [
  { name: 'user_management', label: '用户管理' },
  { name: 'permission_management', label: '权限管理' },
  { name: 'message_monitor', label: '消息监控' },
  { name: 'file_monitor', label: '文件监控' },
  { name: 'contact_monitor', label: '联系人监控' },
  { name: 'interception_management', label: '拦截管理' },
  { name: 'system_config', label: '系统配置' },
  { name: 'log_management', label: '日志管理' }
]

// 方法
const loadUsers = async () => {
  loading.value = true
  try {
    const res = await adminUserApi.getList({
      page: pagination.page,
      limit: pagination.limit,
      keyword: filters.username
    })
    // 后管用户API返回格式: { list, total, page, limit }
    users.value = res.list || []
    pagination.total = res.total || 0

    // 加载每个用户的角色
    if (users.value.length > 0) {
      await Promise.all(users.value.map((user) => loadUserRoles(user.id)))
    }
  } catch (error: any) {
    console.error('加载管理员列表失败:', error)
    ElMessage.error(error.message || '加载管理员列表失败')
  } finally {
    loading.value = false
  }
}

const loadAllRoles = async () => {
  try {
    const res = await rbacApi.getRoleList({ limit: 100 }) as any
    allRoles.value = res.data?.list || res.list || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载角色列表失败')
  }
}

const loadUserRoles = async (userId: number) => {
  try {
    const res = await rbacApi.getAdminRoles(userId) as any
    userRolesMap.value.set(userId, res.data || res || [])
  } catch (error: any) {
    console.error(`加载用户 ${userId} 角色失败:`, error)
  }
}

const getUserRoles = (userId: number): Role[] => {
  return userRolesMap.value.get(userId) || []
}

const handleRefresh = () => {
  loadUsers()
}

const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const handleResetFilter = () => {
  filters.username = ''
  filters.role_id = undefined
  handleSearch()
}

const handleSizeChange = () => {
  loadUsers()
}

const handleCurrentChange = () => {
  loadUsers()
}

const handleAssignRole = async (user: AdminUser) => {
  currentUser.value = user
  roleDialogVisible.value = true
  roleLoading.value = true

  try {
    const res = await rbacApi.getAdminRoles(user.id) as any
    const roles = res.data || res || []
    selectedRoleIds.value = roles.map((role: Role) => role.id)
  } catch (error: any) {
    ElMessage.error(error.message || '加载用户角色失败')
  } finally {
    roleLoading.value = false
  }
}

const handleSubmitRoles = async () => {
  if (!currentUser.value) return

  roleSubmitting.value = true
  try {
    await rbacApi.assignRolesToAdmin(currentUser.value.id, {
      role_ids: selectedRoleIds.value,
      is_primary: true
    })
    ElMessage.success('角色分配成功')
    roleDialogVisible.value = false
    await loadUserRoles(currentUser.value.id)
  } catch (error: any) {
    ElMessage.error(error.message || '角色分配失败')
  } finally {
    roleSubmitting.value = false
  }
}

const handleRoleDialogClose = () => {
  currentUser.value = null
  selectedRoleIds.value = []
}

const handleViewPermissions = async (user: AdminUser) => {
  currentUser.value = user
  permissionDialogVisible.value = true
  permissionLoading.value = true

  try {
    // 加载用户角色和权限
    const [rolesRes, permsRes] = await Promise.all([
      rbacApi.getAdminRoles(user.id),
      rbacApi.getAdminPermissions(user.id)
    ])

    userRoles.value = (rolesRes as any).data || rolesRes || []
    userPermissions.value = (permsRes as any).data || permsRes || []

    // 加载每个角色的权限
    await Promise.all(
      userRoles.value.map(async (role) => {
        const res = await rbacApi.getRolePermissions(role.id) as any
        rolePermissionsMap.value.set(role.id, res.data || res || [])
      })
    )
  } catch (error: any) {
    ElMessage.error(error.message || '加载用户权限失败')
  } finally {
    permissionLoading.value = false
  }
}

const getRolePermissions = (roleId: number): Permission[] => {
  return rolePermissionsMap.value.get(roleId) || []
}

const getModuleUserPermissions = (module: string): Permission[] => {
  return userPermissions.value.filter((p) => p.module === module)
}

const handlePermissionDialogClose = () => {
  currentUser.value = null
  userRoles.value = []
  userPermissions.value = []
  rolePermissionsMap.value.clear()
  activeTab.value = 'roles'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadUsers()
  loadAllRoles()
})
</script>

<style scoped lang="scss">
.user-role-assignment {
  padding: 20px;

  .header-card {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      }

      .header-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .role-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .role-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;

      .role-desc {
        color: #666;
        font-size: 14px;
      }
    }

    .role-permissions {
      padding-left: 12px;
    }
  }

  .module-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .module-header {
      font-weight: 600;
      font-size: 14px;
      padding: 8px 12px;
      background-color: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .module-permissions {
      padding-left: 12px;
    }
  }

  .all-permissions {
    padding: 12px;
  }
}
</style>
