import { ref, computed } from 'vue'
import { useTagStore } from '@/stores/tag'
import type {
  Tag,
  TagListParams,
  TagCreateRequest,
  TagUpdateRequest,
  TagSearchParams,
  BatchTagCreateRequest,
  BatchTagDeleteRequest,
  BatchTagColorUpdateRequest,
  TagFilter,
  TagTableColumn,
  DEFAULT_TAG_COLORS,
  TAG_COLOR_CATEGORIES
} from '@/types/tag'
import { ElMessageBox } from 'element-plus'

export function useTag() {
  const tagStore = useTagStore()

  // Local state for form handling
  const tagForm = ref<TagCreateRequest>({
    name: '',
    description: '',
    color: DEFAULT_TAG_COLORS[0]
  })

  const editTagForm = ref<TagUpdateRequest>({})
  const isFormValid = ref(false)

  // Batch operation state
  const selectedTags = ref<number[]>([])
  const batchCreateForm = ref<TagCreateRequest[]>([])

  // Computed properties
  const tags = computed(() => tagStore.tags)
  const allTags = computed(() => tagStore.allTags)
  const currentTag = computed(() => tagStore.currentTag)
  const tagUsers = computed(() => tagStore.tagUsers)
  const loading = computed(() => tagStore.loading)
  const searchLoading = computed(() => tagStore.searchLoading)
  const paginationInfo = computed(() => tagStore.paginationInfo)
  const filters = computed(() => tagStore.filters)
  const popularTags = computed(() => tagStore.popularTags)
  const recentTags = computed(() => tagStore.recentTags)
  const unusedTags = computed(() => tagStore.unusedTags)
  const colorGroups = computed(() => tagStore.colorGroups)

  // Form validation rules
  const tagFormRules = {
    name: [
      { required: true, message: '请输入标签名称', trigger: 'blur' },
      { min: 1, max: 50, message: '标签名称长度在1到50个字符', trigger: 'blur' }
    ],
    description: [
      { max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }
    ],
    color: [
      { required: true, message: '请选择标签颜色', trigger: 'change' }
    ]
  }

  // Table columns configuration
  const tagTableColumns: TagTableColumn[] = [
    {
      prop: 'selection',
      label: '选择',
      width: 55,
      fixed: 'left'
    },
    {
      prop: 'id',
      label: 'ID',
      width: 80,
      sortable: true
    },
    {
      prop: 'name',
      label: '标签名称',
      width: 150,
      sortable: true
    },
    {
      prop: 'description',
      label: '描述',
      minWidth: 200
    },
    {
      prop: 'color',
      label: '颜色',
      width: 100
    },
    {
      prop: 'user_count',
      label: '用户数量',
      width: 100,
      sortable: true
    },
    {
      prop: 'created_at',
      label: '创建时间',
      width: 160,
      sortable: true,
      formatter: (row: Tag) => new Date(row.created_at).toLocaleString()
    },
    {
      prop: 'updated_at',
      label: '更新时间',
      width: 160,
      sortable: true,
      formatter: (row: Tag) => new Date(row.updated_at).toLocaleString()
    },
    {
      prop: 'actions',
      label: '操作',
      width: 200,
      fixed: 'right'
    }
  ]

  // Color options
  const colorOptions = Object.values(TAG_COLOR_CATEGORIES).flat()

  // Tag operations
  const fetchTags = async (params?: TagListParams) => {
    return await tagStore.fetchTags(params)
  }

  const fetchAllTags = async () => {
    return await tagStore.fetchAllTags()
  }

  const fetchTagById = async (id: number) => {
    return await tagStore.fetchTagById(id)
  }

  const createTag = async () => {
    if (!isFormValid.value) {
      throw new Error('表单验证失败')
    }
    return await tagStore.createTag(tagForm.value)
  }

  const updateTag = async (id: number) => {
    return await tagStore.updateTag(id, editTagForm.value)
  }

  const deleteTag = async (id: number) => {
    const tag = tags.value.find(t => t.id === id)
    const message = tag?.user_count && tag.user_count > 0
      ? `确定要删除标签"${tag.name}"吗？该标签关联了 ${tag.user_count} 个用户，删除后用户将失去此标签。`
      : `确定要删除标签"${tag?.name}"吗？`

    await ElMessageBox.confirm(message, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    return await tagStore.deleteTag(id)
  }

  const searchTags = async (params: TagSearchParams) => {
    return await tagStore.searchTags(params)
  }

  // Special tag lists
  const fetchPopularTags = async (limit?: number) => {
    return await tagStore.fetchPopularTags(limit)
  }

  const fetchRecentTags = async (limit?: number) => {
    return await tagStore.fetchRecentTags(limit)
  }

  const fetchUnusedTags = async () => {
    return await tagStore.fetchUnusedTags()
  }

  // Tag user operations
  const fetchTagUsers = async (tagId: number, params?: { page?: number; page_size?: number }) => {
    return await tagStore.fetchTagUsers(tagId, params)
  }

  const addUsersToTag = async (tagId: number, userIds: number[]) => {
    await ElMessageBox.confirm(
      `确定要将 ${userIds.length} 个用户添加到该标签吗？`,
      '确认添加',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    return await tagStore.addUsersToTag(tagId, userIds)
  }

  const removeUsersFromTag = async (tagId: number, userIds: number[]) => {
    await ElMessageBox.confirm(
      `确定要从该标签移除 ${userIds.length} 个用户吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    return await tagStore.removeUsersFromTag(tagId, userIds)
  }

  // Batch operations
  const batchCreateTags = async () => {
    if (batchCreateForm.value.length === 0) {
      throw new Error('请至少添加一个标签')
    }

    await ElMessageBox.confirm(
      `确定要批量创建 ${batchCreateForm.value.length} 个标签吗？`,
      '确认批量创建',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const data: BatchTagCreateRequest = { tags: batchCreateForm.value }
    return await tagStore.batchCreateTags(data)
  }

  const batchDeleteTags = async (tagIds: number[]) => {
    const tagsWithUsers = tags.value.filter(t => tagIds.includes(t.id) && t.user_count > 0)
    let message = `确定要批量删除 ${tagIds.length} 个标签吗？`

    if (tagsWithUsers.length > 0) {
      const totalUsers = tagsWithUsers.reduce((sum, tag) => sum + tag.user_count, 0)
      message += `\n其中 ${tagsWithUsers.length} 个标签关联了共 ${totalUsers} 个用户，删除后用户将失去这些标签。`
    }

    await ElMessageBox.confirm(message, '确认批量删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const data: BatchTagDeleteRequest = { tag_ids: tagIds }
    return await tagStore.batchDeleteTags(data)
  }

  const batchUpdateColors = async (updates: Array<{ id: number; color: string }>) => {
    await ElMessageBox.confirm(
      `确定要批量更新 ${updates.length} 个标签的颜色吗？`,
      '确认批量更新',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const data: BatchTagColorUpdateRequest = { updates }
    return await tagStore.batchUpdateColors(data)
  }

  // Color management
  const suggestColors = async (count?: number, exclude?: string[]) => {
    return await tagStore.suggestColors(count, exclude)
  }

  const getColorUsageInfo = (color: string) => {
    const usage = tags.value.filter(tag => tag.color === color)
    return {
      count: usage.length,
      tags: usage
    }
  }

  // Form management
  const resetTagForm = () => {
    tagForm.value = {
      name: '',
      description: '',
      color: DEFAULT_TAG_COLORS[0]
    }
    isFormValid.value = false
  }

  const resetEditTagForm = () => {
    editTagForm.value = {}
  }

  const setEditTagForm = (tag: Tag) => {
    editTagForm.value = {
      name: tag.name,
      description: tag.description,
      color: tag.color
    }
  }

  const addBatchCreateItem = () => {
    batchCreateForm.value.push({
      name: '',
      description: '',
      color: DEFAULT_TAG_COLORS[batchCreateForm.value.length % DEFAULT_TAG_COLORS.length]
    })
  }

  const removeBatchCreateItem = (index: number) => {
    batchCreateForm.value.splice(index, 1)
  }

  const resetBatchCreateForm = () => {
    batchCreateForm.value = []
  }

  // Selection management
  const toggleTagSelection = (tagId: number) => {
    const index = selectedTags.value.indexOf(tagId)
    if (index > -1) {
      selectedTags.value.splice(index, 1)
    } else {
      selectedTags.value.push(tagId)
    }
  }

  const selectAllTags = () => {
    selectedTags.value = tags.value.map(tag => tag.id)
  }

  const clearTagSelection = () => {
    selectedTags.value = []
  }

  const isTagSelected = (tagId: number) => {
    return selectedTags.value.includes(tagId)
  }

  // Filter management
  const setFilters = (newFilters: Partial<TagListParams>) => {
    tagStore.setFilters(newFilters)
  }

  const resetFilters = () => {
    tagStore.resetFilters()
  }

  // Pagination
  const handlePageChange = (page: number) => {
    setFilters({ page })
    fetchTags()
  }

  const handlePageSizeChange = (pageSize: number) => {
    setFilters({ page: 1, page_size: pageSize })
    fetchTags()
  }

  // Sorting
  const handleSort = (column: any) => {
    const sortBy = column.prop
    const sortOrder = column.order === 'ascending' ? 'asc' : 'desc'
    setFilters({ sort_by: sortBy, sort_order: sortOrder })
    fetchTags()
  }

  // Utility functions
  const formatUserCount = (count: number) => {
    if (count === 0) return { text: '0', type: 'info' }
    if (count < 10) return { text: count.toString(), type: 'warning' }
    return { text: count.toString(), type: 'success' }
  }

  const getTagDisplayProps = (tag: Tag) => ({
    color: tag.color,
    size: 'default' as const,
    closable: false
  })

  const isColorAvailable = (color: string, excludeTagId?: number) => {
    return !tags.value.some(tag => tag.color === color && tag.id !== excludeTagId)
  }

  const getColorSuggestion = (excludeColors: string[] = []) => {
    const availableColors = DEFAULT_TAG_COLORS.filter(color => !excludeColors.includes(color))
    return availableColors[Math.floor(Math.random() * availableColors.length)] || DEFAULT_TAG_COLORS[0]
  }

  return {
    // State
    tagForm,
    editTagForm,
    isFormValid,
    selectedTags,
    batchCreateForm,

    // Computed
    tags,
    allTags,
    currentTag,
    tagUsers,
    loading,
    searchLoading,
    paginationInfo,
    filters,
    popularTags,
    recentTags,
    unusedTags,
    colorGroups,

    // Configuration
    tagFormRules,
    tagTableColumns,
    colorOptions,

    // Actions
    fetchTags,
    fetchAllTags,
    fetchTagById,
    createTag,
    updateTag,
    deleteTag,
    searchTags,
    fetchPopularTags,
    fetchRecentTags,
    fetchUnusedTags,
    fetchTagUsers,
    addUsersToTag,
    removeUsersFromTag,
    batchCreateTags,
    batchDeleteTags,
    batchUpdateColors,

    // Color management
    suggestColors,
    getColorUsageInfo,

    // Form management
    resetTagForm,
    resetEditTagForm,
    setEditTagForm,
    addBatchCreateItem,
    removeBatchCreateItem,
    resetBatchCreateForm,

    // Selection management
    toggleTagSelection,
    selectAllTags,
    clearTagSelection,
    isTagSelected,

    // Filter and pagination
    setFilters,
    resetFilters,
    handlePageChange,
    handlePageSizeChange,
    handleSort,

    // Utilities
    formatUserCount,
    getTagDisplayProps,
    isColorAvailable,
    getColorSuggestion
  }
}

export function useTagStats() {
  const tagStore = useTagStore()

  const tagStats = computed(() => tagStore.tagStats)
  const colorStats = computed(() => tagStore.colorStats)

  const fetchTagStats = async () => {
    return await tagStore.fetchTagStats()
  }

  const fetchColorStats = async () => {
    return await tagStore.fetchColorStats()
  }

  // Chart configuration helpers
  const getTagUsageChartOptions = (data: Array<{ tag_name: string; user_count: number }>) => ({
    title: {
      text: '标签使用分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.tag_name),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '用户数量',
      type: 'bar',
      data: data.map(item => item.user_count)
    }]
  })

  const getColorDistributionChartOptions = (data: Array<{ color: string; count: number }>) => ({
    title: {
      text: '标签颜色分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    series: [{
      name: '颜色使用',
      type: 'pie',
      radius: '50%',
      data: data.map(item => ({
        value: item.count,
        name: item.color,
        itemStyle: {
          color: item.color
        }
      }))
    }]
  })

  return {
    tagStats,
    colorStats,
    fetchTagStats,
    fetchColorStats,
    getTagUsageChartOptions,
    getColorDistributionChartOptions
  }
}