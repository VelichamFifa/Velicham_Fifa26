/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APPINSIGHTS_CONNECTION_STRING?: string
  readonly VITE_APPINSIGHTS_CLOUD_ROLE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
