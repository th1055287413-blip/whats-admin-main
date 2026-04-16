<template>
  <div class="file-monitor-container">
    <el-page-header @back="$router.go(-1)" content="文件传输监控">
      <template #extra>
        <el-space>
          <el-button
            type="primary"
            :icon="Refresh"
            @click="refreshData"
            :loading="refreshing"
          >
            刷新
          </el-button>
          <el-dropdown trigger="click">
            <el-button type="default" :icon="Download">
              导出 <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="exportData('excel')">
                  <el-icon><Document /></el-icon> Excel格式
                </el-dropdown-item>
                <el-dropdown-item @click="exportData('csv')">
                  <el-icon><Document /></el-icon> CSV格式
                </el-dropdown-item>
                <el-dropdown-item @click="exportData('pdf')">
                  <el-icon><Document /></el-icon> PDF格式
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            :type="wsConnected ? 'success' : 'danger'"
            :icon="wsConnected ? Connection : Disconnect"
            circle
            :title="wsConnected ? '实时连接已建立' : '实时连接已断开'"
          />
        </el-space>
      </template>
    </el-page-header>

    <!-- 实时统计面板 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="活跃上传"
            :value="activeUploadsSummary.count"
            suffix="个"
          >
            <template #prefix>
              <el-icon color="#409eff"><Upload /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="总体进度"
            :value="activeUploadsSummary.totalProgress"
            suffix="%"
          >
            <template #prefix>
              <el-icon color="#67c23a"><SuccessFilled /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="传输速度"
            :value="formatSpeed(activeUploadsSummary.totalSpeed)"
          >
            <template #prefix>
              <el-icon color="#e6a23c"><Timer /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <el-statistic
            title="系统负载"
            :value="realTimeStats.systemLoad"
            suffix="%"
          >
            <template #prefix>
              <el-icon color="#f56c6c"><Monitor /></el-icon>
            </template>
          </el-statistic>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速筛选 -->
    <el-card class="filter-card">
      <template #header>
        <div class="filter-header">
          <span>快速筛选</span>
          <el-button
            v-if="hasActiveFilters"
            type="danger"
            size="small"
            @click="resetFilters"
          >
            清空筛选
          </el-button>
        </div>
      </template>

      <div class="quick-filters">
        <el-button-group>
          <el-button
            v-for="filter in quickFilterOptions"
            :key="filter.key"
            :type="quickFilters.includes(filter.key) ? 'primary' : 'default'"
            size="small"
            @click="setQuickFilter(filter.key)"
          >
            <el-icon><component :is="filter.icon" /></el-icon>
            {{ filter.label }}
          </el-button>
        </el-button-group>
      </div>

      <!-- 高级筛选 -->
      <el-collapse v-model="activeFiltersPanel" class="advanced-filters">
        <el-collapse-item title="高级筛选" name="advanced">
          <el-form :model="filters" inline>
            <el-form-item label="状态">
              <el-select
                v-model="filters.status"
                multiple
                placeholder="选择状态"
                style="width: 200px"
              >
                <el-option
                  v-for="status in statusOptions"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="传输类型">
              <el-select
                v-model="filters.transferType"
                placeholder="选择类型"
                clearable
                style="width: 150px"
              >
                <el-option label="上传" value="upload" />
                <el-option label="下载" value="download" />
              </el-select>
            </el-form-item>

            <el-form-item label="时间范围">
              <el-select
                v-model="selectedTimeRange"
                placeholder="选择时间范围"
                style="width: 150px"
                @change="handleTimeRangeChange"
              >
                <el-option
                  v-for="range in timeRanges"
                  :key="range.value"
                  :label="range.label"
                  :value="range.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item v-if="selectedTimeRange === 'custom'" label="自定义日期">
              <el-date-picker
                v-model="customDateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                @change="handleCustomDateChange"
              />
            </el-form-item>

            <el-form-item label="关键词">
              <el-input
                v-model="filters.keyword"
                placeholder="文件名或用户名"
                style="width: 200px"
                clearable
                @keyup.enter="applyFilters"
              >
                <template #append>
                  <el-button :icon="Search" @click="applyFilters" />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="applyFilters">应用筛选</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 传输摘要 -->
    <el-card v-if="transferSummary.total > 0" class="summary-card">
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-label">总文件数</div>
          <div class="summary-value">{{ transferSummary.total }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">完成率</div>
          <div class="summary-value">{{ transferSummary.completionRate }}%</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">总大小</div>
          <div class="summary-value">{{ formatFileSize(transferSummary.totalSize) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">已完成大小</div>
          <div class="summary-value">{{ formatFileSize(transferSummary.completedSize) }}</div>
        </div>
      </div>

      <!-- 状态分布 -->
      <div class="status-distribution">
        <el-progress
          :percentage="100"
          :show-text="false"
          :stroke-width="20"
        >
          <template #default="{ percentage }">
            <div class="progress-segments">
              <div
                v-for="(count, status) in transferSummary.statuses"
                :key="status"
                class="progress-segment"
                :class="`status-${status}`"
                :style="{
                  width: `${(count / transferSummary.total) * 100}%`
                }"
                :title="`${getStatusInfo(status).label}: ${count}个`"
              />
            </div>
          </template>
        </el-progress>
        <div class="status-legend">
          <div
            v-for="(count, status) in transferSummary.statuses"
            :key="status"
            class="legend-item"
          >
            <div class="legend-color" :class="`status-${status}`" />
            <span class="legend-text">{{ getStatusInfo(status).label }} ({{ count }})</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 传输列表 -->
    <el-card class="transfers-card">
      <template #header>
        <div class="transfers-header">
          <span>传输记录 ({{ pagination.total }})</span>
          <el-space>
            <el-button
              v-if="selectedTransfers.length > 0"
              type="danger"
              size="small"
              @click="batchCancel"
            >
              批量取消 ({{ selectedTransfers.length }})
            </el-button>
            <el-button
              v-if="selectedTransfers.length > 0"
              type="warning"
              size="small"
              @click="batchRetry"
            >
              批量重试 ({{ selectedTransfers.length }})
            </el-button>
          </el-space>
        </div>
      </template>

      <file-transfer-table
        :transfers="transfers"
        :loading="loading"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @retry="retryTransfer"
        @cancel="cancelTransfer"
        @page-change="handlePageChange"
        @sort-change="handleSortChange"
      />
    </el-card>

    <!-- 加载更多 -->
    <div v-if="pagination.current_page < pagination.total_pages" class="load-more">
      <el-button
        type="primary"
        @click="loadMore"
        :loading="loading"
        size="large"
        block
      >
        加载更多
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Download,
  Document,
  ArrowDown,
  Connection,
  Disconnect,
  Upload,
  SuccessFilled,
  Timer,
  Monitor,
  Search,
  VideoPlay,
  Warning,
  CircleClose,
  Clock,
  Shield
} from '@element-plus/icons-vue'
import { useFileMonitor } from '@/composables/useFileMonitor'
import { useFilesStore } from '@/stores/files'
import FileTransferTable from '@/components/files/FileTransferTable.vue'

const router = useRouter()
const filesStore = useFilesStore()

// 使用文件监控组合式函数
const {
  loading,
  refreshing,
  error,
  lastRefreshTime,
  filters,
  quickFilters,
  realTimeStats,
  transfers,
  activeTransfers,
  pagination,
  transferStats,
  securityStats,
  transferSummary,
  activeUploadsSummary,
  hasActiveFilters,
  timeRanges,
  statusOptions,
  refreshTransfers,
  loadMore,
  refreshActiveTransfers,
  refreshStats,
  fetchRealTimeStats,
  applyFilters,
  resetFilters,
  setQuickFilter,
  setTimeRange,
  retryTransfer,
  cancelTransfer,
  batchOperation,
  formatFileSize,
  formatSpeed,
  formatTime,
  formatDuration,
  getStatusInfo,
  exportData
} = useFileMonitor({
  autoRefresh: true,
  refreshInterval: 30000,
  enableRealTime: true,
  pageSize: 20
})

// 组件状态
const selectedTransfers = ref<string[]>([])
const activeFiltersPanel = ref<string[]>([])
const selectedTimeRange = ref('today')
const customDateRange = ref<[Date, Date] | null>(null)

// WebSocket连接状态
const wsConnected = computed(() => filesStore.wsConnected)

// 快速筛选选项
const quickFilterOptions = [
  { key: 'uploading', label: '上传中', icon: VideoPlay },
  { key: 'failed', label: '失败', icon: Warning },
  { key: 'blocked', label: '已拦截', icon: CircleClose },
  { key: 'today', label: '今天', icon: Clock },
  { key: 'threats', label: '安全威胁', icon: Shield }
]

// 方法
const refreshData = async () => {
  await Promise.all([
    refreshTransfers(),
    refreshActiveTransfers(),
    refreshStats(),
    fetchRealTimeStats()
  ])
}

const handleSelectionChange = (selection: any[]) => {
  selectedTransfers.value = selection.map(item => item.id)
}

const handlePageChange = (page: number) => {
  filters.page = page
  applyFilters()
}

const handleSortChange = (sort: any) => {
  filters.sort_by = sort.prop
  filters.sort_order = sort.order === 'ascending' ? 'asc' : 'desc'
  applyFilters()
}

const handleTimeRangeChange = (value: string) => {
  if (value !== 'custom') {
    setTimeRange(value)
    applyFilters()
  }
}

const handleCustomDateChange = (dates: [Date, Date] | null) => {
  if (dates && dates.length === 2) {
    filters.dateRange = [
      dates[0].toISOString(),
      dates[1].toISOString()
    ]
    applyFilters()
  }
}

const batchCancel = async () => {
  if (selectedTransfers.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要取消选中的 ${selectedTransfers.value.length} 个传输吗？`,
      '批量取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await batchOperation(selectedTransfers.value, 'cancel')
    selectedTransfers.value = []
    ElMessage.success('批量取消成功')
  } catch {
    // 用户取消
  }
}

const batchRetry = async () => {
  if (selectedTransfers.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要重试选中的 ${selectedTransfers.value.length} 个传输吗？`,
      '批量重试',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    await batchOperation(selectedTransfers.value, 'retry')
    selectedTransfers.value = []
    ElMessage.success('批量重试成功')
  } catch {
    // 用户取消
  }
}

// 生命周期
onMounted(async () => {
  // 初始化数据
  await refreshData()

  // 设置默认时间范围
  setTimeRange('today')
})
</script>

<style scoped lang="scss">
.file-monitor-container {
  padding: 20px;
  min-height: calc(100vh - 80px);
  background-color: #f5f7fa;

  .stats-row {
    margin: 20px 0;

    .stat-card {
      text-align: center;

      :deep(.el-statistic__number) {
        font-size: 28px;
        font-weight: 600;
      }

      :deep(.el-statistic__title) {
        font-size: 14px;
        color: #909399;
        margin-bottom: 8px;
      }
    }
  }

  .filter-card {
    margin: 20px 0;

    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .quick-filters {
      margin-bottom: 16px;

      .el-button-group {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
    }

    .advanced-filters {
      margin-top: 16px;

      :deep(.el-collapse-item__header) {
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .summary-card {
    margin: 20px 0;

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 20px;
      margin-bottom: 20px;

      .summary-item {
        text-align: center;

        .summary-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .summary-value {
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    .status-distribution {
      .progress-segments {
        display: flex;
        height: 20px;
        border-radius: 10px;
        overflow: hidden;

        .progress-segment {
          transition: all 0.3s ease;

          &.status-pending {
            background-color: #909399;
          }

          &.status-uploading {
            background-color: #409eff;
          }

          &.status-completed {
            background-color: #67c23a;
          }

          &.status-failed {
            background-color: #f56c6c;
          }

          &.status-blocked {
            background-color: #e6a23c;
          }

          &.status-cancelled {
            background-color: #c0c4cc;
          }
        }
      }

      .status-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 12px;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;

          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;

            &.status-pending {
              background-color: #909399;
            }

            &.status-uploading {
              background-color: #409eff;
            }

            &.status-completed {
              background-color: #67c23a;
            }

            &.status-failed {
              background-color: #f56c6c;
            }

            &.status-blocked {
              background-color: #e6a23c;
            }

            &.status-cancelled {
              background-color: #c0c4cc;
            }
          }

          .legend-text {
            font-size: 12px;
            color: #606266;
          }
        }
      }
    }
  }

  .transfers-card {
    margin: 20px 0;

    .transfers-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .load-more {
    margin: 20px 0;
    text-align: center;
  }
}

@media (max-width: 768px) {
  .file-monitor-container {
    padding: 10px;

    .stats-row {
      .el-col {
        margin-bottom: 10px;
      }
    }

    .summary-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 15px !important;
    }

    .quick-filters {
      .el-button-group {
        flex-direction: column;
        width: 100%;

        .el-button {
          margin: 0 0 8px 0;
          width: 100%;
        }
      }
    }

    .status-legend {
      justify-content: center;

      .legend-item {
        .legend-text {
          font-size: 11px;
        }
      }
    }
  }
}
</style>