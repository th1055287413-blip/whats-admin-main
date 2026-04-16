<template>
  <div class="operation-logs">
    <!-- 页面头部 -->
    <el-card class="header-card" shadow="hover">
      <div class="header-content">
        <div class="header-left">
          <h1><el-icon><Document /></el-icon> 操作日志</h1>
          <p>查看和管理系统操作日志记录</p>
        </div>
        <div class="header-right">
          <el-button @click="handleRefresh" :icon="Refresh" :loading="loading">
            刷新
          </el-button>
          <el-button @click="handleExport" :icon="Download">
            导出
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="hover">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="操作类型">
          <el-select
            v-model="filters.operation_type"
            placeholder="请选择操作类型"
            clearable
            style="width: 150px"
          >
            <el-option label="登入" value="login" />
            <el-option label="登出" value="logout" />
            <el-option label="登入失败" value="login_failed" />
            <el-option label="建立" value="create" />
            <el-option label="修改" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="状态变更" value="status_change" />
            <el-option label="重设密码" value="password_reset" />
            <el-option label="配置变更" value="config_change" />
            <el-option label="封存" value="archive" />
            <el-option label="取消封存" value="unarchive" />
            <el-option label="发送" value="send" />
            <el-option label="撤回" value="revoke" />
            <el-option label="执行" value="execute" />
            <el-option label="暂停" value="pause" />
            <el-option label="恢复" value="resume" />
            <el-option label="权限被拒" value="permission_deny" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select
            v-model="filters.resource_type"
            placeholder="请选择资源类型"
            clearable
            style="width: 150px"
          >
            <el-option label="后管用户" value="admin_user" />
            <el-option label="角色" value="role" />
            <el-option label="权限" value="permission" />
            <el-option label="渠道" value="channel" />
            <el-option label="推广域名" value="promotion_domain" />
            <el-option label="敏感词" value="sensitive_word" />
            <el-option label="标签" value="tag" />
            <el-option label="配置" value="config" />
            <el-option label="工作阶段" value="session" />
            <el-option label="批量发送" value="batch_send" />
            <el-option label="聊天" value="chat" />
            <el-option label="消息" value="message" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作者">
          <el-input
            v-model="filters.operator_id"
            placeholder="操作者ID"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="资源ID">
          <el-input
            v-model="filters.resource_id"
            placeholder="资源ID"
            clearable
            style="width: 120px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filters.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="filters.start_time"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker
            v-model="filters.end_time"
            type="datetime"
            placeholder="选择结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">搜索</el-button>
          <el-button @click="handleResetFilter" :icon="RefreshLeft">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card class="table-card" shadow="hover">
      <el-table :data="logs" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operation_type" label="操作类型" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getOperationTypeTag(row.operation_type)" size="small">
              {{ getOperationTypeLabel(row.operation_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作者" min-width="150">
          <template #default="{ row }">
            <div>{{ row.operator_username }}</div>
            <div style="color: #999; font-size: 12px">ID: {{ row.operator_id }}</div>
          </template>
        </el-table-column>
        <el-table-column label="资源" min-width="180">
          <template #default="{ row }">
            <div>{{ getResourceTypeLabel(row.resource_type) }}</div>
            <div style="color: #999; font-size: 12px">
              {{ row.resource_name || row.resource_id }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="请求" min-width="150">
          <template #default="{ row }">
            <el-tag size="small" :type="getMethodTypeTag(row.request_method)">
              {{ row.request_method }}
            </el-tag>
            <div style="color: #999; font-size: 12px; margin-top: 4px">
              {{ row.request_path }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column prop="created_at" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleViewDetail(row)" :icon="View">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="操作日志详情"
      width="800px"
    >
      <div v-if="currentLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getOperationTypeTag(currentLog.operation_type)" size="small">
              {{ getOperationTypeLabel(currentLog.operation_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作者">{{ currentLog.operator_username }}</el-descriptions-item>
          <el-descriptions-item label="操作者ID">{{ currentLog.operator_id }}</el-descriptions-item>
          <el-descriptions-item label="资源类型">{{ getResourceTypeLabel(currentLog.resource_type) }}</el-descriptions-item>
          <el-descriptions-item label="资源ID">{{ currentLog.resource_id }}</el-descriptions-item>
          <el-descriptions-item label="资源名称" :span="2">{{ currentLog.resource_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="请求方法">
            <el-tag size="small" :type="getMethodTypeTag(currentLog.request_method)">
              {{ currentLog.request_method }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="请求路径">{{ currentLog.request_path }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ip_address }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentLog.status === 'success' ? 'success' : 'danger'" size="small">
              {{ currentLog.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">{{ formatDate(currentLog.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="User Agent" :span="2">{{ currentLog.user_agent || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentLog.error_message" label="错误信息" :span="2">
            <el-alert type="error" :closable="false">{{ currentLog.error_message }}</el-alert>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentLog.before_value" class="data-section">
          <h3>变更前数据</h3>
          <el-input
            type="textarea"
            :model-value="formatJSON(currentLog.before_value)"
            :rows="6"
            readonly
          />
        </div>

        <div v-if="currentLog.after_value" class="data-section">
          <h3>变更后数据</h3>
          <el-input
            type="textarea"
            :model-value="formatJSON(currentLog.after_value)"
            :rows="6"
            readonly
          />
        </div>

        <div v-if="currentLog.extra_data" class="data-section">
          <h3>额外数据</h3>
          <el-input
            type="textarea"
            :model-value="formatJSON(currentLog.extra_data)"
            :rows="6"
            readonly
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Document,
  Refresh,
  Download,
  Search,
  RefreshLeft,
  View
} from '@element-plus/icons-vue'
import { operationLogApi } from '@/api/audit'
import type { OperationLog } from '@/types/audit'

const loading = ref(false)
const logs = ref<OperationLog[]>([])
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const filters = reactive({
  operation_type: '',
  resource_type: '',
  operator_id: '',
  resource_id: '',
  status: '',
  start_time: '',
  end_time: ''
})

const detailVisible = ref(false)
const currentLog = ref<OperationLog | null>(null)

const operationTypeMap: Record<string, string> = {
  login: '登入',
  logout: '登出',
  login_failed: '登入失败',
  create: '建立',
  update: '修改',
  delete: '删除',
  status_change: '状态变更',
  password_reset: '重设密码',
  config_change: '配置变更',
  archive: '封存',
  unarchive: '取消封存',
  send: '发送',
  revoke: '撤回',
  execute: '执行',
  pause: '暂停',
  resume: '恢复',
  permission_deny: '权限被拒'
}

const resourceTypeMap: Record<string, string> = {
  admin_user: '后管用户',
  role: '角色',
  permission: '权限',
  channel: '渠道',
  promotion_domain: '推广域名',
  sensitive_word: '敏感词',
  tag: '标签',
  config: '配置',
  session: '工作阶段',
  batch_send: '批量发送',
  chat: '聊天',
  message: '消息'
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.page_size
    }

    if (filters.operation_type) params.operation_type = filters.operation_type
    if (filters.resource_type) params.resource_type = filters.resource_type
    if (filters.operator_id) params.operator_id = Number(filters.operator_id)
    if (filters.resource_id) params.resource_id = filters.resource_id
    if (filters.status) params.status = filters.status
    if (filters.start_time) params.start_time = filters.start_time
    if (filters.end_time) params.end_time = filters.end_time

    const res = await operationLogApi.getOperationLogs(params)
    logs.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error: any) {
    console.error('加载操作日志失败:', error)
    ElMessage.error(error.message || '加载操作日志失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = () => {
  loadLogs()
}

const handleSearch = () => {
  pagination.page = 1
  loadLogs()
}

const handleResetFilter = () => {
  filters.operation_type = ''
  filters.resource_type = ''
  filters.operator_id = ''
  filters.resource_id = ''
  filters.status = ''
  filters.start_time = ''
  filters.end_time = ''
  handleSearch()
}

const handleSizeChange = () => {
  loadLogs()
}

const handleCurrentChange = () => {
  loadLogs()
}

const handleViewDetail = async (row: OperationLog) => {
  try {
    const res = await operationLogApi.getOperationLog(row.id)
    currentLog.value = res.data
    detailVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '加载日志详情失败')
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

const getOperationTypeLabel = (type: string) => {
  return operationTypeMap[type] || type
}

const getResourceTypeLabel = (type: string) => {
  return resourceTypeMap[type] || type
}

const getOperationTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    login: 'success',
    logout: 'info',
    login_failed: 'danger',
    create: 'success',
    update: 'warning',
    delete: 'danger',
    status_change: 'warning',
    password_reset: 'warning',
    config_change: 'warning',
    permission_deny: 'danger'
  }
  return typeMap[type] || 'info'
}

const getMethodTypeTag = (method: string) => {
  const methodMap: Record<string, string> = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    PATCH: 'warning',
    DELETE: 'danger'
  }
  return methodMap[method] || 'info'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const formatJSON = (data: any) => {
  if (!data) return ''
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped lang="scss">
.operation-logs {
  padding: 20px;

  .header-card {
    margin-bottom: 20px;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }
      }

      .header-right {
        display: flex;
        gap: 10px;
      }
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .table-card {
    .pagination {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .log-detail {
    .data-section {
      margin-top: 20px;

      h3 {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 10px;
        color: #333;
      }
    }
  }
}
</style>
