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
// While a key it handled is held, what shows that key (the option's label, or the Nav's [data-brief-enter-key]) is
// marked data-pressed, so its UiKbd presses down too. Released on keyup, or all at once if the window loses focus.
export function useBriefKeys(root: Readonly<ShallowRef<HTMLElement | null>>, primary: () => void) {
  const brief = useBriefStore()

  // Keyed by event.code, since the keyup's key can differ from its keydown's (Shift let go in between)
  const pressed = new Map<string, Element>()

  function press(code: string, el: Element | null | undefined) {
    if (!el) return
    pressed.get(code)?.removeAttribute('data-pressed')
    el.setAttribute('data-pressed', '')
    pressed.set(code, el)
  }

  function release(code: string) {
    pressed.get(code)?.removeAttribute('data-pressed')
    pressed.delete(code)
  }

  function releaseAll() {
    for (const code of pressed.keys()) release(code)
  }

  useEventListener(document, 'keyup', (event) => release(event.code))
  useEventListener(window, 'blur', releaseAll)

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
      press(event.code, root.value.querySelector('[data-brief-enter-key]'))
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
    press(event.code, input.closest('label'))
    // A click, so it picks exactly as a press would: the model, the sound, a radio's siblings
    input.click()
  })
}
