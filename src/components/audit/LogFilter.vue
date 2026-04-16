<template>
  <div class="log-filter">
    <!-- 快速筛选器 -->
    <div class="quick-filters">
      <div class="filter-group">
        <span class="group-label">时间:</span>
        <el-button-group>
          <el-button
            v-for="filter in timeFilters"
            :key="filter.value"
            :type="filter.active ? 'primary' : 'default'"
            size="small"
            @click="handleQuickFilter(filter)"
          >
            {{ filter.label }}
          </el-button>
        </el-button-group>
      </div>

      <div class="filter-group">
        <span class="group-label">风险:</span>
        <el-button-group>
          <el-button
            v-for="filter in riskFilters"
            :key="filter.value"
            :type="filter.active ? 'primary' : 'default'"
            size="small"
            @click="handleQuickFilter(filter)"
          >
            {{ filter.label }}
          </el-button>
        </el-button-group>
      </div>

      <div v-if="type === 'operation'" class="filter-group">
        <span class="group-label">操作:</span>
        <el-button-group>
          <el-button
            v-for="filter in operationFilters"
            :key="filter.value"
            :type="filter.active ? 'primary' : 'default'"
            size="small"
            @click="handleQuickFilter(filter)"
          >
            {{ filter.label }}
          </el-button>
        </el-button-group>
      </div>

      <div class="filter-actions">
        <el-button
          :icon="Filter"
          @click="toggleAdvanced"
          :type="showAdvanced ? 'primary' : 'default'"
          size="small"
        >
          高级筛选
        </el-button>
        <el-button
          :icon="RefreshLeft"
          @click="clearAllFilters"
          size="small"
        >
          清除
        </el-button>
      </div>
    </div>

    <!-- 高级筛选面板 -->
    <el-collapse-transition>
      <div v-show="showAdvanced" class="advanced-filters">
        <el-form
          :model="advancedFilters"
          label-width="80px"
          size="small"
          class="filter-form"
        >
          <el-row :gutter="16">
            <!-- 时间范围 -->
            <el-col :span="8">
              <el-form-item label="时间范围">
                <el-date-picker
                  v-model="dateRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="YYYY-MM-DD HH:mm"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  :shortcuts="dateShortcuts"
                  style="width: 100%"
                  @change="handleDateRangeChange"
                />
              </el-form-item>
            </el-col>

            <!-- 用户筛选 -->
            <el-col :span="8">
              <el-form-item label="用户">
                <el-select
                  v-model="advancedFilters.users"
                  multiple
                  filterable
                  remote
                  placeholder="搜索用户"
                  :remote-method="searchUsers"
                  :loading="userSearchLoading"
                  style="width: 100%"
                >
                  <el-option
                    v-for="user in userOptions"
                    :key="user.id"
                    :label="user.name"
                    :value="user.id"
                  >
                    <div class="user-option">
                      <el-avatar :size="20" :src="user.avatar">
                        {{ user.name.charAt(0) }}
                      </el-avatar>
                      <span>{{ user.name }}</span>
                      <small>(ID: {{ user.id }})</small>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <!-- IP地址 -->
            <el-col :span="8">
              <el-form-item label="IP地址">
                <el-input
                  v-model="advancedFilters.ipAddress"
                  placeholder="输入IP地址或IP段"
                  clearable
                />
              </el-form-item>
            </el-col>

            <!-- 风险等级 -->
            <el-col :span="8">
              <el-form-item label="风险等级">
                <el-select
                  v-model="advancedFilters.riskLevels"
                  multiple
                  placeholder="选择风险等级"
                  style="width: 100%"
                >
                  <el-option label="低风险" value="low">
                    <RiskLevelTag level="low" />
                  </el-option>
                  <el-option label="中风险" value="medium">
                    <RiskLevelTag level="medium" />
                  </el-option>
                  <el-option label="高风险" value="high">
                    <RiskLevelTag level="high" />
                  </el-option>
                  <el-option label="严重" value="critical">
                    <RiskLevelTag level="critical" />
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 操作日志特有筛选 -->
            <template v-if="type === 'operation'">
              <el-col :span="8">
                <el-form-item label="操作类型">
                  <el-select
                    v-model="advancedFilters.operationTypes"
                    multiple
                    placeholder="选择操作类型"
                    style="width: 100%"
                  >
                    <el-option label="创建" value="create" />
                    <el-option label="读取" value="read" />
                    <el-option label="更新" value="update" />
                    <el-option label="删除" value="delete" />
                    <el-option label="执行" value="execute" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="资源类型">
                  <el-select
                    v-model="advancedFilters.resourceTypes"
                    multiple
                    filterable
                    placeholder="选择资源类型"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="type in resourceTypeOptions"
                      :key="type"
                      :label="type"
                      :value="type"
                    />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="HTTP状态">
                  <el-select
                    v-model="advancedFilters.httpStatus"
                    multiple
                    placeholder="选择状态码"
                    style="width: 100%"
                  >
                    <el-option label="成功 (2xx)" value="2xx" />
                    <el-option label="重定向 (3xx)" value="3xx" />
                    <el-option label="客户端错误 (4xx)" value="4xx" />
                    <el-option label="服务器错误 (5xx)" value="5xx" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="敏感操作">
                  <el-radio-group v-model="advancedFilters.isSensitive">
                    <el-radio :label="null">全部</el-radio>
                    <el-radio :label="true">仅敏感</el-radio>
                    <el-radio :label="false">非敏感</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="处理时间">
                  <el-input-number
                    v-model="advancedFilters.minDuration"
                    placeholder="最小时间(ms)"
                    :min="0"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </template>

            <!-- 登录日志特有筛选 -->
            <template v-if="type === 'login'">
              <el-col :span="8">
                <el-form-item label="登录类型">
                  <el-select
                    v-model="advancedFilters.loginTypes"
                    multiple
                    placeholder="选择登录类型"
                    style="width: 100%"
                  >
                    <el-option label="登录" value="login" />
                    <el-option label="登出" value="logout" />
                    <el-option label="会话超时" value="session_timeout" />
                    <el-option label="强制登出" value="force_logout" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="登录状态">
                  <el-select
                    v-model="advancedFilters.loginStatus"
                    multiple
                    placeholder="选择登录状态"
                    style="width: 100%"
                  >
                    <el-option label="成功" value="success" />
                    <el-option label="失败" value="failed" />
                    <el-option label="被阻止" value="blocked" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="可疑登录">
                  <el-radio-group v-model="advancedFilters.isSuspicious">
                    <el-radio :label="null">全部</el-radio>
                    <el-radio :label="true">仅可疑</el-radio>
                    <el-radio :label="false">正常</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="风险评分">
                  <el-slider
                    v-model="riskScoreRange"
                    range
                    :min="0"
                    :max="10"
                    :step="0.1"
                    :format-tooltip="formatRiskScore"
                    @change="handleRiskScoreChange"
                  />
                </el-form-item>
              </el-col>
            </template>

            <!-- 异常检测特有筛选 -->
            <template v-if="type === 'anomaly'">
              <el-col :span="8">
                <el-form-item label="检测类型">
                  <el-select
                    v-model="advancedFilters.detectionTypes"
                    multiple
                    placeholder="选择检测类型"
                    style="width: 100%"
                  >
                    <el-option label="登录异常" value="login_anomaly" />
                    <el-option label="操作异常" value="operation_anomaly" />
                    <el-option label="访问异常" value="access_anomaly" />
                    <el-option label="数据异常" value="data_anomaly" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="严重程度">
                  <el-select
                    v-model="advancedFilters.severities"
                    multiple
                    placeholder="选择严重程度"
                    style="width: 100%"
                  >
                    <el-option label="信息" value="info">
                      <SeverityTag severity="info" />
                    </el-option>
                    <el-option label="警告" value="warning">
                      <SeverityTag severity="warning" />
                    </el-option>
                    <el-option label="错误" value="error">
                      <SeverityTag severity="error" />
                    </el-option>
                    <el-option label="严重" value="critical">
                      <SeverityTag severity="critical" />
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="处理状态">
                  <el-select
                    v-model="advancedFilters.anomalyStatus"
                    placeholder="选择处理状态"
                    style="width: 100%"
                  >
                    <el-option label="全部" value="" />
                    <el-option label="待处理" value="pending" />
                    <el-option label="已确认" value="confirmed" />
                    <el-option label="误报" value="false_positive" />
                  </el-select>
                </el-form-item>
              </el-col>
            </template>

            <!-- 关键字搜索 -->
            <el-col :span="16">
              <el-form-item label="关键字">
                <el-input
                  v-model="advancedFilters.keyword"
                  placeholder="搜索日志内容、描述、路径等"
                  clearable
                  :prefix-icon="Search"
                  @keyup.enter="applyFilters"
                />
              </el-form-item>
            </el-col>

            <!-- 操作按钮 -->
            <el-col :span="8">
              <el-form-item>
                <div class="filter-buttons">
                  <el-button
                    type="primary"
                    :icon="Search"
                    @click="applyFilters"
                  >
                    应用筛选
                  </el-button>
                  <el-button
                    :icon="RefreshLeft"
                    @click="resetAdvancedFilters"
                  >
                    重置
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </el-collapse-transition>

    <!-- 当前筛选条件显示 -->
    <div v-if="hasActiveFilters" class="active-filters">
      <div class="filter-tags">
        <span class="filter-label">当前筛选:</span>
        <el-tag
          v-for="(filter, index) in activeFilterTags"
          :key="index"
          closable
          size="small"
          type="info"
          @close="removeFilter(filter)"
        >
          {{ filter.label }}
        </el-tag>
        <el-button
          size="small"
          link
          type="primary"
          @click="clearAllFilters"
        >
          清除所有
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Filter,
  RefreshLeft,
  Search
} from '@element-plus/icons-vue'

