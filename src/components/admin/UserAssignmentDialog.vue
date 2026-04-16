<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`管理用户分配 - ${currentAdminName}`"
    width="700px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form :model="formData" label-width="100px">
      <!-- 分配模式选择 -->
      <el-form-item label="分配模式">
        <el-radio-group v-model="assignmentMode">
          <el-radio value="range">范围分配</el-radio>
          <el-radio value="explicit">显式分配</el-radio>
        </el-radio-group>
        <div style="color: #999; font-size: 12px; margin-top: 4px">
          范围分配：按用户 ID 范围分配（如 1-10）；显式分配：手动选择具体用户
        </div>
      </el-form-item>

      <!-- 范围分配模式 -->
      <template v-if="assignmentMode === 'range'">
        <el-alert
          v-if="userIdRange"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        >
          <template #title>
            数据库中实际存在的用户ID范围：{{ userIdRange.min }} - {{ userIdRange.max }}（共 {{ userIdRange.total }} 个用户）
          </template>
        </el-alert>
        <el-form-item label="用户 ID 范围">
          <div style="display: flex; align-items: center; gap: 8px">
            <el-input-number
              v-model="formData.rangeStart"
              :min="1"
              :precision="0"
              placeholder="起始 ID"
              style="width: 150px"
            />
            <span>至</span>
            <el-input-number
              v-model="formData.rangeEnd"
              :min="formData.rangeStart || 1"
              :precision="0"
              placeholder="结束 ID"
              style="width: 150px"
            />
          </div>
          <div v-if="rangeCount > 0" style="color: #409eff; font-size: 12px; margin-top: 4px">
            将分配 {{ rangeCount }} 个用户（ID {{ formData.rangeStart }} - {{ formData.rangeEnd }}）
          </div>
        </el-form-item>
      </template>

      <!-- 显式分配模式 -->
      <template v-if="assignmentMode === 'explicit'">
        <el-form-item label="分配用户">
          <el-input
            v-model="userIdsInput"
            type="textarea"
            :rows="4"
            placeholder="输入用户 ID，多个 ID 用逗号或换行分隔&#10;例如：1,2,3,4,5 或&#10;1&#10;2&#10;3"
          />
          <div v-if="parsedUserIds.length > 0" style="color: #409eff; font-size: 12px; margin-top: 4px">
            已解析 {{ parsedUserIds.length }} 个用户 ID
          </div>
        </el-form-item>
      </template>

      <!-- 当前分配信息 -->
      <el-form-item v-if="currentAssignment" label="当前分配">
        <el-tag v-if="currentAssignment.type === 'assigned_users'" type="info">
          <template v-if="currentAssignment.assigned_user_ids && currentAssignment.assigned_user_ids.length > 0">
            显式分配：{{ currentAssignment.total }} 个用户
          </template>
          <template v-else-if="currentAssignment.user_range_start && currentAssignment.user_range_end">
            范围分配：ID {{ currentAssignment.user_range_start }} - {{ currentAssignment.user_range_end }}（{{ currentAssignment.total }} 个）
          </template>
          <template v-else>
            未分配任何用户
          </template>
        </el-tag>
        <el-tag v-else type="warning">未设置分配</el-tag>
      </el-form-item>
    </el-form>

    <template #footer>
      <div style="display: flex; justify-content: space-between; align-items: center">
        <el-button
          v-if="currentAssignment && currentAssignment.type === 'assigned_users'"
          type="danger"
          plain
          @click="handleRemove"
          :loading="removing"
        >
          清除分配
        </el-button>
        <div style="flex: 1"></div>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminUserApi } from '@/api/admin'
import type { AssignedUsersResponse, UserAssignment } from '@/api/admin'

const emit = defineEmits<{
  (e: 'success'): void
}>()

const dialogVisible = ref(false)
const assignmentMode = ref<'range' | 'explicit'>('range')
const loading = ref(false)
const saving = ref(false)
const removing = ref(false)

// 内部状态
const currentAdminId = ref(0)
const currentAdminName = ref('')

const formData = ref({
  rangeStart: 1,
  rangeEnd: 10
})

const userIdsInput = ref('')
const currentAssignment = ref<AssignedUsersResponse | null>(null)
const userIdRange = ref<{ min: number; max: number; total: number } | null>(null)

