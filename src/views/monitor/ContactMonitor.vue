<template>
  <div class="contact-monitor">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>联系人监控</h2>
        <el-text type="info">监控用户联系人变化和可疑行为</el-text>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button
            :type="viewMode === 'list' ? 'primary' : ''"
            :icon="List"
            @click="viewMode = 'list'"
          >
            列表视图
          </el-button>
          <el-button
            :type="viewMode === 'chart' ? 'primary' : ''"
            :icon="PieChart"
            @click="viewMode = 'chart'"
          >
            图表视图
          </el-button>
        </el-button-group>
        <el-badge :value="suspiciousCount" :hidden="suspiciousCount === 0">
          <el-button :icon="Warning" circle />
        </el-badge>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="never" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon size="24"><User /></el-icon>
              </div>
              <div class="stat-data">
                <div class="stat-number">{{ totalContacts }}</div>
                <div class="stat-label">总联系人操作</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon suspicious">
                <el-icon size="24"><Warning /></el-icon>
              </div>
              <div class="stat-data">
                <div class="stat-number">{{ suspiciousContacts }}</div>
                <div class="stat-label">可疑操作</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon reviewed">
                <el-icon size="24"><Check /></el-icon>
              </div>
              <div class="stat-data">
                <div class="stat-number">{{ reviewedContacts }}</div>
                <div class="stat-label">已审核</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="never" class="stat-card">
            <div class="stat-content">
              <div class="stat-icon rate">
                <el-icon size="24"><TrendCharts /></el-icon>
              </div>
              <div class="stat-data">
                <div class="stat-number">{{ suspiciousRate }}%</div>
                <div class="stat-label">可疑率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 列表视图 -->
      <div v-show="viewMode === 'list'" class="list-view">
        <el-row :gutter="20">
          <el-col :span="18">
            <!-- 过滤器 -->
            <ContactFilter
              :loading="loading"
              @apply="handleFilterApply"
              @reset="handleFilterReset"
              @search="handleSearch"
            />

            <!-- 联系人列表 -->
            <ContactList
              :contacts="contacts"
              :loading="loading"
              :height="'calc(100vh - 500px)'"
              @contact-click="handleContactClick"
              @review="handleContactReview"
              @batch-review="handleBatchReview"
              @refresh="handleRefresh"
            />
          </el-col>

          <el-col :span="6">
            <!-- 实时数据面板 -->
            <div class="side-panel">
              <!-- 最新可疑操作 -->
              <el-card shadow="never" class="recent-card">
                <template #header>
                  <div class="card-header">
                    <span>最新可疑操作</span>
                    <el-button
                      size="small"
                      text
                      @click="handleClearSuspiciousBuffer"
                    >
                      清空
                    </el-button>
                  </div>
                </template>
                <div class="recent-activities">
                  <div
                    v-for="activity in latestSuspiciousActivities"
                    :key="`${activity.userId}-${activity.timestamp}`"
                    class="activity-item"
                    @click="handleActivityClick(activity)"
                  >
                    <div class="activity-header">
                      <el-tag
                        :type="getRiskLevelTagType(activity.riskLevel)"
                        size="small"
                      >
                        {{ getRiskLevelLabel(activity.riskLevel) }}
                      </el-tag>
                      <span class="activity-time">
                        {{ formatTime(activity.timestamp) }}
                      </span>
                    </div>
                    <div class="activity-content">
                      <div class="activity-action">
                        {{ getActionLabel(activity.action) }}
                      </div>
                      <div class="activity-details">
                        用户ID: {{ activity.userId }} → 联系人ID: {{ activity.contactUserId }}
                      </div>
                      <div class="activity-score">
                        可疑度: {{ activity.suspiciousScore }}/100
                      </div>
                    </div>
                  </div>

                  <div v-if="latestSuspiciousActivities.length === 0" class="no-activities">
                    <el-text type="info">暂无可疑操作</el-text>
                  </div>
                </div>
              </el-card>

              <!-- 行为模式分析 -->
              <el-card shadow="never" class="pattern-card">
                <template #header>
                  <span>行为模式分析</span>
                </template>
                <div class="behavior-patterns">
                  <div class="pattern-item">
                    <div class="pattern-label">频繁添加联系人</div>
                    <div class="pattern-count">{{ behaviorPatterns.frequentAdd }}</div>
                  </div>
                  <div class="pattern-item">
                    <div class="pattern-label">异常删除行为</div>
                    <div class="pattern-count">{{ behaviorPatterns.abnormalRemove }}</div>
                  </div>
                  <div class="pattern-item">
                    <div class="pattern-label">短时间内屏蔽多人</div>
                    <div class="pattern-count">{{ behaviorPatterns.rapidBlock }}</div>
                  </div>
                </div>
              </el-card>

              <!-- 快速操作 -->
              <el-card shadow="never" class="actions-card">
                <template #header>
                  <span>快速操作</span>
                </template>
                <div class="quick-actions">
                  <el-button
                    type="primary"
                    :icon="Download"
                    @click="handleExportReport"
                    block
                  >
                    导出分析报告
                  </el-button>
                  <el-button
                    type="success"
                    :icon="Check"
                    @click="handleReviewAll"
                    :disabled="suspiciousCount === 0"
                    block
                  >
                    批量审核可疑操作
                  </el-button>
                  <el-button
                    type="warning"
                    :icon="Search"
                    @click="handleAdvancedAnalysis"
                    block
                  >
                    高级行为分析
                  </el-button>
                </div>
              </el-card>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 图表视图 -->
      <div v-show="viewMode === 'chart'" class="chart-view">
        <el-row :gutter="20">
          <el-col :span="12">
            <ContactChart
              title="联系人操作分布"
              :stats="contactStats"
              :loading="loading"
              @refresh="handleRefresh"
              @chart-type-change="handleChartTypeChange"
              @time-range-change="handleTimeRangeChange"
            />
          </el-col>
          <el-col :span="12">
            <ContactChart
              title="风险等级分析"
              :stats="contactStats"
              :loading="loading"
              chart-type="bar"
              @refresh="handleRefresh"
            />
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="24">
            <ContactChart
              title="联系人操作趋势"
              :stats="contactStats"
              :loading="loading"
              :height="'300px'"
              chart-type="line"
              @refresh="handleRefresh"
            />
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 联系人详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="联系人操作详情"
      width="70%"
      destroy-on-close
    >
      <ContactDetail
        v-if="detailVisible && selectedContact"
        :contact="selectedContact"
        @update="handleContactUpdate"
        @close="detailVisible = false"
      />
    </el-dialog>

    <!-- 批量审核对话框 -->
    <el-dialog
      v-model="batchReviewVisible"
      title="批量审核"
      width="50%"
    >
      <BatchReviewForm
        v-if="batchReviewVisible"
        :contacts="selectedContacts"
        @confirm="handleBatchReviewConfirm"
        @cancel="batchReviewVisible = false"
      />
    </el-dialog>

    <!-- 高级分析对话框 -->
    <el-dialog
      v-model="analysisVisible"
      title="高级行为分析"
      width="80%"
      destroy-on-close
    >
      <BehaviorAnalysis
        v-if="analysisVisible"
        @close="analysisVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  List,
  PieChart,
  Warning,
  User,
  Check,
  TrendCharts,
  Download,
  Search
} from '@element-plus/icons-vue'
import { useMonitorStore } from '@/stores/monitor'
import { useRealTimeData } from '@/composables/useRealTimeData'
import ContactChart from '@/components/monitor/ContactChart.vue'
import type {
  ContactMonitor,
  ContactMonitorFilter,
  ContactMonitorData,
  ContactAction,
  RiskLevel
} from '@/types/monitor'

