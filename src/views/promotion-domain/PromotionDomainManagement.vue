<template>
  <div class="promotion-domain-container">
    <!-- Header -->
    <div class="page-header">
      <h1>推廣域名管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        添加域名
      </el-button>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索域名名稱或域名"
          style="width: 300px"
          clearable
          @keyup.enter="loadDomains"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select v-model="statusFilter" placeholder="狀態" style="width: 150px" clearable>
          <el-option label="全部狀態" value="" />
          <el-option label="已啟用" value="enabled" />
          <el-option label="已禁用" value="disabled" />
        </el-select>

        <el-button type="primary" @click="loadDomains">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleResetFilter">重置</el-button>
      </div>
    </el-card>

    <!-- Table -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="domains"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column prop="name" label="名稱" min-width="150" />

        <el-table-column prop="domain" label="域名" min-width="200">
          <template #default="{ row }">
            <el-tag type="success" size="default">{{ row.domain }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="狀態" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">
              {{ row.status === 'enabled' ? '已啟用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="channel_count" label="關聯渠道" width="100">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.channel_count }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="remark" label="備註" min-width="150">
          <template #default="{ row }">
            <span>{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="創建時間" width="160">
          <template #default="{ row }">
            <span>{{ formatDate(row.created_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
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
              啟用
            </el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">
              編輯
            </el-button>
            <el-button
              size="small"
              type="danger"
              :disabled="row.channel_count > 0"
              @click="handleDelete(row)"
            >
              刪除
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
          @current-change="loadDomains"
          @size-change="loadDomains"
        />
      </div>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEditing ? '編輯域名' : '添加域名'"
      width="600px"
      @closed="handleDialogClosed"
    >
      <el-form
        ref="domainFormRef"
        :model="domainForm"
        :rules="domainRules"
        label-width="100px"
      >
        <el-form-item label="名稱" prop="name">
          <el-input
            v-model="domainForm.name"
            placeholder="請輸入域名名稱（如：主站、代理站A）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="域名" prop="domain">
          <el-input
            v-model="domainForm.domain"
            placeholder="請輸入域名（如：ws.example.com）"
            maxlength="255"
          >
            <template #prepend>https://</template>
          </el-input>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            無需輸入 https:// 前綴
          </div>
        </el-form-item>

        <el-form-item label="預設 Pixels">
          <div class="pixels-editor">
            <div
              v-for="(pixel, index) in domainForm.pixelItems"
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
                  @click="domainForm.pixelItems.splice(index, 1)"
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
            <el-button type="primary" link @click="domainForm.pixelItems.push({ platform: '', params: [{ key: '', value: '' }] })">
              <el-icon><Plus /></el-icon>
              添加 Pixel
            </el-button>
          </div>
          <div style="font-size: 12px; color: #909399; margin-top: 4px;">
            此域名下的渠道若未設定自己的 Pixels，將使用這裡的預設值
          </div>
        </el-form-item>

        <el-form-item label="備註" prop="remark">
          <el-input
            v-model="domainForm.remark"
            type="textarea"
            :rows="3"
            placeholder="請輸入備註"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEditing ? '更新' : '創建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Delete } from '@element-plus/icons-vue'
import {
  promotionDomainApi,
  type PromotionDomainListItem,
  type CreatePromotionDomainRequest,
  type UpdatePromotionDomainRequest
} from '@/api/promotion-domain'
import type { ChannelPixel } from '@/api/channel'

// ==================== 數據定義 ====================
const loading = ref(false)
const domains = ref<PromotionDomainListItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const statusFilter = ref('')

const showCreateDialog = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)

interface PixelParamItem {
  key: string
  value: string
}

interface PixelFormItem {
  platform: string
  params: PixelParamItem[]
}

const domainFormRef = ref<FormInstance>()
const domainForm = ref<CreatePromotionDomainRequest & { pixelItems: PixelFormItem[] }>({
  name: '',
  domain: '',
  pixelItems: [],
  remark: ''
})

const domainRules: FormRules = {
  name: [
    { required: true, message: '請輸入域名名稱', trigger: 'blur' },
    { max: 100, message: '名稱不能超過100個字符', trigger: 'blur' }
  ],
  domain: [
    { required: true, message: '請輸入域名', trigger: 'blur' },
    { max: 255, message: '域名不能超過255個字符', trigger: 'blur' }
  ]
}

// ==================== 方法 ====================
/**
 * 加載域名列表
 */
async function loadDomains() {
  loading.value = true
  try {
    const { data } = await promotionDomainApi.getList({
      page: currentPage.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value || undefined,
      status: statusFilter.value as any || undefined
    })
    domains.value = data.list || []
    total.value = data.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加載域名列表失敗')
  } finally {
    loading.value = false
  }
}

/**
 * 重置篩選
 */
function handleResetFilter() {
  searchKeyword.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  loadDomains()
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
  return domainForm.value.pixelItems
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
 * 提交表單
 */
async function handleSubmit() {
  if (!domainFormRef.value) return

  await domainFormRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const pixels = buildPixelsPayload()
      if (isEditing.value && editingId.value) {
        const payload: UpdatePromotionDomainRequest = {
          name: domainForm.value.name,
          domain: domainForm.value.domain,
          pixels,
          remark: domainForm.value.remark
        }
        await promotionDomainApi.update(editingId.value, payload)
        ElMessage.success('更新域名成功')
      } else {
        const payload: CreatePromotionDomainRequest = {
          name: domainForm.value.name,
          domain: domainForm.value.domain,
          pixels,
          remark: domainForm.value.remark
        }
        await promotionDomainApi.create(payload)
        ElMessage.success('創建域名成功')
      }
      showCreateDialog.value = false
      loadDomains()
    } catch (error: any) {
      ElMessage.error(error.message || '操作失敗')
    } finally {
      submitting.value = false
    }
  })
}

/**
 * 編輯域名
 */
function handleEdit(domain: PromotionDomainListItem) {
  isEditing.value = true
  editingId.value = domain.id
  domainForm.value = {
    name: domain.name,
    domain: domain.domain,
    pixelItems: (domain.pixels || []).map(p => ({
      platform: p.platform,
      params: p.params
        ? Object.entries(p.params).map(([key, value]) => ({ key, value: String(value) }))
        : [{ key: '', value: '' }]
    })),
    remark: domain.remark
  }
  showCreateDialog.value = true
}

/**
 * 刪除域名
 */
async function handleDelete(domain: PromotionDomainListItem) {
  try {
    await ElMessageBox.confirm(
      `確定要刪除域名"${domain.name}"嗎？`,
      '確認刪除',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await promotionDomainApi.delete(domain.id)
    ElMessage.success('刪除成功')
    loadDomains()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '刪除失敗')
    }
  }
}

/**
 * 切換域名狀態
 */
async function handleToggleStatus(domain: PromotionDomainListItem) {
  const newStatus = domain.status === 'enabled' ? 'disabled' : 'enabled'
  const action = newStatus === 'enabled' ? '啟用' : '禁用'

  try {
    await ElMessageBox.confirm(
      `確定要${action}域名"${domain.name}"嗎？`,
      '確認操作',
      {
        confirmButtonText: '確定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await promotionDomainApi.updateStatus(domain.id, newStatus)
    ElMessage.success(`${action}成功`)
    loadDomains()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || `${action}失敗`)
    }
  }
}

/**
 * 對話框關閉
 */
function handleDialogClosed() {
  isEditing.value = false
  editingId.value = null
  domainForm.value = {
    name: '',
    domain: '',
    pixelItems: [],
    remark: ''
  }
  domainFormRef.value?.resetFields()
}

/**
 * 格式化日期
 */
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('zh-TW')
}

// ==================== 生命週期 ====================
onMounted(() => {
  loadDomains()
})
</script>

<style scoped>
.promotion-domain-container {
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

.filter-card {
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.table-card {
  margin-bottom: 24px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
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
