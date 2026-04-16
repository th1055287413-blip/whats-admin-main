<template>
  <div class="advanced-search">
    <el-card shadow="hover">
      <template #header>
        <div class="search-header">
          <div class="header-left">
            <h3>高级搜索</h3>
            <span class="search-summary">{{ searchSummary }}</span>
          </div>
          <div class="header-right">
            <el-button
              type="text"
              @click="showSearchHistory = !showSearchHistory"
              :icon="showSearchHistory ? 'Fold' : 'Expand'"
            >
              搜索历史
            </el-button>
            <el-button
              type="text"
              @click="showSavedSearches = !showSavedSearches"
              :icon="showSavedSearches ? 'Fold' : 'Expand'"
            >
              保存的搜索
            </el-button>
          </div>
        </div>
      </template>

      <div class="search-content">
        <!-- 快速搜索 -->
        <div class="quick-search">
          <el-input
            v-model="quickSearchQuery"
            placeholder="输入关键词进行快速搜索..."
            size="large"
            clearable
            @keyup.enter="handleQuickSearch"
            @input="handleQuickSearchInput"
          >
            <template #prepend>
              <el-select
                v-model="quickSearchFields"
                multiple
                placeholder="搜索字段"
                style="width: 120px"
              >
                <el-option label="姓名" value="name" />
                <el-option label="用户名" value="username" />
                <el-option label="手机号" value="phone" />
              </el-select>
            </template>
            <template #append>
              <el-button
                type="primary"
                :loading="searching"
                @click="handleQuickSearch"
                :icon="Search"
              >
                搜索
              </el-button>
            </template>
          </el-input>

          <!-- 搜索建议 -->
          <div v-if="searchSuggestions.length > 0" class="search-suggestions">
            <el-tag
              v-for="suggestion in searchSuggestions.slice(0, 8)"
              :key="suggestion.value"
              type="info"
              size="small"
              effect="plain"
              @click="applySuggestion(suggestion)"
              style="margin: 2px; cursor: pointer"
            >
              {{ suggestion.label }}
              <span v-if="suggestion.count" class="suggestion-count">({{ suggestion.count }})</span>
            </el-tag>
          </div>
        </div>

        <!-- 高级筛选条件 -->
        <el-collapse v-model="activeCollapse" class="filter-collapse">
          <el-collapse-item title="高级筛选条件" name="advanced">
            <div class="advanced-filters">
              <el-row :gutter="20">
                <!-- 用户状态 -->
                <el-col :span="6">
                  <el-form-item label="用户状态">
                    <el-select
                      v-model="filters.status"
                      multiple
                      placeholder="选择状态"
                      clearable
                      collapse-tags
                      collapse-tags-tooltip
                    >
                      <el-option label="活跃" value="active" />
                      <el-option label="非活跃" value="inactive" />
                      <el-option label="已屏蔽" value="blocked" />
                      <el-option label="待审核" value="pending" />
                    </el-select>
                  </el-form-item>
                </el-col>

                <!-- 在线状态 -->
                <el-col :span="6">
                  <el-form-item label="在线状态">
                    <el-select v-model="filters.isOnline" placeholder="选择在线状态" clearable>
                      <el-option label="在线" :value="true" />
                      <el-option label="离线" :value="false" />
                    </el-select>
                  </el-form-item>
                </el-col>

                <!-- 国家 -->
                <el-col :span="6">
                  <el-form-item label="国家">
                    <el-select
                      v-model="filters.country"
                      multiple
                      filterable
                      allow-create
                      placeholder="选择或输入国家"
                      clearable
                    >
                      <el-option
                        v-for="country in countryOptions"
                        :key="country.value"
                        :label="country.label"
                        :value="country.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>

                <!-- 城市 -->
                <el-col :span="6">
                  <el-form-item label="城市">
                    <el-select
                      v-model="filters.city"
                      multiple
                      filterable
                      allow-create
                      placeholder="选择或输入城市"
                      clearable
                    >
                      <el-option
                        v-for="city in cityOptions"
                        :key="city.value"
                        :label="city.label"
                        :value="city.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <!-- 语言 -->
                <el-col :span="6">
                  <el-form-item label="语言">
                    <el-select
                      v-model="filters.language"
                      multiple
                      placeholder="选择语言"
                      clearable
                      collapse-tags
                    >
                      <el-option label="简体中文" value="zh-CN" />
                      <el-option label="英语" value="en-US" />
                      <el-option label="日语" value="ja-JP" />
                      <el-option label="韩语" value="ko-KR" />
                      <el-option label="法语" value="fr-FR" />
                      <el-option label="德语" value="de-DE" />
                      <el-option label="西班牙语" value="es-ES" />
                    </el-select>
                  </el-form-item>
                </el-col>

                <!-- 标签 -->
                <el-col :span="6">
                  <el-form-item label="标签">
                    <el-select
                      v-model="filters.tagIds"
                      multiple
                      placeholder="选择标签"
                      clearable
                      collapse-tags
                      collapse-tags-tooltip
                    >
                      <el-option
                        v-for="tag in availableTags"
                        :key="tag.id"
                        :label="tag.name"
                        :value="tag.id"
                      >
                        <span style="float: left">{{ tag.name }}</span>
                        <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                          <el-tag size="small" :color="tag.color" style="margin-left: 8px">
                            {{ tag.user_count }}
                          </el-tag>
                        </span>
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>

                <!-- 标签逻辑 -->
                <el-col :span="6" v-if="filters.tagIds && filters.tagIds.length > 1">
                  <el-form-item label="标签逻辑">
                    <el-radio-group v-model="filters.tagOperator">
                      <el-radio label="AND">全部匹配</el-radio>
                      <el-radio label="OR">任一匹配</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>

                <!-- 消息数量范围 -->
                <el-col :span="6">
                  <el-form-item label="消息数量">
                    <el-input-number
                      v-model="filters.messageCountMin"
                      placeholder="最小值"
                      :min="0"
                      :precision="0"
                      style="width: 45%"
                    />
                    <span style="margin: 0 5px">-</span>
                    <el-input-number
                      v-model="filters.messageCountMax"
                      placeholder="最大值"
                      :min="0"
                      :precision="0"
                      style="width: 45%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <!-- 注册时间范围 -->
                <el-col :span="12">
                  <el-form-item label="注册时间">
                    <el-date-picker
                      v-model="filters.createdDateRange"
                      type="datetimerange"
                      range-separator="至"
                      start-placeholder="开始时间"
                      end-placeholder="结束时间"
                      value-format="YYYY-MM-DD HH:mm:ss"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>

                <!-- 最后在线时间范围 -->
                <el-col :span="12">
                  <el-form-item label="最后在线">
                    <el-date-picker
                      v-model="filters.lastSeenRange"
                      type="datetimerange"
                      range-separator="至"
                      start-placeholder="开始时间"
                      end-placeholder="结束时间"
                      value-format="YYYY-MM-DD HH:mm:ss"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 操作按钮 -->
              <div class="filter-actions">
                <el-button
                  type="primary"
                  :loading="searching"
                  @click="handleAdvancedSearch"
                  :icon="Search"
                >
                  执行搜索
                </el-button>

                <el-button @click="resetFilters" :icon="RefreshLeft">
                  重置条件
                </el-button>

                <el-button
                  type="success"
                  :disabled="!canSaveSearch"
                  @click="showSaveSearchDialog = true"
                  :icon="DocumentAdd"
                >
                  保存搜索
                </el-button>

                <el-button
                  type="info"
                  :disabled="!hasSearchResults"
                  @click="exportResults"
                  :icon="Download"
                >
                  导出结果
                </el-button>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <!-- 搜索结果统计 -->
        <div v-if="hasSearchResults" class="search-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="搜索结果" :value="searchTotal" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="搜索用时" :value="searchTime" suffix="ms" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="活跃筛选条件" :value="activeFilterCount" />
            </el-col>
            <el-col :span="6">
              <div class="search-actions">
                <el-button
                  type="text"
                  @click="clearSearch"
                  :icon="Close"
                >
                  清除搜索
                </el-button>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 搜索历史侧边栏 -->
    <el-drawer
      v-model="showSearchHistory"
      title="搜索历史"
      direction="rtl"
      size="400px"
    >
      <div class="search-history">
        <div class="history-actions">
          <el-button
            type="danger"
            size="small"
            @click="handleClearHistory"
            :icon="Delete"
          >
            清空历史
          </el-button>
        </div>

        <el-timeline>
          <el-timeline-item
            v-for="item in searchHistory"
            :key="item.id"
            :timestamp="formatTime(item.search_time)"
            placement="top"
          >
            <div class="history-item">
              <div class="history-summary">
                <span class="result-count">{{ item.result_count }} 个结果</span>
                <span class="execution-time">{{ item.execution_time }}ms</span>
              </div>
              <div class="history-params">
                {{ generateHistoryDescription(item.params) }}
              </div>
              <div class="history-actions">
                <el-button
                  type="text"
                  size="small"
                  @click="applyHistorySearch(item.params)"
                >
                  重新搜索
                </el-button>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-drawer>

    <!-- 保存的搜索侧边栏 -->
    <el-drawer
      v-model="showSavedSearches"
      title="保存的搜索"
      direction="rtl"
      size="400px"
    >
      <div class="saved-searches">
        <el-empty v-if="savedSearches.length === 0" description="暂无保存的搜索" />

        <div v-else class="saved-search-list">
          <div
            v-for="savedSearch in savedSearches"
            :key="savedSearch.id"
            class="saved-search-item"
          >
            <div class="search-info">
              <h4>{{ savedSearch.name }}</h4>
              <p v-if="savedSearch.description" class="search-description">
                {{ savedSearch.description }}
              </p>
              <div class="search-meta">
                <el-tag size="small" type="info">
                  使用 {{ savedSearch.use_count }} 次
                </el-tag>
                <span class="created-time">
                  {{ formatTime(savedSearch.created_at) }}
                </span>
              </div>
            </div>
            <div class="search-actions">
              <el-button
                type="primary"
                size="small"
                @click="loadSavedSearch(savedSearch.id)"
              >
                应用
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="deleteSavedSearchItem(savedSearch.id)"
              >
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 保存搜索对话框 -->
    <el-dialog v-model="showSaveSearchDialog" title="保存搜索" width="500px">
      <el-form :model="saveSearchForm" label-width="100px">
        <el-form-item label="搜索名称" required>
          <el-input
            v-model="saveSearchForm.name"
            placeholder="请输入搜索名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="saveSearchForm.description"
            type="textarea"
            placeholder="请输入搜索描述（可选）"
            maxlength="200"
            show-word-limit
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="公开设置">
          <el-switch
            v-model="saveSearchForm.isPublic"
            active-text="公开"
            inactive-text="私有"
          />
          <div class="form-tip">公开的搜索可以被其他用户查看和使用</div>
        </el-form-item>

        <el-form-item label="搜索预览">
          <div class="search-preview">
            {{ generateSearchSummary() }}
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showSaveSearchDialog = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSaveSearch"
          :disabled="!saveSearchForm.name"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  RefreshLeft,
  DocumentAdd,
  Download,
  Close,
  Delete,
  Fold,
  Expand
} from '@element-plus/icons-vue'
import { useAdvancedSearch } from '@/composables/useAdvancedSearch'
import { useTagStore } from '@/stores/tag'
import type { AdvancedSearchParams, SearchSuggestion } from '@/types/search'

