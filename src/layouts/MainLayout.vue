<template>
  <el-container class="main-layout">
    <!-- 顶部导航栏 -->
    <el-header class="main-header">
      <div class="header-left">
        <div class="logo">
          <el-icon size="28" color="#409EFF">
            <ChatDotRound />
          </el-icon>
          <span class="logo-text">WhatsApp 管理系统</span>
        </div>
      </div>

      <div class="header-right">
        <!-- 用户信息 -->
        <el-dropdown @command="handleCommand">
          <div class="user-info">
            <el-avatar :size="32" :src="userStore.user?.avatar" :icon="UserFilled" />
            <span class="username">{{ userStore.user?.username }}</span>
            <el-icon class="dropdown-icon">
              <ArrowDown />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings" :icon="Setting"> 系统设置 </el-dropdown-item>
              <el-dropdown-item divided command="logout" :icon="SwitchButton">
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <!-- 侧边导航菜单 -->
      <el-aside class="main-aside" :width="isCollapsed ? '64px' : '240px'">
        <div class="aside-header">
          <el-button :icon="Fold" text @click="toggleCollapse" class="collapse-btn" />
        </div>

        <el-menu
          :default-active="currentRoute"
          :collapse="isCollapsed"
          :unique-opened="true"
          class="main-menu"
          @select="handleMenuSelect"
        >
          <!-- 仪表盘 -->
          <el-menu-item v-if="hasPermission(['dashboard.view'])" index="Dashboard">
            <el-icon><Odometer /></el-icon>
            <template #title>仪表盘</template>
          </el-menu-item>

          <!-- 用户管理 -->
          <el-menu-item v-if="hasPermission(['account.read', 'account.view_all'])" index="Users">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>

          <!-- 裂变数据 -->
          <el-menu-item v-if="hasPermission(['account.read'])" index="ReferralDashboard">
            <el-icon><TrendCharts /></el-icon>
            <template #title>裂變數據</template>
          </el-menu-item>

          <el-menu-item v-if="hasPermission(['dashboard.view'])" index="Analytics">
            <el-icon><DataAnalysis /></el-icon>
            <template #title>掉线分析</template>
          </el-menu-item>

          <!-- 标签管理 -->
          <el-menu-item v-if="hasPermission(['tag.view'])" index="TagManagement">
            <el-icon><Collection /></el-icon>
            <template #title>标签管理</template>
          </el-menu-item>

          <!-- 渠道管理 -->
          <el-menu-item v-if="hasPermission(['channel.view'])" index="ChannelManagement">
            <el-icon><Shop /></el-icon>
            <template #title>渠道管理</template>
          </el-menu-item>

          <!-- 推广域名 -->
          <el-menu-item v-if="hasPermission(['promotion_domain.view'])" index="PromotionDomainManagement">
            <el-icon><Link /></el-icon>
            <template #title>推广域名</template>
          </el-menu-item>

          <!-- 自动回复关键词 -->
          <el-menu-item v-if="hasPermission(['keyword.view'])" index="KeywordManagement">
            <el-icon><ChatLineRound /></el-icon>
            <template #title>自动回复关键词</template>
          </el-menu-item>

          <!-- 客户对话记录 -->
          <el-menu-item v-if="hasPermission(['customer_conversation.view'])" index="CustomerConversationManagement">
            <el-icon><Document /></el-icon>
            <template #title>客户对话记录</template>
          </el-menu-item>

          <!-- 在线客服 -->
          <el-menu-item v-if="hasPermission(['customer_conversation.view'])" index="CustomerService">
            <el-icon><ChatDotRound /></el-icon>
            <template #title>在线客服</template>
          </el-menu-item>

          <!-- 合同生成 -->
          <el-menu-item index="ContractGenerator">
            <el-icon><Document /></el-icon>
            <template #title>合同管理</template>
          </el-menu-item>

          <!-- 工作組管理 -->
          <el-menu-item v-if="hasPermission(['workgroup.read'])" index="WorkgroupList">
            <el-icon><OfficeBuilding /></el-icon>
            <template #title>工作組管理</template>
          </el-menu-item>

          <!-- 对话分析管理 -->
          <el-sub-menu v-if="hasPermission(['content_moderation.word_view', 'content_moderation.alert_view', 'ai_tag.view'])" index="chat-analysis">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>对话分析管理</span>
            </template>
            <el-menu-item v-if="hasPermission(['content_moderation.word_view'])" index="SensitiveWords">
              <el-icon><Warning /></el-icon>
              <template #title>敏感词</template>
            </el-menu-item>
            <el-menu-item v-if="hasPermission(['content_moderation.config_view'])" index="SensitiveWordConfig">
              <el-icon><Setting /></el-icon>
              <template #title>敏感词设定</template>
            </el-menu-item>
            <el-menu-item v-if="hasPermission(['content_moderation.alert_view'])" index="SensitiveWordAlerts">
              <el-icon><Bell /></el-icon>
              <template #title>告警日志</template>
            </el-menu-item>
            <el-menu-item v-if="hasPermission(['ai_tag.view'])" index="AiTagManagement">
              <el-icon><MagicStick /></el-icon>
              <template #title>AI 標籤定義</template>
            </el-menu-item>
          </el-sub-menu>

          <!-- 系统管理 -->
          <el-sub-menu v-if="hasPermission(['system.config_view', 'admin_user.view', 'role.view', 'system.log_view', 'connector.view', 'connector.manage'])" index="system-admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item v-if="hasPermission(['system.config_view'])" index="SystemConfig">
              <el-icon><Setting /></el-icon>
              <template #title>系统组态</template>
            </el-menu-item>
            <el-menu-item v-if="hasPermission(['admin_user.view'])" index="AdminUserManagement">
              <el-icon><Avatar /></el-icon>
              <template #title>后管用户</template>
            </el-menu-item>
            <el-menu-item v-if="hasPermission(['role.view'])" index="RoleManagement">
              <el-icon><Key /></el-icon>
              <template #title>角色管理</template>
            </el-menu-item>
            <el-menu-item v-if="hasPermission(['system.log_view'])" index="OperationLogs">
              <el-icon><Document /></el-icon>
              <template #title>操作日志</template>
            </el-menu-item>
            <el-menu-item v-if="hasPermission(['connector.view', 'connector.manage'])" index="ConnectorConfigManagement">
              <el-icon><Connection /></el-icon>
              <template #title>Connector 管理</template>
            </el-menu-item>
            <el-menu-item v-if="hasPermission(['connector.manage'])" index="ProxyManagement">
              <el-icon><Link /></el-icon>
              <template #title>代理配置</template>
            </el-menu-item>
            <el-menu-item index="Languages">
              <el-icon><Odometer /></el-icon>
              <template #title>语言设置</template>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
        <div v-show="!isCollapsed" class="aside-version">v{{ appVersion }}</div>
      </el-aside>

      <!-- 主内容区域 -->
      <el-main :class="['main-content', { 'no-scroll': isMessagePage }]">
        <router-view v-slot="{ Component }">
          <keep-alive :include="['UserList']">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ChatDotRound,
  ChatLineRound,
  UserFilled,
  ArrowDown,
  User,
  Setting,
  SwitchButton,
  Fold,
  Odometer,
  Monitor,
  Message,
  Phone,
  Bell,
  Warning,
  TrendCharts,
  Avatar,
  Collection,
  Lock,
  Key,
  Search,
  Shop,
  Link,
  Document,
  Connection,
  MagicStick,
  DataAnalysis,
  OfficeBuilding
} from '@element-plus/icons-vue'

