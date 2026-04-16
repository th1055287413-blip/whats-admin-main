<template>
  <div class="keyword-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>关键词配置管理</h1>
      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
        添加关键词
      </el-button>
    </div>

    <!-- 筛选卡片 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filterForm" @submit.prevent="handleFilter">
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.query"
            placeholder="搜索关键词或回复内容"
            clearable
            style="width: 240px"
            @clear="handleFilter"
          />
        </el-form-item>

        <el-form-item label="语言">
          <el-select
            v-model="filterForm.language"
            placeholder="选择语言"
            clearable
            style="width: 150px"
            @change="handleFilter"
          >
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="繁体中文" value="zh-TW" />
            <el-option label="English" value="en" />
            <el-option label="Bahasa Indonesia" value="id" />
            <el-option label="Bahasa Melayu" value="ms" />
          </el-select>
        </el-form-item>

        <el-form-item label="匹配模式">
          <el-select
            v-model="filterForm.match_type"
            placeholder="匹配模式"
            clearable
            style="width: 120px"
            @change="handleFilter"
          >
            <el-option label="精确匹配" value="exact" />
            <el-option label="模糊匹配" value="fuzzy" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="状态"
            clearable
            style="width: 120px"
            @change="handleFilter"
          >
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>

        <el-form-item label="类型">
          <el-select
            v-model="filterForm.keyword_type"
            placeholder="类型"
            clearable
            style="width: 120px"
            @change="handleFilter"
          >
            <el-option label="普通关键词" value="normal" />
            <el-option label="欢迎语" value="welcome" />
            <el-option label="默认回复" value="default" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleFilter"> 搜索 </el-button>
          <el-button :icon="Refresh" @click="handleResetFilter"> 重置 </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">总关键词数</div>
          <div class="stat-value">{{ totalCount }}</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">启用中</div>
          <div class="stat-value active">{{ activeCount }}</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">已禁用</div>
          <div class="stat-value inactive">{{ inactiveCount }}</div>
        </div>
      </el-card>
    </div>

    <!-- 数据表格 -->
    <el-card class="table-card" shadow="never">
      <el-table :data="keywords" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column label="关键词" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="(keyword, index) in row.keywords"
              :key="index"
              size="small"
              style="margin: 2px"
            >
              {{ keyword }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="回复内容" min-width="300">
          <template #default="{ row }">
            <div class="reply-preview">{{ row.reply }}</div>
          </template>
        </el-table-column>

        <el-table-column label="语言" width="120">
          <template #default="{ row }">
            <el-tag :type="getLanguageTagType(row.language)" size="small">
              {{ getLanguageLabel(row.language) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getKeywordTypeTagType(row.keyword_type)" size="small">
              {{ getKeywordTypeLabel(row.keyword_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100" sortable>
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">
              {{ row.priority }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="匹配模式" width="100">
          <template #default="{ row }">
            <el-tag :type="row.match_type === 'exact' ? 'info' : 'warning'" size="small">
              {{ row.match_type === 'exact' ? '精确' : '模糊' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="isEditing ? '编辑关键词' : '添加关键词'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="关键词" prop="keywords">
          <el-select
            v-model="formData.keywords"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入关键词后按回车添加"
            style="width: 100%"
          >
          </el-select>
          <div class="form-tip">支持多个同义词，例如：贷款、借款、申请贷款</div>
        </el-form-item>

        <el-form-item label="回复内容" prop="reply">
          <el-input
            v-model="formData.reply"
            type="textarea"
            :rows="6"
            placeholder="输入自动回复的内容"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="语言" prop="language">
          <div style="width: 100%">
            <el-checkbox v-model="formData.applyToAllLanguages" :disabled="isEditing">
              应用到所有语言（自动翻译并创建5条记录）
            </el-checkbox>
            <el-select
              v-model="formData.language"
              :placeholder="formData.applyToAllLanguages ? '选择源语言（将自动翻译为其他语言）' : '选择语言'"
              style="width: 100%; margin-top: 8px"
            >
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="繁体中文" value="zh-TW" />
              <el-option label="English" value="en" />
              <el-option label="Bahasa Indonesia" value="id" />
              <el-option label="Bahasa Melayu" value="ms" />
            </el-select>
          </div>
        </el-form-item>

        <el-form-item label="类型" prop="keyword_type">
          <el-radio-group v-model="formData.keyword_type">
            <el-radio label="normal">普通关键词（用于匹配用户消息）</el-radio>
            <el-radio label="welcome">欢迎语（打开聊天时显示）</el-radio>
            <el-radio label="default">默认回复（无匹配时显示）</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-slider
            v-model="formData.priority"
            :min="1"
            :max="10"
            :marks="{ 1: '低', 5: '中', 10: '高' }"
            show-stops
          />
          <div class="form-tip">优先级越高，匹配时越优先使用此回复</div>
        </el-form-item>

        <el-form-item label="匹配模式" prop="match_type">
          <el-radio-group v-model="formData.match_type">
            <el-radio label="exact">精确匹配（用户输入必须完全一致）</el-radio>
            <el-radio label="fuzzy">模糊匹配（用户输入包含关键词即可）</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEditing ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import {
  getKeywordList,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  updateKeywordStatus
} from '@/api/keyword'
import { translateText } from '@/api/translation'
import type {
  KeywordReply,
  KeywordListParams,
  CreateKeywordRequest
} from '@/types/keyword'

// 数据状态
const loading = ref(false)
const submitting = ref(false)
const keywords = ref<KeywordReply[]>([])
const showCreateDialog = ref(false)
const isEditing = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number>()

// 筛选表单
const filterForm = reactive<KeywordListParams>({
  query: '',
  match_type: undefined,
  status: undefined,
  language: undefined,
  keyword_type: undefined
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 表单数据
const formData = reactive<CreateKeywordRequest & { id?: number; applyToAllLanguages?: boolean }>({
  keywords: [],
  reply: '',
  priority: 5,
  match_type: 'fuzzy',
  status: 'active',
  language: 'zh-CN',
  keyword_type: 'normal',
  applyToAllLanguages: true
})

// 表单验证规则
const formRules: FormRules = {
  keywords: [
    { required: true, message: '请输入至少一个关键词', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请输入至少一个关键词'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  reply: [
    { required: true, message: '请输入回复内容', trigger: 'blur' },
    { min: 1, max: 1000, message: '回复内容长度在 1 到 1000 个字符', trigger: 'blur' }
  ],
  language: [{
    required: true,
    validator: (rule, value, callback) => {
      if (formData.applyToAllLanguages || value) {
        callback()
      } else {
        callback(new Error('请选择语言'))
      }
    },
    trigger: 'change'
  }],
  keyword_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  priority: [{ required: true, message: '请设置优先级', trigger: 'change' }],
  match_type: [{ required: true, message: '请选择匹配模式', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 统计数据
const totalCount = computed(() => pagination.total)
const activeCount = computed(() => keywords.value.filter(k => k.status === 'active').length)
const inactiveCount = computed(() => keywords.value.filter(k => k.status === 'inactive').length)

// 获取关键词列表
const fetchKeywords = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      page: pagination.page,
      limit: pagination.limit
    }
    const response = await getKeywordList(params)
    keywords.value = response.data.list
    pagination.total = response.data.total
  } catch (error) {
    ElMessage.error('获取关键词列表失败')
  } finally {
    loading.value = false
  }
}

// 筛选
const handleFilter = () => {
  pagination.page = 1
  fetchKeywords()
}

// 重置筛选
const handleResetFilter = () => {
  Object.assign(filterForm, {
    query: '',
    match_type: undefined,
    status: undefined,
    language: undefined,
    keyword_type: undefined
  })
  handleFilter()
}

// 编辑
const handleEdit = (row: KeywordReply) => {
  isEditing.value = true
  editingId.value = row.id
  Object.assign(formData, {
    keywords: [...row.keywords],
    reply: row.reply,
    priority: row.priority,
    match_type: row.match_type,
    status: row.status,
    language: row.language,
    keyword_type: row.keyword_type || 'normal',
    applyToAllLanguages: false
  })
  showCreateDialog.value = true
}

// 删除
const handleDelete = async (row: KeywordReply) => {
  try {
    await ElMessageBox.confirm(`确定要删除关键词 "${row.keywords.join(', ')}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteKeyword(row.id)
    ElMessage.success('删除成功')
    fetchKeywords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 状态变更
const handleStatusChange = async (row: KeywordReply) => {
  try {
    await updateKeywordStatus(row.id, row.status)
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    // 回滚状态
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

// 所有支持的语言
const ALL_LANGUAGES = ['zh-CN', 'zh-TW', 'en', 'id', 'ms']

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async valid => {
    if (valid) {
      submitting.value = true
      try {
        if (isEditing.value && editingId.value) {
          // 编辑模式：只更新单条记录
          const { applyToAllLanguages, ...updateData } = formData
          await updateKeyword(editingId.value, updateData)
          ElMessage.success('更新成功')
        } else {
          // 创建模式
          if (formData.applyToAllLanguages) {
            // 为所有语言创建记录（自动翻译关键词和回复内容）
            const { applyToAllLanguages, language: sourceLang, ...baseData } = formData
            const translationResults: Record<string, string> = {}
            let translationFailCount = 0

            // 为所有语言准备关键词和回复内容
            const createPromises = ALL_LANGUAGES.map(async (targetLang) => {
              let translatedKeywords = [...baseData.keywords]
              let replyText = baseData.reply

              // 如果目标语言不是源语言，尝试翻译
              if (targetLang !== sourceLang) {
                try {
                  // 翻译所有关键词
                  const keywordTranslations = await Promise.all(
                    baseData.keywords.map(keyword =>
                      translateText({
                        text: keyword,
                        target_language: targetLang,
                        source_language: sourceLang
                      })
                    )
                  )

                  // 翻译回复内容
                  const replyTranslation = await translateText({
                    text: baseData.reply,
                    target_language: targetLang,
                    source_language: sourceLang
                  })

                  // 提取翻译后的关键词
                  translatedKeywords = keywordTranslations.map((res, index) => {
                    if (res.data && res.data.translated_text) {
                      return res.data.translated_text
                    }
                    return baseData.keywords[index] // 翻译失败使用原文
                  })

                  // 提取翻译后的回复内容
                  if (replyTranslation.data && replyTranslation.data.translated_text) {
                    replyText = replyTranslation.data.translated_text
                    translationResults[targetLang] = 'success'
                  } else {
                    translationFailCount++
                    translationResults[targetLang] = 'fallback'
                    console.warn(`Translation response invalid for ${targetLang}, using original text`)
                  }
                } catch (error) {
                  translationFailCount++
                  translationResults[targetLang] = 'fallback'
                  console.warn(`Translation failed for ${targetLang}, using original text`, error)
                }
              } else {
                translationResults[targetLang] = 'source'
              }

              return createKeyword({
                ...baseData,
                keywords: translatedKeywords,
                language: targetLang,
                reply: replyText
              })
            })

            await Promise.all(createPromises)

            // 根据翻译结果显示不同的提示消息
            if (translationFailCount === 0) {
              ElMessage.success(`成功创建 ${ALL_LANGUAGES.length} 条记录（已自动翻译）`)
            } else if (translationFailCount === ALL_LANGUAGES.length - 1) {
              ElMessage.warning(`成功创建 ${ALL_LANGUAGES.length} 条记录，但翻译失败，所有语言使用原文`)
            } else {
              ElMessage.warning(`成功创建 ${ALL_LANGUAGES.length} 条记录，其中 ${translationFailCount} 个语言翻译失败，使用原文`)
            }
          } else {
            // 只创建单条记录
            const { applyToAllLanguages, ...createData } = formData
            await createKeyword(createData)
            ElMessage.success('创建成功')
          }
        }
        showCreateDialog.value = false
        fetchKeywords()
        resetForm()
      } catch (error) {
        ElMessage.error(isEditing.value ? '更新失败' : '创建失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  isEditing.value = false
  editingId.value = undefined
  Object.assign(formData, {
    keywords: [],
    reply: '',
    priority: 5,
    match_type: 'fuzzy',
    status: 'active',
    language: 'zh-CN',
    keyword_type: 'normal',
    applyToAllLanguages: true
  })
  formRef.value?.resetFields()
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.page = page
  fetchKeywords()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchKeywords()
}

// 辅助函数
const getLanguageLabel = (lang: string) => {
  const labels: Record<string, string> = {
    'zh-CN': '简中',
    'zh-TW': '繁中',
    en: 'EN',
    id: 'ID',
    ms: 'MS'
  }
  return labels[lang] || lang
}

const getLanguageTagType = (lang: string) => {
  const types: Record<string, any> = {
    'zh-CN': '',
    'zh-TW': 'success',
    en: 'warning',
    id: 'danger',
    ms: 'info'
  }
  return types[lang] || ''
}

const getPriorityTagType = (priority: number) => {
  if (priority >= 8) return 'danger'
  if (priority >= 5) return 'warning'
  return 'info'
}

const getKeywordTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    normal: '普通关键词',
    welcome: '欢迎语',
    default: '默认回复'
  }
  return labels[type] || type
}

const getKeywordTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    normal: '',
    welcome: 'success',
    default: 'warning'
  }
  return types[type] || ''
}

// 初始化
onMounted(() => {
  fetchKeywords()
})
</script>

<style scoped lang="scss">
.keyword-management {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;

          &.active {
            color: #67c23a;
          }

          &.inactive {
            color: #909399;
          }
        }
      }
    }
  }

  .table-card {
    .reply-preview {
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      line-height: 1.5;
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
