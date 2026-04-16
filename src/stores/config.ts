import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type {
  SystemConfig,
  SystemConfigGroup,
  SensitiveWord,
  SensitiveWordCategory,
  ApprovalTemplate,
  ConfigHistory,
  ConfigStats,
  ConfigPermission,
  ConfigSearchParams,
  SensitiveWordSearchParams,
  ApprovalTemplateSearchParams,
  ConfigHistoryQuery,
  PaginatedResponse
} from '@/types/config'
import configApi from '@/api/config'

// 定義所有預期的系統配置 schema
interface ConfigSchema {
  key: string
  label: string
  type: 'string' | 'boolean' | 'number'
  category: string
  description?: string
  isEncrypted?: boolean
  isRequired?: boolean
  defaultValue?: string
  validationRule?: string
  isTextarea?: boolean
}

const CONFIG_SCHEMA: ConfigSchema[] = [
  // 敏感词监控
  { key: 'sensitive_word.enabled', label: '启用监控', type: 'boolean', category: 'sensitive_word', description: '开启后将自动检测接收到的消息中的敏感词' },
  { key: 'telegram.enabled', label: '启用 Telegram 告警', type: 'boolean', category: 'sensitive_word', description: '检测到敏感词时通过 Telegram 发送通知' },
  { key: 'telegram.bot_token', label: 'Bot Token', type: 'string', category: 'sensitive_word', isEncrypted: true, isRequired: true, description: '从 @BotFather 获取，格式: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz' },
  { key: 'telegram.chat_id', label: 'Chat ID', type: 'string', category: 'sensitive_word', isRequired: true, description: '可以是用户ID或群组ID，从 @userinfobot 或 @getidsbot 获取' },
  // Umami Analytics
  { key: 'umami.base_url', label: 'Base URL', type: 'string', category: 'umami', isRequired: true, description: 'Umami 實例位址，例如 https://umami.example.com' },
  { key: 'umami.api_token', label: 'API Token', type: 'string', category: 'umami', isEncrypted: true, isRequired: true, description: 'Umami API 認證 token' },
  // LLM 模型
  { key: 'llm.analysis_model', label: '分析模型', type: 'string', category: 'llm', description: 'AI 聊天分析使用的 LLM 模型，留空使用預設 google/gemini-flash-1.5', defaultValue: '' },
  { key: 'llm.translation_model', label: '翻譯模型', type: 'string', category: 'llm', description: '翻譯使用的 LLM 模型，留空使用預設 google/gemini-flash-1.5', defaultValue: '' },
]

