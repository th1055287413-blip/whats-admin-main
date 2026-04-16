<template>
  <div class="contact-chart">
    <el-card shadow="never">
      <template #header>
        <div class="chart-header">
          <span>{{ title }}</span>
          <div class="chart-controls">
            <el-radio-group
              v-model="chartType"
              size="small"
              @change="handleChartTypeChange"
            >
              <el-radio-button label="pie">饼图</el-radio-button>
              <el-radio-button label="bar">柱状图</el-radio-button>
              <el-radio-button label="line">趋势图</el-radio-button>
            </el-radio-group>

            <el-select
              v-model="timeRange"
              size="small"
              style="width: 120px; margin-left: 12px"
              @change="handleTimeRangeChange"
            >
              <el-option label="最近7天" value="7d" />
              <el-option label="最近30天" value="30d" />
              <el-option label="最近90天" value="90d" />
            </el-select>

            <el-button
              size="small"
              :icon="Refresh"
              @click="handleRefresh"
              :loading="loading"
            />
          </div>
        </div>
      </template>

      <div v-loading="loading" class="chart-container">
        <!-- 统计概览 -->
        <div class="chart-stats">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number">{{ stats.totalContacts }}</div>
                <div class="stat-label">总联系人</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number suspicious">{{ stats.suspiciousContacts }}</div>
                <div class="stat-label">可疑联系人</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number reviewed">{{ stats.reviewedContacts }}</div>
                <div class="stat-label">已审核</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <div class="stat-number rate">{{ suspiciousRate }}%</div>
                <div class="stat-label">可疑率</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 图表区域 -->
        <div class="chart-content" :style="{ height: chartHeight }">
          <!-- 饼图 - 按操作类型分布 -->
          <div
            v-show="chartType === 'pie'"
            ref="pieChartRef"
            class="chart-canvas"
          />

          <!-- 柱状图 - 按风险等级分布 -->
          <div
            v-show="chartType === 'bar'"
            ref="barChartRef"
            class="chart-canvas"
          />

          <!-- 趋势图 - 时间序列数据 -->
          <div
            v-show="chartType === 'line'"
            ref="lineChartRef"
            class="chart-canvas"
          />
        </div>

        <!-- 无数据提示 -->
        <div v-if="!hasData && !loading" class="no-data">
          <el-empty description="暂无数据" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ContactMonitorStats, ContactAction, RiskLevel } from '@/types/monitor'

// Props
interface Props {
  title?: string
  height?: string
  stats?: ContactMonitorStats | null
  loading?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '联系人监控分析',
  height: '400px',
  refreshInterval: 0
})

// Emits
const emit = defineEmits<{
  refresh: []
  timeRangeChange: [range: string]
  chartTypeChange: [type: string]
}>()

// 组件状态
const chartType = ref<'pie' | 'bar' | 'line'>('pie')
const timeRange = ref('7d')
const pieChartRef = ref<HTMLElement>()
const barChartRef = ref<HTMLElement>()
const lineChartRef = ref<HTMLElement>()

// ECharts实例
let pieChart: echarts.ECharts | null = null
let barChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

// 自动刷新计时器
let refreshTimer: number | null = null

// 计算属性
const chartHeight = computed(() => props.height)

const hasData = computed(() => {
  return props.stats && (
    props.stats.totalContacts > 0 ||
    Object.values(props.stats.contactsByAction).some(value => value > 0) ||
    props.stats.timeSeriesData.length > 0
  )
})

const suspiciousRate = computed(() => {
  if (!props.stats || props.stats.totalContacts === 0) return 0
  return Math.round((props.stats.suspiciousContacts / props.stats.totalContacts) * 100)
})

// 图表数据处理
const getPieChartData = () => {
  if (!props.stats) return []

  const actionLabels: Record<ContactAction, string> = {
    add: '添加联系人',
    remove: '删除联系人',
    block: '屏蔽联系人',
    unblock: '解除屏蔽'
  }

  return Object.entries(props.stats.contactsByAction).map(([action, count]) => ({
    name: actionLabels[action as ContactAction] || action,
    value: count
  }))
}

