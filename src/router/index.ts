import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setupGuards } from './guards'
import { withAdminPrefix } from '@/utils/route'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: withAdminPrefix('/login')
  },
  {
    path: withAdminPrefix('/login'),
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false,
      layout: 'auth'
    }
  },
  {
    path: withAdminPrefix('/'),
    component: () => import('@/layouts/MainLayout.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: {
          title: '仪表盘',
          requiresAuth: true,
          permissions: ['dashboard.view']
        }
      },
      {
        path: 'dashboard',
        redirect: { name: 'Dashboard' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UserList.vue'),
        meta: {
          title: '用户管理',
          requiresAuth: true,
          permissions: ['account.read']
        }
      },
      {
        path: 'referral',
        name: 'ReferralDashboard',
        component: () => import('@/views/referral/ReferralDashboard.vue'),
        meta: {
          title: '裂變數據',
          requiresAuth: true,
          permissions: ['account.read']
        }
      },
      {
        path: 'accounts/:id/contacts',
        name: 'AccountContacts',
        component: () => import('@/views/contact/ContactList.vue'),
        meta: {
          title: '联络人列表',
          requiresAuth: true,
          permissions: ['message.view']
        }
      },
      {
        path: 'messages/user/:userId',
        name: 'UserMessages',
        component: () => import('@/views/messages/UserMessages.vue'),
        meta: {
          title: '用户消息',
          requiresAuth: true,
          permissions: ['message.view']
        }
      },
      {
        path: 'messages/search',
        name: 'MessageSearch',
        component: () => import('@/views/messages/MessageSearch.vue'),
        meta: {
          title: '消息搜索',
          requiresAuth: true,
          permissions: ['message.view']
        }
      },
      {
        path: 'batch-send',
        name: 'BatchSend',
        component: () => import('@/views/batch-send/BatchSend.vue'),
        meta: {
          title: '批量发送',
          requiresAuth: true,
          permissions: ['batch_send.view']
        }
      },
      {
        path: 'contract-generator',
        name: 'ContractGenerator',
        component: () => import('@/views/contract/ContractGenerator.vue'),
        meta: {
          title: '合同管理',
          requiresAuth: true
        }
      },
      {
        path: 'languages',
        name: 'Languages',
        component: () => import('@/views/languages/LanguageSettings.vue'),
        meta: {
          title: '语言设置',
          requiresAuth: true
        }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/Settings.vue'),
        meta: {
          title: '系统设置',
          requiresAuth: true,
          permissions: ['system.config_update']
        }
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/analytics/Analytics.vue'),
        meta: {
          title: '数据分析',
          requiresAuth: true,
          permissions: ['dashboard.view']
        }
      },
      // 监控路由
      {
        path: 'monitor/messages',
        name: 'MessageMonitor',
        component: () => import('@/views/monitor/MessageMonitor.vue'),
        meta: {
          title: '消息监控',
          requiresAuth: true,
          permissions: ['message.view']
        }
      },
      {
        path: 'monitor/contacts',
        name: 'ContactMonitor',
        component: () => import('@/views/monitor/ContactMonitor.vue'),
        meta: {
          title: '联系人监控',
          requiresAuth: true,
          permissions: ['account.read']
        }
      },
      {
        path: 'monitor/alerts',
        name: 'RealTimeAlerts',
        component: () => import('@/views/monitor/RealTimeAlerts.vue'),
        meta: {
          title: '实时告警',
          requiresAuth: true,
          permissions: ['system.log_view']
        }
      },
      // 敏感词系统路由
      {
        path: 'sensitive-words',
        name: 'SensitiveWords',
        component: () => import('@/views/sensitive-words/SensitiveWords.vue'),
        meta: {
          title: '敏感词管理',
          requiresAuth: true,
          permissions: ['content_moderation.word_view']
        }
      },
      {
        path: 'config',
        name: 'SystemConfig',
        component: () => import('@/views/config/SystemConfig.vue'),
        meta: {
          title: '系统配置',
          requiresAuth: true,
          permissions: ['system.config_view'],
          excludeCategories: ['sensitive_word']
        }
      },
      {
        path: 'sensitive-words/config',
        name: 'SensitiveWordConfig',
        component: () => import('@/views/config/SystemConfig.vue'),
        meta: {
          title: '敏感词设定',
          requiresAuth: true,
          permissions: ['content_moderation.config_view'],
          includeCategories: ['sensitive_word']
        }
      },
      {
        path: 'sensitive-words/alerts',
        name: 'SensitiveWordAlerts',
        component: () => import('@/views/sensitive-words/SensitiveWordAlerts.vue'),
        meta: {
          title: '告警日志',
          requiresAuth: true,
          permissions: ['content_moderation.alert_view']
        }
      },
      // 设备管理路由
      {
        path: 'devices',
        name: 'Devices',
        component: () => import('@/views/devices/DeviceList.vue'),
        meta: {
          title: '设备管理',
          requiresAuth: true,
          permissions: ['message.view']
        }
      },
      {
        path: 'devices/:id',
        name: 'DeviceDetail',
        component: () => import('@/views/devices/DeviceDetail.vue'),
        meta: {
          title: '设备详情',
          requiresAuth: true,
          permissions: ['message.view']
        }
      },
      // 标签管理路由
      {
        path: 'tags',
        name: 'TagManagement',
        component: () => import('@/views/tag/TagManagement.vue'),
        meta: {
          title: '标签管理',
          requiresAuth: true,
          permissions: ['tag.view']
        }
      },
      // 渠道管理路由
      {
        path: 'channels',
        name: 'ChannelManagement',
        component: () => import('@/views/channel/ChannelManagement.vue'),
        meta: {
          title: '渠道管理',
          requiresAuth: true,
          permissions: ['channel.view']
        }
      },
      // 推廣域名管理路由
      {
        path: 'promotion-domains',
        name: 'PromotionDomainManagement',
        component: () => import('@/views/promotion-domain/PromotionDomainManagement.vue'),
        meta: {
          title: '推廣域名管理',
          requiresAuth: true,
          permissions: ['promotion_domain.view']
        }
      },
      // 关键词配置路由
      {
        path: 'keywords',
        name: 'KeywordManagement',
        component: () => import('@/views/KeywordManagement.vue'),
        meta: {
          title: '关键词配置',
          requiresAuth: true,
          permissions: ['keyword.view']
        }
      },
      // 客户对话记录路由
      {
        path: 'customer-conversations',
        name: 'CustomerConversationManagement',
        component: () => import('@/views/CustomerConversationManagement.vue'),
        meta: {
          title: '客户对话记录',
          requiresAuth: true,
          permissions: ['customer_conversation.view']
        }
      },
      // 在线客服路由
      {
        path: 'customer-service',
        name: 'CustomerService',
        component: () => import('@/views/customer-service/CustomerServiceChat.vue'),
        meta: {
          title: '在线客服',
          requiresAuth: true,
          permissions: ['customer_conversation.view']
        }
      },
      // RBAC权限管理路由
      {
        path: 'rbac/admin-users',
        name: 'AdminUserManagement',
        component: () => import('@/views/rbac/AdminUserManagement.vue'),
        meta: {
          title: '后管用户管理',
          requiresAuth: true,
          permissions: ['admin_user.view']
        }
      },
      {
        path: 'rbac/roles',
        name: 'RoleManagement',
        component: () => import('@/views/rbac/RoleList.vue'),
        meta: {
          title: '角色管理',
          requiresAuth: true,
          permissions: ['role.view']
        }
      },
      {
        path: 'rbac/user-roles',
        name: 'UserRoleAssignment',
        component: () => import('@/views/rbac/UserRoleAssignment.vue'),
        meta: {
          title: '用户角色分配',
          requiresAuth: true,
          permissions: ['user_role.assign']
        }
      },
      // 审计日志路由
      {
        path: 'audit/operation-logs',
        name: 'OperationLogs',
        component: () => import('@/views/audit/OperationLogs.vue'),
        meta: {
          title: '操作日志',
          requiresAuth: true,
          permissions: ['system.log_view']
        }
      },
      // Connector 状态路由 - 重定向到配置管理頁面
      {
        path: 'connectors',
        name: 'Connectors',
        redirect: { name: 'ConnectorConfigManagement' }
      },
      // 代理配置管理路由
      {
        path: 'proxy-configs',
        name: 'ProxyManagement',
        component: () => import('@/views/proxy/ProxyManagement.vue'),
        meta: {
          title: '代理配置管理',
          requiresAuth: true,
          permissions: ['connector.manage']
        }
      },
      // AI 標籤定義管理路由
      {
        path: 'ai-tags',
        name: 'AiTagManagement',
        component: () => import('@/views/ai-tag/AiTagManagement.vue'),
        meta: {
          title: 'AI 標籤定義',
          requiresAuth: true,
          permissions: ['ai_tag.view']
        }
      },
      // 工作組管理路由
      {
        path: 'workgroups',
        name: 'WorkgroupList',
        component: () => import('@/views/workgroup/WorkgroupList.vue'),
        meta: {
          title: '工作組列表',
          requiresAuth: true,
          permissions: ['workgroup.read']
        }
      },
      {
        path: 'workgroups/:id',
        name: 'WorkgroupDetail',
        component: () => import('@/views/workgroup/WorkgroupDetail.vue'),
        meta: {
          title: '工作組詳情',
          requiresAuth: true,
          permissions: ['workgroup.read']
        }
      },
      // Connector 配置管理路由
      {
        path: 'connector-configs',
        name: 'ConnectorConfigManagement',
        component: () => import('@/views/connector-config/ConnectorConfigManagement.vue'),
        meta: {
          title: 'Connector 配置管理',
          requiresAuth: true,
          permissions: ['connector.manage']
        }
      }
    ]
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: {
      title: '权限不足',
      requiresAuth: false
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 设置路由守卫
setupGuards(router)

export default router
