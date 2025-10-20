import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  runner: {
    disabled: true, // Disable automatic browser opening
  },
  manifest: {
    name: 'PassForge',
    description: 'Secure password management extension',
    version: '1.0.0',
    permissions: ['storage', 'activeTab', 'tabs', 'alarms'],
    host_permissions: [],
  },
});
