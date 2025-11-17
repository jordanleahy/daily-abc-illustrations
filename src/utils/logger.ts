export const logger = {
  realtime: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`📡 ${message}`, data);
    }
  },
  
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error);
  },
  
  info: (message: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`ℹ️ ${message}`, data);
    }
  },
  
  warn: (message: string, data?: any) => {
    console.warn(`⚠️ ${message}`, data);
  },
} as const;
