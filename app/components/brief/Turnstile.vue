<script lang="ts" setup>
// Cloudflare Turnstile, in managed mode: invisible unless Cloudflare wants a click, when it appears in place.
// Its token proves to /api/brief that a person sent the brief. Tokens are single-use, so a failed send clears the
// model and the widget fetches a fresh one.

interface TurnstileOptions {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
  appearance?: 'always' | 'execute' | 'interaction-only'
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  'before-interactive-callback'?: () => void
  'after-interactive-callback'?: () => void
}

interface Turnstile {
  render: (el: HTMLElement, options: TurnstileOptions) => string
  reset: (id: string) => void
  remove: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

// Cloudflare's always-pass site key, used only in `nuxt dev` when no key is set
const TEST_SITE_KEY = '1x00000000000000000000AA'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

const token = defineModel<string>({ default: '' })
// Set when Turnstile errors, for Send to say so rather than wait
const failed = defineModel<boolean>('failed', { default: false })
// Set while Cloudflare is showing its box and waiting for a click, for Send to ask for one rather than to wait
const asking = defineModel<boolean>('asking', { default: false })

const el = useTemplateRef('el')
const config = useRuntimeConfig()
const siteKey = config.public.turnstileSiteKey || (import.meta.dev ? TEST_SITE_KEY : '')

let widgetId: string | undefined

// Loaded once: coming back to the summary finds `window.turnstile` already there
let loading: Promise<Turnstile> | undefined
function loadTurnstile() {
  loading ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile)
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile missing')))
    script.onerror = () => {
      loading = undefined
      reject(new Error('Turnstile failed to load'))
    }
    document.head.append(script)
  })
  return loading
}

onMounted(async () => {
  if (!siteKey || !el.value) return
  const turnstile = await loadTurnstile().catch(() => undefined)
  if (!turnstile) {
    failed.value = true
    return
  }
  if (!el.value) return

  widgetId = turnstile.render(el.value, {
    sitekey: siteKey,
    theme: 'dark',
    size: 'flexible',
    appearance: 'interaction-only',
    callback: (value) => {
      token.value = value
      failed.value = false
    },
    'expired-callback': () => (token.value = ''),
    'error-callback': () => {
      token.value = ''
      failed.value = true
    },
    'before-interactive-callback': () => (asking.value = true),
    'after-interactive-callback': () => (asking.value = false),
  })
})

// Cleared from outside after a send used the token up: fetch another
watch(token, (value, previous) => {
  if (!value && previous && widgetId) window.turnstile?.reset(widgetId)
})

onBeforeUnmount(() => {
  asking.value = false
  if (widgetId) window.turnstile?.remove(widgetId)
})
</script>

<template>
  <div
    ref="el"
    data-brief-turnstile
  />
</template>
