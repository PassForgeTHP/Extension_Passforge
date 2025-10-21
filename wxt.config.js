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
    permissions: ['storage', 'activeTab', 'tabs', 'alarms','scripting','runtime'],
    host_permissions: [
      'http://localhost:3000/*',
      'https://passforge-api.onrender.com*'
    ],
    externally_connectable: {
      matches: [
        'http://localhost:5173/*',
        'https://pass-forge-en.netlify.app/*'
      ],
    },
    commands: {
      'wxt:reload-extension': {
        description: 'Reload the extension during development',
        suggested_key: {
          default: 'Alt+R',
        },
      },
    },
  },
});
