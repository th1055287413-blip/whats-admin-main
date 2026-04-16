<template>
  <div class="approval-templates">
    <!-- 页面头部 -->
    <div class="templates-header">
      <div class="header-main">
        <h2>审批流程模板</h2>
        <p class="description">配置和管理各类业务的审批流程模板</p>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          :icon="Plus"
          @click="showCreateDialog"
          v-if="configStore.hasPermission('canWrite')"
        >
          创建模板
        </el-button>
        <el-button
          type="info"
          :icon="Download"
          @click="exportTemplates"
          v-if="configStore.hasPermission('canExport')"
        >
          导出模板
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="templates-search">
      <el-card shadow="never">
        <el-form :model="searchForm" inline>
          <el-form-item label="搜索模板">
            <el-input
              v-model="searchForm.keyword"
              placeholder="输入模板名称或描述"
              :prefix-icon="Search"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
              style="width: 250px"
            />
          </el-form-item>
          <el-form-item label="分类">
            <el-select
              v-model="searchForm.category"
              placeholder="选择分类"
              clearable
              style="width: 150px"
              @change="handleSearch"
            >
              <el-option
                v-for="category in templateCategories"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="选择状态"
              clearable
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 模板列表 -->
    <div class="templates-content">
      <el-row :gutter="20">
        <el-col
          :xl="8"
          :lg="12"
          :md="12"
          :sm="24"
          v-for="template in configStore.approvalTemplates"
          :key="template.id"
        >
          <el-card
            shadow="hover"
            class="template-card"
            :class="{ disabled: template.status === 'disabled' }"
          >
            <template #header>
              <div class="template-header">
                <div class="template-info">
                  <h3 class="template-name">{{ template.name }}</h3>
                  <div class="template-meta">
                    <el-tag
                      :type="template.status === 'active' ? 'success' : 'info'"
                      size="small"
                    >
                      {{ template.status === 'active' ? '启用中' : '已禁用' }}
                    </el-tag>
                    <el-tag size="small" effect="plain">{{ template.category }}</el-tag>
                    <span class="version">v{{ template.version }}</span>
                  </div>
                </div>
                <el-dropdown
                  trigger="click"
                  @command="handleCommand"
                  v-if="configStore.hasPermission('canWrite')"
                >
                  <el-button type="text" :icon="MoreFilled" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        :command="{ action: 'edit', template }"
                        :icon="Edit"
                      >
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item
                        :command="{ action: 'clone', template }"
                        :icon="CopyDocument"
                      >
                        复制
                      </el-dropdown-item>
                      <el-dropdown-item
                        :command="{ action: 'toggle', template }"
                        :icon="template.status === 'active' ? 'VideoPause' : 'VideoPlay'"
                      >
                        {{ template.status === 'active' ? '禁用' : '启用' }}
                      </el-dropdown-item>
                      <el-dropdown-item
                        :command="{ action: 'stats', template }"
                        :icon="DataAnalysis"
                      >
                        统计信息
                      </el-dropdown-item>
                      <el-dropdown-item
                        :command="{ action: 'delete', template }"
                        :icon="Delete"
                        divided
                      >
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>

            <div class="template-content">
              <div class="template-description">
                <p>{{ template.description || '暂无描述' }}</p>
              </div>

              <div class="template-flow">
                <div class="flow-title">审批流程：</div>
                <div class="flow-nodes">
                  <div
                    v-for="(node, index) in template.nodes.slice(0, 3)"
                    :key="node.id"
                    class="flow-node"
                  >
                    <div class="node-info">
                      <el-tag
                        :type="getNodeTypeColor(node.type)"
                        size="small"
                        effect="plain"
                      >
                        {{ getNodeTypeLabel(node.type) }}
                      </el-tag>
                      <span class="node-name">{{ node.name }}</span>
                    </div>
                    <el-icon
                      v-if="index < Math.min(template.nodes.length - 1, 2)"
                      class="arrow-icon"
                    >
                      <ArrowRight />
                    </el-icon>
                  </div>
                  <div v-if="template.nodes.length > 3" class="more-nodes">
                    <el-text type="info" size="small">
                      还有 {{ template.nodes.length - 3 }} 个节点...
                    </el-text>
                  </div>
                </div>
              </div>

              <div class="template-stats">
                <div class="stat-item">
                  <span class="stat-label">节点数量：</span>
                  <span class="stat-value">{{ template.nodes.length }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">创建时间：</span>
                  <span class="stat-value">{{ formatDate(template.createdAt) }}</span>
                </div>
              </div>
            </div>

            <template #footer>
              <div class="template-actions">
                <el-button
                  size="small"
                  type="primary"
                  @click="viewTemplate(template)"
                >
                  查看详情
                </el-button>
                <el-button
                  size="small"
                  @click="editTemplate(template)"
                  v-if="configStore.hasPermission('canWrite')"
                >
                  编辑
                </el-button>
              </div>
            </template>
          </el-card>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <div v-if="configStore.approvalTemplates.length === 0" class="empty-state">
        <el-empty description="暂无审批模板">
          <el-button
            type="primary"
            @click="showCreateDialog"
            v-if="configStore.hasPermission('canWrite')"
          >
            创建第一个模板
          </el-button>
        </el-empty>
      </div>

      <!-- 分页 -->
      <div v-if="configStore.approvalTemplates.length > 0" class="pagination">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.pageSize"
          :total="configStore.pagination.approvalTemplate.total"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建/编辑模板对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editingTemplate ? '编辑审批模板' : '创建审批模板'"
      width="90%"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <ApprovalFlow
        v-if="editDialogVisible"
        :template="editingTemplate"
        @save="handleTemplateSave"
        @cancel="editDialogVisible = false"
      />
    </el-dialog>

    <!-- 模板详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="模板详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedTemplate" class="template-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模板名称">
            {{ selectedTemplate.name }}
          </el-descriptions-item>
          <el-descriptions-item label="分类">
            {{ selectedTemplate.category }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="selectedTemplate.status === 'active' ? 'success' : 'info'"
            >
              {{ selectedTemplate.status === 'active' ? '启用中' : '已禁用' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="版本">
            v{{ selectedTemplate.version }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(selectedTemplate.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDate(selectedTemplate.updatedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ selectedTemplate.description || '暂无描述' }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="flow-visualization">
          <h4>审批流程</h4>
          <div class="flow-diagram">
            <div
              v-for="(node, index) in selectedTemplate.nodes"
              :key="node.id"
              class="flow-step"
            >
              <div class="step-node">
                <div class="node-number">{{ index + 1 }}</div>
                <div class="node-content">
                  <div class="node-title">{{ node.name }}</div>
                  <div class="node-details">
                    <el-tag
                      :type="getNodeTypeColor(node.type)"
                      size="small"
                    >
                      {{ getNodeTypeLabel(node.type) }}
                    </el-tag>
                    <span v-if="node.timeoutHours" class="timeout">
                      超时: {{ node.timeoutHours }}小时
                    </span>
                  </div>
                  <div v-if="node.approvers && node.approvers.length > 0" class="approvers">
                    审批人: {{ node.approvers.join(', ') }}
                  </div>
                  <div v-if="node.condition" class="condition">
                    条件: {{ node.condition }}
                  </div>
                </div>
              </div>
              <div v-if="index < selectedTemplate.nodes.length - 1" class="step-arrow">
                <el-icon><ArrowDown /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 复制模板对话框 -->
    <el-dialog
      v-model="cloneDialogVisible"
      title="复制模板"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="cloneForm" :rules="cloneRules" ref="cloneFormRef" label-width="100px">
        <el-form-item label="新模板名称" prop="name">
          <el-input
            v-model="cloneForm.name"
            placeholder="请输入新模板名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="cloneForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cloneDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="cloneLoading"
          @click="confirmClone"
        >
          确定复制
        </el-button>
      </template>
    </el-dialog>

    <!-- 统计信息对话框 -->
    <el-dialog
      v-model="statsDialogVisible"
      title="模板统计信息"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-if="templateStats" class="stats-content">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-card class="stats-card">
              <el-statistic
                title="使用次数"
                :value="templateStats.usageCount"
                suffix="次"
              />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stats-card">
              <el-statistic
                title="平均审批时长"
                :value="templateStats.averageApprovalTime"
                suffix="小时"
                :precision="1"
              />
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card class="stats-card">
              <el-statistic
                title="成功率"
                :value="templateStats.successRate"
                suffix="%"
                :precision="1"
              />
            </el-card>
          </el-col>
        </el-row>

        <div class="usage-chart">
          <h4>最近使用情况</h4>
          <el-table :data="templateStats.recentUsage" height="200">
            <el-table-column label="日期" prop="date" />
            <el-table-column label="使用次数" prop="count" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Download,
  Search,
  MoreFilled,
  Edit,
  CopyDocument,
  Delete,
  DataAnalysis,
  ArrowRight,
  ArrowDown
} from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/config'
import { useConfig } from '@/composables/useConfig'
import ApprovalFlow from '@/components/config/ApprovalFlow.vue'
import type {
  ApprovalTemplate,
  ApprovalTemplateSearchParams
} from '@/types/config'

// ============= 响应式数据 =============
const configStore = useConfigStore()
const configUseConfig = useConfig()

// 搜索表单
const searchForm = ref<ApprovalTemplateSearchParams>({
  keyword: '',
  category: '',
  status: undefined,
  page: 1,
  pageSize: 12
})

// 对话框状态
const editDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const cloneDialogVisible = ref(false)
const statsDialogVisible = ref(false)

// 编辑状态
const editingTemplate = ref<ApprovalTemplate | null>(null)
const selectedTemplate = ref<ApprovalTemplate | null>(null)
const templateToClone = ref<ApprovalTemplate | null>(null)

// 复制表单
const cloneFormRef = ref()
const cloneLoading = ref(false)
const cloneForm = ref({
  name: '',
  description: ''
})

// 统计信息
const templateStats = ref<any>(null)

// ============= 计算属性 =============

// 模板分类列表
const templateCategories = computed(() => {
  const categories = new Set<string>()
  configStore.approvalTemplates.forEach(template => {
    if (template.category) {
      categories.add(template.category)
    }
  })
  return Array.from(categories).sort()
})

// 复制表单验证规则
const cloneRules = computed(() => ({
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ]
}))

// ============= 生命周期 =============
onMounted(async () => {
  await initData()
})

// ============= 方法 =============

/**
 * 初始化数据
 */
async function initData() {
  await configUseConfig.initApprovalTemplates()
}

/**
 * 处理搜索
 */
async function handleSearch() {
  await configStore.searchApprovalTemplates(searchForm.value)
}

/**
 * 重置搜索
 */
async function resetSearch() {
  searchForm.value = {
    keyword: '',
    category: '',
    status: undefined,
    page: 1,
    pageSize: 12
  }
  await configStore.fetchApprovalTemplates()
}

/**
 * 分页处理
 */
async function handlePageSizeChange(pageSize: number) {
  searchForm.value.pageSize = pageSize
  await handleSearch()
}

async function handleCurrentChange(page: number) {
  searchForm.value.page = page
  await handleSearch()
}

/**
 * 显示创建对话框
 */
function showCreateDialog() {
  editingTemplate.value = null
  editDialogVisible.value = true
}

/**
 * 查看模板详情
 */
function viewTemplate(template: ApprovalTemplate) {
  selectedTemplate.value = template
  detailDialogVisible.value = true
}

/**
 * 编辑模板
 */
function editTemplate(template: ApprovalTemplate) {
  editingTemplate.value = template
  editDialogVisible.value = true
}

/**
 * 处理下拉菜单命令
 */
async function handleCommand(command: { action: string; template: ApprovalTemplate }) {
  const { action, template } = command

  switch (action) {
    case 'edit':
      editTemplate(template)
      break
    case 'clone':
      showCloneDialog(template)
      break
    case 'toggle':
      await toggleTemplateStatus(template)
      break
    case 'stats':
      await showTemplateStats(template)
      break
    case 'delete':
      await deleteTemplate(template)
      break
  }
}

/**
 * 切换模板状态
 */
async function toggleTemplateStatus(template: ApprovalTemplate) {
  try {
    const newStatus = template.status === 'active' ? 'disabled' : 'active'
    const action = newStatus === 'active' ? '启用' : '禁用'

    await ElMessageBox.confirm(
      `确定要${action}模板 "${template.name}" 吗？`,
      `确认${action}`,
      {
        type: 'warning',
        confirmButtonText: `确定${action}`,
        cancelButtonText: '取消'
      }
    )

    await configStore.configApi.approvalTemplate.toggleTemplateStatus(template.id, newStatus)
    template.status = newStatus
    ElMessage.success(`模板已${action}`)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('切换状态失败:', error)
      ElMessage.error('切换状态失败')
    }
  }
}

/**
 * 显示复制对话框
 */
function showCloneDialog(template: ApprovalTemplate) {
  templateToClone.value = template
  cloneForm.value = {
    name: `${template.name} - 副本`,
    description: template.description || ''
  }
  cloneDialogVisible.value = true
}

/**
 * 确认复制模板
 */
async function confirmClone() {
  try {
    await cloneFormRef.value.validate()

    cloneLoading.value = true

    await configUseConfig.cloneApprovalTemplate(
      templateToClone.value!.id,
      cloneForm.value.name
    )

    cloneDialogVisible.value = false
    await handleSearch()
  } catch (error) {
    console.error('复制模板失败:', error)
  } finally {
    cloneLoading.value = false
  }
}

/**
 * 显示模板统计
 */
async function showTemplateStats(template: ApprovalTemplate) {
  try {
    const response = await configStore.configApi.approvalTemplate.getTemplateStats(template.id)
    templateStats.value = response.data
    statsDialogVisible.value = true
  } catch (error) {
    console.error('获取统计信息失败:', error)
    ElMessage.error('获取统计信息失败')
  }
}

/**
 * 删除模板
 */
async function deleteTemplate(template: ApprovalTemplate) {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板 "${template.name}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )

    await configStore.configApi.approvalTemplate.deleteTemplate(template.id)

    // 从列表中移除
    const index = configStore.approvalTemplates.findIndex(t => t.id === template.id)
    if (index > -1) {
      configStore.approvalTemplates.splice(index, 1)
    }

    ElMessage.success('模板删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模板失败:', error)
      ElMessage.error('删除模板失败')
    }
  }
}

/**
 * 处理模板保存
 */
async function handleTemplateSave() {
  editDialogVisible.value = false
  await handleSearch()
}

/**
 * 导出模板
 */
async function exportTemplates() {
  try {
    const response = await configStore.configApi.exportConfig(['approval_templates'])

    // 创建下载链接
    const blob = new Blob([JSON.stringify(response.data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `approval-templates-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('模板导出成功')
  } catch (error) {
    console.error('导出模板失败:', error)
    ElMessage.error('导出模板失败')
  }
}

// ============= 工具方法 =============

function getNodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    user: '用户审批',
    role: '角色审批',
    condition: '条件审批'
  }
  return labels[type] || type
}

function getNodeTypeColor(type: string): string {
  const colors: Record<string, string> = {
    user: 'primary',
    role: 'success',
    condition: 'warning'
  }
  return colors[type] || 'info'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped>
.approval-templates {
  padding: 20px;
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-main h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.header-main .description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.templates-search {
  margin-bottom: 20px;
}

.templates-search :deep(.el-card__body) {
  padding: 16px 20px;
}

.templates-content {
  min-height: 400px;
}

.template-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.template-card:hover {
  transform: translateY(-2px);
}

.template-card.disabled {
  opacity: 0.7;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.template-info {
  flex: 1;
}

.template-name {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.template-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.version {
  font-size: 12px;
  color: #909399;
  padding: 2px 6px;
  background: #f5f7fa;
  border-radius: 2px;
}

.template-content {
  padding: 16px 0;
}

.template-description {
  margin-bottom: 16px;
}

.template-description p {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.template-flow {
  margin-bottom: 16px;
}

.flow-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.flow-nodes {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.flow-node {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.node-name {
  font-size: 12px;
  color: #606266;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 12px;
}

.more-nodes {
  margin-left: 8px;
}

.template-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.stat-item {
  display: flex;
  gap: 4px;
}

.stat-label {
  color: #909399;
}

.stat-value {
  color: #606266;
}

.template-actions {
  display: flex;
  justify-content: space-between;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
}

.pagination {
  margin-top: 30px;
  text-align: center;
}

.template-detail {
  padding: 20px 0;
}

.flow-visualization {
  margin-top: 30px;
}

.flow-visualization h4 {
  margin: 0 0 20px 0;
  color: #303133;
}

.flow-diagram {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-node {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafbfc;
  width: 100%;
  max-width: 500px;
}

.node-number {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.node-content {
  flex: 1;
}

.node-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.node-details {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.timeout {
  font-size: 12px;
  color: #f56c6c;
}

.approvers,
.condition {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.step-arrow {
  margin: 8px 0;
  color: #409eff;
}

.stats-content {
  padding: 20px 0;
}

.stats-card {
  text-align: center;
  margin-bottom: 20px;
}

.usage-chart h4 {
  margin: 0 0 16px 0;
  color: #303133;
}
</style>