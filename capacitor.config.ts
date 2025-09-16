import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.78c9ea58fb624c97ad2755bad108f482',
  appName: 'daily-abc-illustrations',
  webDir: 'dist',
  server: {
    url: "https://78c9ea58-fb62-4c97-ad27-55bad108f482.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    Haptics: {
      vibrationDuration: 100
    }
  }
};

export default config;