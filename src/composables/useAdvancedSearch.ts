import { ref, computed, watch } from 'vue'
import { searchApi } from '@/api/search'
import type {
  AdvancedSearchParams,
  SearchCondition,
  SearchGroup,
  SavedSearch,
  SearchSuggestion,
  SearchHistory,
  SearchTemplate
} from '@/types/search'

export function useAdvancedSearch() {
  // 搜索状态
  const searching = ref(false)
  const searchResults = ref([])
  const searchTotal = ref(0)
  const searchTime = ref(0)

  // 搜索参数
  const searchParams = ref<AdvancedSearchParams>({
    page: 1,
    page_size: 20,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // 搜索条件组
  const searchGroups = ref<SearchGroup[]>([
    {
      id: 'default',
      name: '默认条件组',
      conditions: [],
      operator: 'AND'
    }
  ])

  // 已保存的搜索
  const savedSearches = ref<SavedSearch[]>([])
  const searchHistory = ref<SearchHistory[]>([])
  const searchSuggestions = ref<SearchSuggestion[]>([])

  // 搜索模板
  const searchTemplate = ref<SearchTemplate | null>(null)

  // 计算属性
  const hasActiveFilters = computed(() => {
    return Object.keys(searchParams.value).some(key => {
      const value = searchParams.value[key]
      return value !== undefined && value !== null && value !== '' &&
             (Array.isArray(value) ? value.length > 0 : true) &&
             !['page', 'page_size', 'sort_by', 'sort_order'].includes(key)
    })
  })

  const activeFilterCount = computed(() => {
    return Object.keys(searchParams.value).filter(key => {
      const value = searchParams.value[key]
      return value !== undefined && value !== null && value !== '' &&
             (Array.isArray(value) ? value.length > 0 : true) &&
             !['page', 'page_size', 'sort_by', 'sort_order'].includes(key)
    }).length
  })

  const canSaveSearch = computed(() => {
    return hasActiveFilters.value
  })

  // 执行搜索
  const executeSearch = async (params?: Partial<AdvancedSearchParams>) => {
    searching.value = true
    const startTime = performance.now()

    try {
      const finalParams = { ...searchParams.value, ...params }
      const response = await searchApi.advancedSearch(finalParams)

      searchResults.value = response.data.data.users || []
      searchTotal.value = response.data.data.total || 0
      searchTime.value = performance.now() - startTime

      // 记录搜索历史
      await addToSearchHistory(finalParams, searchTotal.value, searchTime.value)

      return {
        users: searchResults.value,
        total: searchTotal.value,
        time: searchTime.value
      }
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    } finally {
      searching.value = false
    }
  }

  // 重置搜索
  const resetSearch = () => {
    searchParams.value = {
      page: 1,
      page_size: 20,
      sort_by: 'created_at',
      sort_order: 'desc'
    }
    searchGroups.value = [{
      id: 'default',
      name: '默认条件组',
      conditions: [],
      operator: 'AND'
    }]
    searchResults.value = []
    searchTotal.value = 0
    searchTime.value = 0
  }

  // 更新搜索参数
  const updateSearchParams = (updates: Partial<AdvancedSearchParams>) => {
    searchParams.value = { ...searchParams.value, ...updates }
  }

  // 添加搜索条件
  const addSearchCondition = (groupId: string, condition: Omit<SearchCondition, 'id'>) => {
    const group = searchGroups.value.find(g => g.id === groupId)
    if (group) {
      const newCondition: SearchCondition = {
        id: `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...condition
      }
      group.conditions.push(newCondition)
      updateSearchParamsFromGroups()
    }
  }

  // 移除搜索条件
  const removeSearchCondition = (groupId: string, conditionId: string) => {
    const group = searchGroups.value.find(g => g.id === groupId)
    if (group) {
      group.conditions = group.conditions.filter(c => c.id !== conditionId)
      updateSearchParamsFromGroups()
    }
  }

  // 更新搜索条件
  const updateSearchCondition = (groupId: string, conditionId: string, updates: Partial<SearchCondition>) => {
    const group = searchGroups.value.find(g => g.id === groupId)
    if (group) {
      const condition = group.conditions.find(c => c.id === conditionId)
      if (condition) {
        Object.assign(condition, updates)
        updateSearchParamsFromGroups()
      }
    }
  }

  // 从条件组更新搜索参数
  const updateSearchParamsFromGroups = () => {
    const params: AdvancedSearchParams = {
      page: searchParams.value.page,
      page_size: searchParams.value.page_size,
      sort_by: searchParams.value.sort_by,
      sort_order: searchParams.value.sort_order
    }

    // 解析条件组
    searchGroups.value.forEach(group => {
      group.conditions.forEach(condition => {
        if (condition.value !== undefined && condition.value !== null && condition.value !== '') {
          switch (condition.field) {
            case 'query':
              params.query = condition.value
              break
            case 'phone':
              params.phone = condition.value
              break
            case 'name':
              params.name = condition.value
              break
            case 'username':
              params.username = condition.value
              break
            case 'status':
              params.status = Array.isArray(condition.value) ? condition.value : [condition.value]
              break
            case 'is_online':
              params.is_online = condition.value
              break
            case 'country':
              params.country = Array.isArray(condition.value) ? condition.value : [condition.value]
              break
            case 'city':
              params.city = Array.isArray(condition.value) ? condition.value : [condition.value]
              break
            case 'language':
              params.language = Array.isArray(condition.value) ? condition.value : [condition.value]
              break
            case 'tag_ids':
              params.tag_ids = Array.isArray(condition.value) ? condition.value : [condition.value]
              break
            case 'message_count':
              if (condition.operator === 'gte') {
                params.message_count_min = condition.value
              } else if (condition.operator === 'lte') {
                params.message_count_max = condition.value
              }
              break
            case 'created_at':
              if (condition.operator === 'gte') {
                params.created_date_from = condition.value
              } else if (condition.operator === 'lte') {
                params.created_date_to = condition.value
              }
              break
            case 'last_seen':
              if (condition.operator === 'gte') {
                params.last_seen_from = condition.value
              } else if (condition.operator === 'lte') {
                params.last_seen_to = condition.value
              }
              break
          }
        }
      })
    })

    searchParams.value = params
  }

  // 保存搜索
  const saveSearch = async (name: string, description?: string, isPublic: boolean = false) => {
    try {
      const savedSearch = await searchApi.saveSearch({
        name,
        description,
        params: searchParams.value,
        is_public: isPublic
      })

      savedSearches.value.unshift(savedSearch.data.data)
      return savedSearch.data.data
    } catch (error) {
      console.error('Failed to save search:', error)
      throw error
    }
  }

  // 加载已保存的搜索
  const loadSavedSearch = async (searchId: number) => {
    try {
      const savedSearch = savedSearches.value.find(s => s.id === searchId)
      if (savedSearch) {
        searchParams.value = { ...savedSearch.params }
        await executeSearch()

        // 更新使用次数
        await searchApi.updateSearchUsage(searchId)
        savedSearch.use_count++
        savedSearch.last_used_at = new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to load saved search:', error)
      throw error
    }
  }

  // 删除已保存的搜索
  const deleteSavedSearch = async (searchId: number) => {
    try {
      await searchApi.deleteSavedSearch(searchId)
      savedSearches.value = savedSearches.value.filter(s => s.id !== searchId)
    } catch (error) {
      console.error('Failed to delete saved search:', error)
      throw error
    }
  }

  // 获取搜索建议
  const getSearchSuggestions = async (field: string, query: string) => {
    try {
      const response = await searchApi.getSearchSuggestions(field, query)
      return response.data.data
    } catch (error) {
      console.error('Failed to get search suggestions:', error)
      return []
    }
  }

  // 获取搜索历史
  const loadSearchHistory = async (limit: number = 10) => {
    try {
      const response = await searchApi.getSearchHistory({ limit })
      searchHistory.value = response.data.data.items || []
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }

  // 添加到搜索历史
  const addToSearchHistory = async (params: AdvancedSearchParams, resultCount: number, executionTime: number) => {
    try {
      await searchApi.addSearchHistory({
        params,
        result_count: resultCount,
        execution_time: executionTime
      })
    } catch (error) {
      console.error('Failed to add search history:', error)
    }
  }

  // 清除搜索历史
  const clearSearchHistory = async () => {
    try {
      await searchApi.clearSearchHistory()
      searchHistory.value = []
    } catch (error) {
      console.error('Failed to clear search history:', error)
      throw error
    }
  }

  // 导出搜索结果
  const exportSearchResults = async (format: 'excel' | 'csv' = 'excel') => {
    try {
      const response = await searchApi.exportSearchResults({
        ...searchParams.value,
        format
      })

      // 下载文件
      const blob = new Blob([response.data], {
        type: format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `search_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export search results:', error)
      throw error
    }
  }

  // 获取搜索模板
  const loadSearchTemplate = async () => {
    try {
      const response = await searchApi.getSearchTemplate()
      searchTemplate.value = response.data.data
    } catch (error) {
      console.error('Failed to load search template:', error)
    }
  }

  // 应用搜索预设
  const applySearchPreset = (presetParams: Partial<AdvancedSearchParams>) => {
    updateSearchParams(presetParams)
  }

  // 生成搜索摘要
  const generateSearchSummary = () => {
    const conditions: string[] = []

    if (searchParams.value.query) {
      conditions.push(`关键词: "${searchParams.value.query}"`)
    }

    if (searchParams.value.status?.length) {
      conditions.push(`状态: ${searchParams.value.status.join(', ')}`)
    }

    if (searchParams.value.country?.length) {
      conditions.push(`国家: ${searchParams.value.country.join(', ')}`)
    }

    if (searchParams.value.city?.length) {
      conditions.push(`城市: ${searchParams.value.city.join(', ')}`)
    }

    if (searchParams.value.tag_ids?.length) {
      conditions.push(`标签: ${searchParams.value.tag_ids.length} 个`)
    }

    if (searchParams.value.message_count_min !== undefined || searchParams.value.message_count_max !== undefined) {
      const min = searchParams.value.message_count_min || 0
      const max = searchParams.value.message_count_max || '∞'
      conditions.push(`消息数: ${min} - ${max}`)
    }

    return conditions.length > 0 ? conditions.join(' | ') : '无筛选条件'
  }

  // 监听搜索参数变化
  watch(searchParams, (newParams) => {
    // 可以在这里添加自动搜索逻辑
  }, { deep: true })

  return {
    // 状态
    searching,
    searchResults,
    searchTotal,
    searchTime,
    searchParams,
    searchGroups,
    savedSearches,
    searchHistory,
    searchSuggestions,
    searchTemplate,

    // 计算属性
    hasActiveFilters,
    activeFilterCount,
    canSaveSearch,

    // 方法
    executeSearch,
    resetSearch,
    updateSearchParams,
    addSearchCondition,
    removeSearchCondition,
    updateSearchCondition,
    updateSearchParamsFromGroups,
    saveSearch,
    loadSavedSearch,
    deleteSavedSearch,
    getSearchSuggestions,
    loadSearchHistory,
    clearSearchHistory,
    exportSearchResults,
    loadSearchTemplate,
    applySearchPreset,
    generateSearchSummary
  }
}