const appVersion = __APP_VERSION__

const router = useRouter()
const route = useRoute()
const userStore = useAuthStore()

// 菜单折叠状态
const isCollapsed = ref(false)

// 当前路由名称
const currentRoute = computed(() => (route.name as string) || 'Dashboard')

// 權限檢查
const hasPermission = (permissions: string[]) => {
  const userPermissions = userStore.permissions || []
  const isAdmin = userStore.isAdmin
  if (isAdmin) return true
  return permissions.some(p => userPermissions.includes(p))
}

// 判断是否是消息页面
const isMessagePage = computed(() => route.name === 'UserMessages')

// 切换菜单折叠状态
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

// 处理菜单选择
function handleMenuSelect(index: string) {
  router.push({ name: index })
}

// 处理用户下拉菜单命令
async function handleCommand(command: string) {
  switch (command) {
    case 'settings':
      router.push({ name: 'Settings' })
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await userStore.logout()
        router.push({ name: 'Login' })
      } catch {
        // 用户取消操作
      }
      break
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  overflow: hidden;
}

/* 顶部导航栏 */
.main-header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.dropdown-icon {
  font-size: 12px;
  color: #909399;
}

/* 侧边栏 */
.main-aside {
  background: #fff;
  border-right: 1px solid #e6e6e6;
  transition: width 0.3s;
  overflow: hidden;
}

.aside-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #e6e6e6;
}

.collapse-btn {
  font-size: 18px;
  color: #606266;
}

.main-menu {
  border: none;
  height: calc(100vh - 60px - 60px - 32px);
  overflow-y: auto;
}

.aside-version {
  height: 32px;
  line-height: 32px;
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
}

.main-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
}

.main-menu :deep(.el-sub-menu .el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
}

.main-menu :deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409eff;
}

/* 主内容区域 */
.main-content {
  background: #f5f5f5;
  padding: 0;
  overflow: auto;
  height: calc(100vh - 60px);
}

/* 消息页面不滚动 */
.main-content.no-scroll {
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-aside {
    width: 64px !important;
  }

  .logo-text {
    display: none;
  }

  .username {
    display: none;
  }
}
</style>
