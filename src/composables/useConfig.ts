import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfigStore } from '@/stores/config'
import type {
  SystemConfig,
  SensitiveWord,
  ApprovalTemplate,
  ConfigValidation,
  SensitiveWordImportData,
  SensitiveWordImportResult
} from '@/types/config'
import configApi from '@/api/config'

/**
 * 配置管理 Composable
 * 提供配置管理相关的业务逻辑和状态管理
 */
export function useConfig() {
  const configStore = useConfigStore()

  // ============= 响应式状态 =============
  const loading = ref(false)
  const saving = ref(false)
  const validating = ref(false)

  // 验证状态
  const validationErrors = ref<Record<string, string[]>>({})
  const hasValidationErrors = computed(() => Object.keys(validationErrors.value).length > 0)

  // ============= 系统配置相关 =============

  /**
   * 初始化系统配置
   */
  async function initSystemConfigs() {
    if (configStore.systemConfigs.length === 0) {
      await configStore.fetchSystemConfigs()
    }
  }

  /**
   * 验证配置值
   */
  async function validateConfigValue(_configKey: string, _configValue: string): Promise<ConfigValidation> {
    // 後端未實作 validate endpoint，直接回 valid
    return {
      isValid: true,
      errors: [],
      warnings: []
    }
  }

  /**
   * 批量验证配置
   */
  async function validateConfigs(configs: Array<{ configKey: string; configValue: string }>) {
    const results: Record<string, ConfigValidation> = {}
    validationErrors.value = {}

    for (const config of configs) {
      const validation = await validateConfigValue(config.configKey, config.configValue)
      results[config.configKey] = validation

      if (!validation.isValid) {
        validationErrors.value[config.configKey] = validation.errors
      }
    }

    return results
  }

  /**
   * 保存系统配置（带验证）
   */
  async function saveSystemConfig(configKey: string, configValue: string, description?: string) {
    // 先验证
    const validation = await validateConfigValue(configKey, configValue)
    if (!validation.isValid) {
      ElMessage.error(`配置验证失败: ${validation.errors.join(', ')}`)
      return false
    }

    // 显示警告（如果有）
    if (validation.warnings.length > 0) {
      try {
        await ElMessageBox.confirm(
          `配置保存警告：\n${validation.warnings.join('\n')}\n\n是否继续保存？`,
          '配置警告',
          {
            type: 'warning',
            confirmButtonText: '继续保存',
            cancelButtonText: '取消'
          }
        )
      } catch {
        return false
      }
    }

    saving.value = true
    try {
      await configStore.updateSystemConfig(configKey, configValue, description)
      return true
    } catch (error) {
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * 批量保存系统配置
   */
  async function batchSaveSystemConfigs(configs: Array<{ configKey: string; configValue: string; description?: string }>, source: 'system' | 'content_moderation' = 'system') {
    // 批量验证
    const validationResults = await validateConfigs(configs)
    const invalidConfigs = Object.entries(validationResults)
      .filter(([_, validation]) => !validation.isValid)
      .map(([configKey]) => configKey)

    if (invalidConfigs.length > 0) {
      ElMessage.error(`以下配置验证失败: ${invalidConfigs.join(', ')}`)
      return false
    }

    // 检查警告
    const warningConfigs = Object.entries(validationResults)
      .filter(([_, validation]) => validation.warnings.length > 0)

    if (warningConfigs.length > 0) {
      try {
        const warningMessages = warningConfigs.map(([configKey, validation]) =>
          `${configKey}: ${validation.warnings.join(', ')}`
        ).join('\n')

        await ElMessageBox.confirm(
          `部分配置有警告：\n${warningMessages}\n\n是否继续保存？`,
          '配置警告',
          {
            type: 'warning',
            confirmButtonText: '继续保存',
            cancelButtonText: '取消'
          }
        )
      } catch {
        return false
      }
    }

    saving.value = true
    try {
      await configStore.batchUpdateSystemConfigs(configs, source)
      return true
    } catch (error) {
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * 测试配置连接
   */
  async function testConfigConnection(configKey: string, source: 'system' | 'content_moderation' = 'system') {
    loading.value = true
    try {
      if (configKey.startsWith('telegram')) {
        const client = source === 'content_moderation' ? configApi.contentModerationConfig : configApi.systemConfig
        await client.testTelegram()
        ElMessage.success('Telegram 连接测试成功')
        return true
      }
      ElMessage.warning('此配置不支持连接测试')
      return false
    } catch (error) {
      ElMessage.error(`${configKey} 连接测试失败`)
      return false
    } finally {
      loading.value = false
    }
  }

  // ============= 敏感词管理相关 =============

  /**
   * 初始化敏感词管理
   */
  async function initSensitiveWords() {
    await Promise.all([
      configStore.fetchSensitiveWordCategories(),
      configStore.searchSensitiveWords({})
    ])
  }

  /**
   * 批量导入敏感词
   */
  async function importSensitiveWords(importData: SensitiveWordImportData[]): Promise<SensitiveWordImportResult> {
    loading.value = true
    try {
      const response = await configApi.sensitiveWord.importWords(importData)
      const result = response.data

      ElMessage.success(`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`)

      // 刷新敏感词列表
      await configStore.searchSensitiveWords({})

      return result
    } catch (error) {
      console.error('敏感词导入失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 导出敏感词
   */
  async function exportSensitiveWords(category?: string): Promise<SensitiveWord[]> {
    loading.value = true
    try {
      const response = await configApi.sensitiveWord.exportWords(category)
      ElMessage.success('敏感词导出成功')
      return response.data
    } catch (error) {
      console.error('敏感词导出失败:', error)
      ElMessage.error('敏感词导出失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 测试敏感词检测
   */
  async function testSensitiveWordDetection(text: string, categories?: string[]) {
    loading.value = true
    try {
      const response = await configApi.sensitiveWord.testDetection(text, categories)
      return response.data
    } catch (error) {
      console.error('敏感词检测测试失败:', error)
      ElMessage.error('敏感词检测测试失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量操作敏感词
   */
  async function batchOperateSensitiveWords(action: 'enable' | 'disable' | 'delete', ids: number[]) {
    if (ids.length === 0) {
      ElMessage.warning('请选择要操作的敏感词')
      return false
    }

    try {
      let confirmMessage = ''
      switch (action) {
        case 'enable':
          confirmMessage = `确定要启用选中的 ${ids.length} 个敏感词吗？`
          break
        case 'disable':
          confirmMessage = `确定要禁用选中的 ${ids.length} 个敏感词吗？`
          break
        case 'delete':
          confirmMessage = `确定要删除选中的 ${ids.length} 个敏感词吗？此操作不可恢复！`
          break
      }

      await ElMessageBox.confirm(confirmMessage, '确认操作', {
        type: action === 'delete' ? 'warning' : 'info',
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      })

      loading.value = true

      await configApi.sensitiveWord.batchOperateWords({
        action,
        ids
      })

      ElMessage.success('批量操作成功')

      // 刷新列表
      await configStore.searchSensitiveWords({})
      return true
    } catch (error) {
      if (error !== 'cancel') {
        console.error('批量操作失败:', error)
        ElMessage.error('批量操作失败')
      }
      return false
    } finally {
      loading.value = false
    }
  }

  // ============= 审批模板相关 =============

  /**
   * 初始化审批模板
   */
  async function initApprovalTemplates() {
    await configStore.fetchApprovalTemplates()
  }

  /**
   * 验证审批模板
   */
  async function validateApprovalTemplate(nodes: any[]): Promise<ConfigValidation> {
    validating.value = true
    try {
      const response = await configApi.approvalTemplate.validateTemplate(nodes)
      return response.data
    } catch (error) {
      console.error('审批模板验证失败:', error)
      return {
        isValid: false,
        errors: ['模板验证失败'],
        warnings: []
      }
    } finally {
      validating.value = false
    }
  }

  /**
   * 复制审批模板
   */
  async function cloneApprovalTemplate(templateId: number, newName: string) {
    loading.value = true
    try {
      const response = await configApi.approvalTemplate.cloneTemplate(templateId, newName)
      configStore.approvalTemplates.unshift(response.data)
      ElMessage.success('模板复制成功')
      return response.data
    } catch (error) {
      console.error('模板复制失败:', error)
      ElMessage.error('模板复制失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // ============= 配置历史相关 =============

  /**
   * 回滚配置到历史版本
   */
  async function rollbackToHistory(historyId: number, reason?: string) {
    try {
      await ElMessageBox.confirm(
        '确定要回滚到此历史版本吗？当前配置将被覆盖！',
        '确认回滚',
        {
          type: 'warning',
          confirmButtonText: '确认回滚',
          cancelButtonText: '取消'
        }
      )

      loading.value = true
      await configApi.history.rollbackToHistory(historyId, reason)
      ElMessage.success('配置回滚成功')

      // 刷新相关数据
      await Promise.all([
        configStore.fetchSystemConfigs(),
        configStore.fetchConfigHistory({})
      ])

      return true
    } catch (error) {
      if (error !== 'cancel') {
        console.error('配置回滚失败:', error)
        ElMessage.error('配置回滚失败')
      }
      return false
    } finally {
      loading.value = false
    }
  }

  // ============= 通用工具方法 =============

  /**
   * 应用配置更改（no-op，後端未實作）
   */
  async function applyConfigChanges() {
    return { success: true, restartRequired: false }
  }

  /**
   * 获取系统健康状态（no-op，後端未實作）
   */
  async function getSystemHealth() {
    return null
  }

  /**
   * 格式化配置值显示
   */
  function formatConfigValue(config: SystemConfig): string {
    if (config.isSecret) {
      return config.configValue && config.configValue !== '' ? '已設定' : '未設定'
    }
    if (config.isEncrypted) {
      return '••••••••'
    }

    switch (config.configType) {
      case 'boolean':
        return config.configValue === 'true' ? '是' : '否'
      case 'json':
        try {
          return JSON.stringify(JSON.parse(config.configValue), null, 2)
        } catch {
          return config.configValue
        }
      default:
        return config.configValue
    }
  }

  /**
   * 获取配置项的显示类型
   */
  function getConfigInputType(config: SystemConfig): string {
    if (config.isSecret || config.isEncrypted) {
      return 'password'
    }

    switch (config.configType) {
      case 'number':
        return 'number'
      case 'boolean':
        return 'switch'
      case 'json':
        return 'textarea'
      default:
        return 'text'
    }
  }

  return {
    // 状态
    loading,
    saving,
    validating,
    validationErrors,
    hasValidationErrors,

    // 系统配置
    initSystemConfigs,
    validateConfigValue,
    validateConfigs,
    saveSystemConfig,
    batchSaveSystemConfigs,
    testConfigConnection,

    // 敏感词管理
    initSensitiveWords,
    importSensitiveWords,
    exportSensitiveWords,
    testSensitiveWordDetection,
    batchOperateSensitiveWords,

    // 审批模板
    initApprovalTemplates,
    validateApprovalTemplate,
    cloneApprovalTemplate,

    // 配置历史
    rollbackToHistory,

    // 通用工具
    applyConfigChanges,
    getSystemHealth,
    formatConfigValue,
    getConfigInputType
  }
}