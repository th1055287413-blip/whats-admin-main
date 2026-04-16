<template>
  <div class="admin-user-management">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="header-content">
        <div class="header-left">
          <h1><el-icon><User /></el-icon> 后管用户管理</h1>
          <p>管理后台管理系统的管理员账号</p>
        </div>
        <div class="header-right">
          <el-button
            v-if="hasPermission(['admin_user.create'])"
            type="primary"
            @click="handleCreate"
            :icon="Plus"
          >
            新建管理员
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
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="用户名"
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
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select
            v-model="filters.channel_id"
            placeholder="请选择渠道"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="channel in availableChannels"
              :key="channel.id"
              :label="channel.channel_name"
              :value="channel.id"
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
      <el-table :data="adminUsers" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column label="角色" min-width="150">
          <template #default="{ row }">
            <el-tag
              v-for="role in (row.roles || [])"
              :key="role.id"
              size="small"
              style="margin-right: 4px"
            >
              {{ role.display_name || role.name }}
            </el-tag>
            <span v-if="!row.roles || row.roles.length === 0" style="color: #999">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="所属渠道" min-width="120">
          <template #default="{ row }">
            <el-tag v-if="row.channel_name" type="info" size="small">
              {{ row.channel_name }}
            </el-tag>
            <span v-else style="color: #999">未分配</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.last_login_at ? formatDate(row.last_login_at) : '从未登录' }}
          </template>
        </el-table-column>
        <el-table-column prop="last_login_ip" label="最后登录IP" width="150" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="420" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="hasPermission(['admin_user.update'])"
              size="small"
              type="primary"
              @click="handleEdit(row)"
              :icon="Edit"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasPermission(['user.manage_assignments'])"
              size="small"
              type="info"
              @click="handleManageUserAssignments(row)"
            >
              分配用户
            </el-button>
            <el-button
              v-if="row.channel_id"
              size="small"
              type="warning"
              @click="handleAccountSettings(row)"
            >
              WhatsApp 設定
            </el-button>
            <el-button
              v-if="hasPermission(['admin_user.update_status'])"
              size="small"
              :type="row.status === 'active' ? 'warning' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button
              v-if="hasPermission(['admin_user.delete'])"
              size="small"
              type="danger"
              @click="handleDelete(row)"
              :icon="Delete"
              :disabled="row.id === 1"
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

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑管理员' : '新建管理员'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
          <div v-if="isEdit" style="color: #999; font-size: 12px; margin-top: 4px">
            留空表示不修改密码
          </div>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input
            v-model="formData.confirm_password"
            type="password"
            placeholder="请再次输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="分配角色" prop="role_ids">
          <el-select
            v-model="formData.role_ids"
            multiple
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in availableRoles"
              :key="role.id"
              :label="role.display_name || role.name"
              :value="role.id"
            />
          </el-select>
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            可以选择多个角色，第一个角色将作为主要角色
          </div>
        </el-form-item>
        <el-form-item label="所属渠道" prop="channel_id">
          <el-select
            v-model="formData.channel_id"
            placeholder="请选择渠道（可选）"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="channel in availableChannels"
              :key="channel.id"
              :label="channel.channel_name"
              :value="channel.id"
            />
          </el-select>
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            选择渠道后，该管理员只能查看和管理该渠道的用户数据
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 用户分配对话框 -->
    <UserAssignmentDialog
      ref="userAssignmentDialogRef"
      @success="handleAssignmentSuccess"
    />

    <!-- WhatsApp 帳號設定对话框 -->
    <AccountSettingsDialog ref="accountSettingsDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  User,
  Refresh,
  Search,
  RefreshLeft,
  Edit,
  Delete,
  Plus
} from '@element-plus/icons-vue'
import { adminUserApi, type AdminUser } from '@/api/admin'
import { rbacApi } from '@/api/rbac'
import { channelApi, type Channel } from '@/api/channel'
import UserAssignmentDialog from '@/components/admin/UserAssignmentDialog.vue'
import AccountSettingsDialog from '@/components/admin/AccountSettingsDialog.vue'
import { usePermission } from '@/composables/usePermission'

// 权限检查
const { hasPermission } = usePermission()

// 数据
const loading = ref(false)
const adminUsers = ref<AdminUser[]>([])
const availableRoles = ref<any[]>([])
const availableChannels = ref<Channel[]>([])
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 筛选
const filters = reactive({
  keyword: '',
  status: '',
  channel_id: ''
})

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive<any>({
  username: '',
  password: '',
  confirm_password: '',
  status: 'active',
  role_ids: [],
  channel_id: null
})

// 用户分配对话框
const userAssignmentDialogRef = ref<InstanceType<typeof UserAssignmentDialog>>()
const accountSettingsDialogRef = ref<InstanceType<typeof AccountSettingsDialog>>()

