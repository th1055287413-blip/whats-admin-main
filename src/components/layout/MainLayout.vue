<template>
  <div class="main-layout">
    <el-container>
      <!-- Sidebar -->
      <el-aside :width="sidebarWidth" class="sidebar">
        <SidebarMenu />
      </el-aside>

      <!-- Main content -->
      <el-container direction="vertical">
        <!-- Header -->
        <el-header height="60px" class="header">
          <HeaderNav />
        </el-header>

        <!-- Content -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import SidebarMenu from './SidebarMenu.vue'
import HeaderNav from './HeaderNav.vue'

const appStore = useAppStore()

const sidebarWidth = computed(() =>
  appStore.sidebarCollapsed ? '64px' : '240px'
)
</script>

<style scoped>
.main-layout {
  height: 100vh;
  background-color: var(--bg-light);
}

.sidebar {
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-base);
  transition: width 0.2s ease;
  overflow-x: hidden;
}

.header {
  background-color: var(--bg-white);
  border-bottom: 1px solid var(--border-base);
  padding: 0;
  box-shadow: var(--shadow-sm);
}

.main-content {
  background-color: var(--bg-light);
  padding: var(--spacing-lg);
  overflow-y: auto;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.mobile-visible {
    transform: translateX(0);
  }

  .main-content {
    padding: var(--spacing-md);
  }
}

@media (max-width: 576px) {
  .main-content {
    padding: var(--spacing-sm);
  }
}
</style>