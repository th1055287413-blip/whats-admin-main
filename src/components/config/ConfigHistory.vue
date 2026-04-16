<template>
  <div class="config-history">
    <el-empty description="暂无历史记录" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  configType: string
  configId: number | null
}>()

defineEmits<{
  rollback: [historyId: number]
}>()
</script>
