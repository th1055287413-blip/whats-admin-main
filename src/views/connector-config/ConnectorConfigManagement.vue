<template>
  <div class="connector-config-container">
    <!-- Header -->
    <div class="page-header">
      <h1>Connector 管理</h1>
      <div class="header-actions">
        <el-tag v-if="apiVersion" type="info" class="api-version">API {{ apiVersion }}</el-tag>
        <el-button @click="fetchList" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增 Connector
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索 ID 或名称"
          style="width: 250px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="searchForm.status" placeholder="状态" style="width: 150px" clearable>
          <el-option label="全部状态" value="" />
          <el-option label="运行中" value="running" />
          <el-option label="已停止" value="stopped" />
          <el-option label="启动中" value="starting" />
          <el-option label="停止中" value="stopping" />
          <el-option label="错误" value="error" />
        </el-select>

        <el-select v-model="searchForm.proxy_config_id" placeholder="代理" style="width: 180px" clearable>
          <el-option label="全部代理" :value="undefined" />
          <el-option label="未绑定代理" :value="0" />
          <el-option
            v-for="proxy in proxyOptions"
            :key="proxy.id"
            :label="proxy.name"
            :value="proxy.id"
          />
        </el-select>

        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- Stats -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value stat-running">{{ stats.running }}</div>
          <div class="stat-label">运行中</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value stat-alive">{{ stats.alive }}</div>
          <div class="stat-label">存活</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value stat-stopped">{{ stats.stopped }}</div>
          <div class="stat-label">已停止</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value stat-error">{{ stats.error }}</div>
          <div class="stat-label">错误</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value stat-accounts">{{ stats.connectedAccounts }}/{{ stats.totalAccounts }}</div>
          <div class="stat-label">帐号 (连/总)</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Connector 总计</div>
        </div>
      </el-card>
    </div>

    <!-- System Monitor -->
    <el-card class="monitor-card" shadow="never">
      <template #header>
        <div class="monitor-header" @click="showMonitor = !showMonitor">
          <span class="monitor-title">
            <el-icon><Monitor /></el-icon>
            系统监控
          </span>
          <div class="monitor-header-right">
            <el-tag v-if="monitorData" size="small" :type="monitorHealthType" disable-transitions>
              {{ monitorHealthLabel }}
            </el-tag>
            <el-icon class="collapse-icon" :class="{ 'is-open': showMonitor }">
              <ArrowDown />
            </el-icon>
          </div>
        </div>
      </template>

      <div v-show="showMonitor" v-loading="loadingMonitor">
        <!-- Event Streams -->
        <h4 class="monitor-section-title">Event Streams</h4>
        <div class="stream-grid">
          <div v-for="(info, key) in monitorData?.event_streams" :key="key" class="stream-item">
            <div class="stream-name">{{ streamLabel(key as string) }}</div>
            <div class="stream-pending-main">
              <span class="pending-value" :class="pendingLevelClass(info.pending?.count || 0)">
                {{ info.pending?.count ?? 0 }}
              </span>
              <span class="pending-label">pending</span>
            </div>
            <el-progress
              :percentage="pendingPercentage(info.pending?.count || 0)"
              :stroke-width="4"
              :show-text="false"
              :color="pendingProgressColor(info.pending?.count || 0)"
            />
            <div class="stream-meta">
              stream: {{ info.length.toLocaleString() }} entries
            </div>
          </div>
        </div>

        <!-- Per-Connector -->
        <template v-for="(conn, connId) in monitorData?.connectors" :key="connId">
          <h4 class="monitor-section-title" style="margin-top: 16px;">
            {{ connectorName(connId as string) }}
            <el-tag size="small" type="info" style="margin-left: 8px;">{{ conn.account_count }} 帐号</el-tag>
          </h4>
          <div class="connector-monitor-row">
            <!-- Command Streams -->
            <div class="monitor-block">
              <div class="monitor-block-label">Command Streams</div>
              <template v-if="monitorData?.command_streams?.[connId as string]">
                <div class="cmd-stream-row">
                  <span class="cmd-label">priority</span>
                  <span class="cmd-value" :class="streamLevelClass(monitorData.command_streams[connId as string].priority.length)">
                    {{ monitorData.command_streams[connId as string].priority.length }}
                  </span>
                </div>
                <div class="cmd-stream-row">
                  <span class="cmd-label">bulk</span>
                  <span class="cmd-value" :class="streamLevelClass(monitorData.command_streams[connId as string].bulk.length)">
                    {{ monitorData.command_streams[connId as string].bulk.length }}
                  </span>
                </div>
              </template>
              <span v-else class="no-data">-</span>
            </div>

            <!-- Event Workers -->
            <div class="monitor-block">
              <div class="monitor-block-label">Event Workers</div>
              <template v-if="conn.event_worker_summary">
                <div class="worker-summary">
                  <div class="worker-metric">
                    <span class="worker-value">{{ conn.event_worker_summary.total }}</span>
                    <span class="worker-label">workers</span>
                  </div>
                  <div class="worker-metric">
                    <span class="worker-value" :class="workerQueueClass(conn.event_worker_summary.max_queue)">
                      {{ conn.event_worker_summary.max_queue }}
                    </span>
                    <span class="worker-label">max queue</span>
                  </div>
                  <div class="worker-metric">
                    <span class="worker-value" :class="workerQueueClass(conn.event_worker_summary.total_queued)">
                      {{ conn.event_worker_summary.total_queued }}
                    </span>
                    <span class="worker-label">total queued</span>
                  </div>
                </div>
                <!-- Top queued accounts -->
                <div v-if="topQueuedAccounts(conn).length > 0" class="worker-details">
                  <span v-for="([aid, q]) in topQueuedAccounts(conn)" :key="aid" class="worker-queue-tag">
                    <el-tag size="small" :type="q > 500 ? 'danger' : q > 100 ? 'warning' : 'info'">
                      #{{ aid }}: {{ q }}
                    </el-tag>
                  </span>
                </div>
              </template>
              <span v-else class="no-data">-</span>
            </div>
          </div>
        </template>

        <div v-if="!monitorData" class="no-data" style="text-align: center; padding: 20px;">
          暂无监控数据
        </div>
      </div>
    </el-card>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="connectorList" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="180">
          <template #default="{ row }">
            <span style="font-family: monospace;">{{ row.id }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="名称" width="150" />

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="default">
              <el-icon v-if="row.status === 'running'" class="status-icon is-loading">
                <Loading />
              </el-icon>
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="存活" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.alive !== undefined" :type="row.alive ? 'success' : 'danger'" size="small">
              {{ row.alive ? '在线' : '离线' }}
            </el-tag>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>

        <el-table-column label="帐号" width="160">
          <template #default="{ row }">
            <template v-if="row.accounts">
              <span class="account-stats">
                <span class="total">{{ row.accounts.total }}</span>
                <span class="divider">/</span>
                <span class="connected">{{ row.accounts.connected }}</span>
                <span class="divider">/</span>
                <span class="disconnected">{{ row.accounts.disconnected }}</span>
              </span>
              <div class="account-stats-label">总/连/离</div>
            </template>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="version" label="版本" width="100">
          <template #default="{ row }">
            <span v-if="row.version" style="font-family: monospace; font-size: 12px;">{{ row.version }}</span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="proxy_name" label="代理" width="150">
          <template #default="{ row }">
            <template v-if="row.proxy_config">
              <el-tag type="info" size="small">
                {{ row.proxy_config.name }}
              </el-tag>
            </template>
            <template v-else>
              <span style="color: #909399;">未绑定</span>
            </template>
          </template>
        </el-table-column>

        <el-table-column prop="country_codes" label="国码" width="180">
          <template #default="{ row }">
            <template v-if="row.country_codes?.length">
              <el-tag v-for="code in row.country_codes" :key="code" size="small" style="margin-right: 4px;">
                +{{ code }}
              </el-tag>
            </template>
            <span v-else style="color: #909399;">全部 (Fallback)</span>
          </template>
        </el-table-column>

        <el-table-column prop="accept_new_device" label="新装置" width="90">
          <template #default="{ row }">
            <el-tag :type="row.accept_new_device === false ? 'danger' : 'success'" size="small">
              {{ row.accept_new_device === false ? '拒绝' : '接受' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="error_msg" label="错误信息" min-width="200">
          <template #default="{ row }">
            <el-tooltip v-if="row.error_msg" :content="row.error_msg" placement="top">
              <span class="error-msg">{{ row.error_msg }}</span>
            </el-tooltip>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <!-- Container Actions -->
              <el-button-group>
                <el-button
                  size="small"
                  type="success"
                  :disabled="row.status === 'running' || row.status === 'starting'"
                  :loading="row._starting"
                  @click="handleStart(row)"
                >
                  启动
                </el-button>
                <el-button
                  size="small"
                  type="warning"
                  :disabled="row.status === 'stopped' || row.status === 'stopping'"
                  :loading="row._stopping"
                  @click="handleStop(row)"
                >
                  停止
                </el-button>
                <el-button
                  size="small"
                  :disabled="row.status === 'stopped'"
                  :loading="row._restarting"
                  @click="handleRestart(row)"
                >
                  重启
                </el-button>
              </el-button-group>

              <!-- Other Actions -->
              <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
                <el-button size="small">
                  更多
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="status">
                      <el-icon><View /></el-icon>
                      查看状态
                    </el-dropdown-item>
                    <el-dropdown-item command="bind">
                      <el-icon><Link /></el-icon>
                      绑定代理
                    </el-dropdown-item>
                    <el-dropdown-item v-if="row.proxy_config_id" command="unbind">
                      <el-icon><Unlock /></el-icon>
                      解除绑定
                    </el-dropdown-item>
                    <el-dropdown-item divided command="edit">
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" :disabled="row.status === 'running'">
                      <el-icon><Delete /></el-icon>
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- Create Dialog -->
    <el-dialog v-model="showCreateDialog" title="新增 Connector" width="500px">
      <el-form ref="createFormRef" :model="createForm" :rules="createFormRules" label-width="100px">
        <el-form-item label="ID" prop="id">
          <div class="id-input-row">
            <el-input v-model="createForm.id" readonly style="font-family: monospace;" />
            <el-button @click="createForm.id = generateUUID()" title="重新生成">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          <div class="form-tip">自動生成的 UUID，創建後不可修改</div>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="例如: 台湾节点" />
        </el-form-item>
        <el-form-item label="代理" prop="proxy_config_id">
          <el-select v-model="createForm.proxy_config_id" placeholder="可选，稍后绑定" style="width: 100%" clearable>
            <el-option
              v-for="proxy in proxyOptions"
              :key="proxy.id"
              :label="`${proxy.name} (${proxy.host}:${proxy.port})`"
              :value="proxy.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="服务国码">
          <el-select
            v-model="createForm.country_codes"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入国码，如 886、62（留空为 Fallback）"
            style="width: 100%"
          >
            <el-option v-for="c in commonCountryCodes" :key="c.code" :label="`+${c.code} ${c.name}`" :value="c.code" />
          </el-select>
          <div class="form-tip">留空表示 Fallback，接收未匹配国码的帐号</div>
        </el-form-item>
        <el-form-item label="自动启动">
          <el-checkbox v-model="createForm.auto_start">创建后自动启动</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑 Connector" width="500px">
      <el-form ref="editFormRef" :model="editForm" :rules="editFormRules" label-width="100px">
        <el-form-item label="ID">
          <el-input :value="currentEditId" disabled />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="服务国码">
          <el-select
            v-model="editForm.country_codes"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入国码，如 886、62（留空为 Fallback）"
            style="width: 100%"
          >
            <el-option v-for="c in commonCountryCodes" :key="c.code" :label="`+${c.code} ${c.name}`" :value="c.code" />
          </el-select>
          <div class="form-tip">留空表示 Fallback，接收未匹配国码的帐号</div>
        </el-form-item>
        <el-form-item label="接受新装置">
          <el-switch v-model="editForm.accept_new_device" />
          <div class="form-tip">关闭后，新装置登入不会分配到此 Connector</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdate">更新</el-button>
      </template>
    </el-dialog>

    <!-- Bind Proxy Dialog -->
    <el-dialog v-model="showBindDialog" title="绑定代理" width="500px">
      <el-form ref="bindFormRef" :model="bindForm" label-width="100px">
        <el-form-item label="Connector">
          <el-input :value="currentBindId" disabled />
        </el-form-item>
        <el-form-item label="选择代理" prop="proxy_config_id" :rules="[{ required: true, message: '请选择代理' }]">
          <el-select v-model="bindForm.proxy_config_id" placeholder="请选择代理" style="width: 100%">
            <el-option
              v-for="proxy in proxyOptions"
              :key="proxy.id"
              :label="`${proxy.name} (${proxy.host}:${proxy.port})`"
              :value="proxy.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="dialog-tip">
        <el-alert type="warning" :closable="false" show-icon>
          绑定代理后需要重启 Connector 才能生效
        </el-alert>
      </div>
      <template #footer>
        <el-button @click="showBindDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleBind">绑定</el-button>
      </template>
    </el-dialog>

    <!-- Status Dialog -->
    <el-dialog v-model="showStatusDialog" title="Connector 运行状态" width="500px">
      <div v-loading="loadingStatus">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="Connector ID">{{ currentStatusId }}</el-descriptions-item>
          <el-descriptions-item label="运行状态">
            <el-tag :type="connectorStatus?.running ? 'success' : 'info'">
              {{ connectorStatus?.running ? '运行中' : '未运行' }}
            </el-tag>
          </el-descriptions-item>
          <template v-if="connectorStatus?.running">
            <el-descriptions-item label="管理帐号数">{{ connectorStatus?.account_count || 0 }}</el-descriptions-item>
            <el-descriptions-item label="帐号 ID">
              <template v-if="connectorStatus?.account_ids?.length">
                <el-tag v-for="id in connectorStatus.account_ids" :key="id" size="small" style="margin-right: 4px;">
                  {{ id }}
                </el-tag>
              </template>
              <span v-else style="color: #909399;">无</span>
            </el-descriptions-item>
            <el-descriptions-item label="运行时长">{{ connectorStatus?.uptime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="启动时间">{{ connectorStatus?.start_time ? formatDate(connectorStatus.start_time) : '-' }}</el-descriptions-item>
          </template>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showStatusDialog = false">关闭</el-button>
        <el-button type="primary" @click="fetchStatus">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Refresh,
  ArrowDown,
  View,
  Link,
  Unlock,
  Edit,
  Delete,
  Loading,
  Monitor
} from '@element-plus/icons-vue'
import {
  getConnectorConfigList,
  getConnectorsStatus,
  createConnectorConfig,
  updateConnectorConfig,
  deleteConnectorConfig,
  startConnector,
  stopConnector,
  restartConnector,
  bindProxy,
  unbindProxy,
  getConnectorStatus,
  getSystemMonitor,
  type ConnectorConfigListItem,
  type CreateConnectorConfigRequest,
  type UpdateConnectorConfigRequest,
  type MonitorResponse,
  type MonitorConnector
} from '@/api/connector'
import type { ConnectorStatus, ConnectorsSummary } from '@/types/connector'
import { getEnabledProxyConfigs, type ProxyConfig } from '@/api/proxy'

const commonCountryCodes = [
  { code: '886', name: '台灣' },
  { code: '62', name: '印尼' },
  { code: '63', name: '菲律賓' },
  { code: '66', name: '泰國' },
  { code: '84', name: '越南' },
  { code: '60', name: '馬來西亞' },
  { code: '91', name: '印度' },
  { code: '55', name: '巴西' },
  { code: '52', name: '墨西哥' },
  { code: '1', name: '美國/加拿大' },
]

// 生成 UUID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// State
const loading = ref(false)
const submitting = ref(false)
const loadingStatus = ref(false)
const connectorList = ref<(ConnectorConfigListItem & {
  _starting?: boolean
  _stopping?: boolean
  _restarting?: boolean
  // 監控數據
  alive?: boolean
  version?: string
  last_heartbeat?: string
  accounts?: { total: number; connected: number; disconnected: number }
})[]>([])
const proxyOptions = ref<ProxyConfig[]>([])
const connectorStatus = ref<{
  running: boolean
  account_count?: number
  account_ids?: number[]
  uptime?: string
  start_time?: string
} | null>(null)

// 系統監控面板
const showMonitor = ref(false)
const loadingMonitor = ref(false)
const monitorData = ref<MonitorResponse | null>(null)

// 監控數據
const apiVersion = ref('')
const monitorSummary = reactive<ConnectorsSummary>({
  total_connectors: 0,
  alive_connectors: 0,
  total_accounts: 0,
  connected_accounts: 0,
  disconnected_accounts: 0
})
let refreshTimer: ReturnType<typeof setInterval> | null = null

// Dialogs
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showBindDialog = ref(false)
const showStatusDialog = ref(false)
const currentEditId = ref<string | null>(null)
const currentBindId = ref<string | null>(null)
const currentStatusId = ref<string | null>(null)

// Pagination
const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

// Search form
const searchForm = reactive({
  keyword: '',
  status: '' as '' | 'running' | 'stopped' | 'error' | 'starting' | 'stopping',
  proxy_config_id: undefined as number | undefined
})

// Stats - 整合監控數據
const stats = computed(() => {
  const list = connectorList.value
  return {
    running: list.filter(c => c.status === 'running').length,
    stopped: list.filter(c => c.status === 'stopped').length,
    error: list.filter(c => c.status === 'error').length,
    total: pagination.total,
    // 監控統計
    alive: monitorSummary.alive_connectors,
    totalAccounts: monitorSummary.total_accounts,
    connectedAccounts: monitorSummary.connected_accounts
  }
})

// Create form
const createForm = reactive<CreateConnectorConfigRequest>({
  id: '',
  name: '',
  proxy_config_id: undefined,
  country_codes: [],
  auto_start: false
})

// Edit form
const editForm = reactive<UpdateConnectorConfigRequest>({
  name: '',
  country_codes: [],
  accept_new_device: true
})

// Bind form
const bindForm = reactive({
  proxy_config_id: undefined as number | undefined
})

// Form refs
const createFormRef = ref()
const editFormRef = ref()
const bindFormRef = ref()

// Form rules
const createFormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

const editFormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

// Methods
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    running: 'success',
    stopped: 'info',
    starting: 'warning',
    stopping: 'warning',
    error: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    starting: '启动中',
    stopping: '停止中',
    error: '错误'
  }
  return texts[status] || status
}

const fetchProxyOptions = async () => {
  try {
    const res = await getEnabledProxyConfigs()
    proxyOptions.value = res.data
  } catch (error) {
    console.error('Failed to fetch proxy options:', error)
  }
}

// 獲取監控數據
const fetchMonitorData = async () => {
  try {
    const res = await getConnectorsStatus()
    const data = res.data || res
    apiVersion.value = data.api_version || ''
    Object.assign(monitorSummary, data.summary || {})

    // 合併監控數據到列表
    const statusMap = new Map<string, ConnectorStatus>()
    for (const c of (data.connectors || [])) {
      statusMap.set(c.id, c)
    }
    for (const item of connectorList.value) {
      const status = statusMap.get(item.id)
      if (status) {
        item.alive = status.alive
        item.version = status.version
        item.last_heartbeat = status.last_heartbeat
        item.accounts = status.accounts
      }
    }
  } catch (error) {
    console.error('Failed to fetch monitor data:', error)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.page_size
    }
    if (searchForm.keyword) params.keyword = searchForm.keyword
    if (searchForm.status) params.status = searchForm.status
    if (searchForm.proxy_config_id !== undefined) params.proxy_config_id = searchForm.proxy_config_id

    const res = await getConnectorConfigList(params)
    connectorList.value = res.data.list
    pagination.total = res.data.total

    // 同時獲取監控數據
    await fetchMonitorData()
  } catch (error) {
    console.error('Failed to fetch connector list:', error)
    ElMessage.error('获取 Connector 列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchList()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.proxy_config_id = undefined
  pagination.page = 1
  fetchList()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchList()
}

const handlePageSizeChange = (size: number) => {
  pagination.page_size = size
  pagination.page = 1
  fetchList()
}

const resetCreateForm = () => {
  createForm.id = generateUUID()
  createForm.name = ''
  createForm.proxy_config_id = undefined
  createForm.country_codes = []
  createForm.auto_start = false
}

const handleCreate = async () => {
  try {
    await createFormRef.value.validate()
    submitting.value = true
    await createConnectorConfig(createForm)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    resetCreateForm()
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to create connector:', error)
      ElMessage.error(error?.response?.data?.error || '创建失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleEdit = (row: ConnectorConfigListItem) => {
  currentEditId.value = row.id
  editForm.name = row.name
  editForm.country_codes = row.country_codes ? [...row.country_codes] : []
  editForm.accept_new_device = row.accept_new_device ?? true
  showEditDialog.value = true
}

const handleUpdate = async () => {
  if (!currentEditId.value) return
  try {
    await editFormRef.value.validate()
    submitting.value = true
    await updateConnectorConfig(currentEditId.value, editForm)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to update connector:', error)
      ElMessage.error(error?.response?.data?.error || '更新失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row: ConnectorConfigListItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 Connector "${row.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteConnectorConfig(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete connector:', error)
      ElMessage.error(error?.response?.data?.error || '删除失败')
    }
  }
}

const handleStart = async (row: ConnectorConfigListItem & { _starting?: boolean }) => {
  row._starting = true
  try {
    await startConnector(row.id)
    ElMessage.success('启动指令已发送')
    setTimeout(fetchList, 2000)
  } catch (error: any) {
    console.error('Failed to start connector:', error)
    ElMessage.error(error?.response?.data?.error || '启动失败')
  } finally {
    row._starting = false
  }
}

const handleStop = async (row: ConnectorConfigListItem & { _stopping?: boolean }) => {
  try {
    await ElMessageBox.confirm(`确定要停止 Connector "${row.name}" 吗？`, '确认停止', {
      confirmButtonText: '停止',
      cancelButtonText: '取消',
      type: 'warning'
    })
    row._stopping = true
    await stopConnector(row.id)
    ElMessage.success('停止指令已发送')
    setTimeout(fetchList, 2000)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to stop connector:', error)
      ElMessage.error(error?.response?.data?.error || '停止失败')
    }
  } finally {
    row._stopping = false
  }
}

const handleRestart = async (row: ConnectorConfigListItem & { _restarting?: boolean }) => {
  row._restarting = true
  try {
    await restartConnector(row.id)
    ElMessage.success('重启指令已发送')
    setTimeout(fetchList, 3000)
  } catch (error: any) {
    console.error('Failed to restart connector:', error)
    ElMessage.error(error?.response?.data?.error || '重启失败')
  } finally {
    row._restarting = false
  }
}

const handleBindProxy = (row: ConnectorConfigListItem) => {
  currentBindId.value = row.id
  bindForm.proxy_config_id = row.proxy_config_id || undefined
  showBindDialog.value = true
}

const handleBind = async () => {
  if (!currentBindId.value || !bindForm.proxy_config_id) return
  try {
    await bindFormRef.value.validate()
    submitting.value = true
    await bindProxy(currentBindId.value, bindForm.proxy_config_id)
    ElMessage.success('绑定成功，请重启 Connector 使配置生效')
    showBindDialog.value = false
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to bind proxy:', error)
      ElMessage.error(error?.response?.data?.error || '绑定失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleUnbind = async (row: ConnectorConfigListItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要解除 "${row.name}" 的代理绑定吗？解除后需重启 Connector。`,
      '确认解除绑定',
      {
        confirmButtonText: '解除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await unbindProxy(row.id)
    ElMessage.success('解除绑定成功，请重启 Connector 使配置生效')
    fetchList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to unbind proxy:', error)
      ElMessage.error(error?.response?.data?.error || '解除绑定失败')
    }
  }
}

const fetchStatus = async () => {
  if (!currentStatusId.value) return
  loadingStatus.value = true
  try {
    const res = await getConnectorStatus(currentStatusId.value)
    connectorStatus.value = res.data
  } catch (error: any) {
    console.error('Failed to fetch status:', error)
    ElMessage.error('获取状态失败')
  } finally {
    loadingStatus.value = false
  }
}

const handleViewStatus = (row: ConnectorConfigListItem) => {
  currentStatusId.value = row.id
  connectorStatus.value = null
  showStatusDialog.value = true
  fetchStatus()
}

const handleCommand = (command: string, row: ConnectorConfigListItem) => {
  switch (command) {
    case 'status':
      handleViewStatus(row)
      break
    case 'bind':
      handleBindProxy(row)
      break
    case 'unbind':
      handleUnbind(row)
      break
    case 'edit':
      handleEdit(row)
      break
    case 'delete':
      handleDelete(row)
      break
  }
}

// ========== 系統監控 ==========

watch(showMonitor, (open) => {
  if (open && !monitorData.value) fetchMonitor()
})

const fetchMonitor = async () => {
  loadingMonitor.value = true
  try {
    const res = await getSystemMonitor()
    monitorData.value = res.data
  } catch (error) {
    console.error('Failed to fetch monitor:', error)
  } finally {
    loadingMonitor.value = false
  }
}

const streamLabel = (key: string): string => {
  const labels: Record<string, string> = {
    priority_events: 'Priority Events',
    message_events: 'Message Events',
    events: 'General Events'
  }
  return labels[key] || key
}

const pendingLevelClass = (count: number): string => {
  if (count >= 1000) return 'level-danger'
  if (count >= 100) return 'level-warning'
  return 'level-ok'
}

const pendingProgressColor = (count: number): string => {
  if (count >= 1000) return '#f56c6c'
  if (count >= 100) return '#e6a23c'
  return '#67c23a'
}

const pendingPercentage = (count: number): number => {
  if (count === 0) return 0
  // 以 1000 為滿格，最小顯示 2%
  return Math.max(2, Math.min(count / 10, 100))
}

// command stream 仍用 length（非 consumer group，沒有 pending 概念）
const streamLevelClass = (length: number): string => {
  if (length >= 100) return 'level-danger'
  if (length >= 20) return 'level-warning'
  return 'level-ok'
}

const workerQueueClass = (q: number): string => {
  if (q >= 500) return 'level-danger'
  if (q >= 100) return 'level-warning'
  return 'level-ok'
}

const topQueuedAccounts = (conn: MonitorConnector): [string, number][] => {
  if (!conn.event_worker_queues) return []
  return Object.entries(conn.event_worker_queues)
    .filter(([, q]) => q > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
}

const connectorName = (id: string): string => {
  const item = connectorList.value.find(c => c.id === id)
  return item ? `${item.name} (${id})` : id
}

const monitorHealthType = computed(() => {
  if (!monitorData.value) return 'info'
  const streams = Object.values(monitorData.value.event_streams || {})
  const maxPending = Math.max(0, ...streams.map(s => s.pending?.count || 0))
  const connectors = Object.values(monitorData.value.connectors || {})
  const maxQueue = Math.max(0, ...connectors.map(c => c.event_worker_summary?.max_queue || 0))
  if (maxPending >= 1000 || maxQueue >= 500) return 'danger'
  if (maxPending >= 100 || maxQueue >= 100) return 'warning'
  return 'success'
})

const monitorHealthLabel = computed(() => {
  const typeMap: Record<string, string> = { success: '正常', warning: '注意', danger: '告警' }
  return typeMap[monitorHealthType.value] || '未知'
})

// Lifecycle
onMounted(() => {
  fetchProxyOptions()
  fetchList()
  resetCreateForm() // 初始化 UUID

  // 每 30 秒自動刷新監控數據
  refreshTimer = setInterval(() => {
    fetchMonitorData()
    if (showMonitor.value) fetchMonitor()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.connector-config-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-value.stat-running {
  color: #67c23a;
}

.stat-value.stat-stopped {
  color: #909399;
}

.stat-value.stat-error {
  color: #f56c6c;
}

.stat-value.stat-alive {
  color: #67c23a;
}

.stat-value.stat-accounts {
  color: #409eff;
  font-size: 22px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.error-msg {
  color: #f56c6c;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  display: inline-block;
}

.status-icon.is-loading {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-tip {
  margin-top: 16px;
}

.id-input-row {
  display: flex;
  gap: 8px;
}

.id-input-row .el-input {
  flex: 1;
}

.api-version {
  font-weight: 500;
}

.account-stats {
  font-size: 13px;
  font-family: monospace;
}

.account-stats .total {
  color: #606266;
}

.account-stats .connected {
  color: #67c23a;
}

.account-stats .disconnected {
  color: #f56c6c;
}

.account-stats .divider {
  color: #c0c4cc;
  margin: 0 2px;
}

.account-stats-label {
  font-size: 10px;
  color: #909399;
}

/* Monitor Panel */
.monitor-card {
  margin-bottom: 20px;
}

.monitor-card :deep(.el-card__header) {
  padding: 12px 20px;
  cursor: pointer;
  user-select: none;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.monitor-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
}

.monitor-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-icon {
  transition: transform 0.3s;
}

.collapse-icon.is-open {
  transform: rotate(180deg);
}

.monitor-section-title {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.stream-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stream-item {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
}

.stream-name {
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.stream-pending-main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 6px;
}

.pending-value {
  font-size: 24px;
  font-weight: 600;
  font-family: monospace;
}

.pending-label {
  font-size: 12px;
  color: #909399;
}

.stream-meta {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 4px;
}

.level-ok { color: #67c23a; }
.level-warning { color: #e6a23c; }
.level-danger { color: #f56c6c; }

.connector-monitor-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
}

.monitor-block {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
}

.monitor-block-label {
  font-size: 11px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.cmd-stream-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.cmd-label {
  font-size: 12px;
  color: #606266;
}

.cmd-value {
  font-family: monospace;
  font-weight: 600;
  font-size: 14px;
}

.worker-summary {
  display: flex;
  gap: 16px;
}

.worker-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.worker-value {
  font-size: 18px;
  font-weight: 600;
  font-family: monospace;
}

.worker-label {
  font-size: 10px;
  color: #909399;
}

.worker-details {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.no-data {
  color: #909399;
  font-size: 12px;
}

@media (max-width: 768px) {
  .connector-config-container {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-row > * {
    width: 100% !important;
  }

  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .stream-grid {
    grid-template-columns: 1fr;
  }

  .connector-monitor-row {
    grid-template-columns: 1fr;
  }
}
</style>
