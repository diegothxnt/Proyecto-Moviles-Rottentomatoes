import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rt.app',
  appName: 'Rotten Tomatoes',
  webDir: 'www',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'http',
  },
};

export default config;