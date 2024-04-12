import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  persist: {
    key: 'ditta-app',
  },
  state: () => ({
  }),
  actions: {
  }
})
