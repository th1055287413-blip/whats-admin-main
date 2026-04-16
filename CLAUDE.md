# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
pnpm dev          # 啟動 dev server (port 3001)
pnpm build        # 生產建構 + 打包 tar.gz
pnpm build:check  # vue-tsc 型別檢查 + 建構
pnpm type-check   # 僅 vue-tsc --noEmit
pnpm lint         # ESLint --fix (.vue/.ts/.js)
```

## Architecture

Vue 3 (Composition API + `<script setup>`) + TypeScript + Vite + Element Plus 管理後台。Pinia 做狀態管理，vue-router 用 hash history。

### API 層（雙 axios 實例）

- **`src/api/index.ts`** — 主要的 axios 實例，含 token 自動刷新邏輯（攔截器偵測即將過期的 JWT 並呼叫 `/auth/refresh`）。回應格式 `{ code: 0, message, data }`。
- **`src/utils/request.ts`** — 次要 axios 實例（30s timeout），額外處理 `{ success: true, data }` 格式的回應（新版後端格式）。
- 各 API 模組位於 `src/api/*.ts`，引用 `src/api/index.ts` 的 `request` 物件。

### 認證與權限

- JWT token 以 AES 加密存於 localStorage/sessionStorage（根據「記住我」切換），工具函式在 `src/utils/auth.ts`。
- `src/stores/auth.ts` — Pinia composition store，管理登入狀態、權限列表、角色。啟動時自動呼叫 `initAuthState()`。
- RBAC 權限格式為 `resource.action`（如 `user.read`、`batch_send.create`），admin 角色（`super_admin` / `admin`）繞過所有權限檢查。
- `src/composables/usePermission.ts` — 提供 `hasPermission` / `hasAnyPermission` 等給元件使用。
- 路由守衛在 `src/router/guards.ts`，根據 `meta.permissions` 做存取控制。

### 路由前綴

所有管理路由帶可設定的前綴（`VITE_ADMIN_PREFIX`，預設 `/admin`）。使用 `src/utils/route.ts` 的 `withAdminPrefix()` 包裝路徑，不要硬寫 `/admin`。

### Auto Import

Vite 設定了 `unplugin-auto-import`（Vue / vue-router / Pinia API 自動引入）及 `unplugin-vue-components`（Element Plus 元件自動引入）。不需要手動 import `ref`、`computed`、`watch`、`useRouter` 等，也不需要手動 import Element Plus 元件。型別宣告由 `auto-imports.d.ts` 和 `components.d.ts` 自動產生。

### 即時通訊

- `src/utils/websocket.ts` — WebSocket 單例 `wsClient`，含自動重連。
- `src/utils/sse.ts` — SSE 單例 `sseClient`，監聽 `new_message`、`message_status` 等事件。
- 兩者都從 `VITE_API_BASE_URL` 推導連線位址。

### 全域版本號

`vite.config.ts` 定義 `__APP_VERSION__`（讀取 `package.json` 的 version），側邊欄底部顯示。

## Environment Variables

```
VITE_API_BASE_URL   # 後端 API 基底 URL（預設 /api）
VITE_NODE_ENV       # development / production
VITE_ADMIN_PREFIX   # 路由前綴（預設 /admin）
```

## Versioning & Deployment

### 語意化版本（Semantic Versioning）

版本號在 `package.json` 的 `version` 欄位，遵循 `MAJOR.MINOR.PATCH`：

- **PATCH**（1.0.x）：bug 修復、小幅調整
- **MINOR**（1.x.0）：新功能，向下相容
- **MAJOR**（x.0.0）：破壞性變更

更新版本時一併 commit：`chore: bump version to x.x.x`。

### CI/CD 部署流程

GitHub Actions workflow 在 `.github/workflows/deploy.yml`，觸發條件：

- push `v*` tag（如 `v1.1.0`）
- 手動觸發（workflow_dispatch）

**部署指令：**

```bash
# 1. 更新 package.json version
# 2. commit & push
git push origin main
# 3. 打 tag 觸發部署
git tag v1.1.0
git push origin v1.1.0
```

**重新觸發同版本部署：**

```bash
git tag -d v1.1.0 && git push origin :refs/tags/v1.1.0
git tag v1.1.0 && git push origin v1.1.0
```

**多環境：** 使用 matrix strategy，每個 environment 各自設定 secrets/variables。新增環境只需在 matrix 加一個值，並在 GitHub Settings → Environments 建立對應設定。

| 類型 | 名稱 | 說明 |
|------|------|------|
| Secret | `DEPLOY_HOST` | 伺服器 IP |
| Secret | `DEPLOY_KEY` | SSH private key |
| Variable | `DEPLOY_PATH` | 遠端部署路徑 |
| Secret | `DEPLOY_PORT` | SSH 連線 port（預設 22） |
| Variable | `VITE_API_BASE_URL` | API 基底 URL |

## Key Conventions

- 元件使用 `<script setup lang="ts">`，Pinia store 使用 composition style（`defineStore('name', () => { ... })`）。
- 型別定義集中在 `src/types/*.ts`。
- 新增頁面需在 `src/router/index.ts` 加路由並設定 `meta.permissions`，同時在 `src/layouts/MainLayout.vue` 側邊欄加入對應選單項（含 `v-if="hasPermission([...])"` 權限控制）。
- Build 時 vendor 分包策略在 `vite.config.ts` 的 `manualChunks`：element-plus / vue-vendor / echarts / vendor 各自分離。
