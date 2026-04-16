<template>
  <div class="analytics-dashboard">
    <!-- 顶部概览卡片 -->
    <el-row :gutter="20" class="overview-cards">
      <el-col :span="6" v-for="card in overviewCards" :key="card.title">
        <el-card shadow="hover" class="metric-card">
          <div class="metric-content">
            <div class="metric-icon">
              <el-icon :color="card.color" :size="32">
                <component :is="card.icon" />
              </el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ formatMetricValue(card.value, card.format) }}</div>
              <div class="metric-title">{{ card.title }}</div>
              <div v-if="card.change" class="metric-change" :class="getChangeClass(card.change)">
                <el-icon><component :is="getChangeIcon(card.change)" /></el-icon>
                {{ Math.abs(card.change) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 主要图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 用户增长趋势 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>用户增长趋势</h3>
              <el-radio-group v-model="growthPeriod" size="small" @change="loadGrowthData">
                <el-radio-button label="daily">日</el-radio-button>
                <el-radio-button label="weekly">周</el-radio-button>
                <el-radio-button label="monthly">月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <div v-if="loading" class="chart-loading">
              <el-skeleton animated>
                <template #template>
                  <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
                </template>
              </el-skeleton>
            </div>
            <div v-else ref="growthChartRef" class="chart" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>

      <!-- 用户状态分布 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <h3>用户状态分布</h3>
          </template>
          <div class="chart-container">
            <div v-if="loading" class="chart-loading">
              <el-skeleton animated>
                <template #template>
                  <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
                </template>
              </el-skeleton>
            </div>
            <div v-else ref="statusChartRef" class="chart" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 地理分布和活动热力图 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 地理分布 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="chart-header">
              <h3>地理分布</h3>
              <el-button-group size="small">
                <el-button
                  :type="geoViewMode === 'country' ? 'primary' : ''"
                  @click="geoViewMode = 'country'"
                >
                  国家
                </el-button>
                <el-button
                  :type="geoViewMode === 'city' ? 'primary' : ''"
                  @click="geoViewMode = 'city'"
                >
                  城市
                </el-button>
              </el-button-group>
            </div>
          </template>
          <div class="chart-container">
            <div v-if="loading" class="chart-loading">
              <el-skeleton animated>
                <template #template>
                  <el-skeleton-item variant="rect" style="width: 100%; height: 350px" />
                </template>
              </el-skeleton>
            </div>
            <div v-else class="geo-content">
              <div ref="geoChartRef" class="chart" style="height: 250px"></div>
              <div class="geo-list">
                <div class="geo-item" v-for="item in topGeoData" :key="item.name">
                  <span class="geo-name">{{ item.name }}</span>
                  <div class="geo-bar">
                    <div
                      class="geo-progress"
                      :style="{ width: (item.count / maxGeoCount) * 100 + '%' }"
                    ></div>
                  </div>
                  <span class="geo-count">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 活动热力图 -->
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <h3>用户活动热力图</h3>
          </template>
          <div class="chart-container">
            <div v-if="loading" class="chart-loading">
              <el-skeleton animated>
                <template #template>
                  <el-skeleton-item variant="rect" style="width: 100%; height: 350px" />
                </template>
              </el-skeleton>
            </div>
            <div v-else ref="heatmapChartRef" class="chart" style="height: 350px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-row :gutter="20" class="table-row">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="table-header">
              <h3>详细数据</h3>
              <div class="table-actions">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  @change="handleDateRangeChange"
                />
                <el-button type="primary" size="small" @click="exportData" :icon="Download">
                  导出数据
                </el-button>
                <el-button size="small" @click="refreshData" :icon="Refresh">
                  刷新
                </el-button>
              </div>
            </div>
          </template>

          <el-tabs v-model="activeTab" @tab-click="handleTabClick">
            <el-tab-pane label="用户统计" name="users">
              <el-table
                :data="userTableData"
                border
                stripe
                style="width: 100%"
                v-loading="loading"
                max-height="400"
              >
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="new_users" label="新增用户" width="100" />
                <el-table-column prop="active_users" label="活跃用户" width="100" />
                <el-table-column prop="online_users" label="在线用户" width="100" />
                <el-table-column prop="total_users" label="总用户数" width="100" />
                <el-table-column prop="growth_rate" label="增长率" width="100">
                  <template #default="{ row }">
                    <span :class="getChangeClass(row.growth_rate)">
                      {{ formatPercentage(row.growth_rate) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="retention_rate" label="留存率" width="100">
                  <template #default="{ row }">
                    {{ formatPercentage(row.retention_rate) }}
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="消息统计" name="messages">
              <el-table
                :data="messageTableData"
                border
                stripe
                style="width: 100%"
                v-loading="loading"
                max-height="400"
              >
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="total_messages" label="总消息数" width="120" />
                <el-table-column prop="avg_messages_per_user" label="人均消息数" width="140" />
                <el-table-column prop="peak_hour" label="高峰时段" width="100" />
                <el-table-column prop="message_growth" label="消息增长率" width="120">
                  <template #default="{ row }">
                    <span :class="getChangeClass(row.message_growth)">
                      {{ formatPercentage(row.message_growth) }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="地理统计" name="geographic">
              <el-table
                :data="geoTableData"
                border
                stripe
                style="width: 100%"
                v-loading="loading"
                max-height="400"
              >
                <el-table-column prop="country" label="国家" width="120" />
                <el-table-column prop="user_count" label="用户数" width="100" />
                <el-table-column prop="percentage" label="占比" width="100">
                  <template #default="{ row }">
                    {{ formatPercentage(row.percentage) }}
                  </template>
                </el-table-column>
                <el-table-column prop="growth_rate" label="增长率" width="100">
                  <template #default="{ row }">
                    <span :class="getChangeClass(row.growth_rate)">
                      {{ formatPercentage(row.growth_rate) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="top_cities" label="主要城市" show-overflow-tooltip />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时数据监控 -->
    <el-card shadow="hover" class="realtime-card">
      <template #header>
        <div class="realtime-header">
          <h3>实时监控</h3>
          <div class="realtime-status">
            <el-tag :type="realtimeStatus.type" size="small" effect="plain">
              <el-icon><component :is="realtimeStatus.icon" /></el-icon>
              {{ realtimeStatus.text }}
            </el-tag>
            <span class="last-update">最后更新: {{ lastUpdateTime }}</span>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6" v-for="stat in realtimeStats" :key="stat.title">
          <div class="realtime-stat">
            <div class="stat-value">{{ formatMetricValue(stat.value, stat.format) }}</div>
            <div class="stat-title">{{ stat.title }}</div>
            <div v-if="stat.trend" class="stat-trend" :class="getChangeClass(stat.trend)">
              <el-icon><component :is="getChangeIcon(stat.trend)" /></el-icon>
              {{ Math.abs(stat.trend) }}%
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  User,
  Message,
  Location,
  TrendCharts,
  Download,
  Refresh,
  ArrowUp,
  ArrowDown,
  Minus,
  CircleCheck,
  Warning
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useAnalytics } from '@/composables/useAnalytics'

// 组合函数
const {
  loading,
  userAnalytics,
  realTimeStats,
  fetchUserAnalytics,
  fetchRealTimeStats,
  fetchGrowthTrend,
  fetchGeographicAnalytics,
  refreshAllData,
  startRealTimeUpdates,
  generateChartOptions,
  formatters
} = useAnalytics()

// 响应式数据
const growthPeriod = ref('monthly')
const geoViewMode = ref<'country' | 'city'>('country')
const activeTab = ref('users')
const dateRange = ref([])

// 图表引用
const growthChartRef = ref()
const statusChartRef = ref()
const geoChartRef = ref()
const heatmapChartRef = ref()

// 图表实例
let growthChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null
let geoChart: echarts.ECharts | null = null
let heatmapChart: echarts.ECharts | null = null

// 实时更新定时器
let realtimeTimer: (() => void) | null = null

// 计算属性
const overviewCards = computed(() => [
  {
    title: '总用户数',
    value: userAnalytics.value?.overview.total_users || 0,
    format: 'number',
    icon: User,
    color: '#409EFF',
    change: userAnalytics.value?.overview.growth_rate || 0
  },
  {
    title: '活跃用户',
    value: userAnalytics.value?.overview.active_users || 0,
    format: 'number',
    icon: User,
    color: '#67C23A',
    change: 5.2
  },
  {
    title: '在线用户',
    value: realTimeStats.value?.online_users || 0,
    format: 'number',
    icon: CircleCheck,
    color: '#E6A23C',
    change: 2.1
  },
  {
    title: '消息总数',
    value: realTimeStats.value?.messages_per_min || 0,
    format: 'number',
    icon: Message,
    color: '#F56C6C',
    change: 8.7
  }
])

const topGeoData = computed(() => {
  if (!userAnalytics.value?.top_countries) return []

  return geoViewMode.value === 'country'
    ? userAnalytics.value.top_countries.map(item => ({
        name: item.country,
        count: item.user_count
      }))
    : userAnalytics.value.top_cities.map(item => ({
        name: item.city,
        count: item.user_count
      }))
})

const maxGeoCount = computed(() => {
  return Math.max(...topGeoData.value.map(item => item.count), 1)
})

const realtimeStats = computed(() => [
  {
    title: '在线用户',
    value: realTimeStats.value?.online_users || 0,
    format: 'number',
    trend: 2.1
  },
  {
    title: '活跃会话',
    value: realTimeStats.value?.active_sessions || 0,
    format: 'number',
    trend: -0.5
  },
  {
    title: '每分钟消息',
    value: realTimeStats.value?.messages_per_min || 0,
    format: 'number',
    trend: 15.3
  },
  {
    title: '今日新增',
    value: realTimeStats.value?.new_users_today || 0,
    format: 'number',
    trend: 8.2
  }
])

const realtimeStatus = computed(() => {
  const onlineUsers = realTimeStats.value?.online_users || 0

  if (onlineUsers > 1000) {
    return { type: 'success', icon: CircleCheck, text: '系统正常' }
  } else if (onlineUsers > 500) {
    return { type: 'warning', icon: Warning, text: '负载适中' }
  } else {
    return { type: 'info', icon: Minus, text: '负载较低' }
  }
})

const lastUpdateTime = computed(() => {
  if (!realTimeStats.value?.last_updated) return '--'
  return formatters.formatTime(realTimeStats.value.last_updated)
})

// Mock 表格数据
const userTableData = ref([])
const messageTableData = ref([])
const geoTableData = ref([])

// 方法
const formatMetricValue = (value: number, format: string) => {
  switch (format) {
    case 'number':
      return formatters.formatNumber(value)
    case 'percentage':
      return formatters.formatPercentage(value)
    default:
      return value.toString()
  }
}

const formatPercentage = (value: number) => {
  return formatters.formatPercentage(value)
}

const getChangeClass = (change: number) => {
  if (change > 0) return 'positive-change'
  if (change < 0) return 'negative-change'
  return 'neutral-change'
}

const getChangeIcon = (change: number) => {
  if (change > 0) return ArrowUp
  if (change < 0) return ArrowDown
  return Minus
}

const loadGrowthData = async () => {
  try {
    await fetchGrowthTrend(growthPeriod.value)
    updateGrowthChart()
  } catch (error) {
    ElMessage.error('加载增长数据失败：' + error.message)
  }
}

const handleDateRangeChange = (dates: [string, string] | null) => {
  if (dates) {
    // 重新加载数据
    refreshData()
  }
}

const handleTabClick = (tab: any) => {
  // 切换表格数据
  activeTab.value = tab.name
}

const exportData = () => {
  // 导出当前表格数据
  ElMessage.success('数据导出功能开发中...')
}

const refreshData = async () => {
  try {
    await refreshAllData()
    updateAllCharts()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败：' + error.message)
  }
}

const initCharts = async () => {
  await nextTick()

  // 初始化增长趋势图
  if (growthChartRef.value) {
    growthChart = echarts.init(growthChartRef.value)
    updateGrowthChart()
  }

  // 初始化状态分布图
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
    updateStatusChart()
  }

  // 初始化地理分布图
  if (geoChartRef.value) {
    geoChart = echarts.init(geoChartRef.value)
    updateGeoChart()
  }

  // 初始化热力图
  if (heatmapChartRef.value) {
    heatmapChart = echarts.init(heatmapChartRef.value)
    updateHeatmapChart()
  }

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
}

const updateGrowthChart = () => {
  if (!growthChart || !userAnalytics.value?.growth_trend) return

  const options = generateChartOptions.userGrowthChart(userAnalytics.value.growth_trend)
  growthChart.setOption(options)
}

const updateStatusChart = () => {
  if (!statusChart || !userAnalytics.value?.status_distribution) return

  const options = generateChartOptions.statusDistributionChart(userAnalytics.value.status_distribution)
  statusChart.setOption(options)
}

const updateGeoChart = () => {
  if (!geoChart || !userAnalytics.value?.geographic_data) return

  const options = generateChartOptions.geographicChart(userAnalytics.value.geographic_data)
  geoChart.setOption(options)
}

const updateHeatmapChart = () => {
  if (!heatmapChart || !userAnalytics.value?.activity_data) return

  // 生成热力图数据
  const heatmapData = []
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const value = Math.random() * 100 // Mock 数据
      heatmapData.push([hour, day, Math.round(value)])
    }
  }

  const options = generateChartOptions.activityHeatmap(heatmapData)
  heatmapChart.setOption(options)
}

const updateAllCharts = () => {
  updateGrowthChart()
  updateStatusChart()
  updateGeoChart()
  updateHeatmapChart()
}

const handleResize = () => {
  growthChart?.resize()
  statusChart?.resize()
  geoChart?.resize()
  heatmapChart?.resize()
}

// 生命周期
onMounted(async () => {
  // 初始化数据
  await refreshAllData()

  // 初始化图表
  await initCharts()

  // 开始实时更新
  realtimeTimer = startRealTimeUpdates(30000) // 30秒更新一次
})

onUnmounted(() => {
  // 清理图表实例
  growthChart?.dispose()
  statusChart?.dispose()
  geoChart?.dispose()
  heatmapChart?.dispose()

  // 清理定时器
  if (realtimeTimer) {
    realtimeTimer()
  }

  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped lang="scss">
.analytics-dashboard {
  padding: 20px;

  .overview-cards {
    margin-bottom: 20px;

    .metric-card {
      .metric-content {
        display: flex;
        align-items: center;

        .metric-icon {
          margin-right: 15px;
        }

        .metric-info {
          flex: 1;

          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            line-height: 1;
          }

          .metric-title {
            font-size: 14px;
            color: #909399;
            margin: 5px 0;
          }

          .metric-change {
            font-size: 12px;
            display: flex;
            align-items: center;

            .el-icon {
              margin-right: 2px;
            }

            &.positive-change {
              color: #67C23A;
            }

            &.negative-change {
              color: #F56C6C;
            }

            &.neutral-change {
              color: #909399;
            }
          }
        }
      }
    }
  }

  .chart-row {
    margin-bottom: 20px;

    .chart-card {
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        h3 {
          margin: 0;
          color: #303133;
        }
      }

      .chart-container {
        .chart-loading {
          padding: 20px 0;
        }

        .geo-content {
          .geo-list {
            margin-top: 20px;

            .geo-item {
              display: flex;
              align-items: center;
              margin-bottom: 10px;

              .geo-name {
                width: 80px;
                font-size: 12px;
                color: #606266;
              }

              .geo-bar {
                flex: 1;
                height: 8px;
                background-color: #F0F0F0;
                border-radius: 4px;
                margin: 0 10px;
                position: relative;

                .geo-progress {
                  height: 100%;
                  background: linear-gradient(90deg, #409EFF, #67C23A);
                  border-radius: 4px;
                  transition: width 0.3s ease;
                }
              }

              .geo-count {
                width: 40px;
                text-align: right;
                font-size: 12px;
                color: #303133;
                font-weight: bold;
              }
            }
          }
        }
      }
    }
  }

  .table-row {
    margin-bottom: 20px;

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: #303133;
      }

      .table-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }

    .positive-change {
      color: #67C23A;
    }

    .negative-change {
      color: #F56C6C;
    }

    .neutral-change {
      color: #909399;
    }
  }

  .realtime-card {
    .realtime-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        color: #303133;
      }

      .realtime-status {
        display: flex;
        align-items: center;
        gap: 15px;

        .last-update {
          font-size: 12px;
          color: #909399;
        }
      }
    }

    .realtime-stat {
      text-align: center;
      padding: 20px;
      border: 1px solid #EBEEF5;
      border-radius: 6px;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
        line-height: 1;
      }

      .stat-title {
        font-size: 14px;
        color: #909399;
        margin: 8px 0;
      }

      .stat-trend {
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;

        .el-icon {
          margin-right: 2px;
        }

        &.positive-change {
          color: #67C23A;
        }

        &.negative-change {
          color: #F56C6C;
        }

        &.neutral-change {
          color: #909399;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .analytics-dashboard {
    .overview-cards {
      .el-col {
        margin-bottom: 10px;
      }
    }

    .chart-row {
      .el-col {
        margin-bottom: 20px;
      }
    }
  }
}
</style>