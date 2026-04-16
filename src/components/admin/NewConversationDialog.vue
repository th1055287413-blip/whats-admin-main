<template>
  <el-dialog
    v-model="dialogVisible"
    title="發起新對話"
    width="560px"
    :close-on-click-modal="false"
    @closed="resetForm"
  >
    <el-tabs v-model="activeTab">
      <!-- 手動輸入 -->
      <el-tab-pane label="手動輸入號碼" name="manual">
        <div class="manual-input">
          <div class="phone-row">
            <el-select
              v-model="selectedDialCode"
              filterable
              placeholder="區號"
              style="width: 140px"
            >
              <el-option
                v-for="c in countryOptions"
                :key="c.code"
                :label="`${c.flag} ${c.dialCode}`"
                :value="c.dialCode"
              >
                <span>{{ c.flag }} {{ c.nameZh }} {{ c.dialCode }}</span>
              </el-option>
            </el-select>
            <el-input
              v-model="phoneNumber"
              placeholder="輸入手機號碼"
              style="flex: 1"
              @keydown.enter="handleSend"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 聯絡人列表 -->
      <el-tab-pane label="從聯絡人選擇" name="contact">
        <el-input
          v-model="contactSearch"
          placeholder="搜尋聯絡人..."
          :prefix-icon="Search"
          clearable
          style="margin-bottom: 12px"
        />
        <div class="contact-list" v-loading="loadingContacts">
          <div
            v-for="contact in filteredContacts"
            :key="contact.phone"
            class="contact-item"
            :class="{ active: selectedContact?.phone === contact.phone }"
            @click="selectedContact = contact"
          >
            <el-avatar :size="36" :src="contact.avatar">
              {{ (contact.push_name || contact.full_name || '?').charAt(0).toUpperCase() }}
            </el-avatar>
            <div class="contact-info">
              <div class="contact-name">{{ contact.push_name || contact.full_name || contact.phone }}</div>
              <div class="contact-phone">{{ contact.phone }}</div>
            </div>
            <el-icon v-if="selectedContact?.phone === contact.phone" color="#00a884"><Check /></el-icon>
          </div>
          <el-empty v-if="!loadingContacts && filteredContacts.length === 0" description="無匹配聯絡人" :image-size="60" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 訊息內容 -->
    <div class="message-section">
      <label class="section-label">訊息內容</label>
      <el-input
        v-model="messageContent"
        type="textarea"
        :rows="3"
        placeholder="輸入訊息內容..."
        resize="none"
      />
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="sending" :disabled="!canSend" @click="handleSend">
        發送
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Check } from '@element-plus/icons-vue'
import { accountApi } from '@/api/account'
import { api } from '@/utils/request'
import { countries } from '@/data/countries'

interface Contact {
  phone: string
  push_name?: string
  full_name?: string
  avatar?: string
}

const emit = defineEmits<{
  (e: 'success', contactPhone: string): void
}>()

const dialogVisible = ref(false)
const activeTab = ref('manual')
const sending = ref(false)
const messageContent = ref('')

// 手動輸入
const selectedDialCode = ref('+852')
const phoneNumber = ref('')

// 聯絡人
const loadingContacts = ref(false)
const contactList = ref<Contact[]>([])
const contactSearch = ref('')
const selectedContact = ref<any>(null)

// 內部狀態
let accountId = 0

const countryOptions = computed(() =>
  countries.map(c => ({ code: c.code, flag: c.flag, nameZh: c.nameZh, dialCode: c.dialCode }))
)

const filteredContacts = computed(() => {
  if (!contactSearch.value) return contactList.value
  const kw = contactSearch.value.toLowerCase()
  return contactList.value.filter(c =>
    (c.push_name?.toLowerCase().includes(kw)) ||
    (c.full_name?.toLowerCase().includes(kw)) ||
    (c.phone?.includes(kw))
  )
})

const resolvedPhone = computed(() => {
  if (activeTab.value === 'manual') {
    const clean = phoneNumber.value.replace(/\D/g, '')
    if (!clean) return ''
    const code = selectedDialCode.value.replace('+', '')
    return code + clean
  }
  return selectedContact.value?.phone || ''
})

const canSend = computed(() =>
  !!resolvedPhone.value && !!messageContent.value.trim()
)

const loadContacts = async () => {
  if (!accountId) return
  loadingContacts.value = true
  try {
    const res = await accountApi.getContacts(accountId, { page: 1, page_size: 200 })
    contactList.value = res.items || []
  } catch {
    ElMessage.error('載入聯絡人失敗')
  } finally {
    loadingContacts.value = false
  }
}

const handleSend = async () => {
  if (!canSend.value) return
  sending.value = true
  try {
    await api.post(`/accounts/${accountId}/send`, {
      contact_phone: resolvedPhone.value,
      content: messageContent.value.trim(),
      type: 'text'
    })
    ElMessage.success('訊息發送成功')
    dialogVisible.value = false
    emit('success', resolvedPhone.value)
  } catch (error: any) {
    ElMessage.error('發送失敗: ' + (error?.response?.data?.message || error?.message || '未知錯誤'))
  } finally {
    sending.value = false
  }
}

const resetForm = () => {
  activeTab.value = 'manual'
  messageContent.value = ''
  phoneNumber.value = ''
  selectedContact.value = null
  contactSearch.value = ''
}

const open = (id: number) => {
  accountId = id
  dialogVisible.value = true
  if (contactList.value.length === 0) {
    loadContacts()
  }
}

watch(() => dialogVisible.value, (val) => {
  if (val && accountId && contactList.value.length === 0) {
    loadContacts()
  }
})

defineExpose({ open })
</script>

<style scoped>
.manual-input {
  padding: 12px 0;
}
.phone-row {
  display: flex;
  gap: 8px;
}
.message-section {
  border-top: 1px solid #ebeef5;
  padding-top: 16px;
  margin-top: 12px;
}
.section-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}
.contact-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}
.contact-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f5f7fa;
  transition: background-color 0.15s;
}
.contact-item:last-child {
  border-bottom: none;
}
.contact-item:hover {
  background-color: #f5f7fa;
}
.contact-item.active {
  background-color: #f0f9eb;
}
.contact-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}
.contact-name {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.contact-phone {
  font-size: 12px;
  color: #909399;
}
</style>