// Emits
interface Emits {
  (e: 'search', results: any[]): void
  (e: 'clear'): void
}

const emit = defineEmits<Emits>()

// Stores
const tagStore = useTagStore()

// Composables
const {
  searching,
  searchResults,
  searchTotal,
  searchTime,
  searchParams,
  savedSearches,
  searchHistory,
  hasActiveFilters,
  activeFilterCount,
  canSaveSearch,
  executeSearch,
  resetSearch,
  updateSearchParams,
  saveSearch,
  loadSavedSearch: loadSavedSearchComposable,
  deleteSavedSearch,
  loadSearchHistory,
  clearSearchHistory,
  exportSearchResults,
  getSearchSuggestions,
  generateSearchSummary
} = useAdvancedSearch()

// Reactive data
const quickSearchQuery = ref('')
const quickSearchFields = ref(['name', 'username', 'phone'])
const searchSuggestions = ref<SearchSuggestion[]>([])

const filters = ref({
  status: [],
  isOnline: null,
  country: [],
  city: [],
  language: [],
  tagIds: [],
  tagOperator: 'AND',
  messageCountMin: null,
  messageCountMax: null,
  createdDateRange: null,
  lastSeenRange: null
})

const activeCollapse = ref(['advanced'])
const showSearchHistory = ref(false)
const showSavedSearches = ref(false)
const showSaveSearchDialog = ref(false)

