<template>
  <div class="header-nav">
    <!-- Left side -->
    <div class="header-left">
      <el-button
        :icon="Fold"
        text
        @click="toggleSidebar"
        class="sidebar-toggle"
      />
      <span class="page-title">{{ currentPageTitle }}</span>
    </div>

    <!-- Right side -->
    <div class="header-right">
      <!-- User menu -->
      <el-dropdown trigger="click">
        <div class="user-info">
          <el-avatar
            :src="user?.avatar"
            :size="32"
            class="user-avatar"
          >
            {{ user?.name?.[0] || 'U' }}
          </el-avatar>
          <span class="user-name">{{ user?.name || '用户' }}</span>
          <el-icon class="dropdown-icon">
            <ArrowDown />
          </el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goToProfile">
              <el-icon><User /></el-icon>
              个人资料
            </el-dropdown-item>
            <el-dropdown-item @click="goToSettings">
              <el-icon><Setting /></el-icon>
              系统设置
            </el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Fold,
  ArrowDown,
  User,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const appStore = useAppStore()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const currentPageTitle = computed(() => route.meta.title as string || '首页')

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const goToProfile = () => {
  router.push({ name: 'Profile' })
}

const goToSettings = () => {
  router.push({ name: 'Settings' })
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await authStore.logout()
    router.push({ name: 'Login' })
  } catch (error) {
    // User cancelled
  }
}
</script>

<style scoped>
.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sidebar-toggle {
  font-size: 18px;
  color: #333;
}

.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.user-avatar {
  background-color: #409eff;
}

.user-name {
  font-size: 14px;
  color: #333;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-icon {
  font-size: 12px;
  color: #999;
  transition: transform 0.2s;
}

.el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>