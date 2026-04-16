import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type {
  MessageMonitor,
  MessageMonitorFilter,
  MessageMonitorStats,
  PaginatedResponse,
  MessageType,
  SensitiveLevel,
  MessageStatus
} from '@/types/monitor'

/**
 * 消息监控数据管理Hook
 */
export function useMessageMonitor() {
  // 数据状态
  const messages = ref<MessageMonitor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stats = ref<MessageMonitorStats | null>(null)

  // 过滤器状态
  const filter = reactive<MessageMonitorFilter>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // 分页信息
  const pagination = ref({
    total: 0,
    totalPages: 0,
    page: 1,
    pageSize: 20
  })

  // 计算属性
  const hasMessages = computed(() => messages.value.length > 0)
  const sensitiveMessages = computed(() =>
    messages.value.filter(msg => msg.sensitiveLevel !== SensitiveLevel.NORMAL)
  )
  const unreadMessages = computed(() =>
    messages.value.filter(msg => !msg.isRead)
  )
  const blockedMessages = computed(() =>
    messages.value.filter(msg => msg.status === MessageStatus.BLOCKED)
  )

  /**
   * 获取消息列表
   */
  async function fetchMessages(newFilter?: Partial<MessageMonitorFilter>): Promise<void> {
    try {
      loading.value = true
      error.value = null

      // 合并过滤器
      if (newFilter) {
        Object.assign(filter, newFilter)
      }

      // 这里暂时使用模拟数据，后续集成真实API
      const response = await mockFetchMessages(filter)

      messages.value = response.data
      pagination.value = response.pagination

    } catch (err: any) {
      error.value = err.message || '获取消息列表失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取统计数据
   */
  async function fetchStats(): Promise<void> {
    try {
      // 使用模拟数据
      stats.value = await mockFetchStats()
    } catch (err: any) {
      console.error('Failed to fetch message stats:', err)
    }
  }

  /**
   * 标记消息为已读
   */
  async function markAsRead(messageId: number): Promise<boolean> {
    try {
      // 模拟API调用
      await mockMarkAsRead(messageId)

      // 更新本地状态
      const message = messages.value.find(m => m.id === messageId)
      if (message) {
        message.isRead = true
      }

      return true
    } catch (err: any) {
      ElMessage.error('标记消息已读失败')
      return false
    }
  }

  /**
   * 批量标记已读
   */
  async function markMultipleAsRead(messageIds: number[]): Promise<boolean> {
    try {
      // 模拟API调用
      await mockMarkMultipleAsRead(messageIds)

      // 更新本地状态
      messages.value.forEach(message => {
        if (messageIds.includes(message.id)) {
          message.isRead = true
        }
      })

      ElMessage.success(`已标记 ${messageIds.length} 条消息为已读`)
      return true
    } catch (err: any) {
      ElMessage.error('批量标记失败')
      return false
    }
  }

  /**
   * 更新消息状态
   */
  async function updateMessageStatus(
    messageId: number,
    status: MessageStatus,
    comments?: string
  ): Promise<boolean> {
    try {
      // 模拟API调用
      await mockUpdateMessageStatus(messageId, status, comments)

      // 更新本地状态
      const message = messages.value.find(m => m.id === messageId)
      if (message) {
        message.status = status
        if (comments) {
          message.reviewComments = comments
        }
        message.reviewedAt = new Date().toISOString()
      }

      ElMessage.success('消息状态更新成功')
      return true
    } catch (err: any) {
      ElMessage.error('消息状态更新失败')
      return false
    }
  }

  /**
   * 搜索消息
   */
  async function searchMessages(keyword: string): Promise<void> {
    const searchFilter: Partial<MessageMonitorFilter> = {
      page: 1,
      // 这里可以扩展搜索字段
    }

    await fetchMessages(searchFilter)
  }

  /**
   * 重置过滤器
   */
  function resetFilter(): void {
    Object.assign(filter, {
      fromUserId: undefined,
      toUserId: undefined,
      groupId: undefined,
      messageType: undefined,
      sensitiveLevel: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      hasKeywords: undefined,
      isRead: undefined,
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  /**
   * 应用过滤器
   */
  async function applyFilter(newFilter: Partial<MessageMonitorFilter>): Promise<void> {
    newFilter.page = 1 // 重置到第一页
    await fetchMessages(newFilter)
  }

  /**
   * 分页
   */
  async function goToPage(page: number): Promise<void> {
    if (page > 0 && page <= pagination.value.totalPages) {
      await fetchMessages({ page })
    }
  }

  /**
   * 导出数据
   */
  async function exportMessages(format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    try {
      loading.value = true

      // 模拟导出
      await mockExportMessages(filter, format)

      ElMessage.success('导出成功')
    } catch (err: any) {
      ElMessage.error('导出失败')
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新数据
   */
  async function refresh(): Promise<void> {
    await Promise.all([
      fetchMessages(),
      fetchStats()
    ])
  }

  // 模拟API函数 - 后续替换为真实API调用
  async function mockFetchMessages(filter: MessageMonitorFilter): Promise<PaginatedResponse<MessageMonitor>> {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    const mockMessages: MessageMonitor[] = Array.from({ length: filter.pageSize || 20 }, (_, index) => ({
      id: (filter.page || 1) * 100 + index,
      messageId: `msg_${Date.now()}_${index}`,
      fromUserId: Math.floor(Math.random() * 1000) + 1,
      toUserId: Math.floor(Math.random() * 1000) + 1,
      content: `这是第 ${index + 1} 条测试消息内容`,
      messageType: Object.values(MessageType)[Math.floor(Math.random() * Object.values(MessageType).length)],
      sentAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      sensitiveLevel: Object.values(SensitiveLevel)[Math.floor(Math.random() * Object.values(SensitiveLevel).length)],
      status: Object.values(MessageStatus)[Math.floor(Math.random() * Object.values(MessageStatus).length)],
      isRead: Math.random() > 0.3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    return {
      data: mockMessages,
      pagination: {
        page: filter.page || 1,
        pageSize: filter.pageSize || 20,
        total: 1000,
        totalPages: 50
      }
    }
  }

  async function mockFetchStats(): Promise<MessageMonitorStats> {
    await new Promise(resolve => setTimeout(resolve, 200))

    return {
      totalMessages: 1000,
      sensitiveMessages: 150,
      blockedMessages: 25,
      reviewedMessages: 800,
      messagesByType: {
        [MessageType.TEXT]: 700,
        [MessageType.IMAGE]: 200,
        [MessageType.FILE]: 50,
        [MessageType.VOICE]: 30,
        [MessageType.VIDEO]: 20
      },
      messagesBySensitiveLevel: {
        [SensitiveLevel.NORMAL]: 850,
        [SensitiveLevel.WARNING]: 100,
        [SensitiveLevel.CRITICAL]: 50
      },
      timeSeriesData: Array.from({ length: 7 }, (_, index) => ({
        date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 100) + 50,
        sensitiveCount: Math.floor(Math.random() * 20) + 5
      }))
    }
  }

  async function mockMarkAsRead(messageId: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  async function mockMarkMultipleAsRead(messageIds: number[]): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  async function mockUpdateMessageStatus(
    messageId: number,
    status: MessageStatus,
    comments?: string
  ): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  async function mockExportMessages(filter: MessageMonitorFilter, format: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return {
    // 数据状态
    messages: readonly(messages),
    loading: readonly(loading),
    error: readonly(error),
    stats: readonly(stats),
    filter,
    pagination: readonly(pagination),

    // 计算属性
    hasMessages,
    sensitiveMessages,
    unreadMessages,
    blockedMessages,

    // 方法
    fetchMessages,
    fetchStats,
    markAsRead,
    markMultipleAsRead,
    updateMessageStatus,
    searchMessages,
    resetFilter,
    applyFilter,
    goToPage,
    exportMessages,
    refresh
  }
}