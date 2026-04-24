import { defineConfig } from 'vite-plus'

export default defineConfig({
  // Using .oxfmtrc for formatting configuration so extension works
  // fmt: {
  //   semi: false,
  //   singleQuote: true,
  //   singleAttributePerLine: true,
  // },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
})
