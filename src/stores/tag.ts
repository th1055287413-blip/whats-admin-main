import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import tagApi, { tagUserApi, tagBatchApi, tagColorApi, tagStatsApi } from '@/api/tag'
import type {
  Tag,
  TagListParams,
  TagListResponse,
  TagCreateRequest,
  TagUpdateRequest,
  TagStatsResponse,
  TagUsersResponse,
  BatchTagCreateRequest,
  BatchTagDeleteRequest,
  BatchTagColorUpdateRequest,
  TagSearchParams,
  TagSuggestion,
  ColorStats,
  DEFAULT_TAG_COLORS
} from '@/types/tag'
import type { Account } from '@/types/account'
import { ElMessage } from 'element-plus'

export const useTagStore = defineStore('tag', () => {
  // State
  const tags = ref<Tag[]>([])
  const allTags = ref<Tag[]>([])
  const currentTag = ref<Tag | null>(null)
  const tagUsers = ref<Account[]>([])
  const tagStats = ref<TagStatsResponse | null>(null)
  const colorStats = ref<ColorStats | null>(null)
  const totalTags = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const totalPages = ref(0)
  const loading = ref(false)
  const searchLoading = ref(false)

  // Filter state
  const filters = ref<TagListParams>({
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // Search state
  const searchSuggestions = ref<TagSuggestion[]>([])
  const popularTags = ref<Tag[]>([])
  const recentTags = ref<Tag[]>([])
  const unusedTags = ref<Tag[]>([])

  // Computed
  const hasTags = computed(() => tags.value.length > 0)
  const usedTags = computed(() => tags.value.filter(tag => tag.user_count > 0))
  const emptyTags = computed(() => tags.value.filter(tag => tag.user_count === 0))
  const colorGroups = computed(() => {
    const groups: Record<string, Tag[]> = {}
    tags.value.forEach(tag => {
      if (!groups[tag.color]) {
        groups[tag.color] = []
      }
      groups[tag.color].push(tag)
    })
    return groups
  })
  const paginationInfo = computed(() => ({
    total: totalTags.value,
    current: currentPage.value,
    pageSize: pageSize.value,
    totalPages: totalPages.value
  }))

  // Actions
  const fetchTags = async (params: TagListParams = {}) => {
    loading.value = true
    try {
      const mergedParams = { ...filters.value, ...params }
      const response: TagListResponse = await tagApi.list(mergedParams)

      tags.value = response.tags
      totalTags.value = response.total
      currentPage.value = response.page
      pageSize.value = response.page_size
      totalPages.value = response.total_pages

      // Update filters with actual params used
      filters.value = mergedParams

      return response
    } catch (error) {
      ElMessage.error('获取标签列表失败')
      console.error('Failed to fetch tags:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchAllTags = async () => {
    try {
      const tags = await tagApi.getAll()
      allTags.value = tags
      return tags
    } catch (error) {
      ElMessage.error('获取所有标签失败')
      console.error('Failed to fetch all tags:', error)
      throw error
    }
  }

  const fetchTagById = async (id: number) => {
    loading.value = true
    try {
      const tag = await tagApi.getById(id)
      currentTag.value = tag
      return tag
    } catch (error) {
      ElMessage.error('获取标签详情失败')
      console.error('Failed to fetch tag:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createTag = async (data: TagCreateRequest) => {
    loading.value = true
    try {
      const tag = await tagApi.create(data)
      tags.value.unshift(tag)
      allTags.value.unshift(tag)
      totalTags.value++
      ElMessage.success('创建标签成功')
      return tag
    } catch (error) {
      ElMessage.error('创建标签失败')
      console.error('Failed to create tag:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateTag = async (id: number, data: TagUpdateRequest) => {
    loading.value = true
    try {
      const updatedTag = await tagApi.update(id, data)

      // Update in lists
      const updateInArray = (array: Tag[]) => {
        const index = array.findIndex(tag => tag.id === id)
        if (index !== -1) {
          array[index] = updatedTag
        }
      }

      updateInArray(tags.value)
      updateInArray(allTags.value)

      // Update current tag if it's the same
      if (currentTag.value?.id === id) {
        currentTag.value = updatedTag
      }

      ElMessage.success('更新标签成功')
      return updatedTag
    } catch (error) {
      ElMessage.error('更新标签失败')
      console.error('Failed to update tag:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const deleteTag = async (id: number) => {
    loading.value = true
    try {
      await tagApi.delete(id)

      // Remove from lists
      const removeFromArray = (array: Tag[]) => {
        const index = array.findIndex(tag => tag.id === id)
        if (index !== -1) {
          array.splice(index, 1)
        }
      }

      removeFromArray(tags.value)
      removeFromArray(allTags.value)
      totalTags.value--

      // Clear current tag if it's the deleted one
      if (currentTag.value?.id === id) {
        currentTag.value = null
      }

      ElMessage.success('删除标签成功')
    } catch (error) {
      ElMessage.error('删除标签失败')
      console.error('Failed to delete tag:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const searchTags = async (params: TagSearchParams) => {
    searchLoading.value = true
    try {
      const suggestions = await tagApi.search(params)
      searchSuggestions.value = suggestions
      return suggestions
    } catch (error) {
      ElMessage.error('搜索标签失败')
      console.error('Failed to search tags:', error)
      throw error
    } finally {
      searchLoading.value = false
    }
  }

  // Special tag lists
  const fetchPopularTags = async (limit: number = 10) => {
    try {
      const tags = await tagApi.getPopular({ limit })
      popularTags.value = tags
      return tags
    } catch (error) {
      console.error('Failed to fetch popular tags:', error)
      throw error
    }
  }

  const fetchRecentTags = async (limit: number = 10) => {
    try {
      const tags = await tagApi.getRecent({ limit })
      recentTags.value = tags
      return tags
    } catch (error) {
      console.error('Failed to fetch recent tags:', error)
      throw error
    }
  }

  const fetchUnusedTags = async () => {
    try {
      const tags = await tagApi.getUnused()
      unusedTags.value = tags
      return tags
    } catch (error) {
      console.error('Failed to fetch unused tags:', error)
      throw error
    }
  }

  // Tag user operations
  const fetchTagUsers = async (tagId: number, params: { page?: number; page_size?: number } = {}) => {
    loading.value = true
    try {
      const response = await tagUserApi.getTagUsers(tagId, params)
      tagUsers.value = response.users
      return response
    } catch (error) {
      ElMessage.error('获取标签用户失败')
      console.error('Failed to fetch tag users:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const addUsersToTag = async (tagId: number, userIds: number[]) => {
    try {
      const result = await tagUserApi.addUsers(tagId, userIds)

      // Update tag user count
      const tag = tags.value.find(t => t.id === tagId)
      if (tag) {
        tag.user_count += result.affected_count
      }

      ElMessage.success(`成功添加 ${result.affected_count} 个用户到标签`)
      return result
    } catch (error) {
      ElMessage.error('添加用户到标签失败')
      console.error('Failed to add users to tag:', error)
      throw error
    }
  }

  const removeUsersFromTag = async (tagId: number, userIds: number[]) => {
    try {
      const result = await tagUserApi.removeUsers(tagId, userIds)

      // Update tag user count
      const tag = tags.value.find(t => t.id === tagId)
      if (tag) {
        tag.user_count = Math.max(0, tag.user_count - result.affected_count)
      }

      ElMessage.success(`成功从标签移除 ${result.affected_count} 个用户`)
      return result
    } catch (error) {
      ElMessage.error('从标签移除用户失败')
      console.error('Failed to remove users from tag:', error)
      throw error
    }
  }

  // Batch operations
  const batchCreateTags = async (data: BatchTagCreateRequest) => {
    loading.value = true
    try {
      const result = await tagBatchApi.create(data)

      // Refresh tags list
      await fetchTags()
      await fetchAllTags()

      ElMessage.success(`批量创建成功，创建了 ${result.created_count} 个标签`)
      return result
    } catch (error) {
      ElMessage.error('批量创建标签失败')
      console.error('Failed to batch create tags:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const batchDeleteTags = async (data: BatchTagDeleteRequest) => {
    loading.value = true
    try {
      const result = await tagBatchApi.delete(data)

      // Remove deleted tags from lists
      data.tag_ids.forEach(id => {
        const removeFromArray = (array: Tag[]) => {
          const index = array.findIndex(tag => tag.id === id)
          if (index !== -1) {
            array.splice(index, 1)
          }
        }
        removeFromArray(tags.value)
        removeFromArray(allTags.value)
      })

      totalTags.value -= result.deleted_count || 0

      ElMessage.success(`批量删除成功，删除了 ${result.deleted_count} 个标签`)
      return result
    } catch (error) {
      ElMessage.error('批量删除标签失败')
      console.error('Failed to batch delete tags:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const batchUpdateColors = async (data: BatchTagColorUpdateRequest) => {
    loading.value = true
    try {
      const result = await tagBatchApi.updateColors(data)

      // Update colors in lists
      data.updates.forEach(update => {
        const updateInArray = (array: Tag[]) => {
          const tag = array.find(t => t.id === update.id)
          if (tag) {
            tag.color = update.color
          }
        }
        updateInArray(tags.value)
        updateInArray(allTags.value)
      })

      ElMessage.success(`批量更新颜色成功，更新了 ${result.updated_count} 个标签`)
      return result
    } catch (error) {
      ElMessage.error('批量更新颜色失败')
      console.error('Failed to batch update colors:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Color management
  const fetchColorStats = async () => {
    try {
      const stats = await tagColorApi.getColorStats()
      colorStats.value = stats
      return stats
    } catch (error) {
      console.error('Failed to fetch color stats:', error)
      throw error
    }
  }

  const suggestColors = async (count: number = 5, exclude: string[] = []) => {
    try {
      const colors = await tagColorApi.suggestColors({ count, exclude })
      return colors
    } catch (error) {
      console.error('Failed to suggest colors:', error)
      return DEFAULT_TAG_COLORS.slice(0, count)
    }
  }

  // Statistics
  const fetchTagStats = async () => {
    try {
      const stats = await tagStatsApi.getStats()
      tagStats.value = stats
      return stats
    } catch (error) {
      ElMessage.error('获取标签统计失败')
      console.error('Failed to fetch tag stats:', error)
      throw error
    }
  }

  // Utility actions
  const setFilters = (newFilters: Partial<TagListParams>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {
      page: 1,
      page_size: 20,
      sort_by: 'created_at',
      sort_order: 'desc'
    }
  }

  const clearCurrentTag = () => {
    currentTag.value = null
  }

  const clearTags = () => {
    tags.value = []
    allTags.value = []
    totalTags.value = 0
    currentPage.value = 1
    totalPages.value = 0
  }

  const recalculateTagCount = async (tagId: number) => {
    try {
      const updatedTag = await tagApi.recalculateCount(tagId)

      // Update in lists
      const updateInArray = (array: Tag[]) => {
        const index = array.findIndex(tag => tag.id === tagId)
        if (index !== -1) {
          array[index] = updatedTag
        }
      }

      updateInArray(tags.value)
      updateInArray(allTags.value)

      ElMessage.success('重新计算标签计数成功')
      return updatedTag
    } catch (error) {
      ElMessage.error('重新计算标签计数失败')
      throw error
    }
  }

  return {
    // State
    tags,
    allTags,
    currentTag,
    tagUsers,
    tagStats,
    colorStats,
    totalTags,
    currentPage,
    pageSize,
    totalPages,
    loading,
    searchLoading,
    filters,
    searchSuggestions,
    popularTags,
    recentTags,
    unusedTags,

    // Computed
    hasTags,
    usedTags,
    emptyTags,
    colorGroups,
    paginationInfo,

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
    fetchColorStats,
    suggestColors,
    fetchTagStats,
    setFilters,
    resetFilters,
    clearCurrentTag,
    clearTags,
    recalculateTagCount
  }
})