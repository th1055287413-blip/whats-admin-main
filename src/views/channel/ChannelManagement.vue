<template>
  <div class="channel-management-container">
    <!-- Header -->
    <div class="page-header">
      <h1>渠道管理</h1>
      <div class="header-actions">
        <el-switch
          v-model="isolationEnabled"
          :loading="isolationLoading"
          active-text="渠道隔离: 已启用"
          inactive-text="渠道隔离: 已禁用"
          @change="handleIsolationChange"
          style="margin-right: 16px"
        />
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          添加渠道
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索渠道名称或渠道号"
          style="width: 300px"
          clearable
          @keyup.enter="loadChannels"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="statusFilter" placeholder="状态" style="width: 150px" clearable>
          <el-option label="全部状态" value="" />
          <el-option label="已启用" value="enabled" />
          <el-option label="已禁用" value="disabled" />
        </el-select>

        <el-button type="primary" @click="loadChannels">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleResetFilter">重置</el-button>
      </div>
    </el-card>

    <!-- Quick Stats -->
    <div class="stats-row">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ total }}</div>
          <div class="stat-label">总渠道数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ enabledChannels }}</div>
          <div class="stat-label">已启用渠道</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ disabledChannels }}</div>
          <div class="stat-label">已禁用渠道</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ totalUsers }}</div>
          <div class="stat-label">总授权用户</div>
        </div>
      </el-card>
    </div>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="channels"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column prop="channel_code" label="渠道号" width="120">
          <template #default="{ row }">
            <el-tag type="success" size="default">{{ row.channel_code }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="channel_name" label="渠道名称" min-width="150" />

        <el-table-column prop="lang" label="语言" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.lang === 'zh'" type="success" size="small">中文</el-tag>
            <el-tag v-else-if="row.lang === 'ms'" type="warning" size="small">马来语</el-tag>
            <el-tag v-else-if="row.lang === 'en'" type="info" size="small">英语</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">
              {{ row.status === 'enabled' ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="user_count" label="授权用户" width="100">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.user_count }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="admin_user_count" label="后管用户" width="100">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.admin_user_count }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="promotion_domain_name" label="推广域名" width="150">
          <template #default="{ row }">
            <span>{{ row.promotion_domain_name || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="workgroup_name" label="工作組" width="130">
          <template #default="{ row }">
            <el-tag v-if="row.workgroup_name" type="warning" size="small">{{ row.workgroup_name }}</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column prop="promotion_url" label="推广链接" min-width="250">
          <template #default="{ row }">
            <div class="promotion-url">
              <span>{{ row.promotion_url }}</span>
              <el-button
                link
                type="primary"
                size="small"
                @click="copyUrl(row.promotion_url)"
              >
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="备注" min-width="150">
          <template #default="{ row }">
            <span>{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            <span>{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="450" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="warning"
              @click="handleGenerateShareLink(row)"
            >
              <el-icon><Share /></el-icon>
              分享链接
            </el-button>
            <el-button
              v-if="row.status === 'enabled'"
              size="small"
              type="warning"
              @click="handleToggleStatus(row)"
            >
              禁用
            </el-button>
            <el-button
              v-else
              size="small"
              type="success"
              @click="handleToggleStatus(row)"
            >
              启用
            </el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button size="small" @click="handleSetPassword(row)">
              密码
            </el-button>
            <el-button
              size="small"
              :type="row.has_viewer_password ? 'primary' : 'info'"
              :disabled="!row.has_viewer_password"
              :title="row.has_viewer_password ? '复制报表链接' : '请先设置查看密码'"
              @click="copyReportUrl(row)"
            >
              报表
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadChannels"
          @size-change="loadChannels"
        />
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEditing ? '编辑渠道' : '添加渠道'"
      width="600px"
      @closed="handleDialogClosed"
    >
      <el-form
        ref="channelFormRef"
        :model="channelForm"
        :rules="channelRules"
        label-width="100px"
      >
        <el-form-item label="渠道名称" prop="channel_name">
          <el-input
            v-model="channelForm.channel_name"
            placeholder="请输入渠道名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="语言" prop="lang">
          <el-select
            v-model="channelForm.lang"
            placeholder="请选择语言"
            style="width: 100%"
          >
            <el-option label="中文" value="zh" />
            <el-option label="马来语" value="ms" />
            <el-option label="英语" value="en" />
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            生成渠道号时将使用所选语言
          </div>
        </el-form-item>

        <el-form-item label="渠道号" prop="channel_code">
          <div style="display: flex; gap: 8px; width: 100%;">
            <el-input
              v-model="channelForm.channel_code"
              placeholder="留空自动生成，或输入6位字母数字"
              maxlength="6"
              show-word-limit
              style="flex: 1"
            />
            <el-button @click="handleGenerateCode" :loading="generatingCode">
              生成
            </el-button>
          </div>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            渠道号为6位大写字母和数字组合
          </div>
        </el-form-item>

        <el-form-item label="推广域名" prop="promotion_domain_id">
          <el-select
            v-model="channelForm.promotion_domain_id"
            placeholder="请选择推广域名"
            style="width: 100%"
          >
            <el-option
              v-for="domain in promotionDomains"
              :key="domain.id"
              :label="`${domain.name} (${domain.domain})`"
              :value="domain.id"
            />
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            推广链接将使用所选域名生成
          </div>
        </el-form-item>

        <el-form-item label="贷款类型">
          <el-select v-model="channelForm.loan_type" placeholder="不指定（继承域名配置）" clearable style="width: 100%">
            <el-option label="小额贷" value="smallLoan" />
            <el-option label="购车贷" value="car" />
            <el-option label="公积金贷" value="housingFund" />
            <el-option label="购房贷" value="mortgage" />
            <el-option label="企业贷" value="business" />
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            不选则继承域名的贷款类型配置
          </div>
        </el-form-item>

        <el-form-item label="工作組">
          <el-select
            v-model="channelForm.workgroup_id"
            placeholder="不綁定工作組"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="wg in workgroups.filter(w => w.type !== 'admin')"
              :key="wg.id"
              :label="`${wg.name} (${wg.type})`"
              :value="wg.id"
            />
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            綁定後，透過此渠道註冊的新帳號將自動分配到該工作組
          </div>
        </el-form-item>

        <el-form-item v-if="selectedDomainPixels.length" label="域名 Pixels">
          <div class="domain-pixels-hint">
            <el-tag
              v-for="(pixel, index) in selectedDomainPixels"
              :key="index"
              type="info"
              size="small"
              style="margin-right: 6px; margin-bottom: 4px;"
            >
              {{ pixel.platform }}: {{ Object.entries(pixel.params || {}).map(([k, v]) => `${k}=${v}`).join(', ') }}
            </el-tag>
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              域名已設定的 Pixels，未覆蓋的 platform 會自動繼承
            </div>
          </div>
        </el-form-item>

        <el-form-item label="追蹤 Pixels">
          <div class="pixels-editor">
            <div
              v-for="(pixel, index) in channelForm.pixels"
              :key="index"
              class="pixel-item"
            >
              <div class="pixel-header">
                <el-select
                  v-model="pixel.platform"
                  placeholder="選擇平台"
                  style="width: 200px"
                  filterable
                  allow-create
                  @change="onPixelPlatformChange(pixel)"
                >
                  <el-option label="Facebook" value="facebook" />
                  <el-option label="Google Tag" value="gtag" />
                  <el-option label="Umami" value="umami" />
                </el-select>
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="removePixel(index)"
                />
              </div>
              <div
                v-for="(param, pIndex) in pixel.params"
                :key="pIndex"
                class="param-row"
              >
                <el-input
                  v-model="param.key"
                  placeholder="屬性名"
                  style="width: 180px"
                  :disabled="pixel.platform === 'umami'"
                />
                <el-input
                  v-model="param.value"
                  :placeholder="pixel.platform === 'umami' && param.key === 'funnel-report-id' ? '選填' : '必填'"
                  style="flex: 1"
                />
                <el-button
                  v-if="pixel.platform !== 'umami'"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="pixel.params.splice(pIndex, 1)"
                />
              </div>
              <el-button
                v-if="pixel.platform !== 'umami'"
                type="primary" link size="small"
                @click="pixel.params.push({ key: '', value: '' })"
              >
                + 添加屬性
              </el-button>
            </div>
            <el-button type="primary" link @click="addPixel">
              <el-icon><Plus /></el-icon>
              添加 Pixel
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="channelForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEditing ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Password Dialog -->
    <el-dialog
      v-model="showPasswordDialog"
      title="设置查看密码"
      width="400px"
      @closed="passwordForm = ''"
    >
      <p style="margin-bottom: 12px; color: #666; font-size: 13px;">
        设置后，渠道商可使用此密码查看报表数据
      </p>
      <el-input
        v-model="passwordForm"
        type="password"
        placeholder="请输入密码（6-72 位）"
        show-password
        maxlength="72"
      />
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmSetPassword" :loading="settingPassword">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- Delete Dialog -->
    <el-dialog
      v-model="showDeleteDialog"
      title="删除渠道"
      width="600px"
    >
      <el-alert
        v-if="deletingChannel && (deletingChannel.user_count > 0 || deletingChannel.admin_user_count > 0)"
        title="警告"
        type="warning"
        :closable="false"
        style="margin-bottom: 16px"
      >
        <template #default>
          <p>该渠道下还有 <strong>{{ deletingChannel.user_count }}</strong> 个授权用户和 <strong>{{ deletingChannel.admin_user_count }}</strong> 个后管用户</p>
          <p>删除前需要处理这些用户</p>
        </template>
      </el-alert>

      <el-form label-width="120px">
        <el-form-item label="用户处理方式">
          <el-radio-group v-model="deleteForm.user_handle_type">
            <el-radio label="none">设为无渠道</el-radio>
            <el-radio label="transfer">转移到其他渠道</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
          v-if="deleteForm.user_handle_type === 'transfer'"
          label="目标渠道"
        >
          <el-select
            v-model="deleteForm.target_channel_id"
            placeholder="请选择目标渠道"
            style="width: 100%"
          >
            <el-option
              v-for="channel in availableChannels"
              :key="channel.id"
              :label="`${channel.channel_name} (${channel.channel_code})`"
              :value="channel.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete" :loading="deleting">
          确认删除
        </el-button>
      </template>
    </el-dialog>

    <!-- Share Link Dialog -->
    <el-dialog v-model="showShareLinkDialog" title="生成推广链接" width="600px">
      <el-form label-width="100px">
        <el-form-item label="渠道">
          <el-tag size="large" type="success">{{ selectedChannel?.channel_code }}</el-tag>
          <span style="margin-left: 10px">{{ selectedChannel?.channel_name }}</span>
        </el-form-item>

        <el-form-item label="基础链接">
          <el-input :model-value="selectedChannel?.promotion_url" readonly />
        </el-form-item>

        <el-form-item label="来源标签">
          <el-select v-model="shareLink.sourceTagId" clearable placeholder="选择来源标签（可选）" style="width: 100%">
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="`${tag.name} (${tag.source_key})`"
              :value="tag.id"
            >
              <div style="display: flex; align-items: center; gap: 8px;">
                <div
                  style="width: 12px; height: 12px; border-radius: 50%; border: 1px solid #ddd;"
                  :style="{ backgroundColor: tag.color }"
                />
                <span>{{ tag.name }}</span>
                <el-tag size="small" type="info">{{ tag.source_key }}</el-tag>
              </div>
            </el-option>
          </el-select>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            用户访问时将自动获得该标签
          </div>
        </el-form-item>

        <el-form-item label="推广语言">
          <el-select v-model="shareLink.language" style="width: 100%">
            <el-option
              v-for="option in languageOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="完整链接">
          <el-input
            :model-value="generatedShareLink"
            readonly
            type="textarea"
            :rows="3"
          >
            <template #append>
              <el-button @click="handleCopyShareLink">复制</el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showShareLinkDialog = false">关闭</el-button>
        <el-button type="primary" @click="handleCopyShareLink">复制链接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, CopyDocument, Delete, Share } from '@element-plus/icons-vue'
import {
  channelApi,
  type ChannelListItem,
  type ChannelPixel,
  type CreateChannelRequest,
  type UpdateChannelRequest,
  type PromotionDomain
} from '@/api/channel'
import { promotionDomainApi } from '@/api/promotion-domain'
import { workgroupApi, type Workgroup } from '@/api/workgroup'
import { api } from '@/utils/request'

// ==================== 数据定义 ====================
const loading = ref(false)
const channels = ref<ChannelListItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const statusFilter = ref('')

const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const deleting = ref(false)
const deletingChannel = ref<ChannelListItem | null>(null)
const generatingCode = ref(false)

const isolationEnabled = ref(true)
const isolationLoading = ref(false)

const showPasswordDialog = ref(false)
const passwordForm = ref('')
const settingPassword = ref(false)
const passwordChannelId = ref<number | null>(null)

// 分享链接相关
const showShareLinkDialog = ref(false)
const selectedChannel = ref<ChannelListItem | null>(null)
const shareLink = ref({
  sourceTagId: undefined as number | undefined,
  language: 'ms'
})
const availableTags = ref<any[]>([])

const languageOptions = [
  { label: 'Bahasa Melayu (马来语)', value: 'ms' },
  { label: 'English (英语/新加坡)', value: 'en' },
  { label: '简体中文', value: 'zh' }
]

// 推廣域名相關
const promotionDomains = ref<PromotionDomain[]>([])

// 工作組相關
const workgroups = ref<Workgroup[]>([])

interface PixelParamItem {
  key: string
  value: string
}

interface PixelFormItem {
  platform: string
  params: PixelParamItem[]
}

const channelFormRef = ref<FormInstance>()
const channelForm = ref<CreateChannelRequest & { promotion_domain_id?: number; pixels: PixelFormItem[]; workgroup_id?: number | null }>({
  channel_name: '',
  channel_code: '',
  lang: 'zh',
  loan_type: undefined,
  pixels: [],
  remark: '',
  promotion_domain_id: undefined,
  workgroup_id: undefined
})

const deleteForm = ref({
  user_handle_type: 'none',
  target_channel_id: undefined as number | undefined
})

const channelRules: FormRules = {
  channel_name: [
    { required: true, message: '请输入渠道名称', trigger: 'blur' },
    { max: 100, message: '渠道名称不能超过100个字符', trigger: 'blur' }
  ],
  channel_code: [
    { pattern: /^[A-Z0-9]{0,6}$/, message: '渠道号必须是6位以内的大写字母和数字', trigger: 'blur' }
  ],
  lang: [
    { required: true, message: '请选择语言', trigger: 'change' }
  ],
  promotion_domain_id: [
    { required: true, message: '请选择推广域名', trigger: 'change' }
  ]
}

// ==================== 计算属性 ====================
const enabledChannels = computed(() =>
  channels.value.filter(c => c.status === 'enabled').length
)

const disabledChannels = computed(() =>
  channels.value.filter(c => c.status === 'disabled').length
)

const totalUsers = computed(() =>
  channels.value.reduce((sum, c) => sum + c.user_count, 0)
)

const availableChannels = computed(() =>
  channels.value.filter(c => c.id !== deletingChannel.value?.id)
)

const generatedShareLink = computed(() => {
  if (!selectedChannel.value?.promotion_url) return ''

  try {
    const url = new URL(selectedChannel.value.promotion_url)

    // Add source tag if selected
    if (shareLink.value.sourceTagId) {
      const tag = availableTags.value.find(t => t.id === shareLink.value.sourceTagId)
      if (tag?.source_key) {
        url.searchParams.set('source', tag.source_key)
      }
    }

    // Add language
    url.searchParams.set('lang', shareLink.value.language)

    return url.toString()
  } catch {
    const separator = selectedChannel.value.promotion_url.includes('?') ? '&' : '?'
    let params = `lang=${shareLink.value.language}`

    // Add source tag if selected
    if (shareLink.value.sourceTagId) {
      const tag = availableTags.value.find(t => t.id === shareLink.value.sourceTagId)
      if (tag?.source_key) {
        params += `&source=${tag.source_key}`
      }
    }

    return `${selectedChannel.value.promotion_url}${separator}${params}`
  }
})

const selectedDomainPixels = computed(() => {
  if (!channelForm.value.promotion_domain_id) return []
  const domain = promotionDomains.value.find(d => d.id === channelForm.value.promotion_domain_id)
  return domain?.pixels || []
})

// ==================== 方法 ====================
/**
 * 加载渠道列表
 */
async function loadChannels() {
  loading.value = true
  try {
    const { data } = await channelApi.getList({
      page: currentPage.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value as any || undefined
    })
    channels.value = data.list || []
    total.value = data.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载渠道列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 加载渠道隔离配置
 */
async function loadIsolationConfig() {
  try {
    const { data } = await channelApi.getIsolationConfig()
    isolationEnabled.value = data.enabled
  } catch (error: any) {
    console.error('加载渠道隔离配置失败:', error)
  }
}

/**
 * 加载推广域名列表
 */
async function loadPromotionDomains() {
  try {
    const { data } = await promotionDomainApi.getList({ status: 'enabled' })
    promotionDomains.value = data.list || []
  } catch (error: any) {
    console.error('加载推广域名列表失败:', error)
  }
}

/**
 * 加载工作組列表
 */
async function loadWorkgroups() {
  try {
    const response = await workgroupApi.getList({ status: 'active', page_size: 100 })
    workgroups.value = response.list || []
  } catch (error: any) {
    console.error('加载工作组列表失败:', error)
  }
}

/**
 * 重置筛选
 */
function handleResetFilter() {
  searchKeyword.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  loadChannels()
}

/**
 * 生成渠道号
 */
async function handleGenerateCode() {
  if (!channelForm.value.lang) {
    ElMessage.warning('请先选择语言')
    return
  }
  generatingCode.value = true
  try {
    const { data } = await channelApi.generateCode(channelForm.value.lang)
    channelForm.value.channel_code = data.channel_code
    ElMessage.success('渠道号生成成功')
  } catch (error: any) {
    ElMessage.error(error.message || '生成渠道号失败')
  } finally {
    generatingCode.value = false
  }
}

/**
 * 添加 Pixel
 */
function addPixel() {
  channelForm.value.pixels.push({ platform: '', params: [{ key: '', value: '' }] })
}

function removePixel(index: number) {
  channelForm.value.pixels.splice(index, 1)
}

const UMAMI_PARAMS_TEMPLATE: PixelParamItem[] = [
  { key: 'data-website-id', value: '' },
  { key: 'funnel-report-id', value: '' }
]

function onPixelPlatformChange(pixel: PixelFormItem) {
  if (pixel.platform === 'umami') {
    const existing = new Map(pixel.params.filter(p => p.key).map(p => [p.key, p.value]))
    pixel.params = UMAMI_PARAMS_TEMPLATE.map(t => ({
      key: t.key,
      value: existing.get(t.key) ?? t.value
    }))
  }
}

/**
 * 將表單 pixels 轉換為 API 格式
 */
function buildPixelsPayload(): ChannelPixel[] {
  return channelForm.value.pixels
    .filter(p => p.platform)
    .map(p => {
      const pixel: ChannelPixel = { platform: p.platform }
      const params: Record<string, unknown> = {}
      for (const param of p.params) {
        if (param.key.trim()) {
          params[param.key.trim()] = param.value
        }
      }
      if (Object.keys(params).length > 0) {
        pixel.params = params
      }
      return pixel
    })
}

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!channelFormRef.value) return

  await channelFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const pixels = buildPixelsPayload()
      if (isEditing.value && editingId.value) {
        const editingChannel = channels.value.find(c => c.id === editingId.value)
        const hadWorkgroup = editingChannel?.workgroup_id != null
        const noWorkgroupNow = !channelForm.value.workgroup_id
        const payload: UpdateChannelRequest = {
          ...channelForm.value,
          pixels,
          loan_type: channelForm.value.loan_type || undefined,
          clear_workgroup: hadWorkgroup && noWorkgroupNow
        }
        await channelApi.update(editingId.value, payload)
        ElMessage.success('更新渠道成功')
      } else {
        const payload: CreateChannelRequest = { ...channelForm.value, pixels }
        await channelApi.create(payload)
        ElMessage.success('创建渠道成功')
      }
      showCreateDialog.value = false
      loadChannels()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

/**
 * 编辑渠道
 */
function handleEdit(channel: ChannelListItem) {
  isEditing.value = true
  editingId.value = channel.id
  channelForm.value = {
    channel_name: channel.channel_name,
    channel_code: channel.channel_code,
    lang: channel.lang,
    loan_type: channel.loan_type,
    pixels: (channel.pixels || []).map(p => ({
      platform: p.platform,
      params: p.params
        ? Object.entries(p.params).map(([key, value]) => ({ key, value: String(value) }))
        : [{ key: '', value: '' }]
    })),
    remark: channel.remark,
    promotion_domain_id: channel.promotion_domain_id,
    workgroup_id: channel.workgroup_id ?? undefined
  }
  showCreateDialog.value = true
}

/**
 * 删除渠道
 */
function handleDelete(channel: ChannelListItem) {
  deletingChannel.value = channel
  deleteForm.value = {
    user_handle_type: 'none',
    target_channel_id: undefined
  }
  showDeleteDialog.value = true
}

/**
 * 确认删除
 */
async function confirmDelete() {
  if (!deletingChannel.value) return

  // 如果选择转移，必须选择目标渠道
  if (deleteForm.value.user_handle_type === 'transfer' && !deleteForm.value.target_channel_id) {
    ElMessage.warning('请选择目标渠道')
    return
  }

  deleting.value = true
  try {
    await channelApi.delete(deletingChannel.value.id, {
      user_handle_type: deleteForm.value.user_handle_type as any,
      target_channel_id: deleteForm.value.target_channel_id
    })
    ElMessage.success('删除渠道成功')
    showDeleteDialog.value = false
    loadChannels()
  } catch (error: any) {
    ElMessage.error(error.message || '删除渠道失败')
  } finally {
    deleting.value = false
  }
}

/**
 * 切换渠道状态
 */
async function handleToggleStatus(channel: ChannelListItem) {
  const newStatus = channel.status === 'enabled' ? 'disabled' : 'enabled'
  const action = newStatus === 'enabled' ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(
      `确定要${action}渠道"${channel.channel_name}"吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await channelApi.updateStatus(channel.id, newStatus)
    ElMessage.success(`${action}成功`)
    loadChannels()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `${action}失败`)
    }
  }
}

/**
 * 渠道隔离开关变化
 */
async function handleIsolationChange(value: boolean) {
  isolationLoading.value = true
  try {
    await channelApi.updateIsolationConfig(value)
    ElMessage.success(`渠道隔离已${value ? '启用' : '禁用'}`)
  } catch (error: any) {
    ElMessage.error(error.message || '更新配置失败')
    // 恢复原状态
    isolationEnabled.value = !value
  } finally {
    isolationLoading.value = false
  }
}

/**
 * 设置查看密码
 */
function handleSetPassword(channel: ChannelListItem) {
  passwordChannelId.value = channel.id
  passwordForm.value = ''
  showPasswordDialog.value = true
}

/**
 * 确认设置密码
 */
async function confirmSetPassword() {
  if (!passwordChannelId.value) return

  if (passwordForm.value.length < 6) {
    ElMessage.warning('密码长度至少 6 位')
    return
  }

  settingPassword.value = true
  try {
    await channelApi.setViewerPassword(passwordChannelId.value, passwordForm.value)
    ElMessage.success('查看密码设置成功')
    showPasswordDialog.value = false
    loadChannels()
  } catch (error: any) {
    ElMessage.error(error.message || '设置密码失败')
  } finally {
    settingPassword.value = false
  }
}

/**
 * 对话框关闭
 */
function handleDialogClosed() {
  isEditing.value = false
  editingId.value = null
  channelForm.value = {
    channel_name: '',
    channel_code: '',
    lang: 'zh',
    loan_type: undefined,
    pixels: [],
    remark: '',
    promotion_domain_id: undefined,
    workgroup_id: undefined
  }
  channelFormRef.value?.resetFields()
}

/**
 * 复制报表链接
 */
async function copyReportUrl(channel: ChannelListItem) {
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || window.location.origin
  const url = `${apiBase}/channel-report?code=${channel.channel_code}`
  await copyUrl(url)
  window.open(url, '_blank')
}

/**
 * 复制链接
 */
async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

/**
 * 格式化日期
 */
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('zh-CN')
}

// ==================== 生命周期 ====================
// ==================== 分享链接相关方法 ====================
const handleGenerateShareLink = async (channel: ChannelListItem) => {
  selectedChannel.value = channel
  showShareLinkDialog.value = true

  // 重置选择
  shareLink.value = {
    sourceTagId: undefined,
    language: channel.lang || 'ms'
  }

  // 加载标签列表（只加载有 source_key 的标签）
  try {
    const response = await api.get('/tags/accounts', {
      params: {
        page: 1,
        page_size: 100
      }
    })
    if (response?.list) {
      availableTags.value = response.list.filter((tag: any) => tag.source_key)
    }
  } catch (error) {
    console.error('加载标签列表失败:', error)
  }
}

const handleCopyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(generatedShareLink.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// ==================== 生命周期钩子 ====================
onMounted(() => {
  loadChannels()
  loadIsolationConfig()
  loadPromotionDomains()
  loadWorkgroups()
})
</script>

<style scoped>
.channel-management-container {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-card {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 16px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #1890ff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.table-card {
  margin-bottom: 24px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.promotion-url {
  display: flex;
  align-items: center;
  gap: 8px;
}

.promotion-url span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pixels-editor {
  width: 100%;
}

.pixel-item {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.pixel-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.param-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}
</style>
