<template>
  <div class="message-search-bar">
    <el-form
      :model="formData"
      @submit.prevent="handleSearch"
      class="search-form"
    >
      <el-row :gutter="16">
        <el-col :span="6">
          <el-form-item label="账号">
            <el-select
              v-model="formData.accountId"
              placeholder="全部账号"
              filterable
              clearable
              style="width: 100%"
              @change="handleAccountChange"
            >
              <el-option label="全部账号" :value="0" />
              <el-option
                v-for="account in accounts"
                :key="account.id"
                :label="account.phone_number"
                :value="account.id"
              />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="10">
          <el-form-item label="关键词">
            <el-input
              v-model="formData.keyword"
              placeholder="请输入搜索关键词"
              :prefix-icon="Search"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
        </el-col>

        <el-col :span="4">
          <el-form-item>
            <el-button
              type="primary"
              :icon="Search"
              @click="handleSearch"
              :loading="loading"
              :disabled="!isValidSearch"
            >
              搜索
            </el-button>
          </el-form-item>
        </el-col>

        <el-col :span="4">
          <el-form-item>
            <el-button
              :icon="Filter"
              @click="toggleFilters"
              :type="showFilters ? 'primary' : 'default'"
            >
              {{ showFilters ? '隐藏筛选' : '高级筛选' }}
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, Filter } from '@element-plus/icons-vue'
import type { SearchFormData } from '@/types/message-search'
import type { WhatsAppAccount } from '@/types/whatsapp'

// Props
interface Props {
  loading?: boolean
  accounts: WhatsAppAccount[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  accounts: () => []
})

// Emits
interface Emits {
  (e: 'search', data: SearchFormData): void
  (e: 'toggleFilters'): void
  (e: 'accountChange', accountId: number | null): void
}

const emit = defineEmits<Emits>()

// State
const showFilters = ref(false)
const formData = ref<SearchFormData>({
  accountId: 0,
  keyword: '',
  chatJid: '',
  messageType: 'all',
  dateRange: null,
  isFromMe: null,
  sortOrder: 'desc'
})

// Computed
const isValidSearch = computed(() => {
  // 只要有关键词就可以搜索，账号ID为0表示搜索全部账号
  return formData.value.keyword.trim().length > 0
})

// Methods
const handleSearch = () => {
  if (!isValidSearch.value) {
    return
  }
  emit('search', formData.value)
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
  emit('toggleFilters')
}

const handleAccountChange = (accountId: number) => {
  emit('accountChange', accountId || null)
}

// Watch
watch(() => props.accounts, (newAccounts) => {
  // 如果只有一个账号,自动选中
  if (newAccounts.length === 1 && !formData.value.accountId) {
    formData.value.accountId = newAccounts[0].id
  }
})

// Expose
defineExpose({
  formData
})
</script>

<style scoped lang="scss">
.message-search-bar {
  padding: 16px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;

  .search-form {
    margin-bottom: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}
</style>