// 组件导入
import RiskLevelTag from './RiskLevelTag.vue'
import SeverityTag from './SeverityTag.vue'

// 类型导入
import type {
  LogFilter,
  QuickFilter,
  LogFilterProps
} from '@/types/audit'

// Props
const props = withDefaults(defineProps<LogFilterProps>(), {
  quickFilters: () => [],
  compact: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: LogFilter]
  apply: [filters: LogFilter]
  reset: []
}>()

// 响应式数据
const showAdvanced = ref(false)
const userSearchLoading = ref(false)
const userOptions = ref<Array<{ id: number; name: string; avatar?: string }>>([])
const resourceTypeOptions = ref<string[]>([
  'users', 'roles', 'permissions', 'settings', 'files', 'messages'
])

const dateRange = ref<[string, string] | null>(null)
const riskScoreRange = ref<[number, number]>([0, 10])

// 高级筛选表单
const advancedFilters = reactive<{
  users: number[]
  ipAddress: string
  riskLevels: string[]
  keyword: string
  // 操作日志特有
  operationTypes?: string[]
  resourceTypes?: string[]
  httpStatus?: string[]
  isSensitive?: boolean | null
  minDuration?: number
  // 登录日志特有
  loginTypes?: string[]
  loginStatus?: string[]
  isSuspicious?: boolean | null
  // 异常检测特有
  detectionTypes?: string[]
  severities?: string[]
  anomalyStatus?: string
}>({
  users: [],
  ipAddress: '',
  riskLevels: [],
  keyword: ''
})

