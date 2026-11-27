import { defineConfig } from 'vite-plus'

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    semi: false,
    singleQuote: true,
    singleAttributePerLine: true,
    vueIndentScriptAndStyle: false,
    printWidth: 120,
    ignorePatterns: [
      'worker-configuration.d.ts',
      '.storyblok/**/*',
      '.claude/**/*',
      '.vscode/**/*',
      '.agents/**/*',
      '.wrangler/**/*',
    ],
  },
  lint: {
    plugins: ['typescript', 'unicorn', 'oxc', 'vue', 'import'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
})
