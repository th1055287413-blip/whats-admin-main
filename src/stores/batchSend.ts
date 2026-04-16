import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BatchSendTask, BatchSendRecipient } from '@/api/batch-send'

export const useBatchSendStore = defineStore('batchSend', () => {
  // 当前步骤 (1-4)
  const currentStep = ref(1)

  // 选中的账号ID
  const selectedAccountId = ref<number | null>(null)

  // 选中的接收人JID列表
  const selectedRecipients = ref<string[]>([])

  // 消息内容
  const messageContent = ref('')

  // 发送间隔(秒)
  const sendInterval = ref(2)

  // 当前任务ID
  const currentTaskId = ref<number | null>(null)

  // 任务状态
  const taskStatus = ref<string>('pending')

  // 进度信息
  const progressInfo = ref({
    total: 0,
    success: 0,
    failed: 0
  })

  // 计算进度百分比
  const progressPercentage = computed(() => {
    if (progressInfo.value.total === 0) return 0
    return Math.round(
      (progressInfo.value.success + progressInfo.value.failed) / progressInfo.value.total * 100
    )
  })

  // 重置所有状态
  function reset() {
    currentStep.value = 1
    selectedAccountId.value = null
    selectedRecipients.value = []
    messageContent.value = ''
    sendInterval.value = 2
    currentTaskId.value = null
    taskStatus.value = 'pending'
    progressInfo.value = { total: 0, success: 0, failed: 0 }
  }

  // 更新进度
  function updateProgress(total: number, success: number, failed: number) {
    progressInfo.value = { total, success, failed }
  }

  return {
    currentStep,
    selectedAccountId,
    selectedRecipients,
    messageContent,
    sendInterval,
    currentTaskId,
    taskStatus,
    progressInfo,
    progressPercentage,
    reset,
    updateProgress
  }
})