const saveSearchForm = ref({
  name: '',
  description: '',
  isPublic: false
})

// Mock data for options (should be loaded from API)
const countryOptions = ref([
  { label: '中国', value: '中国' },
  { label: '美国', value: '美国' },
  { label: '日本', value: '日本' },
  { label: '韩国', value: '韩国' },
  { label: '英国', value: '英国' },
  { label: '法国', value: '法国' },
  { label: '德国', value: '德国' }
])

const cityOptions = ref([
  { label: '北京', value: '北京' },
  { label: '上海', value: '上海' },
  { label: '广州', value: '广州' },
  { label: '深圳', value: '深圳' },
  { label: '杭州', value: '杭州' },
  { label: '成都', value: '成都' },
  { label: '武汉', value: '武汉' }
])

// Computed
const availableTags = computed(() => tagStore.tags)

const hasSearchResults = computed(() => searchResults.value.length > 0)

const searchSummary = computed(() => {
  if (!hasActiveFilters.value) {
    return '请设置搜索条件'
  }
  return generateSearchSummary()
})

// Methods
const handleQuickSearch = async () => {
  if (!quickSearchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  const params: AdvancedSearchParams = {
    query: quickSearchQuery.value,
    search_fields: quickSearchFields.value,
    page: 1,
    page_size: 20
  }

  try {
    const result = await executeSearch(params)
    emit('search', result.users)
    ElMessage.success(`找到 ${result.total} 个匹配结果`)
  } catch (error) {
    ElMessage.error('搜索失败：' + error.message)
  }
}

const handleQuickSearchInput = async (value: string) => {
  if (value.length >= 2) {
    try {
      const suggestions = await getSearchSuggestions('query', value)
      searchSuggestions.value = suggestions.slice(0, 8)
    } catch (error) {
      searchSuggestions.value = []
    }
  } else {
    searchSuggestions.value = []
  }
}

const applySuggestion = (suggestion: SearchSuggestion) => {
  quickSearchQuery.value = suggestion.value
  searchSuggestions.value = []
  handleQuickSearch()
}

const handleAdvancedSearch = async () => {
  const params: AdvancedSearchParams = {
    page: 1,
    page_size: 20
  }

  // 构建搜索参数
  if (filters.value.status.length > 0) {
    params.status = filters.value.status
  }

  if (filters.value.isOnline !== null) {
    params.is_online = filters.value.isOnline
  }

  if (filters.value.country.length > 0) {
    params.country = filters.value.country
  }

  if (filters.value.city.length > 0) {
    params.city = filters.value.city
  }

  if (filters.value.language.length > 0) {
    params.language = filters.value.language
  }

  if (filters.value.tagIds.length > 0) {
    params.tag_ids = filters.value.tagIds
    params.tag_operator = filters.value.tagOperator
  }

  if (filters.value.messageCountMin !== null) {
    params.message_count_min = filters.value.messageCountMin
  }

  if (filters.value.messageCountMax !== null) {
    params.message_count_max = filters.value.messageCountMax
  }

  if (filters.value.createdDateRange && filters.value.createdDateRange.length === 2) {
    params.created_date_from = filters.value.createdDateRange[0]
    params.created_date_to = filters.value.createdDateRange[1]
  }

  if (filters.value.lastSeenRange && filters.value.lastSeenRange.length === 2) {
    params.last_seen_from = filters.value.lastSeenRange[0]
    params.last_seen_to = filters.value.lastSeenRange[1]
  }

  try {
    const result = await executeSearch(params)
    emit('search', result.users)
    ElMessage.success(`找到 ${result.total} 个匹配结果`)
  } catch (error) {
    ElMessage.error('搜索失败：' + error.message)
  }
}

const resetFilters = () => {
  filters.value = {
    status: [],
    isOnline: null,
    country: [],
    city: [],
    language: [],
    tagIds: [],
    tagOperator: 'AND',
    messageCountMin: null,
    messageCountMax: null,
    createdDateRange: null,
    lastSeenRange: null
  }
  quickSearchQuery.value = ''
  searchSuggestions.value = []
}

const clearSearch = () => {
  resetSearch()
  resetFilters()
  emit('clear')
  ElMessage.success('已清除搜索条件和结果')
}

const handleSaveSearch = async () => {
  try {
    await saveSearch(
      saveSearchForm.value.name,
      saveSearchForm.value.description,
      saveSearchForm.value.isPublic
    )

    ElMessage.success('搜索已保存')
    showSaveSearchDialog.value = false
    saveSearchForm.value = {
      name: '',
      description: '',
      isPublic: false
    }
  } catch (error) {
    ElMessage.error('保存搜索失败：' + error.message)
  }
}

const loadSavedSearchItem = async (searchId: number) => {
  try {
    await loadSavedSearchComposable(searchId)
    emit('search', searchResults.value)
    showSavedSearches.value = false
    ElMessage.success('已应用保存的搜索')
  } catch (error) {
    ElMessage.error('加载搜索失败：' + error.message)
  }
}

const deleteSavedSearchItem = async (searchId: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个保存的搜索吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await deleteSavedSearch(searchId)
    ElMessage.success('搜索已删除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除搜索失败：' + error.message)
    }
  }
}

const handleClearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有搜索历史吗？',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await clearSearchHistory()
    ElMessage.success('搜索历史已清空')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清空历史失败：' + error.message)
    }
  }
}

const applyHistorySearch = async (params: AdvancedSearchParams) => {
  try {
    const result = await executeSearch(params)
    emit('search', result.users)
    showSearchHistory.value = false
    ElMessage.success('已重新执行搜索')
  } catch (error) {
    ElMessage.error('搜索失败：' + error.message)
  }
}

const exportResults = async () => {
  try {
    await exportSearchResults('excel')
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  }
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString()
}

const generateHistoryDescription = (params: AdvancedSearchParams) => {
  const conditions: string[] = []

  if (params.query) {
    conditions.push(`关键词: "${params.query}"`)
  }

  if (params.status?.length) {
    conditions.push(`状态: ${params.status.join(', ')}`)
  }

  if (params.country?.length) {
    conditions.push(`国家: ${params.country.join(', ')}`)
  }

  return conditions.length > 0 ? conditions.join(' | ') : '无特定条件'
}

// Lifecycle
onMounted(async () => {
  await tagStore.fetchTags()
  await loadSearchHistory()
})

// Watch for changes
watch(quickSearchQuery, (newValue) => {
  if (newValue.length === 0) {
    searchSuggestions.value = []
  }
})
</script>

