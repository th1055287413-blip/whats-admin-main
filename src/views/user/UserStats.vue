<template>
  <div class="user-stats-container">
    <!-- Header -->
    <div class="page-header">
      <h1>帳號統計</h1>
      <div class="header-actions">
        <el-select v-model="selectedPeriod" @change="handlePeriodChange" style="width: 120px">
          <el-option label="今日" value="day" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
          <el-option label="本年" value="year" />
        </el-select>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- Statistics Overview -->
    <div v-else-if="accountStats" class="stats-overview">
      <!-- Main Stats Cards -->
      <div class="main-stats">
        <el-card class="stat-card primary">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ accountStats.total_accounts.toLocaleString() }}</div>
              <div class="stat-label">總帳號數</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card success">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ accountStats.active_accounts.toLocaleString() }}</div>
              <div class="stat-label">活躍帳號</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card warning">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ accountStats.online_accounts.toLocaleString() }}</div>
              <div class="stat-label">在線帳號</div>
            </div>
          </div>
        </el-card>

        <el-card class="stat-card info">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon><Plus /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ accountStats.new_accounts_today.toLocaleString() }}</div>
              <div class="stat-label">今日新增</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Status Distribution -->
      <div class="chart-row">
        <el-card class="chart-card">
          <template #header>
            <h3>帳號管理狀態分佈</h3>
          </template>
          <div class="status-stats">
            <div class="status-item">
              <div class="status-bar active" :style="{ width: getPercentage(accountStats.active_accounts, accountStats.total_accounts) }"></div>
              <div class="status-info">
                <span class="status-label">活躍</span>
                <span class="status-value">{{ accountStats.active_accounts }} ({{ getPercentage(accountStats.active_accounts, accountStats.total_accounts) }})</span>
              </div>
            </div>
            <div class="status-item">
              <div class="status-bar inactive" :style="{ width: getPercentage(accountStats.inactive_accounts, accountStats.total_accounts) }"></div>
              <div class="status-info">
                <span class="status-label">非活躍</span>
                <span class="status-value">{{ accountStats.inactive_accounts }} ({{ getPercentage(accountStats.inactive_accounts, accountStats.total_accounts) }})</span>
              </div>
            </div>
            <div class="status-item">
              <div class="status-bar blocked" :style="{ width: getPercentage(accountStats.blocked_accounts, accountStats.total_accounts) }"></div>
              <div class="status-info">
                <span class="status-label">已封鎖</span>
                <span class="status-value">{{ accountStats.blocked_accounts }} ({{ getPercentage(accountStats.blocked_accounts, accountStats.total_accounts) }})</span>
              </div>
            </div>
            <div class="status-item">
              <div class="status-bar pending" :style="{ width: getPercentage(accountStats.pending_accounts, accountStats.total_accounts) }"></div>
              <div class="status-info">
                <span class="status-label">待審核</span>
                <span class="status-value">{{ accountStats.pending_accounts }} ({{ getPercentage(accountStats.pending_accounts, accountStats.total_accounts) }})</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="chart-card">
          <template #header>
            <h3>新增帳號趨勢</h3>
          </template>
          <div class="growth-stats">
            <div class="growth-item">
              <div class="growth-period">今日</div>
              <div class="growth-value">{{ accountStats.new_accounts_today }}</div>
            </div>
            <div class="growth-item">
              <div class="growth-period">本周</div>
              <div class="growth-value">{{ accountStats.new_accounts_this_week }}</div>
            </div>
            <div class="growth-item">
              <div class="growth-period">本月</div>
              <div class="growth-value">{{ accountStats.new_accounts_this_month }}</div>
            </div>
          </div>
          <div class="trend-indicator">
            <div class="trend-line">
              <div class="trend-point" v-for="n in 7" :key="n" :style="{ height: Math.random() * 60 + 20 + 'px' }"></div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Chart Placeholder -->
      <div v-if="accountCharts" class="charts-section">
        <el-card class="chart-placeholder">
          <template #header>
            <h3>帳號增長圖表</h3>
          </template>
          <div class="chart-content">
            <div class="chart-mock">
              <div class="chart-axis-y">
                <div class="axis-label" v-for="n in 5" :key="n">{{ n * 20 }}</div>
              </div>
              <div class="chart-area">
                <div class="chart-line">
                  <div
                    v-for="(point, index) in mockChartData"
                    :key="index"
                    class="chart-point"
                    :style="{ left: (index / (mockChartData.length - 1)) * 100 + '%', bottom: point + '%' }"
                  ></div>
                </div>
              </div>
              <div class="chart-axis-x">
                <div class="axis-label" v-for="n in 7" :key="n">{{ getDateLabel(n) }}</div>
              </div>
            </div>
            <div class="chart-note">
              <el-alert
                title="圖表功能"
                description="此區域將顯示詳細的帳號增長趨勢圖表。建議整合 ECharts 或 Chart.js 等圖表庫以獲得更好的資料視覺化效果。"
                type="info"
                :closable="false"
              />
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- No Data -->
    <div v-else class="no-data">
      <el-empty description="暫無統計數據" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAccountStats } from '@/composables/useAccount'

