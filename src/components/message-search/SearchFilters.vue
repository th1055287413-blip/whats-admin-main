<template>
  <el-collapse-transition>
    <div v-show="visible" class="search-filters">
      <el-form
        :model="filters"
        label-width="100px"
        size="small"
        class="filter-form"
      >
        <el-row :gutter="16">
          <!-- 聊天会话 -->
          <el-col :span="8">
            <el-form-item label="聊天会话">
              <el-select
                v-model="filters.chatJid"
                placeholder="全部会话"
                filterable
                clearable
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option
                  v-for="chat in chats"
                  :key="chat.jid"
                  :label="chat.name"
                  :value="chat.jid"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 消息类型 -->
          <el-col :span="8">
            <el-form-item label="消息类型">
              <el-select
                v-model="filters.messageType"
                placeholder="全部类型"
                clearable
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option
                  v-for="type in messageTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 发送方向 -->
          <el-col :span="8">
            <el-form-item label="发送方向">
              <el-select
                v-model="filters.isFromMe"
                placeholder="全部方向"
                clearable
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option
                  v-for="direction in directions"
                  :key="direction.value?.toString() || 'null'"
                  :label="direction.label"
                  :value="direction.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <!-- 时间范围 -->
          <el-col :span="12">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="filters.dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                :shortcuts="dateShortcuts"
                style="width: 100%"
                @change="handleFilterChange"
              />
            </el-form-item>
          </el-col>

          <!-- 排序方式 -->
          <el-col :span="6">
            <el-form-item label="排序方式">
              <el-select
                v-model="filters.sortOrder"
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option label="时间倒序" value="desc" />
                <el-option label="时间正序" value="asc" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 操作按钮 -->
          <el-col :span="6">
            <el-form-item label=" ">
              <el-button
                :icon="RefreshLeft"
                @click="handleReset"
              >
                重置筛选
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </el-collapse-transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { RefreshLeft } from '@element-plus/icons-vue'
import type {
  MessageType,
  SortOrder,
  MessageTypeOption,
  DirectionOption
} from '@/types/message-search'
import type { WhatsAppChat } from '@/types/whatsapp'

// Props
interface Props {
  visible: boolean
  chats?: WhatsAppChat[]
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  chats: () => []
})

// Emits
interface Emits {
  (e: 'change', filters: FilterData): void
}

const emit = defineEmits<Emits>()

// Types
export interface FilterData {
  chatJid: string
  messageType: MessageType
  dateRange: [string, string] | null  // Element Plus returns string with value-format
  isFromMe: boolean | null
  sortOrder: SortOrder
}

// State
const filters = ref<FilterData>({
  chatJid: '',
  messageType: 'all',
  dateRange: null,
  isFromMe: null,
  sortOrder: 'desc'
})

// 消息类型选项
const messageTypes: MessageTypeOption[] = [
  { label: '全部类型', value: 'all' },
  { label: '文本消息', value: 'text' },
  { label: '图片消息', value: 'image' },
  { label: '视频消息', value: 'video' },
  { label: '音频消息', value: 'audio' },
  { label: '文档消息', value: 'document' }
]

// 发送方向选项
const directions: DirectionOption[] = [
  { label: '全部方向', value: null },
  { label: '我发送的', value: true },
  { label: '我接收的', value: false }
]

// 日期快捷选项
const dateShortcuts = [
  {
    text: '最近一小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setHours(start.getHours() - 1)
      return [start, end]
    }
  },
  {
    text: '今天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      return [start, end]
    }
  },
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return [start, end]
    }
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 1)
      return [start, end]
    }
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 3)
      return [start, end]
    }
  }
]

// Methods
const handleFilterChange = () => {
  emit('change', filters.value)
}

const handleReset = () => {
  filters.value = {
    chatJid: '',
    messageType: 'all',
    dateRange: null,
    isFromMe: null,
    sortOrder: 'desc'
  }
  emit('change', filters.value)
}

// Expose
defineExpose({
  filters
})
</script>

<style scoped lang="scss">
.search-filters {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;

  .filter-form {
    margin-bottom: 0;

    :deep(.el-form-item) {
      margin-bottom: 0;
    }
  }
}
</style>
