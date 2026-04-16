<template>
  <div class="user-detail-container">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>帳號詳情</h1>
      </div>
      <div class="header-actions" v-if="currentAccount">
        <el-button type="success" @click="handleShowReferralLink">
          <el-icon><Share /></el-icon>
          分享鏈接
        </el-button>
        <el-button type="primary" @click="handleOpenEdit">
          <el-icon><Edit /></el-icon>
          編輯帳號
        </el-button>
        <el-button type="danger" @click="handleDelete">
          <el-icon><Delete /></el-icon>
          刪除帳號
        </el-button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- Account Details -->
    <div v-else-if="currentAccount" class="user-details">
      <!-- Basic Information -->
      <el-card class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>基本資訊</h3>
            <el-tag :type="formatAdminStatus(currentAccount.admin_status).type">
              {{ formatAdminStatus(currentAccount.admin_status).text }}
            </el-tag>
          </div>
        </template>

        <div class="info-grid">
          <div class="info-item">
            <label>帳號ID:</label>
            <span>{{ currentAccount.id }}</span>
          </div>
          <div class="info-item">
            <label>手機號:</label>
            <span>{{ currentAccount.phone_number }}</span>
          </div>
          <div class="info-item">
            <label>顯示名稱:</label>
            <span>{{ currentAccount.push_name || '-' }}</span>
          </div>
          <div class="info-item">
            <label>在線狀態:</label>
            <el-tag :type="formatOnlineStatus(currentAccount.is_online).type">
              {{ formatOnlineStatus(currentAccount.is_online).text }}
            </el-tag>
          </div>
          <div class="info-item">
            <label>連線狀態:</label>
            <span>{{ currentAccount.status }}</span>
          </div>
          <div class="info-item">
            <label>管理狀態:</label>
            <el-tag :type="formatAdminStatus(currentAccount.admin_status).type">
              {{ formatAdminStatus(currentAccount.admin_status).text }}
            </el-tag>
          </div>
          <div class="info-item">
            <label>訊息數量:</label>
            <span>{{ currentAccount.message_count.toLocaleString() }}</span>
          </div>
          <div class="info-item">
            <label>最後在線:</label>
            <span>{{ formatLastSeen(currentAccount.last_seen) }}</span>
          </div>
          <div class="info-item">
            <label>來源方式:</label>
            <span v-if="sourceDisplay">
              <el-tag :type="sourceDisplay.type === 'referral' ? 'warning' : 'success'" size="small">
                {{ sourceDisplay.label }}
              </el-tag>
              <span style="margin-left: 6px;">{{ sourceDisplay.detail }}</span>
            </span>
            <span v-else style="color: #909399;">未知</span>
          </div>
          <div class="info-item">
            <label>Connector:</label>
            <span v-if="currentAccount.connector_name || currentAccount.connector_id">
              {{ currentAccount.connector_name || currentAccount.connector_id }}
            </span>
            <span v-else style="color: #909399;">-</span>
          </div>
          <div class="info-item">
            <label>工作組:</label>
            <span v-if="currentAccount.workgroup_name">
              {{ currentAccount.workgroup_name }}
            </span>
            <span v-else style="color: #909399;">-</span>
          </div>
          <div class="info-item">
            <label>建立時間:</label>
            <span>{{ new Date(currentAccount.created_at).toLocaleString() }}</span>
          </div>
          <div class="info-item">
            <label>更新時間:</label>
            <span>{{ new Date(currentAccount.updated_at).toLocaleString() }}</span>
          </div>
        </div>
      </el-card>

      <!-- Tags Management -->
      <el-card class="tags-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>帳號標籤</h3>
            <el-button size="small" type="primary" @click="handleOpenTagDialog">
              <el-icon><Plus /></el-icon>
              管理標籤
            </el-button>
          </div>
        </template>

        <div v-if="accountTags.length > 0" class="tags-container">
          <el-tag
            v-for="tag in accountTags"
            :key="tag.id"
            :color="tag.color"
            closable
            size="large"
            style="margin-right: 8px; margin-bottom: 8px;"
            @close="handleRemoveTag(tag.id)"
          >
            {{ tag.name }}
          </el-tag>
        </div>
        <div v-else class="empty-tags">
          <el-empty description="暫無標籤" :image-size="80" />
        </div>
      </el-card>

      <!-- Statistics -->
      <el-card class="stats-card" shadow="never">
        <template #header>
          <h3>帳號統計</h3>
        </template>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ currentAccount.message_count }}</div>
            <div class="stat-label">總訊息數</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ accountTags.length }}</div>
            <div class="stat-label">標籤數量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ Math.floor((Date.now() - new Date(currentAccount.created_at).getTime()) / (1000 * 60 * 60 * 24)) }}
            </div>
            <div class="stat-label">註冊天數</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ currentAccount.last_seen ? getLastSeenDays(currentAccount.last_seen) : '-' }}
            </div>
            <div class="stat-label">最後活躍(天前)</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Account Not Found -->
    <div v-else class="not-found">
      <el-empty description="帳號不存在" />
    </div>

    <!-- Edit Account Dialog -->
    <el-dialog v-model="showEditDialog" title="編輯帳號" width="600px">
      <el-form
        ref="editFormRef"
        :model="editAccountForm"
        :rules="accountFormRules"
        label-width="100px"
      >
        <el-form-item label="顯示名稱" prop="push_name">
          <el-input v-model="editAccountForm.push_name" placeholder="請輸入顯示名稱" />
        </el-form-item>
        <el-form-item label="管理狀態" prop="admin_status">
          <el-select v-model="editAccountForm.admin_status" placeholder="請選擇狀態">
            <el-option
              v-for="option in adminStatusOptions.slice(1)"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleUpdate">更新</el-button>
      </template>
    </el-dialog>

    <!-- Tag Management Dialog -->
    <el-dialog v-model="showTagDialog" title="管理帳號標籤" width="600px">
      <div class="tag-management">
        <!-- Current Tags -->
        <div class="current-tags">
          <h4>當前標籤</h4>
          <div v-if="accountTags.length > 0" class="tags-list">
            <el-tag
              v-for="tag in accountTags"
              :key="tag.id"
              :color="tag.color"
              closable
              style="margin-right: 8px; margin-bottom: 8px;"
              @close="handleRemoveTag(tag.id)"
            >
              {{ tag.name }}
            </el-tag>
          </div>
          <div v-else class="empty-message">暫無標籤</div>
        </div>

        <!-- Available Tags -->
        <div class="available-tags">
          <h4>可用標籤</h4>
          <el-select
            v-model="selectedNewTags"
            multiple
            filterable
            placeholder="選擇要新增的標籤"
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="`${tag.name} (${tag.user_count} 帳號)`"
              :value="tag.id"
            >
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>{{ tag.name }}</span>
                <el-tag :color="tag.color" size="small">{{ tag.user_count }}</el-tag>
              </div>
            </el-option>
          </el-select>
          <el-button
            type="primary"
            style="margin-top: 10px; width: 100%"
            :disabled="selectedNewTags.length === 0"
            @click="handleAddTags"
          >
            新增選中標籤
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- Referral Link Dialog -->
    <el-dialog v-model="showReferralDialog" title="分享推薦鏈接" width="600px">
      <div v-loading="referralLoading" class="referral-dialog-content">
        <el-alert
          v-if="referralError"
          :title="referralError"
          type="error"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <template v-if="referralProfile">
          <el-form label-width="100px">
            <el-form-item label="推薦碼">
              <el-tag size="large" type="success">{{ referralProfile.referral_code }}</el-tag>
            </el-form-item>

            <el-form-item label="推廣語言">
              <el-select v-model="selectedLanguage" style="width: 100%">
                <el-option
                  v-for="option in languageOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="分享鏈接">
              <el-input
                :model-value="finalShareUrl"
                readonly
              >
                <template #append>
                  <el-button @click="handleCopyLink">複製</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </template>

        <template v-else-if="!referralLoading && !referralError">
          <el-empty description="尚未生成推薦碼">
            <el-button type="primary" @click="handleGenerateReferralCode">生成推薦碼</el-button>
          </el-empty>
        </template>
      </div>

      <template #footer>
        <el-button @click="showReferralDialog = false">關閉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, Delete, Plus, Share } from '@element-plus/icons-vue'
