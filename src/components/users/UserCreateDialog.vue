<template>
  <el-dialog
    v-model="dialogVisible"
    title="添加用户"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      v-loading="loading"
    >
      <el-form-item label="手機號" prop="phone_number">
        <el-input
          v-model="form.phone_number"
          placeholder="請輸入手機號"
          clearable
        />
      </el-form-item>

      <el-form-item label="顯示名稱" prop="push_name">
        <el-input
          v-model="form.push_name"
          placeholder="請輸入顯示名稱"
          clearable
        />
      </el-form-item>

      <el-form-item label="頭像URL" prop="avatar">
        <el-input
          v-model="form.avatar"
          placeholder="請輸入頭像URL"
          clearable
        />
      </el-form-item>

      <el-form-item label="管理狀態" prop="admin_status">
        <el-select v-model="form.admin_status" placeholder="請選擇狀態">
          <el-option label="活躍" value="active" />
          <el-option label="非活躍" value="inactive" />
          <el-option label="已封鎖" value="blocked" />
          <el-option label="待審核" value="pending" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          创建
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAccountStore } from '@/stores/account'
import type { Account } from '@/types/account'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'created'): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
})

const emit = defineEmits<Emits>()

const accountStore = useAccountStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const form = ref<Partial<Account>>({
  phone_number: '',
  push_name: '',
  avatar: '',
  admin_status: 'pending' as any
})

const rules: FormRules = {
  phone_number: [
    { required: true, message: '請輸入手機號', trigger: 'blur' },
    { max: 20, message: '手機號長度不能超過20個字元', trigger: 'blur' }
  ],
  push_name: [
    { max: 100, message: '顯示名稱長度不能超過100個字元', trigger: 'blur' }
  ],
  avatar: [
    { type: 'url', message: '請輸入正確的URL格式', trigger: 'blur' }
  ]
}

const handleClose = () => {
  formRef.value?.resetFields()
  // 重置表单数据
  form.value = {
    phone_number: '',
    push_name: '',
    avatar: '',
    admin_status: 'pending' as any
  }
  emit('update:visible', false)
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    loading.value = true

    await accountStore.createAccount(form.value)

    ElMessage.success('帳號建立成功')
    emit('created')
    handleClose()
  } catch (error) {
    console.error('Create user error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>