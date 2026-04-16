<template>
  <el-dialog
    v-model="dialogVisible"
    title="用户详情"
    width="600px"
    :before-close="handleClose"
  >
    <div v-if="user" class="user-detail">
      <el-descriptions border :column="2">
        <el-descriptions-item label="帳號ID">
          {{ user.id }}
        </el-descriptions-item>
        <el-descriptions-item label="手機號">
          {{ user.phone_number }}
        </el-descriptions-item>
        <el-descriptions-item label="顯示名稱">
          {{ user.push_name || '未設置' }}
        </el-descriptions-item>
        <el-descriptions-item label="管理狀態">
          <el-tag :type="getStatusType(user.admin_status)">
            {{ getStatusText(user.admin_status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="連線狀態">
          <el-tag :type="getAccountStatusType(user.status)" size="small">
            {{ getAccountStatusText(user.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="在線狀態">
          <el-tag :type="user.is_online ? 'success' : 'info'">
            {{ user.is_online ? '在線' : '離線' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="帳號類型" v-if="user.platform">
          <el-tag :type="isBusiness(user.platform) ? 'warning' : 'info'" size="small">
            {{ isBusiness(user.platform) ? '商業號' : '個人號' }}
          </el-tag>
          <span style="margin-left: 6px; color: #909399; font-size: 12px">
            {{ getPlatformLabel(user.platform) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="商業名稱" v-if="user.business_name">
          {{ user.business_name }}
        </el-descriptions-item>
        <el-descriptions-item label="訊息數量">
          {{ user.message_count }}
        </el-descriptions-item>
        <el-descriptions-item label="最後在線">
          {{ user.last_seen ? formatDateTime(user.last_seen) : '未知' }}
        </el-descriptions-item>
        <el-descriptions-item v-if="user.disconnect_reason" label="斷線原因">
          {{ user.disconnect_reason }}
        </el-descriptions-item>
        <el-descriptions-item v-if="user.disconnected_at" label="斷線時間">
          {{ formatDateTime(user.disconnected_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="來源方式">
          <template v-if="sourceDisplay">
            <el-tag :type="sourceDisplay.type === 'referral' ? 'warning' : 'success'" size="small">
              {{ sourceDisplay.label }}
            </el-tag>
            <span style="margin-left: 6px;">{{ sourceDisplay.detail }}</span>
          </template>
          <span v-else style="color: #909399;">未知</span>
        </el-descriptions-item>
        <el-descriptions-item label="Connector">
          <span v-if="user.connector_name || user.connector_id">
            {{ user.connector_name || user.connector_id }}
          </span>
          <span v-else style="color: #909399;">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="工作組">
          <span v-if="user.workgroup_name">{{ user.workgroup_name }}</span>
          <span v-else style="color: #909399;">-</span>
        </el-descriptions-item>
        <el-descriptions-item label="AI 分析">
          <el-tag :type="user.ai_analysis_enabled ? 'success' : 'info'" size="small">
            {{ user.ai_analysis_enabled ? '已開啟' : '未開啟' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="保持聊天封存">
          <el-tag :type="user.keep_chats_archived ? 'success' : 'info'" size="small">
            {{ user.keep_chats_archived ? '已開啟' : '未開啟' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="建立時間">
          {{ formatDateTime(user.created_at) }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="user-avatar" v-if="user.avatar">
        <el-divider content-position="left">頭像</el-divider>
        <el-avatar :src="user.avatar" :size="80" />
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Account } from '@/types/account'
import type { ReferralSourceAttribution, ChannelSourceAttribution } from '@/types/source'

interface Props {
  visible: boolean
  user?: Account | null
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  user: null
})

const emit = defineEmits<Emits>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const sourceDisplay = computed(() => {
  const user = props.user
  if (!user) return null
  const source = user.source
  if (source?.source_type === 'referral') {
    const s = source as ReferralSourceAttribution
    return {
      type: 'referral' as const,
      label: '裂變推薦',
      detail: `由 ${s.source_account_name || s.source_account_phone || '未知'} 推薦`
    }
  }
  if (source?.source_type === 'channel') {
    const s = source as ChannelSourceAttribution
    return { type: 'channel' as const, label: '渠道', detail: s.channel_source_name }
  }
  if (user.referred_by_account_id) {
    return { type: 'referral' as const, label: '裂變推薦', detail: `推薦人 ID: ${user.referred_by_account_id}` }
  }
  if (user.channel_name) {
    return { type: 'channel' as const, label: '渠道', detail: user.channel_name }
  }
  return null
})

const isBusiness = (platform?: string) => platform === 'smba' || platform === 'smbi'

const getPlatformLabel = (platform?: string) => {
  const map: Record<string, string> = {
    smba: 'WhatsApp Business (Android)',
    smbi: 'WhatsApp Business (iOS)',
    android: '個人號 (Android)',
    iphone: '個人號 (iOS)'
  }
  return map[platform || ''] || platform || ''
}

const getStatusType = (status: string) => {
  const statusMap = {
    active: 'success',
    inactive: 'warning',
    blocked: 'danger',
    pending: 'info'
  }
  return statusMap[status as keyof typeof statusMap] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap = {
    active: '活跃',
    inactive: '非活跃',
    blocked: '已拉黑',
    pending: '待审核'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

const getAccountStatusType = (status?: string) => {
  const map: Record<string, string> = {
    connected: 'success',
    disconnected: 'success',
    logged_out: 'danger'
  }
  return map[status || ''] || 'info'
}

const getAccountStatusText = (status?: string) => {
  const map: Record<string, string> = {
    connected: '已连接',
    disconnected: '已连接',
    logged_out: '已登出'
  }
  return map[status || ''] || status || '未知'
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN')
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
.user-detail {
  padding: 10px 0;
}

.user-avatar {
  margin-top: 20px;
  text-align: center;
}
</style>
