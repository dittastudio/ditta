import { addComponent, defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  setup() {
    addComponent({
      name: 'Screen',
      filePath: '@michaelpumo/screen/vue',
      mode: 'client',
    })
  },
})
