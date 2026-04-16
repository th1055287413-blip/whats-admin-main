<template>
  <div class="config-form">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
    >
      <el-card
        v-for="section in configSections"
        :key="section.title"
        class="config-section-card"
        shadow="never"
      >
        <template #header>
          <div class="section-card-header">
            <h3>{{ section.title }}</h3>
            <p v-if="section.description">{{ section.description }}</p>
          </div>
        </template>

        <div class="config-items">
          <div
            v-for="config in section.configs"
            :key="config.configKey"
            :class="['config-item-row', { changed: hasChanges(config.configKey) }]"
          >
            <el-form-item
              :label="getConfigLabel(config)"
              :prop="config.configKey"
            >
              <template #label>
                <div class="config-label">
                  <span class="label-text">{{ getConfigLabel(config) }}</span>
                  <el-tag v-if="config.isEncrypted" size="small" type="warning" effect="plain">
                    加密
                  </el-tag>
                  <el-tag v-if="config.isSecret" size="small" :type="isSecretSet(config) ? 'success' : 'info'" effect="plain">
                    {{ isSecretSet(config) ? '已設定' : '未設定' }}
                  </el-tag>
                </div>
              </template>

              <!-- 字符串类型输入 -->
              <el-input
                v-if="getInputType(config) === 'text'"
                v-model="formData[config.configKey]"
                :placeholder="config.defaultValue || `請輸入${getConfigLabel(config)}`"
                :show-password="config.isEncrypted"
                :disabled="!hasWritePermission"
                clearable
                @change="handleConfigChange(config.configKey, $event)"
              />

              <!-- 密码类型输入 -->
              <el-input
                v-else-if="getInputType(config) === 'password'"
                v-model="formData[config.configKey]"
                type="password"
                :placeholder="config.isSecret
                  ? (isSecretSet(config) ? '已設定，輸入新值覆蓋' : '未設定，請輸入值')
                  : (config.defaultValue || `請輸入${getConfigLabel(config)}`)"
                :disabled="!hasWritePermission"
                show-password
                clearable
                @change="handleConfigChange(config.configKey, $event)"
              />

              <!-- 数字类型输入 -->
              <el-input-number
                v-else-if="getInputType(config) === 'number'"
                v-model="formData[config.configKey]"
                :placeholder="config.defaultValue || `請輸入${getConfigLabel(config)}`"
                :disabled="!hasWritePermission"
                class="number-input"
                @change="handleConfigChange(config.configKey, $event)"
              />

              <!-- 布尔类型开关 -->
              <el-switch
                v-else-if="getInputType(config) === 'switch'"
                v-model="formData[config.configKey]"
                :disabled="!hasWritePermission"
                @change="handleConfigChange(config.configKey, $event)"
              />

              <!-- JSON 类型文本域 -->
              <el-input
                v-else-if="getInputType(config) === 'textarea'"
                v-model="formData[config.configKey]"
                type="textarea"
                :rows="6"
                :placeholder="config.defaultValue || `請輸入${getConfigLabel(config)}`"
                :disabled="!hasWritePermission"
                @change="handleConfigChange(config.configKey, $event)"
              />

              <!-- 选择类型 -->
              <el-select
                v-else-if="getInputType(config) === 'select'"
                v-model="formData[config.configKey]"
                :placeholder="config.defaultValue || `請選擇${getConfigLabel(config)}`"
                :disabled="!hasWritePermission"
                style="width: 100%"
                @change="handleConfigChange(config.configKey, $event)"
              >
                <el-option
                  v-for="option in getSelectOptions(config)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>

              <!-- 描述提示 -->
              <div class="config-tip" v-if="config.description">
                {{ config.description }}
              </div>

              <!-- 测试连接按钮 -->
              <div class="config-actions" v-if="canTestConnection(config)">
                <el-button
                  size="small"
                  type="primary"
                  :icon="Connection"
                  @click="testConnection(config.configKey)"
                  :loading="testingConnections[config.configKey]"
                >
                  測試連線
                </el-button>
              </div>

              <!-- 验证错误提示 -->
              <div v-if="validationErrors[config.configKey]" class="validation-errors">
                <el-alert
                  v-for="error in validationErrors[config.configKey]"
                  :key="error"
                  :title="error"
                  type="error"
                  size="small"
                  :closable="false"
                />
              </div>

              <!-- 验证警告提示 -->
              <div v-if="validationWarnings[config.configKey]" class="validation-warnings">
                <el-alert
                  v-for="warning in validationWarnings[config.configKey]"
                  :key="warning"
                  :title="warning"
                  type="warning"
                  size="small"
                  :closable="false"
                />
              </div>
            </el-form-item>
          </div>
        </div>
      </el-card>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Connection } from '@element-plus/icons-vue'