export const useConfigStore = defineStore('config', () => {
  // ============= 状态定义 =============

  // 系统配置相关状态
  const systemConfigs = ref<SystemConfigGroup[]>([])
  const systemConfigsLoading = ref(false)

  // 敏感词相关状态
  const sensitiveWords = ref<SensitiveWord[]>([])
  const sensitiveWordCategories = ref<SensitiveWordCategory[]>([])
  const sensitiveWordsLoading = ref(false)

  // 审批模板相关状态
  const approvalTemplates = ref<ApprovalTemplate[]>([])
  const approvalTemplatesLoading = ref(false)

  // 配置历史相关状态
  const configHistories = ref<ConfigHistory[]>([])
  const configHistoriesLoading = ref(false)

  // 配置统计
  const configStats = ref<ConfigStats | null>(null)

  // 权限信息
  const permissions = ref<ConfigPermission | null>(null)

  // 当前选中的配置项
  const selectedSystemConfig = ref<SystemConfig | null>(null)
  const selectedSensitiveWord = ref<SensitiveWord | null>(null)
  const selectedApprovalTemplate = ref<ApprovalTemplate | null>(null)

  // 搜索和分页状态
  const searchParams = ref<{
    system: ConfigSearchParams
    sensitiveWord: SensitiveWordSearchParams
    approvalTemplate: ApprovalTemplateSearchParams
    history: ConfigHistoryQuery
  }>({
    system: { page: 1, pageSize: 20 },
    sensitiveWord: { page: 1, pageSize: 20 },
    approvalTemplate: { page: 1, pageSize: 20 },
    history: { page: 1, pageSize: 20 }
  })

  // 分页信息
  const pagination = ref<{
    system: { total: number; totalPages: number }
    sensitiveWord: { total: number; totalPages: number }
    approvalTemplate: { total: number; totalPages: number }
    history: { total: number; totalPages: number }
  }>({
    system: { total: 0, totalPages: 0 },
    sensitiveWord: { total: 0, totalPages: 0 },
    approvalTemplate: { total: 0, totalPages: 0 },
    history: { total: 0, totalPages: 0 }
  })

  // ============= 计算属性 =============

  // 获取所有系统配置项的扁平化数组
  const allSystemConfigs = computed(() => {
    return systemConfigs.value.flatMap(group => group.configs)
  })

  // 根据分类获取系统配置
  const getSystemConfigsByCategory = computed(() => {
    return (category: string) => {
      const group = systemConfigs.value.find(g => g.category === category)
      return group ? group.configs : []
    }
  })

  // 根据分类获取敏感词
  const getSensitiveWordsByCategory = computed(() => {
    return (category: string) => {
      return sensitiveWords.value.filter(word => word.category === category)
    }
  })

  // 获取活跃的审批模板
  const activeApprovalTemplates = computed(() => {
    return approvalTemplates.value.filter(template => template.status === 'active')
  })

  // 检查是否有相关权限
  const hasPermission = computed(() => {
    return (action: keyof ConfigPermission) => {
      return permissions.value?.[action] || false
    }
  })

  // ============= 系统配置相关方法 =============

  type ConfigSource = 'system' | 'content_moderation'

  function getConfigClient(source: ConfigSource) {
    return source === 'content_moderation'
      ? configApi.contentModerationConfig
      : configApi.systemConfig
  }

  /**
   * 获取系统配置列表
   */
  async function fetchSystemConfigs(source: ConfigSource = 'system') {
    systemConfigsLoading.value = true
    try {
      const response = await getConfigClient(source).getConfigs()
      const rawData = response.data || {}

      // 相容兩種格式：陣列 []SystemConfig 或舊版 map[string]string
      let apiItems: SystemConfig[]
      if (Array.isArray(rawData)) {
        apiItems = rawData
      } else {
        apiItems = Object.entries(rawData as Record<string, string>).map(([key, value]) => ({
          id: 0,
          configKey: key,
          configValue: value,
          configType: 'string' as const,
          category: key.split('.')[0] || 'general',
          isEncrypted: key.includes('token') || key.includes('password'),
          isRequired: false,
          createdAt: '',
          updatedAt: ''
        }))
      }

      // 建立 configKey → API item 的查找表
      const apiMap = new Map<string, SystemConfig>()
      for (const item of apiItems) {
        apiMap.set(item.configKey, item)
      }

      const groups: Record<string, SystemConfigGroup> = {}

      // 以 schema 為基礎，合併 API 回傳的值
      for (const schema of CONFIG_SCHEMA) {
        const { category } = schema
        if (!groups[category]) {
          groups[category] = {
            category,
            categoryName: getCategoryName(category),
            configs: []
          }
        }
        const apiItem = apiMap.get(schema.key)
        groups[category].configs.push({
          id: apiItem?.id ?? 0,
          configKey: schema.key,
          configValue: apiItem?.configValue ?? schema.defaultValue ?? '',
          configType: schema.isTextarea ? 'json' : schema.type,
          label: schema.label,
          category,
          description: apiItem?.description || schema.description || '',
          isEncrypted: schema.isEncrypted || false,
          isSecret: apiItem?.isSecret ?? false,
          isRequired: schema.isRequired || false,
          validationRule: schema.validationRule,
          updatedBy: apiItem?.updatedBy,
          createdAt: '',
          updatedAt: apiItem?.updatedAt ?? ''
        })
      }

      // 補充 schema 未定義但 API 回傳的項目
      for (const apiItem of apiItems) {
        const exists = CONFIG_SCHEMA.some(s => s.key === apiItem.configKey)
        if (!exists) {
          const category = apiItem.configKey.split('.')[0] || 'general'
          if (!groups[category]) {
            groups[category] = {
              category,
              categoryName: getCategoryName(category),
              configs: []
            }
          }
          groups[category].configs.push({
            id: apiItem.id,
            configKey: apiItem.configKey,
            configValue: apiItem.configValue,
            configType: (apiItem.configValue === 'true' || apiItem.configValue === 'false') ? 'boolean' : (apiItem.configType || 'string'),
            category,
            description: apiItem.description || '',
            isEncrypted: apiItem.isEncrypted || false,
            isSecret: apiItem.isSecret ?? false,
            isRequired: false,
            updatedBy: apiItem.updatedBy,
            createdAt: '',
            updatedAt: apiItem.updatedAt ?? ''
          })
        }
      }

      systemConfigs.value = Object.values(groups)
    } catch (error) {
      console.error('获取系统配置失败:', error)
      ElMessage.error('获取系统配置失败')
    } finally {
      systemConfigsLoading.value = false
    }
  }

  function getCategoryName(category: string): string {
    const names: Record<string, string> = {
      sensitive_word: '敏感词监控',
      telegram: 'Telegram',
      advanced: '高级配置',
      umami: 'Umami Analytics',
      llm: 'LLM 模型',
      cache: '缓存',
      alert: '告警',
      log: '日志',
      general: '通用'
    }
    return names[category] || category
  }

  /**
   * 搜索系统配置（client-side filter）
   */
  async function searchSystemConfigs(params: ConfigSearchParams) {
    await fetchSystemConfigs()
    // client-side filtering if keyword provided
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      systemConfigs.value = systemConfigs.value
        .map(group => ({
          ...group,
          configs: group.configs.filter(c =>
            c.configKey.toLowerCase().includes(keyword) ||
            c.configValue.toLowerCase().includes(keyword)
          )
        }))
        .filter(group => group.configs.length > 0)
    }
    if (params.category) {
      systemConfigs.value = systemConfigs.value.filter(g => g.category === params.category)
    }
  }

  /**
   * 更新系统配置
   */
  async function updateSystemConfig(configKey: string, configValue: string, _description?: string, source: ConfigSource = 'system') {
    try {
      await getConfigClient(source).updateConfig(configKey, configValue)

      // 更新本地状态
      systemConfigs.value.forEach(group => {
        const config = group.configs.find(c => c.configKey === configKey)
        if (config) {
          config.configValue = configValue
        }
      })

      ElMessage.success('配置更新成功')
    } catch (error) {
      console.error('更新系统配置失败:', error)
      throw error
    }
  }

  /**
   * 批量更新系统配置
   */
  async function batchUpdateSystemConfigs(configs: Array<{ configKey: string; configValue: string }>, source: ConfigSource = 'system') {
    try {
      const client = getConfigClient(source)
      await Promise.all(
        configs.map(c => client.updateConfig(c.configKey, c.configValue))
      )

      // 更新本地状态
      configs.forEach(({ configKey, configValue }) => {
        systemConfigs.value.forEach(group => {
          const config = group.configs.find(c => c.configKey === configKey)
          if (config) {
            config.configValue = configValue
          }
        })
      })

      ElMessage.success('批量更新配置成功')
    } catch (error) {
      console.error('批量更新配置失败:', error)
      throw error
    }
  }

  // ============= 敏感词相关方法 =============

  /**
   * 获取敏感词分类
   */
  async function fetchSensitiveWordCategories() {
    try {
      const response = await configApi.sensitiveWord.getCategories()
      sensitiveWordCategories.value = response.data
    } catch (error) {
      console.error('获取敏感词分类失败:', error)
      ElMessage.error('获取敏感词分类失败')
    }
  }

  /**
   * 搜索敏感词
   */
  async function searchSensitiveWords(params: SensitiveWordSearchParams) {
    sensitiveWordsLoading.value = true
    try {
      searchParams.value.sensitiveWord = { ...searchParams.value.sensitiveWord, ...params }
      const response = await configApi.sensitiveWord.searchWords(searchParams.value.sensitiveWord)

      sensitiveWords.value = response.data.items
      pagination.value.sensitiveWord = {
        total: response.data.total,
        totalPages: response.data.totalPages
      }
    } catch (error) {
      console.error('搜索敏感词失败:', error)
      ElMessage.error('搜索敏感词失败')
    } finally {
      sensitiveWordsLoading.value = false
    }
  }

  /**
   * 创建敏感词
   */
  async function createSensitiveWord(data: Omit<SensitiveWord, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const response = await configApi.sensitiveWord.createWord(data)
      sensitiveWords.value.unshift(response.data)
      ElMessage.success('敏感词创建成功')
      return response.data
    } catch (error) {
      console.error('创建敏感词失败:', error)
      throw error
    }
  }

  /**
   * 更新敏感词
   */
  async function updateSensitiveWord(id: number, data: Partial<SensitiveWord>) {
    try {
      const response = await configApi.sensitiveWord.updateWord(id, data)

      const index = sensitiveWords.value.findIndex(word => word.id === id)
      if (index !== -1) {
        sensitiveWords.value[index] = response.data
      }

      ElMessage.success('敏感词更新成功')
      return response.data
    } catch (error) {
      console.error('更新敏感词失败:', error)
      throw error
    }
  }

  /**
   * 删除敏感词
   */
  async function deleteSensitiveWord(id: number) {
    try {
      await configApi.sensitiveWord.deleteWord(id)

      const index = sensitiveWords.value.findIndex(word => word.id === id)
      if (index !== -1) {
        sensitiveWords.value.splice(index, 1)
      }

      ElMessage.success('敏感词删除成功')
    } catch (error) {
      console.error('删除敏感词失败:', error)
      throw error
    }
  }

  // ============= 审批模板相关方法 =============

  /**
   * 获取审批模板列表
   */
  async function fetchApprovalTemplates() {
    approvalTemplatesLoading.value = true
    try {
      const response = await configApi.approvalTemplate.getTemplates()
      approvalTemplates.value = response.data
    } catch (error) {
      console.error('获取审批模板失败:', error)
      ElMessage.error('获取审批模板失败')
    } finally {
      approvalTemplatesLoading.value = false
    }
  }

  /**
   * 搜索审批模板
   */
  async function searchApprovalTemplates(params: ApprovalTemplateSearchParams) {
    approvalTemplatesLoading.value = true
    try {
      searchParams.value.approvalTemplate = { ...searchParams.value.approvalTemplate, ...params }
      const response = await configApi.approvalTemplate.searchTemplates(searchParams.value.approvalTemplate)

      approvalTemplates.value = response.data.items
      pagination.value.approvalTemplate = {
        total: response.data.total,
        totalPages: response.data.totalPages
      }
    } catch (error) {
      console.error('搜索审批模板失败:', error)
      ElMessage.error('搜索审批模板失败')
    } finally {
      approvalTemplatesLoading.value = false
    }
  }

  /**
   * 创建审批模板
   */
  async function createApprovalTemplate(data: Omit<ApprovalTemplate, 'id' | 'version' | 'createdBy' | 'createdAt' | 'updatedAt'>) {
    try {
      const response = await configApi.approvalTemplate.createTemplate(data)
      approvalTemplates.value.unshift(response.data)
      ElMessage.success('审批模板创建成功')
      return response.data
    } catch (error) {
      console.error('创建审批模板失败:', error)
      throw error
    }
  }

  // ============= 配置历史相关方法 =============

  /**
   * 获取配置历史
   */
  async function fetchConfigHistory(params: ConfigHistoryQuery) {
    configHistoriesLoading.value = true
    try {
      searchParams.value.history = { ...searchParams.value.history, ...params }
      const response = await configApi.history.getHistory(searchParams.value.history)

      configHistories.value = response.data.items
      pagination.value.history = {
        total: response.data.total,
        totalPages: response.data.totalPages
      }
    } catch (error) {
      console.error('获取配置历史失败:', error)
      ElMessage.error('获取配置历史失败')
    } finally {
      configHistoriesLoading.value = false
    }
  }

  // ============= 通用方法 =============

  /**
   * 获取配置权限
   */
  async function fetchPermissions() {
    try {
      const response = await configApi.getPermissions()
      permissions.value = response.data
    } catch (error) {
      console.error('获取配置权限失败:', error)
    }
  }

  /**
   * 获取配置统计
   */
  async function fetchConfigStats() {
    try {
      const response = await configApi.getStats()
      configStats.value = response.data
    } catch (error) {
      console.error('获取配置统计失败:', error)
    }
  }

  /**
   * 重置所有状态
   */
  function resetState() {
    systemConfigs.value = []
    sensitiveWords.value = []
    sensitiveWordCategories.value = []
    approvalTemplates.value = []
    configHistories.value = []
    configStats.value = null
    permissions.value = null
    selectedSystemConfig.value = null
    selectedSensitiveWord.value = null
    selectedApprovalTemplate.value = null
  }

  return {
    // 状态
    systemConfigs,
    systemConfigsLoading,
    sensitiveWords,
    sensitiveWordCategories,
    sensitiveWordsLoading,
    approvalTemplates,
    approvalTemplatesLoading,
    configHistories,
    configHistoriesLoading,
    configStats,
    permissions,
    selectedSystemConfig,
    selectedSensitiveWord,
    selectedApprovalTemplate,
    searchParams,
    pagination,

    // 计算属性
    allSystemConfigs,
    getSystemConfigsByCategory,
    getSensitiveWordsByCategory,
    activeApprovalTemplates,
    hasPermission,

    // 方法
    fetchSystemConfigs,
    searchSystemConfigs,
    updateSystemConfig,
    batchUpdateSystemConfigs,
    fetchSensitiveWordCategories,
    searchSensitiveWords,
    createSensitiveWord,
    updateSensitiveWord,
    deleteSensitiveWord,
    fetchApprovalTemplates,
    searchApprovalTemplates,
    createApprovalTemplate,
    fetchConfigHistory,
    fetchPermissions,
    fetchConfigStats,
    resetState,
    configApi
  }
})