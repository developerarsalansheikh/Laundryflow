const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const mobileRoot = path.resolve(__dirname, '..');
console.log('--- LaundryFlow Mobile Foundation Verification ---');

// 1. Verify required dependencies in package.json
const pkg = JSON.parse(fs.readFileSync(path.join(mobileRoot, 'package.json'), 'utf-8'));
const requiredDeps = [
  '@react-navigation/native',
  '@react-navigation/native-stack',
  '@react-navigation/bottom-tabs',
  'zustand',
  '@tanstack/react-query',
  'axios',
  'react-native-mmkv',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-gesture-handler',
  'react-native-reanimated',
  '@shopify/flash-list',
  'react-native-svg',
  'react-hook-form',
  'yup',
  'socket.io-client',
  'react-native-config',
];

console.log('\n[1] Verifying dependencies...');
let missingDeps = 0;
for (const dep of requiredDeps) {
  if (pkg.dependencies && pkg.dependencies[dep]) {
    console.log(`  ✓ ${dep}: ${pkg.dependencies[dep]}`);
  } else {
    console.error(`  ✗ MISSING: ${dep}`);
    missingDeps++;
  }
}

// 2. Verify folder structure
console.log('\n[2] Verifying folder structure...');
const requiredDirs = [
  'src/api',
  'src/assets',
  'src/components',
  'src/constants',
  'src/hooks',
  'src/navigation',
  'src/screens/auth',
  'src/screens/customer',
  'src/screens/admin',
  'src/screens/delivery',
  'src/services',
  'src/store',
  'src/theme',
  'src/utils',
];

let missingDirs = 0;
for (const dir of requiredDirs) {
  const fullPath = path.join(mobileRoot, dir);
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    console.log(`  ✓ ${dir}`);
  } else {
    console.error(`  ✗ MISSING DIRECTORY: ${dir}`);
    missingDirs++;
  }
}

// 3. Verify Babel parsing of all JS/JSX files
console.log('\n[3] Verifying Babel syntax parsing across all source files...');
function getAllFiles(dir, exts = ['.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'android' && file !== 'ios' && file !== '.bundle') {
        results = results.concat(getAllFiles(filePath, exts));
      }
    } else {
      if (exts.includes(path.extname(file))) {
        results.push(filePath);
      }
    }
  }
  return results;
}

const allFiles = [
  path.join(mobileRoot, 'index.js'),
  path.join(mobileRoot, 'App.jsx'),
  ...getAllFiles(path.join(mobileRoot, 'src')),
];

const parser = require('@babel/parser');

let syntaxErrors = 0;
for (const file of allFiles) {
  const relPath = path.relative(mobileRoot, file);
  try {
    const code = fs.readFileSync(file, 'utf-8');
    parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx'],
    });
    console.log(`  ✓ Parsed OK: ${relPath}`);
  } catch (err) {
    console.error(`  ✗ SYNTAX ERROR in ${relPath}:`, err.message);
    syntaxErrors++;
  }
}


// 4. Verify Android native configurations
console.log('\n[4] Verifying Android native configurations...');
const mainActivityPath = fs.existsSync(path.join(mobileRoot, 'android/app/src/main/java/com/laundryflow/MainActivity.kt'))
  ? path.join(mobileRoot, 'android/app/src/main/java/com/laundryflow/MainActivity.kt')
  : path.join(mobileRoot, 'android/app/src/main/java/com/mobile/MainActivity.kt');
const mainActivityContent = fs.readFileSync(mainActivityPath, 'utf-8');
const hasScreensOnCreate = mainActivityContent.includes('super.onCreate(null)');
console.log(
  hasScreensOnCreate
    ? '  ✓ MainActivity.kt has react-native-screens onCreate(null)'
    : '  ✗ MainActivity.kt MISSING react-native-screens onCreate(null)'
);

const buildGradlePath = path.join(mobileRoot, 'android/app/build.gradle');
const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf-8');
const hasDotenv = buildGradleContent.includes('dotenv.gradle');
console.log(
  hasDotenv
    ? '  ✓ android/app/build.gradle applies react-native-config dotenv.gradle'
    : '  ✗ android/app/build.gradle MISSING dotenv.gradle'
);

const babelConfigPath = path.join(mobileRoot, 'babel.config.js');
const babelConfigContent = fs.readFileSync(babelConfigPath, 'utf-8');
const hasReanimatedPlugin = babelConfigContent.includes('react-native-reanimated/plugin');
console.log(
  hasReanimatedPlugin
    ? '  ✓ babel.config.js includes react-native-reanimated/plugin'
    : '  ✗ babel.config.js MISSING react-native-reanimated/plugin'
);

const indexJsPath = path.join(mobileRoot, 'index.js');
const indexJsContent = fs.readFileSync(indexJsPath, 'utf-8');
const hasGestureHandler = indexJsContent.includes("import 'react-native-gesture-handler'");
console.log(
  hasGestureHandler
    ? '  ✓ index.js imports react-native-gesture-handler at top'
    : '  ✗ index.js MISSING gesture-handler import'
);

// 5. Check Android Environment
console.log('\n[5] Android SDK / Environment Check...');
const hasAndroidHome = Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT);
console.log(`  ANDROID_HOME / ANDROID_SDK_ROOT configured: ${hasAndroidHome ? 'YES' : 'NO'}`);

const summary = {
  missingDeps,
  missingDirs,
  syntaxErrors,
  nativeConfigPassed: hasScreensOnCreate && hasDotenv && hasReanimatedPlugin && hasGestureHandler,
};

console.log('\n--- VERIFICATION SUMMARY ---');
console.log(JSON.stringify(summary, null, 2));

if (missingDeps === 0 && missingDirs === 0 && syntaxErrors === 0 && summary.nativeConfigPassed) {
  console.log('\n✅ ALL FOUNDATION CHECKS PASSED!');
  process.exit(0);
} else {
  console.error('\n❌ SOME CHECKS FAILED!');
  process.exit(1);
}
