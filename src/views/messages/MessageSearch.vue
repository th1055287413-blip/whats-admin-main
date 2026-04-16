<template>
  <div class="message-search-page">
    <!-- 页面头部 -->
    <el-card class="page-header" shadow="hover">
      <div class="header-content">
        <div class="header-left">
          <el-icon><Search /></el-icon>
          <h2>消息搜索</h2>
        </div>
        <div class="header-right">
          <el-button @click="handleBack" :icon="ArrowLeft">
            返回
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 搜索栏 -->
    <SearchBar
      :loading="searchLoading"
      :accounts="accounts"
      @search="handleSearch"
      @toggle-filters="toggleFilters"
      @account-change="handleAccountChange"
    />

    <!-- 搜索过滤器 -->
    <SearchFilters
      :visible="showFilters"
      :chats="chats"
      @change="handleFiltersChange"
      ref="filtersRef"
    />

    <!-- 搜索结果 -->
    <SearchResults
      :results="searchResults"
      :total="total"
      :loading="searchLoading"
      :has-more="hasMore"
      @message-click="handleMessageClick"
      @view-context="handleViewContext"
      @load-more="handleLoadMore"
      @message-deleted="handleMessageDeleted"
      @message-revoked="handleMessageRevoked"
    />

    <!-- 消息上下文对话框 -->
    <MessageContext
      v-model:visible="showContextDialog"
      :message-id="currentMessageId"
      :account-id="currentAccountId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import SearchBar from '@/components/message-search/SearchBar.vue'
import SearchFilters from '@/components/message-search/SearchFilters.vue'
import SearchResults from '@/components/message-search/SearchResults.vue'
import MessageContext from '@/components/message-search/MessageContext.vue'
import { searchMessages } from '@/api/message-search'
import { accountApi } from '@/api/account'
import type { Account } from '@/types/account'
import type {
  SearchFormData,
  MessageSearchRequest,
  MessageSearchResultItem
} from '@/types/message-search'
import type { WhatsAppChat } from '@/types/whatsapp'

const router = useRouter()

// 定义过滤器数据类型
interface FilterData {
  chatJid: string
  messageType: string
  dateRange: [string, string] | null
  isFromMe: boolean | null
  sortOrder: 'desc' | 'asc'
}

// State
const accounts = ref<Account[]>([])
const chats = ref<WhatsAppChat[]>([])
const searchResults = ref<MessageSearchResultItem[]>([])
const total = ref(0)
const searchLoading = ref(false)
const showFilters = ref(false)
const showContextDialog = ref(false)
const currentMessageId = ref<number | null>(null)
const currentAccountId = ref(0)
const hasMore = ref(false)

// 搜索参数
const searchParams = ref<MessageSearchRequest | null>(null)
const currentOffset = ref(0)
const PAGE_SIZE = 20

// Refs
const filtersRef = ref()

// Lifecycle
onMounted(() => {
  loadAccounts()
})

// Methods
const loadAccounts = async () => {
  try {
    const response = await accountApi.list({ page: 1, page_size: 100 })
    accounts.value = response.items || []
  } catch (error: any) {
    console.error('加载账号列表失败:', error)
    ElMessage.error(error.message || '加载账号列表失败')
    accounts.value = []
  }
}

const loadChats = async (accountId: number) => {
  if (!accountId) {
    chats.value = []
    return
  }

  try {
    // TODO: 调用API加载聊天列表
    // 这里暂时使用模拟数据
    chats.value = []
  } catch (error: any) {
    ElMessage.error(error.message || '加载聊天列表失败')
  }
}

const handleSearch = async (formData: SearchFormData) => {
  // 构建搜索参数
  const params: MessageSearchRequest = {
    account_id: formData.accountId,
    keyword: formData.keyword.trim(),
    limit: PAGE_SIZE,
    offset: 0,
    sort_order: formData.sortOrder
  }

  // 应用过滤器
  if (filtersRef.value) {
    const filters = filtersRef.value.filters
    if (filters.chatJid) {
      params.chat_jid = filters.chatJid
    }
    if (filters.messageType && filters.messageType !== 'all') {
      params.message_type = filters.messageType
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.date_from = filters.dateRange[0]
      params.date_to = filters.dateRange[1]
    }
    if (filters.isFromMe !== null) {
      params.is_from_me = filters.isFromMe
    }
  }

  searchParams.value = params
  currentOffset.value = 0
  await executeSearch(params, false)
}

const executeSearch = async (params: MessageSearchRequest, append: boolean = false) => {
  searchLoading.value = true
  try {
    const response = await searchMessages(params)
    const data = response.data

    if (append) {
      searchResults.value = [...searchResults.value, ...data.results]
    } else {
      searchResults.value = data.results
    }

    total.value = data.total
    hasMore.value = data.has_more
    currentAccountId.value = params.account_id

    if (!append && data.results.length === 0) {
      ElMessage.info('未找到匹配的消息')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '搜索失败')
    if (!append) {
      searchResults.value = []
      total.value = 0
      hasMore.value = false
    }
  } finally {
    searchLoading.value = false
  }
}

const handleLoadMore = async () => {
  if (!searchParams.value || !hasMore.value || searchLoading.value) {
    return
  }

  const nextOffset = currentOffset.value + PAGE_SIZE
  const params = {
    ...searchParams.value,
    offset: nextOffset
  }

  try {
    await executeSearch(params, true)
    // 只在成功后更新offset
    currentOffset.value = nextOffset
  } catch (error) {
    // 失败时不更新offset,保证下次重试时从正确位置继续
    console.error('Load more failed:', error)
  }
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const handleFiltersChange = (filters: FilterData) => {
  // 过滤器变化时，如果已经有搜索结果，自动重新搜索
  if (searchParams.value) {
    handleSearch({
      accountId: searchParams.value.account_id,
      keyword: searchParams.value.keyword,
      chatJid: filters.chatJid,
      messageType: filters.messageType as any,
      dateRange: filters.dateRange,
      isFromMe: filters.isFromMe,
      sortOrder: filters.sortOrder
    })
  }
}

const handleAccountChange = (accountId: number | null) => {
  if (accountId) {
    loadChats(accountId)
  } else {
    chats.value = []
  }
}

const handleMessageClick = (message: MessageSearchResultItem) => {
  // 可以跳转到消息详情或聊天页面
  console.log('Message clicked:', message)
}

const handleViewContext = (message: MessageSearchResultItem) => {
  currentMessageId.value = message.id
  currentAccountId.value = message.account_id
  showContextDialog.value = true
}

const handleMessageDeleted = (messageId: number) => {
  // 标记消息为已删除（保留原始内容供查看）
  const message = searchResults.value.find(msg => msg.id === messageId)
  if (message) {
    message.deleted_at = new Date().toISOString()
    message.deleted_by = '管理员'
  }
}

const handleMessageRevoked = (messageId: number) => {
  // 更新消息状态为已撤销
  const message = searchResults.value.find(msg => msg.id === messageId)
  if (message) {
    message.is_revoked = true
    message.content = ''
  }
}

const handleBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.message-search-page {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .el-icon {
          font-size: 24px;
          color: #409eff;
        }

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }
      }

      .header-right {
        display: flex;
        gap: 12px;
      }
    }
  }
}
</style>
