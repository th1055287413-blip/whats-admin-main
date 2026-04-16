<template>
  <div class="alert-detail">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="告警ID">
        {{ alert.id }}
      </el-descriptions-item>
      <el-descriptions-item label="告警类型">
        <el-tag :type="getAlertTypeTagType(alert.type)">
          {{ getAlertTypeText(alert.type) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="严重程度">
        <el-tag :type="getSeverityTagType(alert.severity)">
          {{ getSeverityText(alert.severity) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="标题">
        {{ alert.title }}
      </el-descriptions-item>
      <el-descriptions-item label="描述">
        {{ alert.description }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ formatDate(alert.createdAt) }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ formatDate(alert.updatedAt) }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag v-if="alert.isHandled" type="success">已处理</el-tag>
        <el-tag v-else-if="alert.isRead" type="info">已读</el-tag>
        <el-tag v-else type="warning">未读</el-tag>
      </el-descriptions-item>
      <el-descriptions-item v-if="alert.metadata" label="详细信息">
        <pre class="metadata">{{ JSON.stringify(alert.metadata, null, 2) }}</pre>
      </el-descriptions-item>
    </el-descriptions>

    <div class="actions" style="margin-top: 20px; text-align: right;">
      <el-button v-if="!alert.isRead" @click="handleMarkRead">标记已读</el-button>
      <el-button v-if="!alert.isHandled" type="primary" @click="handleMarkHandled">
        标记已处理
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { RealTimeAlert, AlertType, AlertSeverity } from '@/types/monitor'

interface Props {
  alert: RealTimeAlert
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: []
}>()

const getAlertTypeText = (type: AlertType): string => {
  const typeMap: Record<AlertType, string> = {
    account_offline: '账号离线',
    message_failed: '消息发送失败',
    rate_limit: '频率限制',
    api_error: 'API错误',
    system_error: '系统错误',
    security_warning: '安全警告'
  }
  return typeMap[type] || type
}

const getAlertTypeTagType = (type: AlertType) => {
  const typeMap: Record<AlertType, string> = {
    account_offline: 'warning',
    message_failed: 'danger',
    rate_limit: 'warning',
    api_error: 'danger',
    system_error: 'danger',
    security_warning: 'danger'
  }
  return typeMap[type] || 'info'
}

const getSeverityText = (severity: AlertSeverity): string => {
  const severityMap: Record<AlertSeverity, string> = {
    info: '信息',
    warning: '警告',
    error: '错误',
    critical: '严重'
  }
  return severityMap[severity] || severity
}

const getSeverityTagType = (severity: AlertSeverity) => {
  const severityMap: Record<AlertSeverity, string> = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    critical: 'danger'
  }
  return severityMap[severity] || 'info'
}

const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleString('zh-CN')
}

const handleMarkRead = () => {
  ElMessage.success('已标记为已读')
  emit('update')
}

const handleMarkHandled = () => {
  ElMessage.success('已标记为已处理')
  emit('update')
}
</script>

<style scoped lang="scss">
.alert-detail {
  .metadata {
    background-color: #f5f7fa;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
  }
}
</style>
