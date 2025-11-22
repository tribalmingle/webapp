declare module '@next/env' {
  export function loadEnvConfig(dir: string, dev?: boolean): { combinedEnv: Record<string, string> }
}
