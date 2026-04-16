<template>
  <div class="message-filter">
    <el-card shadow="never">
      <template #header>
        <div class="filter-header">
          <span>消息过滤器</span>
          <div class="filter-actions">
            <el-button
              size="small"
              type="primary"
              :icon="Search"
              @click="handleApplyFilter"
              :loading="loading"
            >
              应用过滤
            </el-button>
            <el-button
              size="small"
              :icon="RefreshLeft"
              @click="handleResetFilter"
            >
              重置
            </el-button>
            <el-button
              size="small"
              :icon="expanded ? 'arrow-up' : 'arrow-down'"
              @click="expanded = !expanded"
              text
            >
              {{ expanded ? '收起' : '展开' }}
            </el-button>
          </div>
        </div>
      </template>

      <el-collapse-transition>
        <div v-show="expanded" class="filter-content">
          <el-form
            ref="formRef"
            :model="filterForm"
            label-width="100px"
            size="small"
          >
            <el-row :gutter="16">
              <!-- 基础过滤 -->
              <el-col :span="8">
                <el-form-item label="消息类型">
                  <el-select
                    v-model="filterForm.messageType"
                    placeholder="选择消息类型"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="type in messageTypes"
                      :key="type.value"
                      :label="type.label"
                      :value="type.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="敏感等级">
                  <el-select
                    v-model="filterForm.sensitiveLevel"
                    placeholder="选择敏感等级"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="level in sensitiveLevels"
                      :key="level.value"
                      :label="level.label"
                      :value="level.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="消息状态">
                  <el-select
                    v-model="filterForm.status"
                    placeholder="选择消息状态"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="status in messageStatuses"
                      :key="status.value"
                      :label="status.label"
                      :value="status.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <!-- 用户过滤 -->
              <el-col :span="8">
                <el-form-item label="发送者ID">
                  <el-input
                    v-model.number="filterForm.fromUserId"
                    placeholder="输入发送者ID"
                    type="number"
                    clearable
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="接收者ID">
                  <el-input
                    v-model.number="filterForm.toUserId"
                    placeholder="输入接收者ID"
                    type="number"
                    clearable
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="群组ID">
                  <el-input
                    v-model.number="filterForm.groupId"
                    placeholder="输入群组ID"
                    type="number"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <!-- 时间过滤 -->
              <el-col :span="12">
                <el-form-item label="时间范围">
                  <el-date-picker
                    v-model="dateRange"
                    type="datetimerange"
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                    @change="handleDateRangeChange"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="快速时间">
                  <el-button-group>
                    <el-button
                      v-for="quick in quickTimeOptions"
                      :key="quick.value"
                      size="small"
                      :type="selectedQuickTime === quick.value ? 'primary' : ''"
                      @click="handleQuickTime(quick.value, quick.range)"
                    >
                      {{ quick.label }}
                    </el-button>
                  </el-button-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <!-- 高级过滤 -->
              <el-col :span="8">
                <el-form-item label="包含敏感词">
                  <el-switch
                    v-model="filterForm.hasKeywords"
                    active-text="是"
                    inactive-text="否"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="读取状态">
                  <el-radio-group v-model="filterForm.isRead">
                    <el-radio :label="undefined">全部</el-radio>
                    <el-radio :label="true">已读</el-radio>
                    <el-radio :label="false">未读</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="排序方式">
                  <el-select
                    v-model="filterForm.sortBy"
                    placeholder="选择排序字段"
                    style="width: 60%"
                  >
                    <el-option
                      v-for="sort in sortOptions"
                      :key="sort.value"
                      :label="sort.label"
                      :value="sort.value"
                    />
                  </el-select>
                  <el-select
                    v-model="filterForm.sortOrder"
                    style="width: 40%"
                  >
                    <el-option label="降序" value="desc" />
                    <el-option label="升序" value="asc" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 搜索框 -->
            <el-row>
              <el-col :span="24">
                <el-form-item label="内容搜索">
                  <div class="search-input-wrapper">
                    <el-input
                      v-model="searchKeyword"
                      placeholder="搜索消息内容、消息ID或用户ID..."
                      :prefix-icon="Search"
                      clearable
                      @keyup.enter="handleSearch"
                    >
                      <template #append>
                        <el-button
                          :icon="Search"
                          @click="handleSearch"
                          :loading="loading"
                        />
                      </template>
                    </el-input>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </el-collapse-transition>

      <!-- 活跃过滤器标签 -->
      <div v-if="hasActiveFilters" class="active-filters">
        <div class="active-filters-header">
          <span>当前过滤条件：</span>
          <el-button size="small" text type="danger" @click="handleClearAllFilters">
            清除所有
          </el-button>
        </div>
        <div class="active-filters-tags">
          <el-tag
            v-for="filter in activeFilterTags"
            :key="filter.key"
            closable
            size="small"
            @close="handleRemoveFilter(filter.key)"
          >
            {{ filter.label }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Search, RefreshLeft } from '@element-plus/icons-vue'
