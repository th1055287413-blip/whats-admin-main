/// <reference types="vite/client" />

declare const __APP_VERSION__: string

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_ADMIN_PREFIX: string
  readonly VITE_DEV_MODE?: string
  readonly VITE_LOGIN_PAGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}