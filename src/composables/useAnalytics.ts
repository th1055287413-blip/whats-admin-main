import { ref, computed } from 'vue'
import { analyticsApi } from '@/api/analytics'
import type {
  AnalyticsParams,
  UserAnalytics,
  GrowthTrend,
  ActivityAnalytics,
  MessageAnalytics,
  GeographicAnalytics,
  RealTimeStats,
  CustomReportConfig
} from '@/types/analytics'

export function useAnalytics() {
  // 状态管理
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 数据状态
  const userAnalytics = ref<UserAnalytics | null>(null)
  const growthTrend = ref<GrowthTrend | null>(null)
  const activityAnalytics = ref<ActivityAnalytics | null>(null)
  const messageAnalytics = ref<MessageAnalytics | null>(null)
  const geographicAnalytics = ref<GeographicAnalytics | null>(null)
  const realTimeStats = ref<RealTimeStats | null>(null)

  // 计算属性
  const hasData = computed(() => {
    return userAnalytics.value !== null ||
           growthTrend.value !== null ||
           activityAnalytics.value !== null
  })

  const totalUsers = computed(() => {
    return userAnalytics.value?.overview.total_users || 0
  })

  const activeUsers = computed(() => {
    return userAnalytics.value?.overview.active_users || 0
  })

  const onlineUsers = computed(() => {
    return realTimeStats.value?.online_users || 0
  })

  const growthRate = computed(() => {
    return userAnalytics.value?.overview.growth_rate || 0
  })

  // 获取用户分析数据
  const fetchUserAnalytics = async (params: AnalyticsParams = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getUserAnalytics(params)
      userAnalytics.value = response.data.data
      return userAnalytics.value
    } catch (err) {
      error.value = err.message || '获取用户分析数据失败'
      console.error('Failed to fetch user analytics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取用户增长趋势
  const fetchGrowthTrend = async (period: string = 'monthly', duration: number = 30) => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getUserGrowthTrend({ period, duration })
      growthTrend.value = response.data.data
      return growthTrend.value
    } catch (err) {
      error.value = err.message || '获取增长趋势数据失败'
      console.error('Failed to fetch growth trend:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取用户活动分析
  const fetchActivityAnalytics = async (period: string = 'daily') => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getUserActivityAnalytics({ period })
      activityAnalytics.value = response.data.data
      return activityAnalytics.value
    } catch (err) {
      error.value = err.message || '获取活动分析数据失败'
      console.error('Failed to fetch activity analytics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取消息分析数据
  const fetchMessageAnalytics = async (params: AnalyticsParams = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getMessageAnalytics(params)
      messageAnalytics.value = response.data.data
      return messageAnalytics.value
    } catch (err) {
      error.value = err.message || '获取消息分析数据失败'
      console.error('Failed to fetch message analytics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取地理分析数据
  const fetchGeographicAnalytics = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getGeographicAnalytics()
      geographicAnalytics.value = response.data.data
      return geographicAnalytics.value
    } catch (err) {
      error.value = err.message || '获取地理分析数据失败'
      console.error('Failed to fetch geographic analytics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取实时统计
  const fetchRealTimeStats = async () => {
    try {
      const response = await analyticsApi.getRealTimeStats()
      realTimeStats.value = response.data.data
      return realTimeStats.value
    } catch (err) {
      console.error('Failed to fetch real-time stats:', err)
      throw err
    }
  }

  // 获取用户行为分析
  const fetchUserBehaviorAnalytics = async (userId: number, period: string = 'monthly') => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getUserBehaviorAnalytics(userId, { period })
      return response.data.data
    } catch (err) {
      error.value = err.message || '获取用户行为分析失败'
      console.error('Failed to fetch user behavior analytics:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取队列分析
  const fetchCohortAnalysis = async (period: string = 'monthly') => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getCohortAnalysis({ period })
      return response.data.data
    } catch (err) {
      error.value = err.message || '获取队列分析失败'
      console.error('Failed to fetch cohort analysis:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取增长预测
  const fetchGrowthPrediction = async (days: number = 30) => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getUserGrowthPrediction({ days })
      return response.data.data
    } catch (err) {
      error.value = err.message || '获取增长预测失败'
      console.error('Failed to fetch growth prediction:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取流失预测
  const fetchChurnPrediction = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getChurnPrediction()
      return response.data.data
    } catch (err) {
      error.value = err.message || '获取流失预测失败'
      console.error('Failed to fetch churn prediction:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 生成自定义报表
  const generateCustomReport = async (config: CustomReportConfig) => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.generateCustomReport(config)
      return response.data.data
    } catch (err) {
      error.value = err.message || '生成自定义报表失败'
      console.error('Failed to generate custom report:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取分析概览
  const fetchAnalyticsOverview = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await analyticsApi.getAnalyticsOverview()
      return response.data.data
    } catch (err) {
      error.value = err.message || '获取分析概览失败'
      console.error('Failed to fetch analytics overview:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 刷新所有数据
  const refreshAllData = async () => {
    try {
      await Promise.all([
        fetchUserAnalytics(),
        fetchRealTimeStats(),
        fetchGrowthTrend(),
        fetchActivityAnalytics()
      ])
    } catch (err) {
      console.error('Failed to refresh analytics data:', err)
    }
  }

  // 定时刷新实时数据
  const startRealTimeUpdates = (interval: number = 30000) => {
    const timer = setInterval(() => {
      fetchRealTimeStats()
    }, interval)

    return () => clearInterval(timer)
  }

  // 图表配置生成器
  const generateChartOptions = {
    // 用户增长趋势图
    userGrowthChart: (data: any[]) => ({
      title: {
        text: '用户增长趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const point = params[0]
          return `${point.axisValue}<br/>新增用户: ${point.value}`
        }
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.date)
      },
      yAxis: {
        type: 'value',
        name: '用户数'
      },
      series: [{
        name: '新增用户',
        type: 'line',
        data: data.map(item => item.value),
        smooth: true,
        areaStyle: {
          opacity: 0.3
        }
      }]
    }),

    // 状态分布饼图
    statusDistributionChart: (data: any[]) => ({
      title: {
        text: '用户状态分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [{
        name: '用户状态',
        type: 'pie',
        radius: '50%',
        data: data.map(item => ({
          value: item.count,
          name: item.status
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }),

    // 地理分布图
    geographicChart: (data: any[]) => ({
      title: {
        text: '地理分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}'
      },
      geo: {
        map: 'world',
        roam: true,
        emphasis: {
          label: {
            show: true
          },
          itemStyle: {
            areaColor: '#f7f7f7'
          }
        }
      },
      series: [{
        name: '用户数量',
        type: 'map',
        geoIndex: 0,
        data: data.map(item => ({
          name: item.country,
          value: item.count
        }))
      }]
    }),

    // 活动热力图
    activityHeatmap: (data: any[]) => ({
      title: {
        text: '用户活动热力图',
        left: 'center'
      },
      tooltip: {
        position: 'top'
      },
      grid: {
        height: '50%',
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, i) => `${i}:00`)
      },
      yAxis: {
        type: 'category',
        data: ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      },
      visualMap: {
        min: 0,
        max: Math.max(...data.map(item => item.value)),
        calculable: true,
        inRange: {
          color: ['#50a3ba', '#eac736', '#d94e5d']
        }
      },
      series: [{
        name: '活动量',
        type: 'heatmap',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }

  // 数据格式化工具
  const formatters = {
    // 格式化数字
    formatNumber: (value: number, precision: number = 0) => {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(precision) + 'M'
      } else if (value >= 1000) {
        return (value / 1000).toFixed(precision) + 'K'
      }
      return value.toFixed(precision)
    },

    // 格式化百分比
    formatPercentage: (value: number, precision: number = 1) => {
      return value.toFixed(precision) + '%'
    },

    // 格式化增长率
    formatGrowthRate: (value: number) => {
      const sign = value >= 0 ? '+' : ''
      return sign + value.toFixed(1) + '%'
    },

    // 格式化时间
    formatTime: (timestamp: string) => {
      return new Date(timestamp).toLocaleString()
    }
  }

  return {
    // 状态
    loading,
    error,
    hasData,

    // 数据
    userAnalytics,
    growthTrend,
    activityAnalytics,
    messageAnalytics,
    geographicAnalytics,
    realTimeStats,

    // 计算属性
    totalUsers,
    activeUsers,
    onlineUsers,
    growthRate,

    // 方法
    fetchUserAnalytics,
    fetchGrowthTrend,
    fetchActivityAnalytics,
    fetchMessageAnalytics,
    fetchGeographicAnalytics,
    fetchRealTimeStats,
    fetchUserBehaviorAnalytics,
    fetchCohortAnalysis,
    fetchGrowthPrediction,
    fetchChurnPrediction,
    generateCustomReport,
    fetchAnalyticsOverview,
    refreshAllData,
    startRealTimeUpdates,

    // 工具
    generateChartOptions,
    formatters
  }
}