import { useConfig } from '@/composables/useConfig'
import type { SystemConfig } from '@/types/config'

// ============= Props =============
interface Props {
  configs: SystemConfig[]
  category: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// ============= Emits =============
interface Emits {
  update: [configKey: string, value: string]
  testConnection: [configKey: string]
  batchSave: [changes: Array<{ configKey: string; configValue: string; description?: string }>]
}

const emit = defineEmits<Emits>()

// ============= 响应式数据 =============
const configUseConfig = useConfig()

const formRef = ref()
const formData = ref<Record<string, any>>({})
const originalData = ref<Record<string, any>>({})

const testingConnections = ref<Record<string, boolean>>({})

const validationErrors = ref<Record<string, string[]>>({})
const validationWarnings = ref<Record<string, string[]>>({})

// ============= 计算属性 =============

const hasWritePermission = computed(() => true)

const configSections = computed(() => {
  const sections: Array<{
    title: string
    description?: string
    configs: SystemConfig[]
  }> = []

  const grouped = props.configs.reduce(
    (groups, config) => {
      const prefix = config.configKey.split('.')[0] || 'general'
      if (!groups[prefix]) {
        groups[prefix] = []
      }
      groups[prefix].push(config)
      return groups
    },
    {} as Record<string, SystemConfig[]>
  )

  Object.entries(grouped).forEach(([prefix, configs]) => {
    sections.push({
      title: getSectionTitle(prefix),
      description: getSectionDescription(prefix),
      configs: configs.sort((a, b) => a.configKey.localeCompare(b.configKey))
    })
  })

  return sections
})

const formRules = computed(() => {
  const rules: Record<string, any[]> = {}

  props.configs.forEach(config => {
    const configRules: any[] = []

    if (config.isRequired) {
      configRules.push({
        required: true,
        message: `${getConfigLabel(config)}不能為空`,
        trigger: 'blur'
      })
    }

    if (config.validationRule) {
      try {
        const regex = new RegExp(config.validationRule)
        configRules.push({
          pattern: regex,
          message: `${getConfigLabel(config)}格式不正確`,
          trigger: 'blur'
        })
      } catch (error) {
        console.warn(`配置項 ${config.configKey} 的驗證規則無效:`, error)
      }
    }

    if (config.configType === 'number') {
      configRules.push({
        type: 'number',
        message: `${getConfigLabel(config)}必須是數字`,
        trigger: 'blur'
      })
    }

    if (configRules.length > 0) {
      rules[config.configKey] = configRules
    }
  })

  return rules
})

// ============= 监听器 =============

watch(
  () => props.configs,
  newConfigs => {
    initFormData(newConfigs)
  },
  { immediate: true, deep: true }
)

// ============= 方法 =============

function initFormData(configs: SystemConfig[]) {
  const data: Record<string, any> = {}
  const original: Record<string, any> = {}

  configs.forEach(config => {
    let value: any = config.configValue

    // isSecret 欄位的遮罩值清空，讓 placeholder 顯示狀態
    if (config.isSecret && value === '******') {
      value = ''
    }

    switch (config.configType) {
      case 'number':
        value = value ? Number(value) : 0
        break
      case 'boolean':
        value = value === 'true' || value === true
        break
      case 'json':
        try {
          value = JSON.parse(value)
          value = JSON.stringify(value, null, 2)
        } catch {
          // keep original
        }
        break
    }

    data[config.configKey] = value
    original[config.configKey] = value
  })

  formData.value = data
  originalData.value = original
}

function getSectionTitle(prefix: string): string {
  const titles: Record<string, string> = {
    system: '系統參數',
    sensitive_word: '敏感詞監控',
    telegram: 'Telegram',
    umami: 'Umami Analytics',
    advanced: '進階組態',
    security: '安全組態',
    notification: '通知組態',
    whatsapp: 'WhatsApp API',
    database: '資料庫組態',
    cache: '快取',
    alert: '告警',
    log: '日誌',
    storage: '儲存組態',
    general: '通用組態'
  }
  return titles[prefix] || prefix.toUpperCase()
}

function getSectionDescription(prefix: string): string {
  const descriptions: Record<string, string> = {
    system: '系統運行的基礎參數設定',
    umami: 'Umami Analytics 報表服務連線設定',
    advanced: '快取、告警頻率等進階參數',
    security: '安全策略和權限控制相關組態',
    notification: '郵件、簡訊等通知服務組態',
    whatsapp: 'WhatsApp Business API 連線組態',
    database: '資料庫連線和效能相關組態',
    cache: 'Redis 快取服務組態',
    storage: '檔案儲存服務組態'
  }
  return descriptions[prefix] || ''
}

function getConfigLabel(config: SystemConfig): string {
  if (config.label) return config.label
  const parts = config.configKey.split('.')
  const lastPart = parts[parts.length - 1]
  return lastPart.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getInputType(config: SystemConfig): string {
  if (config.isSecret || config.isEncrypted) return 'password'

  switch (config.configType) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'switch'
    case 'json':
      return 'textarea'
    default:
      if (config.validationRule && config.validationRule.includes('|')) {
        return 'select'
      }
      return 'text'
  }
}

function isSecretSet(config: SystemConfig): boolean {
  return !!(config.isSecret && config.configValue && config.configValue !== '')
}

function getSelectOptions(config: SystemConfig) {
  if (!config.validationRule || !config.validationRule.includes('|')) {
    return []
  }

  return config.validationRule.split('|').map(option => ({
    value: option.trim(),
    label: option.trim()
  }))
}

function canTestConnection(config: SystemConfig): boolean {
  const testableKeys = [
    'database.host',
    'cache.host',
    'notification.email.smtp_host',
    'whatsapp.api_url'
  ]
  return testableKeys.some(key => config.configKey.includes(key))
}

function hasChanges(configKey: string): boolean {
  return formData.value[configKey] !== originalData.value[configKey]
}

async function handleConfigChange(configKey: string, value: any) {
  formData.value[configKey] = value
  emit('update', configKey, String(value))
  await validateConfig(configKey, String(value))
}

async function validateConfig(configKey: string, value: string) {
  try {
    const validation = await configUseConfig.validateConfigValue(configKey, value)

    if (validation.isValid) {
      delete validationErrors.value[configKey]
    } else {
      validationErrors.value[configKey] = validation.errors
    }

    if (validation.warnings.length > 0) {
      validationWarnings.value[configKey] = validation.warnings
    } else {
      delete validationWarnings.value[configKey]
    }
  } catch (error) {
    console.error('驗證組態失敗:', error)
  }
}

async function testConnection(configKey: string) {
  testingConnections.value[configKey] = true
  try {
    emit('testConnection', configKey)
  } finally {
    testingConnections.value[configKey] = false
  }
}
</script>

<style scoped>
.config-form {
  padding: var(--spacing-md, 16px) 0;
}

.config-section-card {
  margin-bottom: var(--spacing-md, 16px);
  border-radius: 8px;
}

.config-section-card :deep(.el-card__header) {
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border-lighter, #ebeef5);
}

.config-section-card :deep(.el-card__body) {
  padding: 8px 20px 16px;
}

.section-card-header h3 {
  margin: 0 0 4px 0;
  color: var(--text-primary, #303133);
  font-size: 15px;
  font-weight: 600;
}

.section-card-header p {
  margin: 0;
  color: var(--text-secondary, #909399);
  font-size: 13px;
}

.config-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-item-row {
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid transparent;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.config-item-row.changed {
  border-left-color: var(--primary-color, #409eff);
  background-color: #f0f7ff;
}

.config-item-row :deep(.el-form-item) {
  margin-bottom: 0;
}

.config-item-row :deep(.el-form-item__label) {
  padding-bottom: 4px;
  display: inline-flex;
  align-items: center;
}

.config-item-row :deep(.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label::before) {
  display: inline;
  margin-right: 4px;
  vertical-align: middle;
}

.config-label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-text {
  font-weight: 500;
  color: var(--text-primary, #303133);
}

.config-item-row :deep(.el-input),
.config-item-row :deep(.el-select) {
  max-width: 480px;
}

.number-input {
  width: 240px;
}

.config-tip {
  width: 100%;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary, #909399);
  line-height: 1.5;
}

.config-actions {
  margin-top: 8px;
}

.validation-errors,
.validation-warnings {
  margin-top: 8px;
}

.validation-errors :deep(.el-alert),
.validation-warnings :deep(.el-alert) {
  margin-bottom: 4px;
}

/* Responsive */
@media (max-width: 768px) {
  .config-section-card :deep(.el-card__header),
  .config-section-card :deep(.el-card__body) {
    padding-left: 12px;
    padding-right: 12px;
  }

  .number-input {
    width: 100%;
  }
}
</style>
