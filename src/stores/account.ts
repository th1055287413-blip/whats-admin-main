import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { accountApi } from '@/api/account'
import type {
  Account,
  AccountListParams,
  AccountListResponse,
  AccountStatsResponse,
  AccountChartsResponse,
  BatchOperationRequest,
  AdminStatus
} from '@/types/account'
import type { Tag } from '@/types/tag'
import { ElMessage } from 'element-plus'

export const useAccountStore = defineStore('account', () => {
  // State
  const accounts = ref<Account[]>([])
  const currentAccount = ref<Account | null>(null)
  const accountTags = ref<Tag[]>([])
  const accountStats = ref<AccountStatsResponse | null>(null)
  const accountCharts = ref<AccountChartsResponse | null>(null)
  const totalAccounts = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalPages = ref(0)
  const loading = ref(false)
  const searchLoading = ref(false)

  // Filter state
  const filters = ref<AccountListParams>({
    page: 1,
    page_size: 20
  })

  // Computed
  const hasAccounts = computed(() => accounts.value.length > 0)
  const onlineAccounts = computed(() => accounts.value.filter(a => a.is_online))
  const paginationInfo = computed(() => ({
    total: totalAccounts.value,
    current: currentPage.value,
    pageSize: pageSize.value,
    totalPages: totalPages.value
  }))

  // Actions
  const fetchAccounts = async (params: AccountListParams = {}) => {
    loading.value = true
    try {
      const mergedParams = { ...filters.value, ...params }
      const response: AccountListResponse = await accountApi.list(mergedParams)

      accounts.value = response.items
      totalAccounts.value = response.total
      currentPage.value = response.page
      pageSize.value = response.page_size
      totalPages.value = response.total_pages

      filters.value = mergedParams

      return response
    } catch (error) {
      ElMessage.error('取得帳號列表失敗')
      console.error('Failed to fetch accounts:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchAccountById = async (id: number) => {
    loading.value = true
    try {
      const account = await accountApi.getById(id)
      currentAccount.value = account
      return account
    } catch (error) {
      ElMessage.error('取得帳號詳情失敗')
      console.error('Failed to fetch account:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createAccount = async (data: Partial<Account>) => {
    loading.value = true
    try {
      const account = await accountApi.create(data)
      accounts.value.unshift(account)
      totalAccounts.value++
      ElMessage.success('建立帳號成功')
      return account
    } catch (error) {
      ElMessage.error('建立帳號失敗')
      console.error('Failed to create account:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateAccount = async (id: number, data: Partial<Account>) => {
    loading.value = true
    try {
      const updated = await accountApi.update(id, data)

      const index = accounts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        accounts.value[index] = updated
      }

      if (currentAccount.value?.id === id) {
        currentAccount.value = updated
      }

      ElMessage.success('更新帳號成功')
      return updated
    } catch (error) {
      ElMessage.error('更新帳號失敗')
      console.error('Failed to update account:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteAccount = async (id: number) => {
    loading.value = true
    try {
      await accountApi.delete(id)

      const index = accounts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        accounts.value.splice(index, 1)
        totalAccounts.value--
      }

      if (currentAccount.value?.id === id) {
        currentAccount.value = null
      }

      ElMessage.success('刪除帳號成功')
    } catch (error) {
      ElMessage.error('刪除帳號失敗')
      console.error('Failed to delete account:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateAdminStatus = async (id: number, adminStatus: AdminStatus) => {
    try {
      const updated = await accountApi.update(id, { admin_status: adminStatus } as Partial<Account>)

      const index = accounts.value.findIndex(a => a.id === id)
      if (index !== -1) {
        accounts.value[index] = updated
      }

      if (currentAccount.value?.id === id) {
        currentAccount.value = updated
      }

      ElMessage.success('更新帳號狀態成功')
      return updated
    } catch (error) {
      ElMessage.error('更新帳號狀態失敗')
      console.error('Failed to update account admin status:', error)
      throw error
    }
  }

  const batchOperation = async (data: BatchOperationRequest) => {
    loading.value = true
    try {
      const result = await accountApi.batch(data)
      await fetchAccounts()
      ElMessage.success(`批量操作成功，影響 ${result.affected_count} 個帳號`)
      return result
    } catch (error) {
      ElMessage.error('批量操作失敗')
      console.error('Failed to perform batch operation:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Account tags actions
  const fetchAccountTags = async (accountId: number) => {
    try {
      const tags = await accountApi.getTags(accountId)
      accountTags.value = tags
      return tags
    } catch (error) {
      ElMessage.error('取得帳號標籤失敗')
      console.error('Failed to fetch account tags:', error)
      throw error
    }
  }

  const setAccountTags = async (accountId: number, tagIds: number[]) => {
    try {
      const tags = await accountApi.setTags(accountId, tagIds)
      accountTags.value = tags
      ElMessage.success('設定帳號標籤成功')
      return tags
    } catch (error) {
      ElMessage.error('設定帳號標籤失敗')
      console.error('Failed to set account tags:', error)
      throw error
    }
  }

  const addAccountTags = async (accountId: number, tagIds: number[]) => {
    try {
      const tags = await accountApi.addTags(accountId, tagIds)
      accountTags.value = tags
      ElMessage.success('新增帳號標籤成功')
      return tags
    } catch (error) {
      ElMessage.error('新增帳號標籤失敗')
      console.error('Failed to add account tags:', error)
      throw error
    }
  }

  const removeAccountTag = async (accountId: number, tagId: number) => {
    try {
      await accountApi.removeTag(accountId, tagId)
      accountTags.value = accountTags.value.filter(tag => tag.id !== tagId)
      ElMessage.success('移除帳號標籤成功')
    } catch (error) {
      ElMessage.error('移除帳號標籤失敗')
      console.error('Failed to remove account tag:', error)
      throw error
    }
  }

  // Statistics actions
  const fetchAccountStats = async () => {
    try {
      const stats = await accountApi.getStats()
      accountStats.value = stats
      return stats
    } catch (error) {
      ElMessage.error('取得帳號統計失敗')
      console.error('Failed to fetch account stats:', error)
      throw error
    }
  }

  const fetchAccountCharts = async (params: {
    period?: 'day' | 'week' | 'month' | 'year'
    start_date?: string
    end_date?: string
  } = {}) => {
    try {
      const charts = await accountApi.getCharts(params)
      accountCharts.value = charts
      return charts
    } catch (error) {
      ElMessage.error('取得帳號圖表資料失敗')
      console.error('Failed to fetch account charts:', error)
      throw error
    }
  }

  // Utility actions
  const setFilters = (newFilters: Partial<AccountListParams>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      page: 1,
      page_size: 20
    }
  }

  const clearCurrentAccount = () => {
    currentAccount.value = null
  }

  const clearAccounts = () => {
    accounts.value = []
    totalAccounts.value = 0
    currentPage.value = 1
    totalPages.value = 0
  }

  return {
    // State
    accounts,
    currentAccount,
    accountTags,
    accountStats,
    accountCharts,
    totalAccounts,
    currentPage,
    pageSize,
    totalPages,
    loading,
    searchLoading,
    filters,

    // Computed
    hasAccounts,
    onlineAccounts,
    paginationInfo,

    // Actions
    fetchAccounts,
    fetchAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
    updateAdminStatus,
    batchOperation,
    fetchAccountTags,
    setAccountTags,
    addAccountTags,
    removeAccountTag,
    fetchAccountStats,
    fetchAccountCharts,
    setFilters,
    resetFilters,
    clearCurrentAccount,
    clearAccounts
  }
})