// Composables
const { accountStats, accountCharts, fetchAccountStats, fetchAccountCharts } = useAccountStats()

// State
const loading = ref(false)
const selectedPeriod = ref('month')

// Mock data for chart placeholder
const mockChartData = ref([20, 35, 45, 60, 55, 70, 80])

// Methods
const handlePeriodChange = async () => {
  await loadChartData()
}

const handleRefresh = async () => {
  await loadAllData()
}

const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchAccountStats(),
      loadChartData()
    ])
  } catch (error) {
    console.error('Failed to load stats data:', error)
  } finally {
    loading.value = false
  }
}

const loadChartData = async () => {
  try {
    await fetchAccountCharts({ period: selectedPeriod.value as any })
  } catch (error) {
    console.error('Failed to load chart data:', error)
  }
}

// Utility functions
const getPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%'
  return ((value / total) * 100).toFixed(1) + '%'
}

const getDateLabel = (dayOffset: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - (7 - dayOffset))
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// Lifecycle
onMounted(async () => {
  await loadAllData()
})
</script>

<style scoped>
.user-stats-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.loading-container {
  padding: 40px;
}

.stats-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.main-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.primary {
  background: linear-gradient(135deg, #409eff 0%, #6bb6ff 100%);
  color: white;
}

.stat-card.success {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
  color: white;
}

.stat-card.warning {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
  color: white;
}

.stat-card.info {
  background: linear-gradient(135deg, #909399 0%, #b1b3b8 100%);
  color: white;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  font-size: 32px;
  opacity: 0.8;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.status-stats {
  padding: 20px 0;
}

.status-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.status-bar {
  height: 8px;
  border-radius: 4px;
  min-width: 20px;
  transition: width 0.3s ease;
}

.status-bar.active {
  background: #67c23a;
}

.status-bar.inactive {
  background: #909399;
}

.status-bar.blocked {
  background: #f56c6c;
}

.status-bar.pending {
  background: #e6a23c;
}

.status-info {
  display: flex;
  justify-content: space-between;
  flex: 1;
  align-items: center;
}

.status-label {
  font-weight: 500;
}

.status-value {
  color: #606266;
  font-size: 14px;
}

.growth-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.growth-item {
  text-align: center;
}

.growth-period {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.growth-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.trend-indicator {
  padding: 20px;
}

.trend-line {
  display: flex;
  align-items: end;
  gap: 8px;
  height: 60px;
  background: linear-gradient(180deg, transparent 0%, #f5f7fa 100%);
  border-radius: 4px;
  padding: 10px;
}

.trend-point {
  flex: 1;
  background: #409eff;
  border-radius: 2px;
  min-height: 10px;
  transition: height 0.3s ease;
}

.charts-section {
  margin-top: 24px;
}

.chart-placeholder {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-placeholder h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.chart-content {
  padding: 20px 0;
}

.chart-mock {
  display: grid;
  grid-template-areas:
    ". chart"
    "y-axis chart"
    ". x-axis";
  grid-template-columns: 40px 1fr;
  grid-template-rows: 20px 200px 40px;
  gap: 10px;
  margin-bottom: 20px;
}

.chart-axis-y {
  grid-area: y-axis;
  display: flex;
  flex-direction: column-reverse;
  justify-content: space-between;
  align-items: end;
  padding-right: 8px;
}

.chart-axis-x {
  grid-area: x-axis;
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding-top: 8px;
}

.chart-area {
  grid-area: chart;
  position: relative;
  background: linear-gradient(180deg, #f0f9ff 0%, transparent 100%);
  border: 1px solid #e4e7ed;
  border-radius: 6px;
}

.chart-line {
  position: absolute;
  width: 100%;
  height: 100%;
}

.chart-point {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #409eff;
  border-radius: 50%;
  transform: translate(-50%, 50%);
}

.axis-label {
  font-size: 12px;
  color: #606266;
}

.chart-note {
  margin-top: 20px;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
}

@media (max-width: 768px) {
  .user-stats-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .main-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .chart-row {
    grid-template-columns: 1fr;
  }

  .stat-content {
    padding: 15px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-icon {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .main-stats {
    grid-template-columns: 1fr;
  }
}
</style>
