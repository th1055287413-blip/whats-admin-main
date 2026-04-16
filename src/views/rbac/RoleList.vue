<template>
  <div class="role-list">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="header-content">
        <div class="header-left">
          <h1><el-icon><Lock /></el-icon> 角色管理</h1>
          <p>管理系统角色和权限分配</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="handleCreateRole" :icon="Plus">
            创建角色
          </el-button>
          <el-button @click="handleRefresh" :icon="Refresh" :loading="loading">
            刷新
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="角色名称">
          <el-input
            v-model="filters.keyword"
            placeholder="请输入角色名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="系统角色">
          <el-select
            v-model="filters.is_system"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          <el-button @click="handleResetFilter" :icon="RefreshLeft">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 角色列表 -->
    <el-card class="table-card" shadow="hover">
      <el-table
        :data="roles"
        v-loading="loading"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="150">
          <template #default="{ row }">
            <el-tag v-if="row.is_system" type="info" size="small" style="margin-right: 8px">
              系统
            </el-tag>
            {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="user_count" label="用户数" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewPermissions(row)" :icon="View">
              查看权限
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="handleEditRole(row)"
              :icon="Edit"
              :disabled="row.is_system"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDeleteRole(row)"
              :icon="Delete"
              :disabled="row.is_system"
            >
              删除
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

    <!-- 创建/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleFormRules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="roleForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRole" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限分配对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="角色权限"
      width="800px"
      @close="handlePermissionDialogClose"
    >
      <div v-loading="permissionLoading">
        <el-alert
          title="提示"
          type="info"
          description="请选择该角色拥有的权限"
          :closable="false"
          style="margin-bottom: 16px"
        />

        <div class="permission-modules">
          <div
            v-for="module in permissionModules"
            :key="module.name"
            class="permission-module"
          >
            <div class="module-header">
              <el-checkbox
                :model-value="isModuleAllSelected(module.name)"
                :indeterminate="isModuleIndeterminate(module.name)"
                @change="handleModuleCheckChange(module.name, $event)"
              >
                {{ module.label }}
              </el-checkbox>
            </div>
            <div class="module-permissions">
              <el-checkbox-group v-model="selectedPermissions">
                <el-checkbox
                  v-for="permission in getModulePermissions(module.name)"
                  :key="permission.id"
                  :value="permission.id"
                  :label="permission.id"
                >
                  {{ permission.name }}
                  <span class="permission-desc">{{ permission.description }}</span>
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmitPermissions"
          :loading="permissionSubmitting"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Plus,
  Refresh,
  Search,
  RefreshLeft,
  Edit,
  Delete,
  View,
  Lock
} from '@element-plus/icons-vue'
import { rbacApi } from '@/api/rbac'
import type {
  Role,
  Permission,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleListParams
} from '@/types/rbac'

