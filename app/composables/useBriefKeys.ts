import { useEventListener } from '@vueuse/core'
import type { ShallowRef } from 'vue'

// Fields that take typing, where Enter and the number keys belong to the field
const isTyping = (el: HTMLElement) =>
  el.isContentEditable ||
  el instanceof HTMLTextAreaElement ||
  el instanceof HTMLSelectElement ||
  (el instanceof HTMLInputElement && !['radio', 'checkbox', 'range'].includes(el.type))

// The brief's own keys, on top of what each field does itself:
// - Enter moves on from any question, as it already does from a text field (which handles its own Enter). Not from a
//   button or link, where Enter presses that instead, and not on the review, where sending takes a deliberate press.
// - 1–9 pick (or tick) the matching card or chip, and focus it, so Space and the arrows carry on from there. The group
//   with focus wins; otherwise the screen's first, the question's own rather than a follow-up's.
// Always on, with no visible hints: the keys are announced through aria-keyshortcuts on what they trigger.
export function useBriefKeys(root: Readonly<ShallowRef<HTMLElement | null>>, primary: () => void) {
  const brief = useBriefStore()

  useEventListener(document, 'keydown', (event) => {
    if (event.defaultPrevented || event.repeat || event.isComposing || event.metaKey || event.ctrlKey || event.altKey)
      return
    if (brief.status !== 'draft' || brief.isSummary || !root.value) return

    const target = event.target as HTMLElement
    // Only from the brief itself, or from nothing in particular
    if (target !== document.body && !root.value.contains(target)) return
    if (isTyping(target)) return

    if (event.key === 'Enter' && !event.shiftKey) {
      if (target.closest('a, button, summary')) return
      event.preventDefault()
      return primary()
    }

    // By key position, so it's the same keys on a keyboard whose number row needs Shift
    const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)?.[1]
    if (!digit) return

    const group =
      target.closest<HTMLElement>('[data-brief-options]') ??
      root.value.querySelector<HTMLElement>('[data-brief-options]')
    const input = group?.querySelectorAll<HTMLInputElement>('input')[Number(digit) - 1]
    if (!input) return

    event.preventDefault()
    input.focus({ preventScroll: true })
    // A click, so it picks exactly as a press would: the model, the sound, a radio's siblings
    input.click()
  })
}
