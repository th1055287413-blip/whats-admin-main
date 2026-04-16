<template>
  <div class="json-viewer">
    <div class="json-actions">
      <el-button-group size="small">
        <el-button
          :type="formatted ? 'primary' : 'default'"
          @click="toggleFormat"
        >
          格式化
        </el-button>
        <el-button
          :icon="CopyDocument"
          @click="copyData"
        >
          复制
        </el-button>
        <el-button
          :icon="Download"
          @click="downloadData"
        >
          下载
        </el-button>
      </el-button-group>
    </div>

    <div class="json-content">
      <el-scrollbar height="400px">
        <pre v-if="formatted" class="json-formatted"><code>{{ formattedData }}</code></pre>
        <div v-else class="json-raw">{{ rawData }}</div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, Download } from '@element-plus/icons-vue'

interface Props {
  data: any
  formatted?: boolean
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  formatted: true,
  maxHeight: '400px'
})

const internalFormatted = ref(props.formatted)

const formattedData = computed(() => {
  if (!props.data) return ''
  try {
    return JSON.stringify(props.data, null, 2)
  } catch (error) {
    return String(props.data)
  }
})

const rawData = computed(() => {
  if (!props.data) return ''
  try {
    return JSON.stringify(props.data)
  } catch (error) {
    return String(props.data)
  }
})

const formatted = computed({
  get: () => internalFormatted.value,
  set: (value) => {
    internalFormatted.value = value
  }
})

function toggleFormat() {
  formatted.value = !formatted.value
}

async function copyData() {
  try {
    const textToCopy = formatted.value ? formattedData.value : rawData.value
    await navigator.clipboard.writeText(textToCopy)
    ElMessage.success('数据已复制到剪贴板')
  } catch (error) {
    console.error('Failed to copy data:', error)
    ElMessage.error('复制失败')
  }
}

function downloadData() {
  try {
    const textToDownload = formatted.value ? formattedData.value : rawData.value
    const blob = new Blob([textToDownload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `data_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    ElMessage.success('数据已下载')
  } catch (error) {
    console.error('Failed to download data:', error)
    ElMessage.error('下载失败')
  }
}

// 监听prop变化
watch(() => props.formatted, (newVal) => {
  internalFormatted.value = newVal
})
</script>

<style lang="scss" scoped>
.json-viewer {
  .json-actions {
    margin-bottom: 12px;
    display: flex;
    justify-content: flex-end;
  }

  .json-content {
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    background-color: var(--el-bg-color-page);

    .json-formatted {
      margin: 0;
      padding: 16px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.5;
      color: var(--el-text-color-primary);
      background-color: transparent;
      overflow-x: auto;

      code {
        background-color: transparent;
        color: inherit;
        padding: 0;
      }
    }

    .json-raw {
      padding: 16px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 12px;
      line-height: 1.4;
      color: var(--el-text-color-primary);
      white-space: pre-wrap;
      word-break: break-all;
    }
  }
}

// JSON语法高亮样式
.json-formatted {
  /* 字符串 */
  :deep(.string) {
    color: #22863a;
  }

  /* 数字 */
  :deep(.number) {
    color: #005cc5;
  }

  /* 布尔值 */
  :deep(.boolean) {
    color: #d73a49;
  }

  /* null */
  :deep(.null) {
    color: #6f42c1;
  }

  /* 属性名 */
  :deep(.key) {
    color: #005cc5;
    font-weight: 600;
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .json-formatted {
    :deep(.string) {
      color: #85e89d;
    }

    :deep(.number) {
      color: #79b8ff;
    }

    :deep(.boolean) {
      color: #f97583;
    }

    :deep(.null) {
      color: #b392f0;
    }

    :deep(.key) {
      color: #79b8ff;
    }
  }
}
</style>