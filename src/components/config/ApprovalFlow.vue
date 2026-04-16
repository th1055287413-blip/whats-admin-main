<template>
  <div class="approval-flow">
    <!-- 基本信息表单 -->
    <div class="template-basic">
      <el-form
        ref="basicFormRef"
        :model="templateForm"
        :rules="basicRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input
                v-model="templateForm.name"
                placeholder="请输入模板名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select
                v-model="templateForm.category"
                placeholder="选择或输入分类"
                style="width: 100%"
                filterable
                allow-create
              >
                <el-option
                  v-for="category in templateCategories"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="templateForm.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>

    <el-divider />

    <!-- 流程设计器 -->
    <div class="flow-designer">
      <div class="designer-header">
        <h3>审批流程设计</h3>
        <div class="designer-actions">
          <el-button
            type="primary"
            :icon="Plus"
            @click="addNode"
          >
            添加节点
          </el-button>
          <el-button
            :icon="View"
            @click="previewFlow"
          >
            预览流程
          </el-button>
          <el-button
            :icon="Check"
            :loading="validating"
            @click="validateFlow"
          >
            验证流程
          </el-button>
        </div>
      </div>

      <!-- 流程节点列表 -->
      <div class="flow-nodes">
        <div v-if="templateForm.nodes.length === 0" class="empty-flow">
          <el-empty description="暂无流程节点">
            <el-button type="primary" @click="addNode">
              添加第一个节点
            </el-button>
          </el-empty>
        </div>

        <div v-else class="nodes-container">
          <draggable
            v-model="templateForm.nodes"
            item-key="id"
            :animation="300"
            @change="handleNodeOrderChange"
          >
            <template #item="{ element: node, index }">
              <div class="flow-node-item">
                <div class="node-header">
                  <div class="node-info">
                    <span class="node-number">{{ index + 1 }}</span>
                    <span class="node-title">{{ node.name || `节点 ${index + 1}` }}</span>
                    <el-tag
                      :type="getNodeTypeColor(node.type)"
                      size="small"
                      effect="plain"
                    >
                      {{ getNodeTypeLabel(node.type) }}
                    </el-tag>
                  </div>
                  <div class="node-actions">
                    <el-button
                      type="text"
                      :icon="Edit"
                      @click="editNode(node, index)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      type="text"
                      :icon="CopyDocument"
                      @click="duplicateNode(node, index)"
                    >
                      复制
                    </el-button>
                    <el-button
                      type="text"
                      :icon="Delete"
                      @click="deleteNode(index)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>

                <div class="node-content">
                  <div class="node-details">
                    <div v-if="node.approvers && node.approvers.length > 0" class="detail-item">
                      <span class="detail-label">审批人：</span>
                      <span class="detail-value">{{ node.approvers.join(', ') }}</span>
                    </div>
                    <div v-if="node.condition" class="detail-item">
                      <span class="detail-label">条件：</span>
                      <span class="detail-value">{{ node.condition }}</span>
                    </div>
                    <div v-if="node.timeoutHours" class="detail-item">
                      <span class="detail-label">超时：</span>
                      <span class="detail-value">{{ node.timeoutHours }} 小时</span>
                    </div>
                    <div v-if="node.description" class="detail-item">
                      <span class="detail-label">描述：</span>
                      <span class="detail-value">{{ node.description }}</span>
                    </div>
                  </div>
                </div>

                <!-- 连接线 -->
                <div v-if="index < templateForm.nodes.length - 1" class="node-connector">
                  <el-icon><ArrowDown /></el-icon>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>

    <!-- 节点编辑对话框 -->
    <el-dialog
      v-model="nodeDialogVisible"
      :title="editingNodeIndex >= 0 ? '编辑节点' : '添加节点'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="nodeFormRef"
        :model="nodeForm"
        :rules="nodeRules"
        label-width="100px"
      >
        <el-form-item label="节点名称" prop="name">
          <el-input
            v-model="nodeForm.name"
            placeholder="请输入节点名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="节点类型" prop="type">
          <el-select v-model="nodeForm.type" style="width: 100%" @change="handleNodeTypeChange">
            <el-option
              label="用户审批"
              value="user"
              description="指定具体用户进行审批"
            />
            <el-option
              label="角色审批"
              value="role"
              description="指定角色中的任意用户进行审批"
            />
            <el-option
              label="条件审批"
              value="condition"
              description="根据条件自动判断是否通过"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="nodeForm.type === 'user'"
          label="审批用户"
          prop="approvers"
        >
          <el-select
            v-model="nodeForm.approvers"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="搜索并选择用户"
            :remote-method="searchUsers"
            :loading="searchingUsers"
            style="width: 100%"
          >
            <el-option
              v-for="user in userOptions"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="nodeForm.type === 'role'"
          label="审批角色"
          prop="approvers"
        >
          <el-select
            v-model="nodeForm.approvers"
            multiple
            placeholder="选择角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          v-if="nodeForm.type === 'condition'"
          label="条件表达式"
          prop="condition"
        >
          <el-input
            v-model="nodeForm.condition"
            type="textarea"
            :rows="3"
            placeholder="请输入条件表达式，例如：amount < 1000"
          />
          <div class="condition-help">
            <el-text size="small" type="info">
              支持的变量：amount（金额）、applicant（申请人）、department（部门）等
            </el-text>
          </div>
        </el-form-item>

        <el-form-item label="超时设置">
          <el-input-number
            v-model="nodeForm.timeoutHours"
            :min="1"
            :max="72"
            placeholder="小时"
            style="width: 200px"
          />
          <el-text size="small" type="info" style="margin-left: 8px">
            超过指定时间未审批将自动处理
          </el-text>
        </el-form-item>

        <el-form-item label="是否必需">
          <el-switch
            v-model="nodeForm.isRequired"
            active-text="必需"
            inactive-text="可选"
          />
        </el-form-item>

        <el-form-item label="节点描述">
          <el-input
            v-model="nodeForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入节点描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="nodeDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="nodeLoading"
          @click="saveNode"
        >
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 流程预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="流程预览"
      width="80%"
      :close-on-click-modal="false"
    >
      <div class="flow-preview">
        <div class="preview-header">
          <h4>{{ templateForm.name || '未命名模板' }}</h4>
          <p>{{ templateForm.description || '暂无描述' }}</p>
        </div>

        <div class="preview-flow">
          <div
            v-for="(node, index) in templateForm.nodes"
            :key="node.id"
            class="preview-node"
          >
            <div class="preview-step">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <div class="step-title">{{ node.name }}</div>
                <div class="step-details">
                  <el-tag
                    :type="getNodeTypeColor(node.type)"
                    size="small"
                  >
                    {{ getNodeTypeLabel(node.type) }}
                  </el-tag>
                  <span v-if="node.timeoutHours" class="timeout">
                    {{ node.timeoutHours }}小时超时
                  </span>
                  <span v-if="node.isRequired" class="required">必需</span>
                </div>
                <div v-if="node.approvers && node.approvers.length > 0" class="step-approvers">
                  审批人: {{ node.approvers.join(', ') }}
                </div>
                <div v-if="node.condition" class="step-condition">
                  条件: {{ node.condition }}
                </div>
              </div>
            </div>
            <div v-if="index < templateForm.nodes.length - 1" class="preview-arrow">
              <el-icon><ArrowDown /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 验证结果对话框 -->
    <el-dialog
      v-model="validationDialogVisible"
      title="流程验证结果"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="validationResult" class="validation-result">
        <el-result
          :icon="validationResult.isValid ? 'success' : 'error'"
          :title="validationResult.isValid ? '验证通过' : '验证失败'"
        >
          <template #sub-title>
            <div v-if="validationResult.errors.length > 0" class="validation-errors">
              <div v-for="error in validationResult.errors" :key="error" class="error-item">
                <el-icon><Close /></el-icon>
                <span>{{ error }}</span>
              </div>
            </div>
            <div v-if="validationResult.warnings.length > 0" class="validation-warnings">
              <div v-for="warning in validationResult.warnings" :key="warning" class="warning-item">
                <el-icon><Warning /></el-icon>
                <span>{{ warning }}</span>
              </div>
            </div>
            <div v-if="validationResult.isValid" class="success-message">
              流程配置正确，可以正常使用
            </div>
          </template>
        </el-result>
      </div>
    </el-dialog>

    <!-- 操作按钮 -->
    <div class="flow-actions">
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button
        type="primary"
        :loading="saving"
        @click="saveTemplate"
      >
        保存模板
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  CopyDocument,
  View,
  Check,
  ArrowDown,
  Close,
  Warning
} from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { useConfigStore } from '@/stores/config'
import { useConfig } from '@/composables/useConfig'
import type {
  ApprovalTemplate,
  ApprovalNode,
  ConfigValidation
} from '@/types/config'

