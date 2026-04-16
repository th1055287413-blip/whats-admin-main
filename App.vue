<template>
  <div id="app">
    <!-- Loading Screen -->
    <AppLoadingScreen 
      :duration="3000"
      @loading-complete="handleLoadingComplete"
    />
    
    <!-- Main App Content -->
    <div v-show="appLoaded" class="app-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLoadingScreen from '@/components/AppLoadingScreen.vue'

const authStore = useAuthStore()
const appLoaded = ref(false)

const handleLoadingComplete = () => {
  appLoaded.value = true
}

onMounted(async () => {
  // 应用启动时检查登录状态，但不等待它完成
  // 这样loading screen可以独立控制显示时间
  authStore.checkAuthStatus()
})
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
  position: relative;
}

.app-content {
  opacity: 0;
  animation: fadeIn 0.5s ease-in-out 0.5s forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>