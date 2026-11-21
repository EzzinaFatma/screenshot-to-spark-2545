/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional base URL of the CoastGuard FastAPI backend. Unset = local demo data. */
  readonly VITE_COASTGUARD_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