// 范围分配用户数量
const rangeCount = computed(() => {
  if (formData.value.rangeStart && formData.value.rangeEnd) {
    return Math.max(0, formData.value.rangeEnd - formData.value.rangeStart + 1)
  }
  return 0
})

// 解析用户 ID
const parsedUserIds = computed(() => {
  if (!userIdsInput.value.trim()) return []

  const ids: number[] = []
  const text = userIdsInput.value.replace(/[\s,;]+/g, ',')
  const parts = text.split(',').filter(s => s.trim())

  for (const part of parts) {
    const num = parseInt(part.trim(), 10)
    if (!isNaN(num) && num > 0 && !ids.includes(num)) {
      ids.push(num)
    }
  }

  return ids.sort((a, b) => a - b)
})

// 打开对话框
const open = async (adminId: number, adminName: string) => {
  if (!adminId || adminId === 0) {
    ElMessage.error('无效的管理员 ID')
    return
  }
  currentAdminId.value = adminId
  currentAdminName.value = adminName
  dialogVisible.value = true
  await Promise.all([loadCurrentAssignments(), loadUserIdRange()])
}

// 加载用户ID范围
const loadUserIdRange = async () => {
  try {
    const { accountApi } = await import('@/api/account')
    const response = await accountApi.getIdRange()
    userIdRange.value = response
  } catch (error) {
    console.error('加载用户ID范围失败', error)
  }
}

// 加载当前分配
const loadCurrentAssignments = async () => {
  if (!currentAdminId.value || currentAdminId.value === 0) {
    return
  }
  try {
    loading.value = true
    const response = await adminUserApi.getAssignedUsers(currentAdminId.value)
    currentAssignment.value = response

    // 根据当前分配设置表单
    if (response.type === 'assigned_users') {
      if (response.assigned_user_ids && response.assigned_user_ids.length > 0) {
        assignmentMode.value = 'explicit'
        userIdsInput.value = response.assigned_user_ids.join(', ')
      } else if (response.user_range_start && response.user_range_end) {
        assignmentMode.value = 'range'
        formData.value.rangeStart = response.user_range_start
        formData.value.rangeEnd = response.user_range_end
      }
    }
  } catch (error) {
    console.error('加载分配信息失败', error)
    ElMessage.error('加载分配信息失败')
  } finally {
    loading.value = false
  }
}

// 保存分配
const handleSave = async () => {
  const payload: UserAssignment = {
    type: assignmentMode.value
  }

  if (assignmentMode.value === 'range') {
    if (!formData.value.rangeStart || !formData.value.rangeEnd) {
      ElMessage.warning('请输入有效的用户 ID 范围')
      return
    }
    if (formData.value.rangeStart > formData.value.rangeEnd) {
      ElMessage.warning('起始 ID 不能大于结束 ID')
      return
    }
    payload.user_range_start = formData.value.rangeStart
    payload.user_range_end = formData.value.rangeEnd
  } else {
    if (parsedUserIds.value.length === 0) {
      ElMessage.warning('请至少输入一个用户 ID')
      return
    }
    payload.user_ids = parsedUserIds.value
  }

  try {
    saving.value = true
    await adminUserApi.assignUsers(currentAdminId.value, payload)
    ElMessage.success('用户分配成功')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    console.error('分配失败', error)
    ElMessage.error(error.message || '分配失败，请重试')
  } finally {
    saving.value = false
  }
}

// 移除分配
const handleRemove = async () => {
  try {
    await ElMessageBox.confirm('确定要清除该管理员的用户分配吗？', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    removing.value = true
    await adminUserApi.removeUserAssignments(currentAdminId.value)
    ElMessage.success('已清除用户分配')
    dialogVisible.value = false
    emit('success')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('清除分配失败', error)
      ElMessage.error(error.message || '清除失败，请重试')
    }
  } finally {
    removing.value = false
  }
}

// 对话框关闭时重置
const handleClosed = () => {
  assignmentMode.value = 'range'
  formData.value = {
    rangeStart: 1,
    rangeEnd: 10
  }
  userIdsInput.value = ''
  currentAssignment.value = null
}

defineExpose({ open })
</script>

<style scoped>
.el-form-item {
  margin-bottom: 18px;
}
</style>