// 模拟导入组件（这些组件需要后续创建）
// import ContactFilter from '@/components/monitor/ContactFilter.vue'
// import ContactList from '@/components/monitor/ContactList.vue'
// import ContactDetail from '@/components/monitor/ContactDetail.vue'
// import BatchReviewForm from '@/components/monitor/BatchReviewForm.vue'
// import BehaviorAnalysis from '@/components/monitor/BehaviorAnalysis.vue'

// Store和数据管理
const monitorStore = useMonitorStore()
const realTimeData = useRealTimeData()

// 组件状态
const viewMode = ref<'list' | 'chart'>('list')
const detailVisible = ref(false)
const batchReviewVisible = ref(false)
const analysisVisible = ref(false)
const selectedContact = ref<ContactMonitor | null>(null)
const selectedContacts = ref<ContactMonitor[]>([])

// 从store获取状态
const { contactMonitor } = monitorStore
const loading = computed(() => contactMonitor.loading)
const contacts = computed(() => contactMonitor.data)
const contactStats = computed(() => contactMonitor.stats)

// 实时数据
const { getHighRiskContacts, clearContactBuffer } = realTimeData

// 计算属性
const totalContacts = computed(() => contactStats.value?.totalContacts || 0)
const suspiciousContacts = computed(() => contactStats.value?.suspiciousContacts || 0)
const reviewedContacts = computed(() => contactStats.value?.reviewedContacts || 0)
const suspiciousCount = computed(() =>
  contacts.value.filter(c => c.riskLevel === 'high' && !c.isReviewed).length
)
const suspiciousRate = computed(() => {
  if (totalContacts.value === 0) return 0
  return Math.round((suspiciousContacts.value / totalContacts.value) * 100)
})

const latestSuspiciousActivities = computed(() =>
  getHighRiskContacts().slice(0, 10)
)

// 模拟行为模式数据
const behaviorPatterns = computed(() => ({
  frequentAdd: 15,
  abnormalRemove: 8,
  rapidBlock: 3
}))

// 事件处理
const handleFilterApply = (filter: ContactMonitorFilter) => {
  monitorStore.fetchContactMonitors(filter)
}

const handleFilterReset = () => {
  monitorStore.resetFilters('contacts')
  monitorStore.fetchContactMonitors()
}

