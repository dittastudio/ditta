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
    ignorePatterns: ['.storyblok/**/*', '.claude/**/*', '.vscode/**/*'],
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
})
