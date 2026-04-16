<template>
  <div class="language-settings">
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">语言设置</span>
          <el-button type="primary" :icon="Plus" @click="showAddDialog">
            添加语言
          </el-button>
        </div>
      </template>

      <!-- 语言列表 -->
      <el-table :data="languageList" style="width: 100%" v-loading="loading">
        <el-table-column prop="language_name" label="语言" width="150" />
        <el-table-column prop="country_name" label="国家" width="150" />
        <el-table-column prop="language_code" label="语言代码" width="120" />
        <el-table-column prop="country_code" label="国家代码" width="120" />
        <el-table-column label="默认语言" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.is_default" type="success">默认</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button
              v-if="!row.is_default"
              size="small"
              type="primary"
              @click="setDefault(row)"
            >
              设为默认
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
              :disabled="row.is_default"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑语言对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="选择国家" prop="country_code">
          <el-select
            v-model="formData.country_code"
            filterable
            placeholder="搜索国家..."
            style="width: 100%"
            @change="onCountryChange"
          >
            <el-option
              v-for="country in countryList"
              :key="country.code"
              :label="`${country.name} (${country.code})`"
              :value="country.code"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="国家名称" prop="country_name">
          <el-input v-model="formData.country_name" readonly />
        </el-form-item>

        <el-form-item label="语言代码" prop="language_code">
          <el-input v-model="formData.language_code" placeholder="如: zh, en, ja" />
        </el-form-item>

        <el-form-item label="语言名称" prop="language_name">
          <el-input v-model="formData.language_name" placeholder="如: 中文, English" />
        </el-form-item>

        <el-form-item label="设为默认">
          <el-switch v-model="formData.is_default" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getLanguageConfigs,
  createLanguageConfig,
  updateLanguageConfig,
  deleteLanguageConfig,
  type LanguageConfig
} from '@/api/translation'

// 国家列表数据
const countryList = ref([
  { code: 'CN', name: '中国', lang: 'zh', langName: '中文' },
  { code: 'US', name: '美国', lang: 'en', langName: 'English' },
  { code: 'GB', name: '英国', lang: 'en', langName: 'English' },
  { code: 'JP', name: '日本', lang: 'ja', langName: '日本語' },
  { code: 'KR', name: '韩国', lang: 'ko', langName: '한국어' },
  { code: 'FR', name: '法国', lang: 'fr', langName: 'Français' },
  { code: 'DE', name: '德国', lang: 'de', langName: 'Deutsch' },
  { code: 'ES', name: '西班牙', lang: 'es', langName: 'Español' },
  { code: 'IT', name: '意大利', lang: 'it', langName: 'Italiano' },
  { code: 'PT', name: '葡萄牙', lang: 'pt', langName: 'Português' },
  { code: 'RU', name: '俄罗斯', lang: 'ru', langName: 'Русский' },
  { code: 'BR', name: '巴西', lang: 'pt', langName: 'Português' },
  { code: 'MX', name: '墨西哥', lang: 'es', langName: 'Español' },
  { code: 'CA', name: '加拿大', lang: 'en', langName: 'English' },
  { code: 'AU', name: '澳大利亚', lang: 'en', langName: 'English' },
  { code: 'IN', name: '印度', lang: 'en', langName: 'English' },
  { code: 'TH', name: '泰国', lang: 'th', langName: 'ไทย' },
  { code: 'VN', name: '越南', lang: 'vi', langName: 'Tiếng Việt' },
  { code: 'ID', name: '印度尼西亚', lang: 'id', langName: 'Bahasa Indonesia' },
  { code: 'MY', name: '马来西亚', lang: 'ms', langName: 'Bahasa Melayu' },
  { code: 'SG', name: '新加坡', lang: 'en', langName: 'English' },
  { code: 'PH', name: '菲律宾', lang: 'en', langName: 'English' },
  { code: 'SA', name: '沙特阿拉伯', lang: 'ar', langName: 'العربية' },
  { code: 'AE', name: '阿联酋', lang: 'ar', langName: 'العربية' },
  { code: 'TR', name: '土耳其', lang: 'tr', langName: 'Türkçe' }
])

const languageList = ref<LanguageConfig[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('添加语言')
const submitting = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive<Partial<LanguageConfig>>({
  country_code: '',
  country_name: '',
  language_code: '',
  language_name: '',
  is_default: false
})

const formRules: FormRules = {
  country_code: [{ required: true, message: '请选择国家', trigger: 'change' }],
  language_code: [{ required: true, message: '请输入语言代码', trigger: 'blur' }],
  language_name: [{ required: true, message: '请输入语言名称', trigger: 'blur' }]
}

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 加载语言列表
const loadLanguages = async () => {
  loading.value = true
  try {
    const res = await getLanguageConfigs()
    languageList.value = res.data || []
  } catch (error) {
    ElMessage.error('加载语言列表失败')
  } finally {
    loading.value = false
  }
}

// 显示添加对话框
const showAddDialog = () => {
  dialogTitle.value = '添加语言'
  dialogVisible.value = true
}

// 国家选择变化
const onCountryChange = (countryCode: string) => {
  const country = countryList.value.find(c => c.code === countryCode)
  if (country) {
    formData.country_name = country.name
    formData.language_code = country.lang
    formData.language_name = country.langName
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      await createLanguageConfig(formData as LanguageConfig)
      ElMessage.success('添加成功')
      dialogVisible.value = false
      await loadLanguages()
    } catch (error: any) {
      ElMessage.error(error.message || '添加失败')
    } finally {
      submitting.value = false
    }
  })
}

// 设为默认
const setDefault = async (row: LanguageConfig) => {
  try {
    await updateLanguageConfig(row.id!, { is_default: true })
    ElMessage.success('设置成功')
    await loadLanguages()
  } catch (error) {
    ElMessage.error('设置失败')
  }
}

// 删除语言
const handleDelete = async (row: LanguageConfig) => {
  try {
    await ElMessageBox.confirm('确定要删除这个语言配置吗？', '提示', {
      type: 'warning'
    })

    await deleteLanguageConfig(row.id!)
    ElMessage.success('删除成功')
    await loadLanguages()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    country_code: '',
    country_name: '',
    language_code: '',
    language_name: '',
    is_default: false
  })
}

onMounted(() => {
  loadLanguages()
})
</script>

<style scoped>
.language-settings {
  padding: 20px;
}

.page-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
}
</style>
