import { ref, computed } from 'vue'
import { useAccountStore } from '@/stores/account'
import type {
  Account,
  AccountListParams,
  AdminStatus,
  BatchOperationRequest,
  AccountTableColumn
} from '@/types/account'
import { AdminStatus as AdminStatusEnum } from '@/types/account'
import { ElMessageBox } from 'element-plus'

export function useAccount() {
  const accountStore = useAccountStore()

  // Local state for form handling
  const editAccountForm = ref<Partial<Account>>({})
  const isFormValid = ref(false)

  // Computed properties
  const accounts = computed(() => accountStore.accounts)
  const currentAccount = computed(() => accountStore.currentAccount)
  const accountTags = computed(() => accountStore.accountTags)
  const loading = computed(() => accountStore.loading)
  const searchLoading = computed(() => accountStore.searchLoading)
  const paginationInfo = computed(() => accountStore.paginationInfo)
  const filters = computed(() => accountStore.filters)

  // Form validation rules
  const accountFormRules = {
    phone_number: [
      { required: true, message: '請輸入手機號', trigger: 'blur' },
      { pattern: /^[+]?[\d\s-()]+$/, message: '請輸入有效的手機號', trigger: 'blur' }
    ],
    admin_status: [
      { required: true, message: '請選擇帳號狀態', trigger: 'change' }
    ]
  }

  // Table columns configuration
  const accountTableColumns: AccountTableColumn[] = [
    { prop: 'selection', label: '選擇', width: 55, fixed: 'left' },
    { prop: 'id', label: 'ID', width: 80, sortable: true },
    { prop: 'phone_number', label: '手機號', width: 140, sortable: true },
    { prop: 'push_name', label: '顯示名稱', width: 120, sortable: true },
    {
      prop: 'is_online',
      label: '在線狀態',
      width: 100,
      formatter: (row: Account) => row.is_online ? '在線' : '離線'
    },
    { prop: 'admin_status', label: '管理狀態', width: 100, sortable: true },
    { prop: 'status', label: '連線狀態', width: 100, sortable: true },
    { prop: 'message_count', label: '訊息數', width: 100, sortable: true },
    {
      prop: 'last_seen',
      label: '最後在線',
      width: 160,
      sortable: true,
      formatter: (row: Account) => row.last_seen ? new Date(row.last_seen).toLocaleString() : '-'
    },
    {
      prop: 'created_at',
      label: '建立時間',
      width: 160,
      sortable: true,
      formatter: (row: Account) => new Date(row.created_at).toLocaleString()
    },
    {
      prop: 'referral_registered_at',
      label: '註冊日期',
      width: 160,
      sortable: true,
      formatter: (row: Account) => row.referral_registered_at ? new Date(row.referral_registered_at).toLocaleString() : '-'
    },
    { prop: 'actions', label: '操作', width: 200, fixed: 'right' }
  ]

  // Admin status options
  const adminStatusOptions = [
    { label: '全部', value: '' },
    { label: '活躍', value: AdminStatusEnum.ACTIVE },
    { label: '非活躍', value: AdminStatusEnum.INACTIVE },
    { label: '已封鎖', value: AdminStatusEnum.BLOCKED },
    { label: '待審核', value: AdminStatusEnum.PENDING }
  ]

  // Account operations
  const fetchAccounts = async (params?: AccountListParams) => {
    return await accountStore.fetchAccounts(params)
  }

  const fetchAccountById = async (id: number) => {
    return await accountStore.fetchAccountById(id)
  }

  const createAccount = async (data: Partial<Account>) => {
    return await accountStore.createAccount(data)
  }

  const updateAccount = async (id: number) => {
    return await accountStore.updateAccount(id, editAccountForm.value)
  }

  const deleteAccount = async (id: number) => {
    await ElMessageBox.confirm(
      '確定要刪除這個帳號嗎？刪除後不可恢復。',
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    return await accountStore.deleteAccount(id)
  }

  const updateAdminStatus = async (id: number, status: AdminStatus) => {
    return await accountStore.updateAdminStatus(id, status)
  }

  const batchOperation = async (data: BatchOperationRequest) => {
    const operationNames: Record<string, string> = {
      update_admin_status: '更新狀態',
      delete: '刪除',
      add_tags: '新增標籤',
      remove_tags: '移除標籤'
    }

    const operationName = operationNames[data.operation] || '操作'

    await ElMessageBox.confirm(
      `確定要對選中的 ${data.account_ids.length} 個帳號執行${operationName}嗎？`,
      '確認批量操作',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    return await accountStore.batchOperation(data)
  }

  // Account tags operations
  const fetchAccountTags = async (accountId: number) => {
    return await accountStore.fetchAccountTags(accountId)
  }

  const setAccountTags = async (accountId: number, tagIds: number[]) => {
    return await accountStore.setAccountTags(accountId, tagIds)
  }

  const addAccountTags = async (accountId: number, tagIds: number[]) => {
    return await accountStore.addAccountTags(accountId, tagIds)
  }

  const removeAccountTag = async (accountId: number, tagId: number) => {
    return await accountStore.removeAccountTag(accountId, tagId)
  }

  // Form management
  const resetEditAccountForm = () => {
    editAccountForm.value = {}
  }

  const setEditAccountForm = (account: Account) => {
    editAccountForm.value = {
      push_name: account.push_name,
      admin_status: account.admin_status
    }
  }

  // Filter management
  const setFilters = (newFilters: Partial<AccountListParams>) => {
    accountStore.setFilters(newFilters)
  }

  const resetFilters = () => {
    accountStore.resetFilters()
  }

  // Pagination
  const handlePageChange = (page: number) => {
    setFilters({ page })
    fetchAccounts()
  }

  const handlePageSizeChange = (size: number) => {
    setFilters({ page: 1, page_size: size })
    fetchAccounts()
  }

  // Sorting
  const handleSort = (column: any) => {
    const sortBy = column.prop
    const sortOrder = column.order === 'ascending' ? 'asc' : 'desc'
    setFilters({ sort_by: sortBy, sort_order: sortOrder })
    fetchAccounts()
  }

  // Utility functions
  const formatAdminStatus = (status: AdminStatus) => {
    const statusMap: Record<string, { text: string; type: string }> = {
      [AdminStatusEnum.ACTIVE]: { text: '活躍', type: 'success' },
      [AdminStatusEnum.INACTIVE]: { text: '非活躍', type: 'info' },
      [AdminStatusEnum.BLOCKED]: { text: '已封鎖', type: 'danger' },
      [AdminStatusEnum.PENDING]: { text: '待審核', type: 'warning' }
    }
    return statusMap[status] || { text: status, type: 'info' }
  }

  const formatOnlineStatus = (isOnline: boolean) => {
    return {
      text: isOnline ? '在線' : '離線',
      type: isOnline ? 'success' : 'info'
    }
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return '-'
    const date = new Date(lastSeen)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return '剛剛'
    if (minutes < 60) return `${minutes}分鐘前`
    if (hours < 24) return `${hours}小時前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  return {
    // State
    editAccountForm,
    isFormValid,

    // Computed
    accounts,
    currentAccount,
    accountTags,
    loading,
    searchLoading,
    paginationInfo,
    filters,

    // Configuration
    accountFormRules,
    accountTableColumns,
    adminStatusOptions,

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

    // Form management
    resetEditAccountForm,
    setEditAccountForm,

    // Filter and pagination
    setFilters,
    resetFilters,
    handlePageChange,
    handlePageSizeChange,
    handleSort,

    // Utilities
    formatAdminStatus,
    formatOnlineStatus,
    formatLastSeen
  }
}

export function useAccountStats() {
  const accountStore = useAccountStore()

  const accountStats = computed(() => accountStore.accountStats)
  const accountCharts = computed(() => accountStore.accountCharts)

  const fetchAccountStats = async () => {
    return await accountStore.fetchAccountStats()
  }

  const fetchAccountCharts = async (params: {
    period?: 'day' | 'week' | 'month' | 'year'
    start_date?: string
    end_date?: string
  } = {}) => {
    return await accountStore.fetchAccountCharts(params)
  }

  const getAccountGrowthChartOptions = (data: Array<{ date: string; count: number }>) => ({
    title: {
      text: '帳號增長趨勢',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '新增帳號',
      type: 'line',
      data: data.map(item => item.count),
      smooth: true
    }]
  })

  const getStatusDistributionChartOptions = (data: Array<{ status: string; count: number }>) => ({
    title: {
      text: '帳號狀態分佈',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    series: [{
      name: '帳號狀態',
      type: 'pie',
      radius: '50%',
      data: data.map(item => ({ value: item.count, name: item.status }))
    }]
  })

  return {
    accountStats,
    accountCharts,
    fetchAccountStats,
    fetchAccountCharts,
    getAccountGrowthChartOptions,
    getStatusDistributionChartOptions
  }
}