import type {
  MessageMonitorFilter,
  MessageType,
  SensitiveLevel,
  MessageStatus
} from '@/types/monitor'

// Props
interface Props {
  loading?: boolean
  initialFilter?: Partial<MessageMonitorFilter>
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Emits
const emit = defineEmits<{
  apply: [filter: MessageMonitorFilter]
  reset: []
  search: [keyword: string]
}>()

// 组件状态
const formRef = ref()
const expanded = ref(false)
const searchKeyword = ref('')
const selectedQuickTime = ref('')
const dateRange = ref<[string, string] | null>(null)

// 过滤表单
const filterForm = reactive<MessageMonitorFilter>({
  page: 1,
  pageSize: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ...props.initialFilter
})

// 选项数据
const messageTypes = [
  { label: '文本', value: 'text' },
  { label: '图片', value: 'image' },
  { label: '文件', value: 'file' },
  { label: '语音', value: 'voice' },
  { label: '视频', value: 'video' }
]

const sensitiveLevels = [
  { label: '正常', value: 'normal' },
  { label: '警告', value: 'warning' },
  { label: '严重', value: 'critical' }
]

const messageStatuses = [
  { label: '正常', value: 'normal' },
  { label: '已屏蔽', value: 'blocked' },
  { label: '已审核', value: 'reviewed' }
]

const sortOptions = [
  { label: '创建时间', value: 'createdAt' },
  { label: '发送时间', value: 'sentAt' },
  { label: '敏感等级', value: 'sensitiveLevel' },
  { label: '消息类型', value: 'messageType' }
]

const quickTimeOptions = [
  {
    label: '最近1小时',
    value: '1h',
    range: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 60 * 60 * 1000)
      return [start, end]
    }
  },
  {
    label: '最近24小时',
    value: '24h',
    range: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
      return [start, end]
    }
  },
  {
    label: '最近7天',
    value: '7d',
    range: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
      return [start, end]
    }
  },
  {
    label: '最近30天',
    value: '30d',
    range: () => {
      const end = new Date()
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      return [start, end]
    }
  }
]

// 计算属性
const hasActiveFilters = computed(() => {
  const { page, pageSize, sortBy, sortOrder, ...filters } = filterForm
  return Object.values(filters).some(value => value !== undefined && value !== null && value !== '')
})