const getBarChartData = () => {
  if (!props.stats) return { categories: [], data: [] }

  const riskLabels: Record<RiskLevel, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }

  const categories = Object.keys(props.stats.contactsByRiskLevel).map(
    level => riskLabels[level as RiskLevel] || level
  )
  const data = Object.values(props.stats.contactsByRiskLevel)

  return { categories, data }
}

const getLineChartData = () => {
  if (!props.stats || !props.stats.timeSeriesData) {
    return { dates: [], contactCounts: [], suspiciousCounts: [] }
  }

  const dates = props.stats.timeSeriesData.map(item =>
    new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  )
  const contactCounts = props.stats.timeSeriesData.map(item => item.count)
  const suspiciousCounts = props.stats.timeSeriesData.map(item => item.suspiciousCount || 0)

  return { dates, contactCounts, suspiciousCounts }
}

// 图表初始化
const initPieChart = async () => {
  await nextTick()
  if (!pieChartRef.value) return

  pieChart = echarts.init(pieChartRef.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'right',
      top: 'center'
    },
    series: [
      {
        name: '联系人操作分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: getPieChartData()
      }
    ],
    color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
  }

  pieChart.setOption(option)
}

const initBarChart = async () => {
  await nextTick()
  if (!barChartRef.value) return

  barChart = echarts.init(barChartRef.value)

  const { categories, data } = getBarChartData()

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '联系人数量',
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (params: any) => {
            const colors = ['#67C23A', '#E6A23C', '#F56C6C']
            return colors[params.dataIndex] || '#409EFF'
          }
        },
        data
      }
    ]
  }

  barChart.setOption(option)
}

const initLineChart = async () => {
  await nextTick()
  if (!lineChartRef.value) return

  lineChart = echarts.init(lineChartRef.value)

  const { dates, contactCounts, suspiciousCounts } = getLineChartData()

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['联系人操作', '可疑操作']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '联系人操作',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 2
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.3
        },
        data: contactCounts,
        color: '#409EFF'
      },
      {
        name: '可疑操作',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 2
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.3
        },
        data: suspiciousCounts,
        color: '#F56C6C'
      }
    ]
  }

  lineChart.setOption(option)
}

// 更新图表数据
const updateCharts = () => {
  if (pieChart) {
    pieChart.setOption({
      series: [{
        data: getPieChartData()
      }]
    })
  }

  if (barChart) {
    const { categories, data } = getBarChartData()
    barChart.setOption({
      xAxis: { data: categories },
      series: [{ data }]
    })
  }

  if (lineChart) {
    const { dates, contactCounts, suspiciousCounts } = getLineChartData()
    lineChart.setOption({
      xAxis: { data: dates },
      series: [
        { data: contactCounts },
        { data: suspiciousCounts }
      ]
    })
  }
}

// 调整图表大小
const resizeCharts = () => {
  pieChart?.resize()
  barChart?.resize()
  lineChart?.resize()
}

// 事件处理
const handleChartTypeChange = (type: string) => {
  emit('chartTypeChange', type)
}

const handleTimeRangeChange = (range: string) => {
  emit('timeRangeChange', range)
}

const handleRefresh = () => {
  emit('refresh')
}

// 自动刷新
const startAutoRefresh = () => {
  if (props.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => {
      if (!props.loading) {
        handleRefresh()
      }
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 监听窗口大小变化
const handleResize = () => {
  resizeCharts()
}

// 监听数据变化
watch(
  () => props.stats,
  () => {
    updateCharts()
  },
  { deep: true }
)

// 生命周期
onMounted(async () => {
  await Promise.all([
    initPieChart(),
    initBarChart(),
    initLineChart()
  ])

  window.addEventListener('resize', handleResize)
  startAutoRefresh()
})

onUnmounted(() => {
  pieChart?.dispose()
  barChart?.dispose()
  lineChart?.dispose()

  window.removeEventListener('resize', handleResize)
  stopAutoRefresh()
})
</script>

<style scoped>
.contact-chart {
  width: 100%;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-container {
  position: relative;
}

.chart-stats {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-number.suspicious {
  color: #F56C6C;
}

.stat-number.reviewed {
  color: #67C23A;
}

.stat-number.rate {
  color: #E6A23C;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.chart-content {
  position: relative;
  width: 100%;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 16px;
}
</style>