// 快速筛选器
const timeFilters = computed(() => {
  return props.quickFilters.filter(f => f.type === 'time')
})

const riskFilters = computed(() => {
  return props.quickFilters.filter(f => f.type === 'risk')
})

const operationFilters = computed(() => {
  return props.quickFilters.filter(f => f.type === 'operation')
})

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近30分钟',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 30 * 60 * 1000)
      return [start, end]
    }
  },
  {
    text: '最近1小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000)
      return [start, end]
    }
  },
  {
    text: '最近24小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      return [start, end]
    }
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    }
  }
]

// 计算属性
const hasActiveFilters = computed(() => {
  return activeFilterTags.value.length > 0
})

const activeFilterTags = computed(() => {
  const tags: Array<{ label: string; key: string; value: any }> = []

  // 时间范围
  if (dateRange.value) {
    tags.push({
      label: `时间: ${dateRange.value[0]} 至 ${dateRange.value[1]}`,
      key: 'dateRange',
      value: dateRange.value
    })
  }

  // 用户
  if (advancedFilters.users.length > 0) {
    tags.push({
      label: `用户: ${advancedFilters.users.length}个`,
      key: 'users',
      value: advancedFilters.users
    })
  }

  // IP地址
  if (advancedFilters.ipAddress) {
    tags.push({
      label: `IP: ${advancedFilters.ipAddress}`,
      key: 'ipAddress',
      value: advancedFilters.ipAddress
    })
  }

  // 风险等级
  if (advancedFilters.riskLevels.length > 0) {
    tags.push({
      label: `风险: ${advancedFilters.riskLevels.join(', ')}`,
      key: 'riskLevels',
      value: advancedFilters.riskLevels
    })
  }

  // 关键字
  if (advancedFilters.keyword) {
    tags.push({
      label: `关键字: ${advancedFilters.keyword}`,
      key: 'keyword',
      value: advancedFilters.keyword
    })
  }

  // 类型特定的筛选
  if (props.type === 'operation') {
    if (advancedFilters.operationTypes?.length) {
      tags.push({
        label: `操作: ${advancedFilters.operationTypes.join(', ')}`,
        key: 'operationTypes',
        value: advancedFilters.operationTypes
      })
    }
  }

  return tags
})