import { useAccount } from '@/composables/useAccount'
import { useTag } from '@/composables/useTag'
import { referralApi } from '@/api/referral'
import { promotionDomainApi } from '@/api/promotion-domain'
import type { ReferralProfile } from '@/types/referral'
import type { ReferralSourceAttribution, ChannelSourceAttribution } from '@/types/source'

const route = useRoute()
const router = useRouter()

// Composables
const {
  currentAccount,
  accountTags,
  loading,
  editAccountForm,
  accountFormRules,
  adminStatusOptions,
  fetchAccountById,
  updateAccount,
  deleteAccount,
  fetchAccountTags,
  addAccountTags,
  removeAccountTag,
  setEditAccountForm,
  resetEditAccountForm,
  formatAdminStatus,
  formatOnlineStatus,
  formatLastSeen
} = useAccount()

const { allTags, fetchAllTags } = useTag()

// Dialog states
const showEditDialog = ref(false)
const showTagDialog = ref(false)
const showReferralDialog = ref(false)

// Form refs
const editFormRef = ref()

// Tag management
const selectedNewTags = ref<number[]>([])


// Referral state
const referralProfile = ref<ReferralProfile | null>(null)
const referralLoading = ref(false)
const referralError = ref('')
const selectedLanguage = ref('ms')