// ============= Props & Emits =============
interface Props {
  template?: ApprovalTemplate | null
}

interface Emits {
  save: []
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  template: null
})

const emit = defineEmits<Emits>()

// ============= 响应式数据 =============
const configStore = useConfigStore()
const configUseConfig = useConfig()

// 表单引用
const basicFormRef = ref()
const nodeFormRef = ref()

// 模板表单
const templateForm = ref<{
  name: string
  description: string
  category: string
  status: 'active' | 'disabled'
  nodes: ApprovalNode[]
}>({
  name: '',
  description: '',
  category: '',
  status: 'active',
  nodes: []
})

// 节点对话框状态
const nodeDialogVisible = ref(false)
const editingNodeIndex = ref(-1)
const nodeLoading = ref(false)

// 节点表单
const nodeForm = ref<ApprovalNode>({
  id: '',
  name: '',
  type: 'user',
  approvers: [],
  condition: '',
  timeoutHours: 24,
  isRequired: true,
  description: ''
})

// 预览对话框
const previewDialogVisible = ref(false)

// 验证相关
const validating = ref(false)
const validationDialogVisible = ref(false)
const validationResult = ref<ConfigValidation | null>(null)

// 保存状态
const saving = ref(false)

// 用户和角色选项
const userOptions = ref<Array<{ id: string; name: string }>>([])
const roleOptions = ref<Array<{ id: string; name: string }>>([])
const searchingUsers = ref(false)

