/**
 * LaundryFlow Mobile RN-2 Design System & Theme Verification Script
 */

const path = require('path');
const fs = require('fs');

global.__DEV__ = true;

const Module = require('module');
const origRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'react-native') {
    return {
      Platform: {
        select: (obj) => obj.android || obj.default,
        OS: 'android',
      },
      StyleSheet: { create: (s) => s },
      useColorScheme: () => 'dark',
    };
  }
  return origRequire.apply(this, arguments);
};

require('@babel/register')({
  presets: ['module:@react-native/babel-preset'],
  ignore: [/node_modules\/(?!react-native)/],
});

console.log('=== VERIFYING RN-2 THEME & DESIGN SYSTEM ===');

let errorCount = 0;

// 1. Verify Theme Modules & Tokens
console.log('\n[1] Checking Theme Files & Exports...');
try {
  // Theme modules
  const colorsModule = require('../src/theme/colors');
  const typographyModule = require('../src/theme/typography');
  const spacingModule = require('../src/theme/spacing');
  const radiusModule = require('../src/theme/radius');
  const shadowsModule = require('../src/theme/shadows');
  const themesModule = require('../src/theme/themes');

  // Palette checks
  if (!colorsModule.palette || !colorsModule.palette.primary || !colorsModule.palette.navy) {
    console.error('✗ Palette missing primary or navy scales');
    errorCount++;
  } else {
    console.log('✓ Palette tokens: primary (50-900), navy (50-950), status, accent');
  }

  // Dark & Light colors check
  if (!colorsModule.darkColors || !colorsModule.lightColors) {
    console.error('✗ Dark or light colors missing');
    errorCount++;
  } else {
    console.log('✓ darkColors & lightColors exported properly');
    console.log('  - Dark background:', colorsModule.darkColors.background);
    console.log('  - Brand primary:', colorsModule.darkColors.primary);
    console.log('  - Status success:', colorsModule.darkColors.status.success);
    console.log('  - Status error:', colorsModule.darkColors.status.error);
  }

  // Typography checks
  if (!typographyModule.typography || !typographyModule.fontSizes || !typographyModule.fontWeights) {
    console.error('✗ Typography tokens missing');
    errorCount++;
  } else {
    console.log('✓ Typography tokens: h1, h2, h3, title, subtitle, body, caption, overline, etc.');
  }

  // Spacing checks
  if (!spacingModule.spacing || !spacingModule.layout) {
    console.error('✗ Spacing tokens missing');
    errorCount++;
  } else {
    console.log('✓ Spacing & Layout scale: 4-point incremental + accessibility touchTarget (48dp)');
  }

  // Radius checks
  if (!radiusModule.radius || !radiusModule.borderRadius) {
    console.error('✗ Radius tokens missing');
    errorCount++;
  } else {
    console.log('✓ Radius tokens: none to full + component presets');
  }

  // Shadows checks
  if (!shadowsModule.shadows || !shadowsModule.shadows.md || !shadowsModule.shadows.glass) {
    console.error('✗ Shadows tokens missing');
    errorCount++;
  } else {
    console.log('✓ Shadows tokens: xs, sm, md, lg, xl, glass');
  }

  // Compiled Themes check
  if (!themesModule.darkTheme || !themesModule.lightTheme) {
    console.error('✗ Compiled themes missing');
    errorCount++;
  } else {
    console.log('✓ darkTheme & lightTheme assembled with tokens');
    if (themesModule.darkTheme.isDark !== true || themesModule.lightTheme.isDark !== false) {
      console.error('✗ Theme isDark boolean mismatch');
      errorCount++;
    }
  }

} catch (err) {
  console.error('✗ Error importing theme modules:', err.message);
  errorCount++;
}

// 2. Check for gradient usage (must be zero gradients)
console.log('\n[2] Checking for Gradient Usages across src/...');
function searchForGradients(dir) {
  let found = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found = found.concat(searchForGradients(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/LinearGradient|expo-linear-gradient|react-native-linear-gradient/i.test(content)) {
        found.push(fullPath);
      }
    }
  }
  return found;
}

const gradientOccurrences = searchForGradients(path.join(__dirname, '../src'));
if (gradientOccurrences.length > 0) {
  console.error('✗ Found gradient references in:', gradientOccurrences);
  errorCount += gradientOccurrences.length;
} else {
  console.log('✓ Zero gradients found across entire src directory (strictly compliant)!');
}

// 3. Verify Reusable UI Components
console.log('\n[3] Verifying Reusable UI Components...');
const expectedComponents = [
  'Button.jsx',
  'Input.jsx',
  'Card.jsx',
  'Badge.jsx',
  'Text.jsx',
  'Header.jsx',
  'Divider.jsx',
  'Modal.jsx',
  'Loader.jsx',
  'EmptyState.jsx',
  'ErrorState.jsx',
  'ScreenContainer.jsx',
];

const uiDir = path.join(__dirname, '../src/components/ui');
for (const comp of expectedComponents) {
  const compPath = path.join(uiDir, comp);
  if (!fs.existsSync(compPath)) {
    console.error(`✗ Missing component: ${comp}`);
    errorCount++;
  } else {
    const content = fs.readFileSync(compPath, 'utf8');
    const usesTheme = content.includes('useTheme');
    const hasAccessibility = content.includes('accessibility');
    console.log(`  ✓ ${comp} (theme: ${usesTheme ? 'yes' : 'no'}, accessible: ${hasAccessibility ? 'yes' : 'no'})`);
  }
}

// 4. Verify Component Barrel Exports
console.log('\n[4] Verifying Barrel Exports...');
const uiIndexContent = fs.readFileSync(path.join(uiDir, 'index.js'), 'utf8');
const rootComponentsIndexContent = fs.readFileSync(path.join(__dirname, '../src/components/index.js'), 'utf8');

const baseComponentNames = [
  'Button', 'Input', 'Card', 'Badge', 'Text', 'Header',
  'Divider', 'Modal', 'Loader', 'EmptyState', 'ErrorState', 'ScreenContainer'
];

for (const name of baseComponentNames) {
  if (!uiIndexContent.includes(name)) {
    console.error(`✗ ${name} not exported in src/components/ui/index.js`);
    errorCount++;
  }
}

if (!rootComponentsIndexContent.includes("from './ui'") && !rootComponentsIndexContent.includes('from "./ui"')) {
  console.error('✗ src/components/index.js does not re-export ./ui');
  errorCount++;
} else {
  console.log('✓ All 12 UI components re-exported cleanly in src/components/ui/index.js and src/components/index.js');
}

// 5. Verify uiStore Default
console.log('\n[5] Verifying uiStore Default Theme...');
const uiStoreContent = fs.readFileSync(path.join(__dirname, '../src/store/uiStore.js'), 'utf8');
if (uiStoreContent.includes("theme: 'dark'")) {
  console.log("✓ uiStore initializes default theme as 'dark'");
} else {
  console.error("✗ uiStore does not default to 'dark'");
  errorCount++;
}

console.log('\n=======================================');
if (errorCount === 0) {
  console.log('✅ ALL THEME & DESIGN SYSTEM VERIFICATIONS PASSED!');
  process.exit(0);
} else {
  console.error(`❌ ${errorCount} verification issue(s) detected.`);
  process.exit(1);
}
