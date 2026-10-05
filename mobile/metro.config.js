const fs = require('fs');
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// Sync runtime configuration from .env at bundle time
function syncEnvConfig() {
  const envPath = path.resolve(__dirname, '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*(?:export\s+|)([\w\d\.\-_]+)\s*=\s*['"]?(.*?)?['"]?\s*$/);
      if (match && match[1]) {
        env[match[1]] = match[2] ? match[2].trim() : '';
      }
    }
  }
  const targetDir = path.resolve(__dirname, 'src/config');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  const content = `// Auto-generated from .env by metro.config.js - DO NOT EDIT MANUALLY\nexport const Config = ${JSON.stringify(
    env,
    null,
    2
  )};\nexport default Config;\n`;
  fs.writeFileSync(path.resolve(targetDir, 'runtimeConfig.js'), content, 'utf8');
}
syncEnvConfig();

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'react-native-config') {
        return {
          filePath: path.resolve(__dirname, 'src/config/runtimeConfig.js'),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

