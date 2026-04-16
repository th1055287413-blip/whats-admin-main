<template>
  <el-drawer
    v-model="visible"
    :title="drawerTitle"
    :size="'50%'"
    direction="rtl"
    @close="handleClose"
    class="log-detail-drawer"
  >
    <template #header>
      <div class="drawer-header">
        <div class="header-title">
          <el-icon><component :is="titleIcon" /></el-icon>
          <span>{{ drawerTitle }}</span>
        </div>
        <div class="header-actions">
          <el-button
            type="primary"
            link
            :icon="CopyDocument"
            @click="copyLogData"
          >
            复制数据
          </el-button>
          <el-button
            type="primary"
            link
            :icon="Download"
            @click="exportLog"
          >
            导出
          </el-button>
        </div>
      </div>
    </template>

    <div v-if="log" class="log-detail-content">
      <!-- 基础信息卡片 -->
      <el-card class="detail-card">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>基础信息</span>
          </div>
        </template>
        <div class="basic-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="日志ID">
              <el-tag type="info" size="small">{{ log.id }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDateTime(log.created_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="用户">
              <div class="user-info">
                <el-avatar :size="24" :src="getUserAvatar(log.user_id)">
                  {{ log.user_name?.charAt(0) }}
                </el-avatar>
                <span>{{ log.user_name }} (ID: {{ log.user_id }})</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="IP地址">
              <span class="ip-address">{{ log.ip_address }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <RiskLevelTag :level="getRiskLevel(log)" />
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <LogStatusIndicator :log="log" :type="type" />
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <!-- 操作日志特定信息 -->
      <el-card v-if="type === 'operation'" class="detail-card">
        <template #header>
          <div class="card-header">
            <el-icon><Operation /></el-icon>
            <span>操作详情</span>
          </div>
        </template>
        <div class="operation-detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="操作类型">
              <OperationTypeTag :operation="log as OperationLog" />
            </el-descriptions-item>
            <el-descriptions-item label="请求方法">
              <el-tag :type="getMethodTagType((log as OperationLog).request_method)" size="small">
                {{ (log as OperationLog).request_method }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="请求路径">
              <code class="request-path">{{ (log as OperationLog).request_path }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="响应状态">
              <el-tag :type="getStatusTagType((log as OperationLog).response_status)" size="small">
                {{ (log as OperationLog).response_status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="资源类型">
              {{ (log as OperationLog).resource_type }}
            </el-descriptions-item>
            <el-descriptions-item label="资源ID">
              {{ (log as OperationLog).resource_id || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="操作名称" :span="2">
              {{ (log as OperationLog).operation_name }}
            </el-descriptions-item>
            <el-descriptions-item label="处理时间">
              <span :class="getDurationClass((log as OperationLog).duration_ms)">
                {{ formatDuration((log as OperationLog).duration_ms) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="敏感操作">
              <el-tag :type="(log as OperationLog).is_sensitive ? 'danger' : 'success'" size="small">
                {{ (log as OperationLog).is_sensitive ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="(log as OperationLog).trace_id" label="追踪ID" :span="2">
              <code>{{ (log as OperationLog).trace_id }}</code>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <!-- 登录日志特定信息 -->
      <el-card v-if="type === 'login'" class="detail-card">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>登录详情</span>
          </div>
        </template>
        <div class="login-detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="登录类型">
              <LoginTypeTag :login="log as LoginLog" />
            </el-descriptions-item>
            <el-descriptions-item label="登录状态">
              <el-tag :type="getLoginStatusType((log as LoginLog).login_status)" size="small">
                {{ (log as LoginLog).login_status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="(log as LoginLog).failure_reason" label="失败原因" :span="2">
              {{ (log as LoginLog).failure_reason }}
            </el-descriptions-item>
            <el-descriptions-item v-if="(log as LoginLog).session_id" label="会话ID" :span="2">
              <code>{{ (log as LoginLog).session_id }}</code>
            </el-descriptions-item>
            <el-descriptions-item v-if="(log as LoginLog).session_duration" label="会话时长">
              {{ formatDuration((log as LoginLog).session_duration! * 1000) }}
            </el-descriptions-item>
            <el-descriptions-item label="风险评分">
              <el-progress
                :percentage="(log as LoginLog).risk_score * 10"
                :color="getRiskScoreColor((log as LoginLog).risk_score)"
                :stroke-width="6"
                text-inside
              />
            </el-descriptions-item>
            <el-descriptions-item label="可疑登录" :span="2">
              <el-tag :type="(log as LoginLog).is_suspicious ? 'danger' : 'success'" size="small">
                {{ (log as LoginLog).is_suspicious ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <!-- 异常检测特定信息 -->
      <el-card v-if="type === 'anomaly'" class="detail-card">
        <template #header>
          <div class="card-header">
            <el-icon><Warning /></el-icon>
            <span>异常详情</span>
          </div>
        </template>
        <div class="anomaly-detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="检测类型">
              <AnomalyTypeTag :anomaly="log as AnomalyDetection" />
            </el-descriptions-item>
            <el-descriptions-item label="严重程度">
              <SeverityTag :severity="(log as AnomalyDetection).severity" />
            </el-descriptions-item>
            <el-descriptions-item label="异常描述" :span="2">
              <div class="anomaly-description">
                {{ (log as AnomalyDetection).anomaly_description }}
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="风险评分">
              <el-progress
                :percentage="(log as AnomalyDetection).risk_score * 10"
                :color="getRiskScoreColor((log as AnomalyDetection).risk_score)"
                :stroke-width="6"
                text-inside
              />
            </el-descriptions-item>
            <el-descriptions-item label="处理状态">
              <AnomalyStatusTag :anomaly="log as AnomalyDetection" />
            </el-descriptions-item>
            <el-descriptions-item v-if="(log as AnomalyDetection).handled_by" label="处理人员">
              处理员ID: {{ (log as AnomalyDetection).handled_by }}
            </el-descriptions-item>
            <el-descriptions-item v-if="(log as AnomalyDetection).handled_at" label="处理时间">
              {{ formatDateTime((log as AnomalyDetection).handled_at!) }}
            </el-descriptions-item>
            <el-descriptions-item v-if="(log as AnomalyDetection).handling_note" label="处理备注" :span="2">
              <div class="handling-note">
                {{ (log as AnomalyDetection).handling_note }}
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-card>

      <!-- 地理位置信息 -->
      <el-card v-if="hasLocationInfo" class="detail-card">
        <template #header>
          <div class="card-header">
            <el-icon><Location /></el-icon>
            <span>地理位置</span>
          </div>
        </template>
        <div class="location-detail">
          <LocationInfo :location="getLocationInfo()!" :is-unusual="isUnusualLocation" />
          <div v-if="hasCoordinates" class="coordinates">
            <small>坐标: {{ getLocationInfo()?.latitude }}, {{ getLocationInfo()?.longitude }}</small>
          </div>
        </div>
      </el-card>

      <!-- 设备信息 -->
      <el-card v-if="hasDeviceInfo" class="detail-card">
        <template #header>
          <div class="card-header">
            <el-icon><Monitor /></el-icon>
            <span>设备信息</span>
          </div>
        </template>
        <div class="device-detail">
          <DeviceInfo :device="getDeviceInfo()!" :is-unusual="isUnusualDevice" />
          <div v-if="log.user_agent" class="user-agent">
            <small><strong>User Agent:</strong> {{ log.user_agent }}</small>
          </div>
        </div>
      </el-card>

      <!-- 数据详情 (JSON格式) -->
      <el-card v-if="hasDataDetails" class="detail-card">
        <template #header>
          <div class="card-header">
            <el-icon><Document /></el-icon>
            <span>数据详情</span>
            <el-button
              type="primary"
              link
              size="small"
              @click="toggleJsonFormat"
            >
              {{ jsonFormatted ? '压缩显示' : '格式化显示' }}
            </el-button>
          </div>
        </template>
        <div class="data-detail">
          <el-tabs v-model="activeDataTab">
            <el-tab-pane
              v-if="type === 'operation' && (log as OperationLog).request_params"
              label="请求参数"
              name="request_params"
            >
              <JsonViewer
                :data="(log as OperationLog).request_params"
                :formatted="jsonFormatted"
              />
            </el-tab-pane>
            <el-tab-pane
              v-if="type === 'operation' && (log as OperationLog).request_body"
              label="请求体"
              name="request_body"
            >
              <JsonViewer
                :data="(log as OperationLog).request_body"
                :formatted="jsonFormatted"
              />
            </el-tab-pane>
            <el-tab-pane
              v-if="type === 'operation' && (log as OperationLog).response_body"
              label="响应体"
              name="response_body"
            >
              <JsonViewer
                :data="(log as OperationLog).response_body"
                :formatted="jsonFormatted"
              />
            </el-tab-pane>
            <el-tab-pane
              v-if="type === 'operation' && (log as OperationLog).before_data"
              label="变更前"
              name="before_data"
            >
              <JsonViewer
                :data="(log as OperationLog).before_data"
                :formatted="jsonFormatted"
              />
            </el-tab-pane>
            <el-tab-pane
              v-if="type === 'operation' && (log as OperationLog).after_data"
              label="变更后"
              name="after_data"
            >
              <JsonViewer
                :data="(log as OperationLog).after_data"
                :formatted="jsonFormatted"
              />
            </el-tab-pane>
            <el-tab-pane
              v-if="type === 'anomaly' && (log as AnomalyDetection).evidence"
              label="证据数据"
              name="evidence"
            >
              <JsonViewer
                :data="(log as AnomalyDetection).evidence"
                :formatted="jsonFormatted"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="没有选中的日志" />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  CopyDocument,
  Download,
  InfoFilled,
  Operation,
  User,
  Warning,
  Location,
  Monitor,
  Document
} from '@element-plus/icons-vue'

// 组件导入
import LogStatusIndicator from './LogStatusIndicator.vue'
import RiskLevelTag from './RiskLevelTag.vue'
import OperationTypeTag from './OperationTypeTag.vue'
import LoginTypeTag from './LoginTypeTag.vue'
import AnomalyTypeTag from './AnomalyTypeTag.vue'
import SeverityTag from './SeverityTag.vue'
import AnomalyStatusTag from './AnomalyStatusTag.vue'
import LocationInfo from './LocationInfo.vue'
import DeviceInfo from './DeviceInfo.vue'
import JsonViewer from './JsonViewer.vue'

// 类型导入
import type {
  OperationLog,
  LoginLog,
  AnomalyDetection
} from '@/types/audit'

interface Props {
  modelValue: boolean
  log: OperationLog | LoginLog | AnomalyDetection | null
  type: 'operation' | 'login' | 'anomaly'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

// 响应式数据
const activeDataTab = ref('request_params')
const jsonFormatted = ref(true)

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const drawerTitle = computed(() => {
  if (!props.log) return '日志详情'

  const typeMap = {
    operation: '操作日志详情',
    login: '登录日志详情',
    anomaly: '异常检测详情'
  }

  return typeMap[props.type]
})

const titleIcon = computed(() => {
  switch (props.type) {
    case 'operation': return Operation
    case 'login': return User
    case 'anomaly': return Warning
    default: return InfoFilled
  }
})

const hasLocationInfo = computed(() => {
  return props.type === 'login' && (props.log as LoginLog)?.location_info
})

const hasDeviceInfo = computed(() => {
  return props.type === 'login' && (props.log as LoginLog)?.device_info
})

const hasDataDetails = computed(() => {
  if (!props.log) return false

  if (props.type === 'operation') {
    const log = props.log as OperationLog
    return log.request_params || log.request_body || log.response_body || log.before_data || log.after_data
  }

  if (props.type === 'anomaly') {
    const log = props.log as AnomalyDetection
    return log.evidence
  }

  return false
})

const hasCoordinates = computed(() => {
  if (!hasLocationInfo.value) return false
  const location = getLocationInfo()
  return location?.latitude !== undefined && location?.longitude !== undefined
})

const isUnusualLocation = computed(() => {
  // 实际项目中应该根据用户历史登录位置判断
  return false
})

const isUnusualDevice = computed(() => {
  // 实际项目中应该根据用户历史设备判断
  return false
})

// 工具函数
function getRiskLevel(log: any) {
  return log.risk_level || log.severity || 'low'
}

function formatDateTime(dateTime: string) {
  return new Date(dateTime).toLocaleString('zh-CN')
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

function getDurationClass(ms: number) {
  if (ms > 5000) return 'duration-slow'
  if (ms > 1000) return 'duration-medium'
  return 'duration-fast'
}

function getMethodTagType(method: string) {
  switch (method?.toUpperCase()) {
    case 'GET': return 'primary'
    case 'POST': return 'success'
    case 'PUT': return 'warning'
    case 'DELETE': return 'danger'
    default: return 'info'
  }
}

function getStatusTagType(status: number) {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'warning'
  if (status >= 400) return 'danger'
  return 'info'
}

function getLoginStatusType(status: string) {
  switch (status?.toLowerCase()) {
    case 'success': return 'success'
    case 'failed': return 'danger'
    case 'blocked': return 'warning'
    default: return 'info'
  }
}

function getRiskScoreColor(score: number) {
  if (score >= 8) return '#f56c6c'
  if (score >= 6) return '#e6a23c'
  if (score >= 4) return '#409eff'
  return '#67c23a'
}

function getUserAvatar(userId: number) {
  return `/api/users/${userId}/avatar`
}

function getLocationInfo() {
  if (props.type === 'login') {
    return (props.log as LoginLog)?.location_info
  }
  return null
}

function getDeviceInfo() {
  if (props.type === 'login') {
    return (props.log as LoginLog)?.device_info
  }
  return null
}

function toggleJsonFormat() {
  jsonFormatted.value = !jsonFormatted.value
}

async function copyLogData() {
  if (!props.log) return

  try {
    const dataStr = JSON.stringify(props.log, null, 2)
    await navigator.clipboard.writeText(dataStr)
    ElMessage.success('日志数据已复制到剪贴板')
  } catch (error) {
    console.error('Failed to copy log data:', error)
    ElMessage.error('复制失败')
  }
}

function exportLog() {
  if (!props.log) return

  const dataStr = JSON.stringify(props.log, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${props.type}_log_${props.log.id}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
  ElMessage.success('日志已导出')
}

function handleClose() {
  emit('close')
}
</script>

<style lang="scss" scoped>
.log-detail-drawer {
  .drawer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .log-detail-content {
    .detail-card {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ip-address {
      font-family: monospace;
      background-color: var(--el-bg-color);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }

    .request-path {
      background-color: var(--el-bg-color);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      word-break: break-all;
    }

    .duration-fast {
      color: var(--el-color-success);
    }

    .duration-medium {
      color: var(--el-color-warning);
    }

    .duration-slow {
      color: var(--el-color-danger);
    }

    .anomaly-description,
    .handling-note {
      line-height: 1.6;
      padding: 8px;
      background-color: var(--el-bg-color);
      border-radius: 4px;
      border-left: 4px solid var(--el-color-primary);
    }

    .coordinates,
    .user-agent {
      margin-top: 8px;
      padding: 8px;
      background-color: var(--el-bg-color-page);
      border-radius: 4px;
      font-family: monospace;
    }
  }
}

:deep(.el-descriptions__body) {
  background-color: var(--el-bg-color-page);
}

:deep(.el-descriptions-item__label) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

:deep(.el-progress-bar__inner) {
  transition: width 0.6s ease;
}
</style>