// 表单验证规则
const validatePassword = (rule: any, value: any, callback: any) => {
  if (!isEdit.value && !value) {
    callback(new Error('请输入密码'))
  } else if (value && value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (formData.password && !value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const formRules = reactive<FormRules>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  confirm_password: [{ validator: validateConfirmPassword, trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
})

// 方法
const loadAdminUsers = async () => {
  loading.value = true
  try {
    const res = await adminUserApi.getList({
      page: pagination.page,
      limit: pagination.limit,
      keyword: filters.keyword,
      status: filters.status,
      channel_id: filters.channel_id
    })
    adminUsers.value = res.list || []
    pagination.total = res.total || 0
  } catch (error: any) {
    console.error('加载管理员列表失败:', error)
    ElMessage.error(error.message || '加载管理员列表失败')
  } finally {
    loading.value = false
  }
}

// 加载可用角色列表
const loadAvailableRoles = async () => {
  try {
    const res = await rbacApi.getRoles({ page: 1, limit: 100 })
    // API 返回格式: { code, message, data: { list, total, page, limit } }
    availableRoles.value = res.data?.list || []
  } catch (error: any) {
    console.error('加载角色列表失败:', error)
    ElMessage.error(error.message || '加载角色列表失败')
  }
}

// 加载可用渠道列表
const loadAvailableChannels = async () => {
  try {
    const res = await channelApi.getList({ page: 1, page_size: 100 })
    availableChannels.value = res.data?.list || []
  } catch (error: any) {
    console.error('加载渠道列表失败:', error)
    ElMessage.error(error.message || '加载渠道列表失败')
  }
}

const handleRefresh = () => {
  loadAdminUsers()
}

const handleSearch = () => {
  pagination.page = 1
  loadAdminUsers()
}

const handleResetFilter = () => {
  filters.keyword = ''
  filters.status = ''
  filters.channel_id = ''
  handleSearch()
}

const handleSizeChange = () => {
  loadAdminUsers()
}

const handleCurrentChange = () => {
  loadAdminUsers()
}

const handleCreate = () => {
  isEdit.value = false
  dialogVisible.value = true
  Object.assign(formData, {
    username: '',
    password: '',
    confirm_password: '',
    status: 'active',
    role_ids: [],
    channel_id: null
  })
}

const handleEdit = async (row: AdminUser) => {
  // 先拿角色資料，避免 await 期間 dialog 被 interceptor 關閉
  let userRoleIds: number[] = []
  try {
    const rolesRes = await rbacApi.getAdminRoles(row.id)
    const roles = rolesRes.data || []
    userRoleIds = roles.map((role: any) => role.id)
  } catch (error) {
    console.error('获取用户角色失败:', error)
  }

  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    username: row.username,
    password: '',
    confirm_password: '',
    status: row.status,
    role_ids: userRoleIds,
    channel_id: row.channel_id || null
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      if (isEdit.value) {
        const updateData: any = {
          status: formData.status,
          channel_id: formData.channel_id
        }
        if (formData.password) {
          updateData.password = formData.password
          updateData.confirm_password = formData.confirm_password
        }
        await adminUserApi.update(formData.id, updateData)

        // 更新用户角色
        if (formData.role_ids && formData.role_ids.length > 0) {
          await rbacApi.assignRolesToAdmin(formData.id, {
            role_ids: formData.role_ids,
            is_primary: true
          })
        }

        ElMessage.success('更新成功')
      } else {
        const res = await adminUserApi.create(formData)

        // 为新创建的用户分配角色
        if (formData.role_ids && formData.role_ids.length > 0 && res.id) {
          await rbacApi.assignRolesToAdmin(res.id, {
            role_ids: formData.role_ids,
            is_primary: true
          })
        }

        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadAdminUsers()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
}

const handleToggleStatus = async (row: AdminUser) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${action}该管理员吗?`, '提示', {
      type: 'warning'
    })

    await adminUserApi.updateStatus(row.id, newStatus)
    ElMessage.success(`${action}成功`)
    loadAdminUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `${action}失败`)
    }
  }
}

const handleDelete = async (row: AdminUser) => {
  try {
    await ElMessageBox.confirm('确定要删除该管理员吗? 此操作不可恢复。', '警告', {
      type: 'error',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })

    await adminUserApi.delete(row.id)
    ElMessage.success('删除成功')
    loadAdminUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 管理用户分配
const handleManageUserAssignments = (row: AdminUser) => {
  userAssignmentDialogRef.value?.open(row.id, row.username)
}

// WhatsApp 帳號設定
const handleAccountSettings = (row: AdminUser) => {
  accountSettingsDialogRef.value?.open(row.channel_id!)
}

// 用户分配成功回调
const handleAssignmentSuccess = () => {
  ElMessage.success('用户分配已更新')
  loadAdminUsers()
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadAdminUsers()
  loadAvailableRoles()
  loadAvailableChannels()
})
</script>

<style scoped lang="scss">
.admin-user-management {
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
}
</style>
