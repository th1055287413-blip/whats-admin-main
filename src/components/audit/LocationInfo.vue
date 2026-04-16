<template>
  <div class="location-info">
    <el-tooltip effect="dark" placement="top">
      <template #content>
        <div class="location-tooltip">
          <div v-if="location.country" class="location-item">
            <strong>国家:</strong> {{ location.country }}
          </div>
          <div v-if="location.region" class="location-item">
            <strong>地区:</strong> {{ location.region }}
          </div>
          <div v-if="location.city" class="location-item">
            <strong>城市:</strong> {{ location.city }}
          </div>
          <div v-if="location.timezone" class="location-item">
            <strong>时区:</strong> {{ location.timezone }}
          </div>
          <div v-if="hasCoordinates" class="location-item">
            <strong>坐标:</strong> {{ location.latitude }}, {{ location.longitude }}
          </div>
        </div>
      </template>
      <div class="location-display">
        <el-icon class="location-icon"><Location /></el-icon>
        <span class="location-text">{{ displayText }}</span>
        <el-tag v-if="isUnusualLocation" type="warning" size="small" class="unusual-tag">
          异地
        </el-tag>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Location } from '@element-plus/icons-vue'
import type { LocationInfo as LocationInfoType } from '@/types/audit'

interface Props {
  location: LocationInfoType
  isUnusual?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isUnusual: false
})

const displayText = computed(() => {
  const parts = []

  if (props.location.city) {
    parts.push(props.location.city)
  }

  if (props.location.region && props.location.region !== props.location.city) {
    parts.push(props.location.region)
  }

  if (props.location.country && props.location.country !== props.location.region) {
    parts.push(props.location.country)
  }

  if (parts.length === 0) {
    return '未知位置'
  }

  return parts.join(', ')
})

const hasCoordinates = computed(() => {
  return props.location.latitude !== undefined && props.location.longitude !== undefined
})

const isUnusualLocation = computed(() => {
  return props.isUnusual ||
         props.location.country !== '中国' ||
         (props.location.city && !['北京', '上海', '广州', '深圳'].includes(props.location.city))
})
</script>

<style lang="scss" scoped>
.location-info {
  .location-display {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;

    .location-icon {
      font-size: 12px;
      color: var(--el-color-primary);
    }

    .location-text {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }

    .unusual-tag {
      margin-left: 4px;
    }

    &:hover {
      .location-text {
        color: var(--el-color-primary);
      }
    }
  }
}

.location-tooltip {
  .location-item {
    margin-bottom: 4px;
    font-size: 12px;
    line-height: 1.4;

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