// ============= 计算属性 =============

// 模板分类
const templateCategories = computed(() => {
  const categories = new Set(['消息审批', '文件审批', '用户管理', '系统配置'])
  configStore.approvalTemplates.forEach(template => {
    if (template.category) {
      categories.add(template.category)
    }
  })
  return Array.from(categories).sort()
})

// 基本信息验证规则
const basicRules = computed(() => ({
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}))

// 节点验证规则
const nodeRules = computed(() => {
  const rules: any = {
    name: [
      { required: true, message: '请输入节点名称', trigger: 'blur' }
    ],
    type: [
      { required: true, message: '请选择节点类型', trigger: 'change' }
    ]
  }

  if (nodeForm.value.type === 'user' || nodeForm.value.type === 'role') {
    rules.approvers = [
      { required: true, message: '请选择审批人', trigger: 'change' }
    ]
  }

  if (nodeForm.value.type === 'condition') {
    rules.condition = [
      { required: true, message: '请输入条件表达式', trigger: 'blur' }
    ]
  }

  return rules
})

// ============= 生命周期 =============
onMounted(async () => {
  await initData()
})

// 监听模板属性变化
watch(
  () => props.template,
  (newTemplate) => {
    if (newTemplate) {
      initTemplateForm(newTemplate)
    } else {
      resetTemplateForm()
    }
  },
  { immediate: true }
)

// ============= 方法 =============

/**
 * 初始化数据
 */
async function initData() {
  // 加载角色选项
  roleOptions.value = [
    { id: 'admin', name: '管理员' },
    { id: 'manager', name: '经理' },
    { id: 'supervisor', name: '主管' },
    { id: 'operator', name: '操作员' }
  ]
}

/**
 * 初始化模板表单
 */
function initTemplateForm(template: ApprovalTemplate) {
  templateForm.value = {
    name: template.name,
    description: template.description || '',
    category: template.category,
    status: template.status,
    nodes: JSON.parse(JSON.stringify(template.nodes))
  }
}

/**
 * 重置模板表单
 */
function resetTemplateForm() {
  templateForm.value = {
    name: '',
    description: '',
    category: '',
    status: 'active',
    nodes: []
  }
}

/**
 * 添加节点
 */
function addNode() {
  editingNodeIndex.value = -1
  nodeForm.value = {
    id: generateNodeId(),
    name: '',
    type: 'user',
    approvers: [],
    condition: '',
    timeoutHours: 24,
    isRequired: true,
    description: ''
  }
  nodeDialogVisible.value = true
}

/**
 * 编辑节点
 */
function editNode(node: ApprovalNode, index: number) {
  editingNodeIndex.value = index
  nodeForm.value = JSON.parse(JSON.stringify(node))
  nodeDialogVisible.value = true
}

/**
 * 复制节点
 */
function duplicateNode(node: ApprovalNode, index: number) {
  const duplicatedNode = JSON.parse(JSON.stringify(node))
  duplicatedNode.id = generateNodeId()
  duplicatedNode.name = `${node.name} - 副本`
  templateForm.value.nodes.splice(index + 1, 0, duplicatedNode)
}

/**
 * 删除节点
 */
function deleteNode(index: number) {
  templateForm.value.nodes.splice(index, 1)
}

/**
 * 保存节点
 */
async function saveNode() {
  try {
    await nodeFormRef.value.validate()

    nodeLoading.value = true

    if (editingNodeIndex.value >= 0) {
      // 编辑现有节点
      templateForm.value.nodes[editingNodeIndex.value] = JSON.parse(JSON.stringify(nodeForm.value))
    } else {
      // 添加新节点
      templateForm.value.nodes.push(JSON.parse(JSON.stringify(nodeForm.value)))
    }

    nodeDialogVisible.value = false
    ElMessage.success('节点保存成功')
  } catch (error) {
    console.error('节点保存失败:', error)
  } finally {
    nodeLoading.value = false
  }
}

/**
 * 处理节点类型变化
 */
function handleNodeTypeChange() {
  nodeForm.value.approvers = []
  nodeForm.value.condition = ''
}

/**
 * 处理节点顺序变化
 */
