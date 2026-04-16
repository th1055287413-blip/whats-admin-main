<template>
  <div class="wa-instruction-item">
    <span class="wa-instruction-number">{{ number }}</span>
    <component :is="isHtml ? 'div' : 'span'" class="wa-instruction-text" :style="textStyle">
      <slot />
    </component>
  </div>
</template>

<script setup lang="ts">
interface Props {
  number: number
  isHtml?: boolean
  textStyle?: Record<string, string>
}

withDefaults(defineProps<Props>(), {
  isHtml: false,
  textStyle: () => ({})
})
</script>

<style scoped lang="scss">
.wa-instruction-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: center;
  text-align: left;
  position: relative;
  padding-bottom: 24px;

  /* Add connecting line between circles */
  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 11.5px;
    top: 24px;
    width: 1px;
    height: calc(100% - 24px);
    background: #000;
    z-index: 0;
  }

  &:last-child {
    padding-bottom: 0;
  }
}

.wa-instruction-number {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #000;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 600;
  color: #000;
  line-height: 1;
  position: relative;
  z-index: 1;
}

.wa-instruction-text {
  flex-wrap: wrap;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 1.25rem;
  color: #000;
  line-height: 1.6;
  padding-top: 1px;

  :deep(strong) {
    color: #111b21;
    font-weight: 500;
  }
}

@media (max-width: 500px) {
  .wa-instruction-text {
    font-size: 14px;
  }

  .wa-instruction-number {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }

  .wa-instruction-item {
    padding-bottom: 20px;
  }

  .wa-instruction-item:not(:last-child)::before {
    left: 10.5px;
    top: 22px;
    height: 100%;
  }
}

@media (max-width: 480px) {
  .wa-instruction-text {
    font-size: 13px;
  }

  .wa-instruction-number {
    width: 20px;
    height: 20px;
    font-size: 11px;
  }

  .wa-instruction-item {
    gap: 10px;
    padding-bottom: 18px;
  }

  .wa-instruction-item:not(:last-child)::before {
    left: 9.5px;
    top: 20px;
    height: 100%;
  }
}
</style>


