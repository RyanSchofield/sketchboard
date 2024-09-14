/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_KEY: string;
  // other environment variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
