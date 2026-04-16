<template>
  <div class="log-detail-panel">
    <el-row :gutter="16">
      <!-- 基础信息 -->
      <el-col :span="12">
        <div class="detail-section">
          <h4 class="section-title">基础信息</h4>
          <div class="detail-item">
            <span class="label">时间:</span>
            <span class="value">{{ formatDateTime(log.created_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">用户:</span>
            <span class="value">{{ log.user_name }} ({{ log.user_id }})</span>
          </div>
          <div class="detail-item">
            <span class="label">IP:</span>
            <span class="value ip-address">{{ log.ip_address }}</span>
          </div>
          <div class="detail-item">
            <span class="label">风险:</span>
            <RiskLevelTag :level="getRiskLevel(log)" />
          </div>
        </div>
      </el-col>

      <!-- 类型特定信息 -->
      <el-col :span="12">
        <div class="detail-section">
          <!-- 操作日志 -->
          <template v-if="type === 'operation'">
            <h4 class="section-title">操作详情</h4>
            <div class="detail-item">
              <span class="label">操作:</span>
              <OperationTypeTag :operation="log as OperationLog" />
            </div>
            <div class="detail-item">
              <span class="label">方法:</span>
              <el-tag :type="getMethodTagType((log as OperationLog).request_method)" size="small">
                {{ (log as OperationLog).request_method }}
              </el-tag>
            </div>
            <div class="detail-item">
              <span class="label">路径:</span>
              <code class="request-path">{{ (log as OperationLog).request_path }}</code>
            </div>
            <div class="detail-item">
              <span class="label">状态:</span>
              <el-tag :type="getStatusTagType((log as OperationLog).response_status)" size="small">
                {{ (log as OperationLog).response_status }}
              </el-tag>
            </div>
          </template>

          <!-- 登录日志 -->
          <template v-else-if="type === 'login'">
            <h4 class="section-title">登录详情</h4>
            <div class="detail-item">
              <span class="label">类型:</span>
              <LoginTypeTag :login="log as LoginLog" />
            </div>
            <div class="detail-item">
              <span class="label">状态:</span>
              <el-tag :type="getLoginStatusType((log as LoginLog).login_status)" size="small">
                {{ (log as LoginLog).login_status }}
              </el-tag>
            </div>
            <div v-if="(log as LoginLog).location_info" class="detail-item">
              <span class="label">位置:</span>
              <LocationInfo :location="(log as LoginLog).location_info!" />
            </div>
            <div class="detail-item">
              <span class="label">风险:</span>
              <el-progress
                :percentage="(log as LoginLog).risk_score * 10"
                :stroke-width="6"
                :show-text="false"
                :color="getRiskScoreColor((log as LoginLog).risk_score)"
              />
              <span class="risk-score">{{ (log as LoginLog).risk_score }}/10</span>
            </div>
          </template>

          <!-- 异常检测 -->
          <template v-else-if="type === 'anomaly'">
            <h4 class="section-title">异常详情</h4>
            <div class="detail-item">
              <span class="label">类型:</span>
              <AnomalyTypeTag :anomaly="log as AnomalyDetection" />
            </div>
            <div class="detail-item">
              <span class="label">严重程度:</span>
              <SeverityTag :severity="(log as AnomalyDetection).severity" />
            </div>
            <div class="detail-item">
              <span class="label">状态:</span>
              <AnomalyStatusTag :anomaly="log as AnomalyDetection" />
            </div>
            <div class="detail-item">
              <span class="label">描述:</span>
              <div class="anomaly-description">
                {{ (log as AnomalyDetection).anomaly_description }}
              </div>
            </div>
          </template>
        </div>
      </el-col>
    </el-row>

    <!-- User Agent -->
    <div v-if="log.user_agent" class="detail-section user-agent">
      <h4 class="section-title">User Agent</h4>
      <div class="user-agent-text">{{ log.user_agent }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 组件导入
import RiskLevelTag from './RiskLevelTag.vue'
import OperationTypeTag from './OperationTypeTag.vue'
import LoginTypeTag from './LoginTypeTag.vue'
import AnomalyTypeTag from './AnomalyTypeTag.vue'
import SeverityTag from './SeverityTag.vue'
import AnomalyStatusTag from './AnomalyStatusTag.vue'
import LocationInfo from './LocationInfo.vue'

// 类型导入
import type {
  OperationLog,
  LoginLog,
  AnomalyDetection
} from '@/types/audit'

interface Props {
  log: OperationLog | LoginLog | AnomalyDetection
  type: 'operation' | 'login' | 'anomaly'
}

const props = defineProps<Props>()

// 工具函数
function getRiskLevel(log: any) {
  return log.risk_level || log.severity || 'low'
}

function formatDateTime(dateTime: string) {
  return new Date(dateTime).toLocaleString('zh-CN')
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
</script>

<style lang="scss" scoped>
.log-detail-panel {
  padding: 16px;
  background-color: var(--el-bg-color-page);
  border-radius: 6px;

  .detail-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--el-border-color-lighter);
      padding-bottom: 6px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      line-height: 1.4;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        min-width: 60px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-right: 8px;
      }

      .value {
        font-size: 13px;
        color: var(--el-text-color-primary);

        &.ip-address {
          font-family: monospace;
          background-color: var(--el-bg-color);
          padding: 2px 6px;
          border-radius: 4px;
        }
      }

      .request-path {
        font-size: 12px;
        background-color: var(--el-bg-color);
        padding: 2px 6px;
        border-radius: 4px;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .risk-score {
        margin-left: 8px;
        font-size: 12px;
        font-weight: 600;
      }

      .anomaly-description {
        font-size: 12px;
        line-height: 1.4;
        max-width: 200px;
      }
    }

    &.user-agent {
      .user-agent-text {
        font-size: 11px;
        font-family: monospace;
        color: var(--el-text-color-secondary);
        background-color: var(--el-bg-color);
        padding: 8px;
        border-radius: 4px;
        word-break: break-all;
        line-height: 1.3;
      }
    }
  }
}
</style>