import { defineConfig } from 'vite-plus'

export default defineConfig({
  staged: {
    '*.{js,ts,vue}': 'vp check --fix',
  },
  // Using .oxfmtrc for formatting configuration so extension works
  fmt: {
    semi: false,
    singleQuote: true,
    singleAttributePerLine: true,
    vueIndentScriptAndStyle: false,
    printWidth: 120,
    ignorePatterns: ['.storyblok/**/*', '.claude/**/*', '.vscode/**/*', '.agents/**/*'],
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
})