// 数据
const loading = ref(false)
const roles = ref<Role[]>([])
const selectedRoles = ref<Role[]>([])
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 筛选
const filters = reactive<RoleListParams>({
  keyword: '',
  status: 'active', // 默认只显示启用的角色
  is_system: undefined
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = computed(() => (isEditing.value ? '编辑角色' : '创建角色'))
const isEditing = ref(false)
const submitting = ref(false)
const roleFormRef = ref<FormInstance>()
const roleForm = reactive<CreateRoleRequest & { id?: number }>({
  name: '',
  description: '',
  status: 'active'
})

// 表单验证规则
const roleFormRules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 权限管理
const permissionDialogVisible = ref(false)
const permissionLoading = ref(false)
const permissionSubmitting = ref(false)
const currentRole = ref<Role | null>(null)
const allPermissions = ref<Permission[]>([])
const selectedPermissions = ref<number[]>([])

// 模块显示名称映射（可选，用于友好显示）
const moduleLabels: Record<string, string> = {
  dashboard: 'Dashboard & Analytics',
  analytics: '数据分析',
  admin_user_management: '后管用户管理',
  permission_management: '角色权限管理',
  user_management: '用户管理',
  message: '消息与账号管理',
  tag_management: '标签管理',
  channel_management: '渠道管理',
  content_moderation: '内容审核',
  batch_send: '批量发送',
  promotion_domain: '推广域名',
  proxy_management: '代理管理',
  system: '系统管理',
  content: '内容管理',
  ai_tag_management: 'AI标签管理'
}

// 权限模块（从API返回的权限列表中动态生成）
const permissionModules = computed(() => {
  const moduleSet = new Set<string>()
  const modules: { name: string; label: string }[] = []

  for (const permission of allPermissions.value) {
    if (permission.module && !moduleSet.has(permission.module)) {
      moduleSet.add(permission.module)
      modules.push({
        name: permission.module,
        label: moduleLabels[permission.module] || permission.module
      })
    }
  }

  return modules
})

// 方法
const loadRoles = async () => {
  loading.value = true
  try {
    const params: RoleListParams = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters
    }
    const res = await rbacApi.getRoleList(params)
    roles.value = res.data.list
    pagination.total = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '加载角色列表失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadRoles()
}

const handleSearch = () => {
  pagination.page = 1
  loadRoles()
}

const handleResetFilter = () => {
  filters.keyword = ''
  filters.status = 'active' // 重置为默认值：只显示启用的角色
  filters.is_system = undefined
  handleSearch()
}

const handleSizeChange = () => {
  loadRoles()
}

const handleCurrentChange = () => {
  loadRoles()
}

const handleSelectionChange = (selection: Role[]) => {
  selectedRoles.value = selection
}

const handleCreateRole = () => {
  isEditing.value = false
  resetRoleForm()
  dialogVisible.value = true
}

const handleEditRole = (role: Role) => {
  isEditing.value = true
  roleForm.id = role.id
  roleForm.name = role.name
  roleForm.description = role.description
  roleForm.status = role.status
  dialogVisible.value = true
}

const handleDeleteRole = async (role: Role) => {
  try {
    await ElMessageBox.confirm(`确定要删除角色"${role.name}"吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await rbacApi.deleteRole(role.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleSubmitRole = async () => {
  if (!roleFormRef.value) return

  await roleFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (isEditing.value && roleForm.id) {
        const data: UpdateRoleRequest = {
          name: roleForm.name,
          description: roleForm.description,
          status: roleForm.status
        }
        await rbacApi.updateRole(roleForm.id, data)
        ElMessage.success('更新成功')
      } else {
        const data: CreateRoleRequest = {
          name: roleForm.name,
          description: roleForm.description,
          status: roleForm.status
        }
        await rbacApi.createRole(data)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadRoles()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleDialogClose = () => {
  roleFormRef.value?.resetFields()
  resetRoleForm()
}

const resetRoleForm = () => {
  roleForm.id = undefined
  roleForm.name = ''
  roleForm.description = ''
  roleForm.status = 'active'
}

// 权限管理相关方法
const handleViewPermissions = async (role: Role) => {
  currentRole.value = role
  permissionDialogVisible.value = true
  await loadAllPermissions()
  await loadRolePermissions(role.id)
}

const loadAllPermissions = async () => {
  permissionLoading.value = true
  try {
    const res = await rbacApi.getAllPermissions()
    allPermissions.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '加载权限列表失败')
  } finally {
    permissionLoading.value = false
  }
}

const loadRolePermissions = async (roleId: number) => {
  try {
    const res = await rbacApi.getRolePermissions(roleId)
    selectedPermissions.value = res.data.map((p) => p.id)
  } catch (error: any) {
    ElMessage.error(error.message || '加载角色权限失败')
  }
}

const getModulePermissions = (module: string) => {
  return allPermissions.value.filter((p) => p.module === module)
}

const isModuleAllSelected = (module: string) => {
  const modulePerms = getModulePermissions(module)
  if (modulePerms.length === 0) return false
  return modulePerms.every((p) => selectedPermissions.value.includes(p.id))
}

const isModuleIndeterminate = (module: string) => {
  const modulePerms = getModulePermissions(module)
  if (modulePerms.length === 0) return false
  const selectedCount = modulePerms.filter((p) =>
    selectedPermissions.value.includes(p.id)
  ).length
  return selectedCount > 0 && selectedCount < modulePerms.length
}

const handleModuleCheckChange = (module: string, checked: boolean) => {
  const modulePerms = getModulePermissions(module)
  const modulePermIds = modulePerms.map((p) => p.id)

  if (checked) {
    // 添加模块所有权限
    modulePermIds.forEach((id) => {
      if (!selectedPermissions.value.includes(id)) {
        selectedPermissions.value.push(id)
      }
    })
  } else {
    // 移除模块所有权限
    selectedPermissions.value = selectedPermissions.value.filter(
      (id) => !modulePermIds.includes(id)
    )
  }
}

const handleSubmitPermissions = async () => {
  if (!currentRole.value) return

  permissionSubmitting.value = true
  try {
    await rbacApi.assignPermissionsToRole(currentRole.value.id, {
      permission_ids: selectedPermissions.value
    })
    ElMessage.success('权限分配成功')
    permissionDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '权限分配失败')
  } finally {
    permissionSubmitting.value = false
  }
}

const handlePermissionDialogClose = () => {
  currentRole.value = null
  selectedPermissions.value = []
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadRoles()
})
</script>

<style scoped lang="scss">
.role-list {
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

  .permission-modules {
    max-height: 500px;
    overflow-y: auto;

    .permission-module {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .module-header {
        padding: 12px;
        background-color: #f5f7fa;
        border-radius: 4px;
        margin-bottom: 12px;
        font-weight: 600;
      }

      .module-permissions {
        padding-left: 24px;

        :deep(.el-checkbox-group) {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        :deep(.el-checkbox) {
          margin-right: 0;
          height: auto;
          align-items: flex-start;

          .el-checkbox__label {
            white-space: normal;
            line-height: 1.5;
          }
        }

        .permission-desc {
          color: #999;
          font-size: 12px;
          margin-left: 8px;
        }
      }
    }
  }
}
</style>