function handleNodeOrderChange() {
  // 拖拽排序后的处理
  ElMessage.success('节点顺序已更新')
}

/**
 * 搜索用户
 */
async function searchUsers(query: string) {
  if (!query) return

  searchingUsers.value = true
  try {
    // 这里应该调用真实的用户搜索API
    // 现在使用模拟数据
    setTimeout(() => {
      userOptions.value = [
        { id: 'user1', name: `用户1-${query}` },
        { id: 'user2', name: `用户2-${query}` },
        { id: 'user3', name: `用户3-${query}` }
      ]
      searchingUsers.value = false
    }, 500)
  } catch (error) {
    console.error('搜索用户失败:', error)
    searchingUsers.value = false
  }
}

/**
 * 预览流程
 */
function previewFlow() {
  if (templateForm.value.nodes.length === 0) {
    ElMessage.warning('请先添加审批节点')
    return
  }
  previewDialogVisible.value = true
}

/**
 * 验证流程
 */
async function validateFlow() {
  if (templateForm.value.nodes.length === 0) {
    ElMessage.warning('请先添加审批节点')
    return
  }

  validating.value = true
  try {
    validationResult.value = await configUseConfig.validateApprovalTemplate(templateForm.value.nodes)
    validationDialogVisible.value = true
  } catch (error) {
    console.error('验证失败:', error)
    ElMessage.error('验证失败')
  } finally {
    validating.value = false
  }
}

/**
 * 保存模板
 */
async function saveTemplate() {
  try {
    // 验证基本信息
    await basicFormRef.value.validate()

    if (templateForm.value.nodes.length === 0) {
      ElMessage.warning('请至少添加一个审批节点')
      return
    }

    saving.value = true

    const templateData = {
      name: templateForm.value.name,
      description: templateForm.value.description,
      category: templateForm.value.category,
      nodes: templateForm.value.nodes,
      status: templateForm.value.status
    }

    if (props.template) {
      // 更新现有模板
      await configStore.configApi.approvalTemplate.updateTemplate(props.template.id, templateData)
      ElMessage.success('模板更新成功')
    } else {
      // 创建新模板
      await configStore.createApprovalTemplate(templateData)
      ElMessage.success('模板创建成功')
    }

    emit('save')
  } catch (error) {
    console.error('保存模板失败:', error)
    ElMessage.error('保存模板失败')
  } finally {
    saving.value = false
  }
}

// ============= 工具方法 =============

/**
 * 生成节点ID
 */
function generateNodeId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 获取节点类型标签
 */
function getNodeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    user: '用户审批',
    role: '角色审批',
    condition: '条件审批'
  }
  return labels[type] || type
}

/**
 * 获取节点类型颜色
 */
function getNodeTypeColor(type: string): string {
  const colors: Record<string, string> = {
    user: 'primary',
    role: 'success',
    condition: 'warning'
  }
  return colors[type] || 'info'
}
</script>

<style scoped>
.approval-flow {
  padding: 20px 0;
}

.template-basic {
  margin-bottom: 30px;
}

.flow-designer {
  margin-bottom: 30px;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.designer-header h3 {
  margin: 0;
  color: #303133;
}

.designer-actions {
  display: flex;
  gap: 12px;
}

.flow-nodes {
  min-height: 300px;
}

.empty-flow {
  padding: 60px 20px;
  text-align: center;
}

.nodes-container {
  padding: 20px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafbfc;
}

.flow-node-item {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
  position: relative;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.node-title {
  font-weight: 500;
  color: #303133;
}

.node-actions {
  display: flex;
  gap: 8px;
}

.node-content {
  padding: 16px 20px;
}

.node-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  font-size: 14px;
}

.detail-label {
  min-width: 80px;
  color: #909399;
}

.detail-value {
  color: #606266;
  flex: 1;
}

.node-connector {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  color: #409eff;
}

.condition-help {
  margin-top: 8px;
}

.flow-preview {
  padding: 20px 0;
}

.preview-header {
  margin-bottom: 30px;
  text-align: center;
}

.preview-header h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.preview-header p {
  margin: 0;
  color: #606266;
}

.preview-flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-node {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-step {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: white;
  min-width: 400px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.step-content {
  flex: 1;
}

.step-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.step-details {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.timeout,
.required {
  font-size: 12px;
  color: #f56c6c;
}

.step-approvers,
.step-condition {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.preview-arrow {
  padding: 8px 0;
  color: #409eff;
}

.validation-result {
  padding: 20px 0;
}

.validation-errors,
.validation-warnings {
  margin-top: 16px;
}

.error-item,
.warning-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.error-item {
  color: #f56c6c;
}

.warning-item {
  color: #e6a23c;
}

.success-message {
  color: #67c23a;
  font-size: 14px;
  margin-top: 16px;
}

.flow-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}
</style>