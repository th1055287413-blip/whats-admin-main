import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as tagApi from '@/api/tag'
import type {
  AccountTag,
  TagListParams,
  CreateTagRequest,
  UpdateTagRequest,
  TagStatistics
} from '@/api/tag'

// 默认颜色选项
export const DEFAULT_TAG_COLORS = [
  '#409EFF', // 蓝色
  '#67C23A', // 绿色
  '#E6A23C', // 橙色
  '#F56C6C', // 红色
  '#909399', // 灰色
  '#00D1B2', // 青色
  '#FF3860', // 粉红色
  '#FFB53C', // 黄色
  '#8E44AD', // 紫色
  '#3498DB', // 天蓝色
  '#1ABC9C', // 薄荷绿
  '#E74C3C'  // 番茄红
]

export function useAccountTag() {
  // ==================== 状态 ====================
  const tags = ref<AccountTag[]>([])
  const currentTag = ref<AccountTag | null>(null)
  const loading = ref(false)

  const paginationInfo = ref({
    current: 1,
    pageSize: 20,
    total: 0
  })

  // 表单数据
  const tagForm = ref<CreateTagRequest>({
    name: '',
    color: DEFAULT_TAG_COLORS[0],
    description: '',
    tag_type: 'custom'
  })

  const editTagForm = ref<UpdateTagRequest>({})

  // 批量创建表单
  const batchCreateForm = ref<CreateTagRequest[]>([])

  // ==================== 计算属性 ====================
  const usedTags = computed(() => tags.value.filter(t => t.account_count > 0))
  const emptyTags = computed(() => tags.value.filter(t => t.account_count === 0))

  const colorGroups = computed(() => {
    const groups: Record<string, AccountTag[]> = {}
    tags.value.forEach(tag => {
      if (!groups[tag.color]) {
        groups[tag.color] = []
      }
      groups[tag.color].push(tag)
    })
    return groups
  })

  // 颜色选项
  const colorOptions = ref(DEFAULT_TAG_COLORS)

  // ==================== 表单验证规则 ====================
  const tagFormRules = {
    name: [
      { required: true, message: '请输入标签名称', trigger: 'blur' },
      { min: 1, max: 50, message: '标签名称长度在1到50个字符', trigger: 'blur' }
    ],
    color: [
      { required: true, message: '请选择标签颜色', trigger: 'change' }
    ],
    description: [
      { max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }
    ]
  }

  // ==================== API 调用方法 ====================

  /**
   * 获取标签列表
   */
  const fetchTags = async (params?: TagListParams) => {
    loading.value = true
    try {
      const response = await tagApi.getTagList({
        page: paginationInfo.value.current,
        limit: paginationInfo.value.pageSize,
        ...params
      })

      if (response.data && typeof response.data === 'object' && 'list' in response.data) {
        tags.value = response.data.list
        paginationInfo.value.total = response.data.total
        paginationInfo.value.current = response.data.page
        paginationInfo.value.pageSize = response.data.limit
      }
    } catch (error: any) {
      console.error('获取标签列表失败:', error)
      ElMessage.error(error.message || '获取标签列表失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建标签
   */
  const createTag = async () => {
    loading.value = true
    try {
      const response = await tagApi.createTag(tagForm.value)
      if (response.data) {
        ElMessage.success('创建标签成功')
        await fetchTags()
        return true
      }
      return false
    } catch (error: any) {
      console.error('创建标签失败:', error)
      ElMessage.error(error.message || '创建标签失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新标签
   */
  const updateTag = async (id: number) => {
    loading.value = true
    try {
      const response = await tagApi.updateTag(id, editTagForm.value)
      if (response.data) {
        ElMessage.success('更新标签成功')
        await fetchTags()
        return true
      }
      return false
    } catch (error: any) {
      console.error('更新标签失败:', error)
      ElMessage.error(error.message || '更新标签失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除标签
   */
  const deleteTag = async (id: number) => {
    const tag = tags.value.find(t => t.id === id)
    const message = tag?.account_count && tag.account_count > 0
      ? `确定要删除标签"${tag.name}"吗？该标签关联了 ${tag.account_count} 个账号。`
      : `确定要删除标签"${tag?.name}"吗？`

    try {
      await ElMessageBox.confirm(message, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      loading.value = true
      await tagApi.deleteTag(id)
      ElMessage.success('删除标签成功')
      await fetchTags()
      return true
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error('删除标签失败:', error)
        ElMessage.error(error.message || '删除标签失败')
      }
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取账号的标签
   */
  const fetchAccountTags = async (accountId: number) => {
    loading.value = true
    try {
      const response = await tagApi.getAccountTags(accountId)
      if (response.data) {
        return response.data
      }
      return []
    } catch (error: any) {
      console.error('获取账号标签失败:', error)
      ElMessage.error(error.message || '获取账号标签失败')
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * 为账号添加标签
   */
  const addAccountTags = async (accountId: number, tagIds: number[]) => {
    loading.value = true
    try {
      const response = await tagApi.addAccountTags(accountId, tagIds)
      if (response.data) {
        ElMessage.success('添加标签成功')
        return true
      }
    } catch (error: any) {
      console.error('添加标签失败:', error)
      ElMessage.error(error.message || '添加标签失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 移除账号标签
   */
  const removeAccountTag = async (accountId: number, tagId: number) => {
    loading.value = true
    try {
      const response = await tagApi.removeAccountTag(accountId, tagId)
      if (response.data) {
        ElMessage.success('移除标签成功')
        return true
      }
    } catch (error: any) {
      console.error('移除标签失败:', error)
      ElMessage.error(error.message || '移除标签失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 批量为账号添加标签
   */
  const batchAddAccountTags = async (accountIds: number[], tagIds: number[]) => {
    loading.value = true
    try {
      const response = await tagApi.batchAddAccountTags({ account_ids: accountIds, tag_ids: tagIds })
      if (response.data) {
        ElMessage.success('批量添加标签成功')
        return true
      }
    } catch (error: any) {
      console.error('批量添加标签失败:', error)
      ElMessage.error(error.message || '批量添加标签失败')
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取标签统计信息
   */
  const fetchTagStatistics = async (tagId: number): Promise<TagStatistics | null> => {
    loading.value = true
    try {
      const response = await tagApi.getTagStatistics(tagId)
      if (response.data) {
        return response.data
      }
      return null
    } catch (error: any) {
      console.error('获取标签统计失败:', error)
      ElMessage.error(error.message || '获取标签统计失败')
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取所有标签统计
   */
  const fetchAllTagsStatistics = async (): Promise<TagStatistics[]> => {
    loading.value = true
    try {
      const response = await tagApi.getAllTagsStatistics()
      if (response.data) {
        return response.data
      }
      return []
    } catch (error: any) {
      console.error('获取标签统计失败:', error)
      ElMessage.error(error.message || '获取标签统计失败')
      return []
    } finally {
      loading.value = false
    }
  }

  // ==================== 表单管理 ====================
  const resetTagForm = () => {
    tagForm.value = {
      name: '',
      color: DEFAULT_TAG_COLORS[0],
      description: '',
      tag_type: 'custom'
    }
  }

  const resetEditTagForm = () => {
    editTagForm.value = {}
  }

  const setEditTagForm = (tag: AccountTag) => {
    editTagForm.value = {
      name: tag.name,
      color: tag.color,
      description: tag.description,
      tag_type: tag.tag_type
    }
  }

  const addBatchCreateItem = () => {
    batchCreateForm.value.push({
      name: '',
      color: DEFAULT_TAG_COLORS[batchCreateForm.value.length % DEFAULT_TAG_COLORS.length],
      description: '',
      tag_type: 'custom'
    })
  }

  const removeBatchCreateItem = (index: number) => {
    batchCreateForm.value.splice(index, 1)
  }

  const resetBatchCreateForm = () => {
    batchCreateForm.value = []
  }

  // ==================== 过滤和分页 ====================
  const filters = ref<TagListParams>({})

  const setFilters = (newFilters: Partial<TagListParams>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  const resetFilters = () => {
    filters.value = {}
    paginationInfo.value.current = 1
  }

  const handlePageChange = async (page: number) => {
    paginationInfo.value.current = page
    await fetchTags(filters.value)
  }

  const handlePageSizeChange = async (pageSize: number) => {
    paginationInfo.value.pageSize = pageSize
    paginationInfo.value.current = 1
    await fetchTags(filters.value)
  }

  const handleSort = async (_column: any) => {
    // 可以根据需要实现排序逻辑
    await fetchTags(filters.value)
  }

  // ==================== 工具函数 ====================
  const formatUserCount = (count: number) => {
    if (count === 0) return { text: '0', type: 'info' as const }
    if (count < 10) return { text: count.toString(), type: 'warning' as const }
    return { text: count.toString(), type: 'success' as const }
  }

  return {
    // 状态
    tags,
    currentTag,
    loading,
    paginationInfo,
    tagForm,
    editTagForm,
    batchCreateForm,
    usedTags,
    emptyTags,
    colorGroups,
    colorOptions,
    tagFormRules,
    filters,

    // API 方法
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    fetchAccountTags,
    addAccountTags,
    removeAccountTag,
    batchAddAccountTags,
    fetchTagStatistics,
    fetchAllTagsStatistics,

    // 表单管理
    resetTagForm,
    resetEditTagForm,
    setEditTagForm,
    addBatchCreateItem,
    removeBatchCreateItem,
    resetBatchCreateForm,

    // 过滤和分页
    setFilters,
    resetFilters,
    handlePageChange,
    handlePageSizeChange,
    handleSort,

    // 工具函数
    formatUserCount
  }
}
