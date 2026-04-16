<template>
  <div class="device-info">
    <el-tooltip effect="dark" placement="top">
      <template #content>
        <div class="device-tooltip">
          <div v-if="device.device_type" class="device-item">
            <strong>设备类型:</strong> {{ getDeviceTypeText(device.device_type) }}
          </div>
          <div v-if="device.device_model" class="device-item">
            <strong>设备型号:</strong> {{ device.device_model }}
          </div>
          <div v-if="device.operating_system" class="device-item">
            <strong>操作系统:</strong> {{ device.operating_system }}
          </div>
          <div v-if="device.browser" class="device-item">
            <strong>浏览器:</strong> {{ device.browser }}
            <span v-if="device.browser_version">{{ device.browser_version }}</span>
          </div>
          <div v-if="device.screen_resolution" class="device-item">
            <strong>屏幕分辨率:</strong> {{ device.screen_resolution }}
          </div>
        </div>
      </template>
      <div class="device-display">
        <el-icon class="device-icon"><component :is="deviceIcon" /></el-icon>
        <span class="device-text">{{ displayText }}</span>
        <el-tag v-if="isUnusualDevice" type="info" size="small" class="unusual-tag">
          新设备
        </el-tag>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Monitor,
  Iphone,
  Laptop,
  Platform
} from '@element-plus/icons-vue'
import type { DeviceInfo as DeviceInfoType } from '@/types/audit'

interface Props {
  device: DeviceInfoType
  isUnusual?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isUnusual: false
})

const deviceIcon = computed(() => {
  const deviceType = props.device.device_type?.toLowerCase()

  switch (deviceType) {
    case 'mobile':
    case 'phone':
    case 'iphone':
    case 'android':
      return Iphone
    case 'tablet':
    case 'ipad':
      return Platform
    case 'laptop':
    case 'notebook':
      return Laptop
    case 'desktop':
    case 'pc':
    default:
      return Monitor
  }
})

const displayText = computed(() => {
  const parts = []

  // 操作系统
  if (props.device.operating_system) {
    const os = props.device.operating_system
    if (os.includes('Windows')) {
      parts.push('Windows')
    } else if (os.includes('Mac') || os.includes('macOS')) {
      parts.push('macOS')
    } else if (os.includes('Linux')) {
      parts.push('Linux')
    } else if (os.includes('Android')) {
      parts.push('Android')
    } else if (os.includes('iOS')) {
      parts.push('iOS')
    } else {
      parts.push(os)
    }
  }

  // 浏览器
  if (props.device.browser) {
    const browser = props.device.browser
    if (browser.includes('Chrome')) {
      parts.push('Chrome')
    } else if (browser.includes('Safari')) {
      parts.push('Safari')
    } else if (browser.includes('Firefox')) {
      parts.push('Firefox')
    } else if (browser.includes('Edge')) {
      parts.push('Edge')
    } else {
      parts.push(browser)
    }
  }

  // 设备型号（如果是移动设备）
  if (props.device.device_model && isMobileDevice.value) {
    parts.push(props.device.device_model)
  }

  if (parts.length === 0) {
    return '未知设备'
  }

  return parts.join(' • ')
})

const isMobileDevice = computed(() => {
  const deviceType = props.device.device_type?.toLowerCase()
  return ['mobile', 'phone', 'iphone', 'android', 'tablet', 'ipad'].includes(deviceType || '')
})

const isUnusualDevice = computed(() => {
  // 这里可以根据实际业务逻辑判断是否为异常设备
  // 比如检查设备指纹、是否为新设备等
  return props.isUnusual
})

function getDeviceTypeText(deviceType: string): string {
  const typeMap: Record<string, string> = {
    desktop: '桌面设备',
    laptop: '笔记本',
    mobile: '手机',
    tablet: '平板',
    tv: '智能电视',
    watch: '智能手表',
    other: '其他设备'
  }
  return typeMap[deviceType.toLowerCase()] || deviceType
}
</script>

<style lang="scss" scoped>
.device-info {
  .device-display {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;

    .device-icon {
      font-size: 12px;
      color: var(--el-color-primary);
    }

    .device-text {
      font-size: 12px;
      color: var(--el-text-color-regular);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .unusual-tag {
      margin-left: 4px;
    }

    &:hover {
      .device-text {
        color: var(--el-color-primary);
      }
    }
  }
}

.device-tooltip {
  max-width: 300px;

  .device-item {
    margin-bottom: 4px;
    font-size: 12px;
    line-height: 1.4;
    word-break: break-word;

    &:last-child {
      margin-bottom: 0;
    }

    strong {
      color: var(--el-color-primary);
      margin-right: 4px;
    }
  }
}
</style>