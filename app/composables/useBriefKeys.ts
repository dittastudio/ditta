import { useEventListener } from '@vueuse/core'
import type { ShallowRef } from 'vue'

// Fields where Shift+Enter is a new line, so it isn't Back
const isMultiline = (el: HTMLElement) => el.isContentEditable || el instanceof HTMLTextAreaElement

const isRange = (el: HTMLElement): el is HTMLInputElement => el instanceof HTMLInputElement && el.type === 'range'

// Focus on nothing that takes keys: the page, or a heading focused in code (tabindex -1, see Shell)
const isUnfocused = (el: HTMLElement) =>
  el === document.body ||
  (el.getAttribute('tabindex') === '-1' && !el.matches('input, textarea, select, button, a, summary'))

// Moves a slider a band as its own arrow key would. Its keydown goes first, so the slider leans towards the key (and
// lets go on the real keyup, which reaches it now it has focus) and can handle the key itself (one with nothing chosen
// picks its first band on Left); otherwise it steps, and says so as a native step would.
function nudge(slider: HTMLInputElement, key: 'ArrowLeft' | 'ArrowRight') {
  if (!slider.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }))) return

  const before = slider.value
  if (key === 'ArrowRight') slider.stepUp()
  else slider.stepDown()
  if (slider.value !== before) slider.dispatchEvent(new Event('input', { bubbles: true }))
}

// Fields that take typing, where Enter and the number keys belong to the field
const isTyping = (el: HTMLElement) =>
  el.isContentEditable ||
  el instanceof HTMLTextAreaElement ||
  el instanceof HTMLSelectElement ||
  (el instanceof HTMLInputElement && !['radio', 'checkbox', 'range'].includes(el.type))

// The brief's own keys, on top of what each field does itself:
// - Enter starts the brief from its intro, and moves on from any question, as it already does from a text field (which handles its own Enter). Not from a
//   button or link, where Enter presses that instead, and not on the review, where sending takes a deliberate press.
// - Shift+Enter goes back a step, its reverse. From a single-line field too (which leaves Shift+Enter alone), but not
//   from one that takes new lines.
// - 1–9 pick (or tick) the matching card or chip, and focus it, so Space and the arrows carry on from there. The group
//   with focus wins; otherwise the screen's first, the question's own rather than a follow-up's.
// - Left and Right move a slider a band, and focus it, so Home, End and the arrows carry on natively. Only with focus
//   on nothing in particular (the page, or a heading focused in code): anything focused that has arrows of its own,
//   a card group, keeps them. The slider with focus moves itself; otherwise it's the screen's first. Not Up and Down,
//   which keep scrolling the page. Their keycaps press either way.
// The keys are announced through aria-keyshortcuts on what they trigger, and shown as keycaps (UiKbd) when the
// shortcuts setting is on. While a key it handled is held, what shows that key (the option's label, or the Nav's
// [data-brief-enter-key] and [data-brief-back-key]) is marked data-pressed, so its UiKbd presses down too. Released on
// keyup, or all at once if the window loses focus.
export function useBriefKeys(
  root: Readonly<ShallowRef<HTMLElement | null>>,
  { primary, back }: { primary: () => void; back: () => void },
) {
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
    // The intro takes Enter for Start
    if (!brief.inProgress || brief.isSummary || !root.value) return

    const target = event.target as HTMLElement
    // Only from the brief itself, or from nothing in particular
    if (target !== document.body && !root.value.contains(target)) return

    if (event.key === 'Enter' && event.shiftKey) {
      if (isMultiline(target) || target.closest('a, button, summary') || brief.status !== 'draft') return
      event.preventDefault()
      press(event.code, root.value.querySelector('[data-brief-back-key]'))
      return back()
    }

    if (isTyping(target)) return

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const slider = isRange(target)
        ? target
        : isUnfocused(target)
          ? root.value.querySelector<HTMLInputElement>('[data-brief-slider] input[type="range"]')
          : null
      if (!slider) return

      press(event.code, slider.closest('[data-brief-slider]')?.querySelector(`[data-brief-key="${event.key}"]`))
      // A focused slider moves itself
      if (slider === target) return

      event.preventDefault()
      slider.focus({ preventScroll: true })
      return nudge(slider, event.key)
    }

    if (event.key === 'Enter') {
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