const languageOptions = [
  { label: 'Bahasa Melayu (马来语)', value: 'ms' },
  { label: 'English (英语/新加坡)', value: 'en' },
  { label: '简体中文', value: 'zh' }
]

// Computed
const accountId = computed(() => Number(route.params.id))

const sourceDisplay = computed(() => {
  const account = currentAccount.value
  if (!account) return null
  const source = account.source
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
  // fallback: 舊欄位
  if (account.referred_by_account_id) {
    return { type: 'referral' as const, label: '裂變推薦', detail: `推薦人 ID: ${account.referred_by_account_id}` }
  }
  if (account.channel_name) {
    return { type: 'channel' as const, label: '渠道', detail: account.channel_name }
  }
  return null
})

const availableTags = computed(() => {
  const currentTagIds = accountTags.value.map(tag => tag.id)
  return allTags.value.filter(tag => !currentTagIds.includes(tag.id))
})

const finalShareUrl = computed(() => {
  if (!referralProfile.value?.share_url) return ''

  try {
    const url = new URL(referralProfile.value.share_url)
    // whats-shop uses 'ref' parameter for referral code
    url.searchParams.set('lang', selectedLanguage.value)
    return url.toString()
  } catch {
    const separator = referralProfile.value.share_url.includes('?') ? '&' : '?'
    return `${referralProfile.value.share_url}${separator}lang=${selectedLanguage.value}`
  }
})

// Methods
const loadAccountData = async () => {
  if (accountId.value) {
    try {
      await fetchAccountById(accountId.value)
      await fetchAccountTags(accountId.value)
    } catch (error) {
      console.error('Failed to load account data:', error)
    }
  }
}

const handleOpenEdit = () => {
  if (currentAccount.value) {
    setEditAccountForm(currentAccount.value)
    showEditDialog.value = true
  }
}

const handleOpenTagDialog = async () => {
  await fetchAllTags()
  showTagDialog.value = true
}