// 方法
function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

function handleQuickFilter(filter: QuickFilter) {
  emit('apply', buildFilterFromQuick(filter))
}

function handleDateRangeChange(range: [string, string] | null) {
  if (range) {
    applyFilters()
  }
}

function handleRiskScoreChange(range: [number, number]) {
  applyFilters()
}

async function searchUsers(query: string) {
  if (!query) return

  userSearchLoading.value = true
  try {
    // 模拟用户搜索API调用
    await new Promise(resolve => setTimeout(resolve, 300))

    userOptions.value = [
      { id: 1, name: '张三', avatar: '' },
      { id: 2, name: '李四', avatar: '' },
      { id: 3, name: '王五', avatar: '' }
    ].filter(user => user.name.includes(query))
  } catch (error) {
    console.error('Search users failed:', error)
  } finally {
    userSearchLoading.value = false
  }
}

function applyFilters() {
  const filters = buildAdvancedFilters()
  emit('update:modelValue', filters)
  emit('apply', filters)
  ElMessage.success('筛选条件已应用')
}

function resetAdvancedFilters() {
  // 重置所有高级筛选
  Object.keys(advancedFilters).forEach(key => {
    if (Array.isArray((advancedFilters as any)[key])) {
      (advancedFilters as any)[key] = []
    } else {
      (advancedFilters as any)[key] = key === 'isSensitive' || key === 'isSuspicious' ? null : ''
    }
  })

  dateRange.value = null
  riskScoreRange.value = [0, 10]

  applyFilters()
}

function clearAllFilters() {
  resetAdvancedFilters()
  emit('reset')
  ElMessage.info('已清除所有筛选条件')
}

