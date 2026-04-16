<template>
  <el-dialog
    v-model="dialogVisible"
    title="WhatsApp 帳號設定"
    width="500px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-loading="loading">
      <el-empty v-if="!loading && accounts.length === 0" description="此用戶未關聯 WhatsApp 帳號" />

      <template v-else-if="accounts.length > 0">
        <el-tabs v-if="accounts.length > 1" v-model="activeAccountId">
          <el-tab-pane
            v-for="acc in accounts"
            :key="acc.id"
            :label="acc.push_name || acc.phone_number || `帳號 ${acc.id}`"
            :name="acc.id"
          />
        </el-tabs>

        <el-form
          v-if="currentForm"
          label-width="140px"
          style="margin-top: 16px"
        >
          <el-form-item label="Push Name">
            <el-input v-model="currentForm.push_name" placeholder="顯示名稱" />
          </el-form-item>
          <el-form-item label="AI 分析">
            <el-switch v-model="currentForm.ai_analysis_enabled" />
          </el-form-item>
        </el-form>
      </template>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        @click="handleSave"
        :loading="saving"
        :disabled="accounts.length === 0"
      >
        儲存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { accountApi, type AccountSettings } from '@/api/account'

interface AccountInfo {
  id: number
  phone_number?: string
  push_name?: string
  channel_id?: number
  ai_analysis_enabled?: boolean
  keep_chats_archived?: boolean
}

const dialogVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const accounts = ref<AccountInfo[]>([])
const activeAccountId = ref<number>(0)

// 每個帳號的表單資料與原始值
const formMap = ref<Record<number, AccountSettings>>({})
const originalMap = ref<Record<number, AccountSettings>>({})

const currentForm = computed(() => formMap.value[activeAccountId.value])

const open = async (channelId: number) => {
  dialogVisible.value = true
  loading.value = true
  accounts.value = []
  formMap.value = {}
  originalMap.value = {}

  try {
    const res = await accountApi.list({ page: 1, page_size: 200, channel_id: channelId })
    accounts.value = (res.items || []) as AccountInfo[]

    for (const acc of accounts.value) {
      const settings: AccountSettings = {
        push_name: acc.push_name ?? '',
        ai_analysis_enabled: acc.ai_analysis_enabled ?? false,
        keep_chats_archived: acc.keep_chats_archived ?? false
      }
      formMap.value[acc.id] = { ...settings }
      originalMap.value[acc.id] = { ...settings }
    }

    if (accounts.value.length > 0) {
      activeAccountId.value = accounts.value[0].id
    }
  } catch (error: any) {
    console.error('載入帳號失敗', error)
    ElMessage.error(error.message || '載入帳號失敗')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  const form = currentForm.value
  const original = originalMap.value[activeAccountId.value]
  if (!form || !original) return

  // 只送有變更的欄位
  const diff: Partial<AccountSettings> = {}
  for (const key of Object.keys(original) as (keyof AccountSettings)[]) {
    if (form[key] !== original[key]) {
      ;(diff as any)[key] = form[key]
    }
  }

  if (Object.keys(diff).length === 0) {
    ElMessage.info('沒有變更')
    return
  }

  saving.value = true
  try {
    await accountApi.updateSettings(activeAccountId.value, diff)
    // 更新 original 快照
    originalMap.value[activeAccountId.value] = { ...form }
    ElMessage.success('儲存成功')
    dialogVisible.value = false
  } catch (error: any) {
    console.error('儲存失敗', error)
    ElMessage.error(error.message || '儲存失敗')
  } finally {
    saving.value = false
  }
}

const handleClosed = () => {
  accounts.value = []
  formMap.value = {}
  originalMap.value = {}
}

defineExpose({ open })
</script>