const activeFilterTags = computed(() => {
  const tags: Array<{ key: string; label: string }> = []

  if (filterForm.messageType) {
    const type = messageTypes.find(t => t.value === filterForm.messageType)
    tags.push({ key: 'messageType', label: `类型：${type?.label}` })
  }

  if (filterForm.sensitiveLevel) {
    const level = sensitiveLevels.find(l => l.value === filterForm.sensitiveLevel)
    tags.push({ key: 'sensitiveLevel', label: `敏感等级：${level?.label}` })
  }

  if (filterForm.status) {
    const status = messageStatuses.find(s => s.value === filterForm.status)
    tags.push({ key: 'status', label: `状态：${status?.label}` })
  }

  if (filterForm.fromUserId) {
    tags.push({ key: 'fromUserId', label: `发送者：${filterForm.fromUserId}` })
  }

  if (filterForm.toUserId) {
    tags.push({ key: 'toUserId', label: `接收者：${filterForm.toUserId}` })
  }

  if (filterForm.groupId) {
    tags.push({ key: 'groupId', label: `群组：${filterForm.groupId}` })
  }

  if (filterForm.dateFrom && filterForm.dateTo) {
    tags.push({
      key: 'dateRange',
      label: `时间：${filterForm.dateFrom} 至 ${filterForm.dateTo}`
    })
  }

  if (filterForm.hasKeywords !== undefined) {
    tags.push({
      key: 'hasKeywords',
      label: `包含敏感词：${filterForm.hasKeywords ? '是' : '否'}`
    })
  }

  if (filterForm.isRead !== undefined) {
    tags.push({
      key: 'isRead',
      label: `读取状态：${filterForm.isRead ? '已读' : '未读'}`
    })
  }

  if (searchKeyword.value) {
    tags.push({ key: 'search', label: `搜索：${searchKeyword.value}` })
  }

  return tags
})

// 事件处理
const handleApplyFilter = () => {
  // 重置到第一页
  filterForm.page = 1
  emit('apply', { ...filterForm })
}

const handleResetFilter = () => {
  // 重置表单
  Object.assign(filterForm, {
    fromUserId: undefined,
    toUserId: undefined,
    groupId: undefined,
    messageType: undefined,
    sensitiveLevel: undefined,
    status: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    hasKeywords: undefined,
    isRead: undefined,
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // 重置其他状态
  searchKeyword.value = ''
  selectedQuickTime.value = ''
  dateRange.value = null

  emit('reset')
}

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    emit('search', searchKeyword.value.trim())
  }
}

const handleDateRangeChange = (range: [string, string] | null) => {
  if (range && range.length === 2) {
    filterForm.dateFrom = range[0]
    filterForm.dateTo = range[1]
    selectedQuickTime.value = ''
  } else {
    filterForm.dateFrom = undefined
    filterForm.dateTo = undefined
  }
}

const handleQuickTime = (value: string, rangeFunc: () => [Date, Date]) => {
  selectedQuickTime.value = value
  const [start, end] = rangeFunc()
  const startStr = start.toISOString().slice(0, 19).replace('T', ' ')
  const endStr = end.toISOString().slice(0, 19).replace('T', ' ')

  filterForm.dateFrom = startStr
  filterForm.dateTo = endStr
  dateRange.value = [startStr, endStr]
}

const handleRemoveFilter = (key: string) => {
  switch (key) {
    case 'messageType':
      filterForm.messageType = undefined
      break
    case 'sensitiveLevel':
      filterForm.sensitiveLevel = undefined
      break
    case 'status':
      filterForm.status = undefined
      break
    case 'fromUserId':
      filterForm.fromUserId = undefined
      break
    case 'toUserId':
      filterForm.toUserId = undefined
      break
    case 'groupId':
      filterForm.groupId = undefined
      break
    case 'dateRange':
      filterForm.dateFrom = undefined
      filterForm.dateTo = undefined
      dateRange.value = null
      selectedQuickTime.value = ''
      break
    case 'hasKeywords':
      filterForm.hasKeywords = undefined
      break
    case 'isRead':
      filterForm.isRead = undefined
      break
    case 'search':
      searchKeyword.value = ''
      break
  }

  handleApplyFilter()
}

const handleClearAllFilters = () => {
  handleResetFilter()
  handleApplyFilter()
}

// 监听外部过滤器变化
watch(
  () => props.initialFilter,
  (newFilter) => {
    if (newFilter) {
      Object.assign(filterForm, newFilter)
    }
  },
  { deep: true }
)
</script>

<style scoped>
.message-filter {
  margin-bottom: 16px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-content {
  padding-top: 16px;
}

.search-input-wrapper {
  width: 100%;
}

.active-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.active-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.active-filters-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
}

:deep(.el-card__body) {
  padding: 16px;
}

:deep(.el-form-item) {
  margin-bottom: 12px;
}

:deep(.el-date-picker) {
  width: 100%;
}
</style>