function removeFilter(filter: { key: string; value: any }) {
  switch (filter.key) {
    case 'dateRange':
      dateRange.value = null
      break
    case 'users':
      advancedFilters.users = []
      break
    case 'ipAddress':
      advancedFilters.ipAddress = ''
      break
    case 'riskLevels':
      advancedFilters.riskLevels = []
      break
    case 'keyword':
      advancedFilters.keyword = ''
      break
    case 'operationTypes':
      if (advancedFilters.operationTypes) {
        advancedFilters.operationTypes = []
      }
      break
    default:
      break
  }
  applyFilters()
}

function buildFilterFromQuick(filter: QuickFilter): LogFilter {
  const filters: LogFilter = {}

  if (filter.type === 'time') {
    const now = new Date()
    let start: Date

    switch (filter.value) {
      case '1h':
        start = new Date(now.getTime() - 60 * 60 * 1000)
        break
      case '24h':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '7d':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    filters.time_range = {
      start: start.toISOString(),
      end: now.toISOString()
    }
  } else if (filter.type === 'risk') {
    filters.risk_levels = [filter.value as any]
  }

  return filters
}

function buildAdvancedFilters(): LogFilter {
  const filters: LogFilter = {}

  // 时间范围
  if (dateRange.value) {
    filters.time_range = {
      start: dateRange.value[0],
      end: dateRange.value[1]
    }
  }

  // 用户
  if (advancedFilters.users.length > 0) {
    filters.users = advancedFilters.users.map(id => ({ id, name: '' }))
  }

  // IP地址
  if (advancedFilters.ipAddress) {
    filters.ip_addresses = [advancedFilters.ipAddress]
  }

  // 风险等级
  if (advancedFilters.riskLevels.length > 0) {
    filters.risk_levels = advancedFilters.riskLevels as any
  }

  // 关键字
  if (advancedFilters.keyword) {
    filters.keyword = advancedFilters.keyword
  }

  // 类型特定筛选
  if (props.type === 'operation') {
    if (advancedFilters.operationTypes?.length) {
      filters.operation_types = advancedFilters.operationTypes as any
    }
    if (advancedFilters.resourceTypes?.length) {
      filters.resource_types = advancedFilters.resourceTypes
    }
    if (advancedFilters.isSensitive !== null) {
      filters.is_sensitive = advancedFilters.isSensitive
    }
  }

  return filters
}

function formatRiskScore(value: number) {
  return `${value}/10`
}

// 生命周期
onMounted(() => {
  // 初始化资源类型选项
  // 实际项目中应该从API获取
})

// 监听器
watch(() => props.modelValue, (newVal) => {
  // 同步外部筛选条件到内部状态
  if (newVal.time_range) {
    dateRange.value = [newVal.time_range.start, newVal.time_range.end]
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
.log-filter {
  .quick-filters {
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
    margin-bottom: 16px;

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;

      .group-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        white-space: nowrap;
      }
    }

    .filter-actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
  }

  .advanced-filters {
    background-color: var(--el-bg-color-page);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 16px;

    .filter-form {
      .filter-buttons {
        display: flex;
        gap: 8px;
      }

      .user-option {
        display: flex;
        align-items: center;
        gap: 8px;

        small {
          color: var(--el-text-color-secondary);
          margin-left: auto;
        }
      }
    }
  }

  .active-filters {
    .filter-tags {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;

      .filter-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        white-space: nowrap;
      }
    }
  }
}

// 紧凑模式
.log-filter.compact {
  .quick-filters {
    margin-bottom: 8px;

    .filter-group {
      .group-label {
        font-size: 12px;
      }

      :deep(.el-button-group .el-button) {
        padding: 4px 8px;
        font-size: 12px;
      }
    }
  }

  .advanced-filters {
    padding: 12px;

    .filter-form {
      :deep(.el-form-item) {
        margin-bottom: 12px;
      }

      :deep(.el-form-item__label) {
        font-size: 12px;
      }
    }
  }
}

:deep(.el-date-editor) {
  width: 100%;
}

:deep(.el-slider__runway) {
  margin: 16px 0;
}

:deep(.el-collapse-transition) {
  transition: all 0.3s ease;
}
</style>