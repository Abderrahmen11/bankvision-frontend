/**
 * BankVision Frontend Environment Configuration
 * Centralized, type-safe access to environment variables.
 */

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  appName: import.meta.env.VITE_APP_NAME || 'BankVision',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  /**
   * Demo affordances (login prefills, persona switcher) are only shown when
   * explicitly enabled via VITE_DEMO_MODE or in non-production environments.
   */
  isDemoMode:
    import.meta.env.VITE_DEMO_MODE !== undefined
      ? import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1'
      : (import.meta.env.VITE_APP_ENV || 'development') !== 'production',
} as const
