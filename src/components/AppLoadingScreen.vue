<template>
  <div 
    v-if="isVisible" 
    class="app-loading-screen"
    :class="{ 'fade-out': isFadingOut }"
  >
    <div class="loading-content">
      <!-- WhatsApp Logo with Animation -->
      <div class="logo-container">
        <div class="whatsapp-logo">
          <div class="logo-icon">
            <img :src="whatsappLoadingLogo" width="60" height="60" alt="WhatsApp Logo" />
          </div>
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
          </div>
        </div>
      </div>
      
      <!-- WhatsApp Text -->
      <div class="whatsapp-text">
        WhatsApp
      </div>
      
      <!-- Loading Dots Animation -->
      <div class="loading-dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import whatsappLoadingLogo from '@/assets/whatsapp-loading-logo.svg'

interface Props {
  duration?: number // minimum duration to show loading screen in ms
}

const props = withDefaults(defineProps<Props>(), {
  duration: 3000 // 3 seconds default to match WhatsApp Web timing
})

const emit = defineEmits<{
  'loading-complete': []
}>()

const isVisible = ref(true)
const isFadingOut = ref(false)

const hideLoadingScreen = () => {
  setTimeout(() => {
    isFadingOut.value = true
    // Wait for fade animation to complete before removing from DOM
    setTimeout(() => {
      isVisible.value = false
      emit('loading-complete')
    }, 500) // Match CSS transition duration
  }, props.duration)
}

onMounted(() => {
  hideLoadingScreen()
})
</script>

<style scoped>
.app-loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #111b21; /* WhatsApp Web dark background */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.5s ease-out;
  opacity: 1;
}

.app-loading-screen.fade-out {
  opacity: 0;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  text-align: center;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.whatsapp-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.logo-icon svg,
.logo-icon img {
  animation: logoPulse 2s ease-in-out infinite;
}

.loading-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
}

.spinner-ring {
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top: 3px solid #00a884;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.whatsapp-text {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 28px;
  font-weight: 300;
  color: #ffffff;
  letter-spacing: -0.5px;
  margin-top: 8px;
}

.loading-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #8696a0;
  animation: dotBounce 1.4s ease-in-out infinite both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

.dot:nth-child(3) {
  animation-delay: 0s;
}

/* Animations */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes logoPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .whatsapp-text {
    font-size: 24px;
  }
  
  .logo-icon svg,
  .logo-icon img {
    width: 50px;
    height: 50px;
  }
  
  .loading-spinner {
    width: 70px;
    height: 70px;
  }
  
  .loading-content {
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .whatsapp-text {
    font-size: 22px;
  }
  
  .logo-icon svg,
  .logo-icon img {
    width: 45px;
    height: 45px;
  }
  
  .loading-spinner {
    width: 60px;
    height: 60px;
  }
  
  .loading-content {
    gap: 18px;
  }
}

/* Ensure it covers everything */
.app-loading-screen * {
  box-sizing: border-box;
}
</style>
