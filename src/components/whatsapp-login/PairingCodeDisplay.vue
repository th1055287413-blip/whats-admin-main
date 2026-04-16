<template>
  <div class="wa-code-wrapper">
    <div class="wa-code-boxes-container">
      <div class="wa-code-box" v-for="(char, index) in codeArray" :key="index" v-memo="[char]">
        {{ char }}
      </div>
    </div>
    <button class="wa-code-copy-btn" @click="copyCode">
      <img
        src="@/assets/copy-icon.svg"
        alt="Copy"
        width="16"
        height="16"
        style="margin-right: 8px"
      />
      {{ isCopied ? 'Copied!' : 'Copy Code' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  code: string
}

const props = defineProps<Props>()

const isCopied = ref(false)
let copyTimeout: number | undefined

const codeArray = computed(() => {
  if (!props.code) return []
  return props.code.split('')
})

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code)
    isCopied.value = true
    
    // Reset after 2 seconds
    if (copyTimeout) {
      clearTimeout(copyTimeout)
    }
    copyTimeout = window.setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    // Silent fail for copy operation
  }
}
</script>

<style scoped lang="scss">
.wa-code-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wa-code-boxes-container {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 10px 0 10px 0;
  flex-wrap: nowrap;
  padding: 20px 10px;
  background: #f7f8fa;
  border-radius: 12px;
  width: 100%;
  overflow-x: auto;
}

.wa-code-copy-btn {
  width: fit-content;
  margin-top: 20px;
  padding: 12px 24px;
  background: #1daa61;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  outline: none;
  display: flex;
  align-items: center;

  img {
    filter: brightness(0) invert(1);
  }

  &:hover {
    background: #06cf9c;
  }

  &:active {
    background: #008f6f;
  }

  &:disabled {
    background: #d1d7db;
    color: #8696a0;
    cursor: not-allowed;
  }
}

.wa-code-box {
  width: 44px;
  height: 50px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  color: #111b21;
  background: #fff;
  border: 1px solid rgb(99, 97, 97);
  border-radius: 8px;
  font-family: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 0;

  /* Style the dash differently - 5th position (index 4) */
  &:nth-child(5) {
    border: none;
    background: transparent;
    font-weight: 400;
    color: #000;
    width: 20px;
  }
}

@media (max-width: 768px) {
  .wa-code-boxes-container {
    padding: 16px 8px;
    gap: 6px;
  }

  .wa-code-box {
    width: 36px;
    height: 48px;
    font-size: 22px;
  }

  .wa-code-box:nth-child(5) {
    width: 16px;
  }
}

@media (max-width: 480px) {
  .wa-code-boxes-container {
    padding: 12px 6px;
    gap: 4px;
  }

  .wa-code-box {
    width: 32px;
    height: 42px;
    font-size: 20px;
    border-radius: 6px;
  }

  .wa-code-box:nth-child(5) {
    width: 12px;
  }
}
</style>