const handleUpdate = async () => {
  if (!currentAccount.value) return

  try {
    await editFormRef.value.validate()
    await updateAccount(currentAccount.value.id)
    showEditDialog.value = false
    resetEditAccountForm()
    await loadAccountData()
  } catch (error) {
    console.error('Update account failed:', error)
  }
}

const handleDelete = async () => {
  if (!currentAccount.value) return

  try {
    await deleteAccount(currentAccount.value.id)
    router.push({ name: 'Users' })
  } catch (error) {
    console.error('Delete account failed:', error)
  }
}

// Referral methods
const handleShowReferralLink = async () => {
  if (!currentAccount.value) return

  showReferralDialog.value = true
  referralProfile.value = null
  referralError.value = ''

  await loadReferralProfile(currentAccount.value.id)
}

const loadReferralProfile = async (accountId: number) => {
  referralLoading.value = true
  referralError.value = ''

  try {
    referralProfile.value = await referralApi.getReferralProfile(accountId)
  } catch (error: any) {
    if (error.response?.status === 404 || error.code === 404) {
      referralProfile.value = null
    } else {
      referralError.value = error.message || '加載推薦信息失敗'
    }
  } finally {
    referralLoading.value = false
  }
}

const handleGenerateReferralCode = async () => {
  if (!currentAccount.value) return

  referralLoading.value = true
  referralError.value = ''

  try {
    const domainsResponse = await promotionDomainApi.getOptions()
    if (!domainsResponse.data || domainsResponse.data.length === 0) {
      ElMessage.error('沒有可用的推廣域名，請先配置推廣域名')
      return
    }

    const firstDomain = domainsResponse.data[0]

    await referralApi.generateCode(currentAccount.value.id, {
      promotion_domain_id: firstDomain.id,
      landing_path: '/'
    })

    ElMessage.success('推薦碼生成成功')
    await loadReferralProfile(currentAccount.value.id)
  } catch (error: any) {
    referralError.value = error.message || '生成推薦碼失敗'
    ElMessage.error(referralError.value)
  } finally {
    referralLoading.value = false
  }
}

const handleCopyLink = async () => {
  if (!finalShareUrl.value) return

  try {
    await navigator.clipboard.writeText(finalShareUrl.value)
    ElMessage.success('鏈接已複製到剪貼板')
  } catch (error) {
    ElMessage.error('複製失敗，請手動複製')
  }
}

const handleAddTags = async () => {
  if (!currentAccount.value || selectedNewTags.value.length === 0) return

  try {
    await addAccountTags(currentAccount.value.id, selectedNewTags.value)
    selectedNewTags.value = []
    await fetchAccountTags(currentAccount.value.id)
  } catch (error) {
    console.error('Add tags failed:', error)
  }
}

const handleRemoveTag = async (tagId: number) => {
  if (!currentAccount.value) return

  try {
    await removeAccountTag(currentAccount.value.id, tagId)
    await fetchAccountTags(currentAccount.value.id)
  } catch (error) {
    console.error('Remove tag failed:', error)
  }
}

const getLastSeenDays = (lastSeen: string): number => {
  const date = new Date(lastSeen)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// Lifecycle
onMounted(async () => {
  await loadAccountData()
  await fetchAllTags()
})
</script>

<style scoped>
.user-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.loading-container {
  padding: 20px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.info-card {
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item label {
  font-weight: 500;
  width: 120px;
  flex-shrink: 0;
  color: #606266;
}

.info-item span {
  color: #303133;
}

.tags-card {
  margin-bottom: 20px;
}

.tags-container {
  min-height: 60px;
}

.empty-tags {
  text-align: center;
  padding: 20px;
}

.stats-card {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.not-found {
  text-align: center;
  padding: 40px;
}

.tag-management {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.current-tags h4,
.available-tags h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 600;
}

.tags-list {
  min-height: 40px;
}

.empty-message {
  color: #909399;
  font-style: italic;
}

@media (max-width: 768px) {
  .user-detail-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

.referral-dialog-content {
  min-height: 200px;
}
</style>