<style scoped lang="scss">
.advanced-search {
  .search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-left {
      h3 {
        margin: 0 0 5px 0;
        color: #303133;
      }

      .search-summary {
        color: #909399;
        font-size: 14px;
      }
    }

    .header-right {
      .el-button {
        margin-left: 10px;
      }
    }
  }

  .search-content {
    .quick-search {
      margin-bottom: 20px;

      .search-suggestions {
        margin-top: 10px;

        .suggestion-count {
          color: #909399;
          font-size: 12px;
        }
      }
    }

    .filter-collapse {
      margin-bottom: 20px;

      .advanced-filters {
        .el-form-item {
          margin-bottom: 20px;
        }

        .filter-actions {
          text-align: center;
          margin-top: 30px;

          .el-button {
            margin: 0 10px;
          }
        }
      }
    }

    .search-stats {
      padding: 20px;
      background-color: #fafafa;
      border-radius: 6px;

      .search-actions {
        text-align: right;
      }
    }
  }

  .search-history {
    .history-actions {
      margin-bottom: 20px;
      text-align: right;
    }

    .history-item {
      .history-summary {
        margin-bottom: 8px;
        font-size: 14px;

        .result-count {
          color: #409EFF;
          font-weight: bold;
        }

        .execution-time {
          color: #909399;
          margin-left: 10px;
        }
      }

      .history-params {
        color: #606266;
        font-size: 13px;
        margin-bottom: 8px;
      }

      .history-actions {
        text-align: right;
      }
    }
  }

  .saved-searches {
    .saved-search-list {
      .saved-search-item {
        padding: 15px;
        border: 1px solid #EBEEF5;
        border-radius: 6px;
        margin-bottom: 10px;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .search-info {
          h4 {
            margin: 0 0 8px 0;
            color: #303133;
          }

          .search-description {
            color: #606266;
            font-size: 13px;
            margin: 0 0 10px 0;
          }

          .search-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .created-time {
              color: #909399;
              font-size: 12px;
            }
          }
        }

        .search-actions {
          margin-top: 10px;
          text-align: right;

          .el-button {
            margin-left: 8px;
          }
        }
      }
    }
  }

  .form-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 5px;
  }

  .search-preview {
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
    font-size: 13px;
    color: #606266;
  }
}
</style>