const handleSearch = (keyword: string) => {
  // 实现搜索逻辑
  const searchFilter = {
    ...contactMonitor.filter,
    page: 1
  }
  monitorStore.fetchContactMonitors(searchFilter)
}

const handleContactClick = (contact: ContactMonitor) => {
  selectedContact.value = contact
  detailVisible.value = true
}

const handleContactReview = async (contact: ContactMonitor, comment?: string) => {
  try {
    // 调用审核API
    ElMessage.success('联系人操作已审核')
    contact.isReviewed = true
    contact.reviewedAt = new Date().toISOString()
  } catch (error) {
    ElMessage.error('审核失败')
  }
}

const handleBatchReview = (contacts: ContactMonitor[]) => {
  selectedContacts.value = contacts
  batchReviewVisible.value = true
}

const handleBatchReviewConfirm = async (reviewData: any) => {
  try {
    // 调用批量审核API
    ElMessage.success(`已审核 ${selectedContacts.value.length} 条记录`)
    batchReviewVisible.value = false
    selectedContacts.value = []
  } catch (error) {
    ElMessage.error('批量审核失败')
  }
}

const handleRefresh = () => {
  monitorStore.fetchContactMonitors()
}

const handleActivityClick = (activity: ContactMonitorData) => {
  // 根据实时数据创建模拟的ContactMonitor对象
  const contact: ContactMonitor = {
    id: Date.now(),
    userId: activity.userId,
    contactUserId: activity.contactUserId,
    action: activity.action,
    timestamp: activity.timestamp,
    details: activity.details,
    suspiciousScore: activity.suspiciousScore,
    riskLevel: activity.riskLevel,
    isReviewed: false,
    createdAt: activity.timestamp,
    updatedAt: activity.timestamp
  }

  selectedContact.value = contact
  detailVisible.value = true
}

const handleClearSuspiciousBuffer = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空可疑操作缓冲区吗？',
      '确认操作',
      { type: 'warning' }
    )
    clearContactBuffer()
    ElMessage.success('缓冲区已清空')
  } catch {
    // 用户取消
  }
}

const handleExportReport = () => {
  ElMessage.info('导出功能开发中...')
}

const handleReviewAll = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要批量审核 ${suspiciousCount.value} 条可疑操作吗？`,
      '确认操作',
      { type: 'warning' }
    )

    const suspiciousContacts = contacts.value.filter(
      c => c.riskLevel === 'high' && !c.isReviewed
    )
    selectedContacts.value = suspiciousContacts
    batchReviewVisible.value = true
  } catch {
    // 用户取消
  }
}

const handleAdvancedAnalysis = () => {
  analysisVisible.value = true
}

const handleContactUpdate = () => {
  monitorStore.fetchContactMonitors()
}

const handleChartTypeChange = (type: string) => {
  console.log('Chart type changed:', type)
}

const handleTimeRangeChange = (range: string) => {
  console.log('Time range changed:', range)
  // 可以根据时间范围重新获取数据
}

// 工具函数
const getActionLabel = (action: ContactAction) => {
  const labels = {
    add: '添加联系人',
    remove: '删除联系人',
    block: '屏蔽联系人',
    unblock: '解除屏蔽'
  }
  return labels[action] || action
}

const getRiskLevelLabel = (level: RiskLevel) => {
  const labels = {
    low: '低风险',
    medium: '中风险',
    high: '高风险'
  }
  return labels[level] || level
}

const getRiskLevelTagType = (level: RiskLevel) => {
  const types = {
    low: 'success',
    medium: 'warning',
    high: 'danger'
  }
  return types[level] || 'info'
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 生命周期
onMounted(async () => {
  await monitorStore.fetchContactMonitors()
})
</script>

<style scoped>
.contact-monitor {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-icon.suspicious {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.stat-icon.reviewed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.stat-icon.rate {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.stat-data {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.main-content {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.list-view,
.chart-view {
  padding: 20px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-activities {
  max-height: 300px;
  overflow-y: auto;
}

.activity-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.activity-item:hover {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 12px 8px;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

.activity-content {
  font-size: 14px;
}

.activity-action {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.activity-details {
  color: #606266;
  font-size: 13px;
  margin-bottom: 4px;
}

.activity-score {
  color: #F56C6C;
  font-size: 12px;
  font-weight: 500;
}

.no-activities {
  text-align: center;
  padding: 40px 0;
}

.behavior-patterns {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pattern-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.pattern-item:last-child {
  border-bottom: none;
}

.pattern-label {
  font-size: 14px;
  color: #606266;
}

.pattern-count {
  font-size: 16px;
  font-weight: bold;
  color: #E6A23C;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-card__body) {
  padding: 16px;
}

@media (max-width: 1200px) {
  .contact-monitor {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-right {
    align-self: stretch;
    justify-content: flex-end;
  }

  .stats-overview :deep(.el-col) {
    margin-bottom: 16px;
  }
}
</style>