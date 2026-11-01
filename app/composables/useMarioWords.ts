import type { Target } from '@/composables/useMario'

import { COIN_WIDTH } from '@/utils/mario/coin'
import { SIZE } from '@/utils/mario/physics'
import { fontMetrics } from '@/utils/mario/textPlatforms'

interface Options {
  stage: Target
  lockup: Target // the copy whose words get bumped
  scale: () => number // screen px per sprite px
  playSound: (name: 'bump' | 'coin') => void
}

const BUMP_DURATION = 150 // ms for a bonked word to pop up and back
const BUMP_HEIGHT = 0.15 // em
const COINS = 10 // like a multi-coin block, the copy's last word pays out this many before it's spent
const MAX_FLYING_COINS = 3 // SMB's jumping coin slots; past that the oldest goes

const caretAt = (x: number, y: number) => {
  if ('caretPositionFromPoint' in document) {
    const position = document.caretPositionFromPoint(x, y)
    return position && { node: position.offsetNode, offset: position.offset }
  }

  // Safari before 26.2
  const range = (document as Document).caretRangeFromPoint(x, y)
  return range && { node: range.startContainer, offset: range.startOffset }
}

// Words Mario bonks from below, by splitting the text nodes Vue rendered and always putting them back. The copy's last
// word is a coin block.
export default function useMarioWords({ stage, lockup, scale, playSound }: Options) {
  const flyingCoins = ref<{ id: number; x: number; y: number }[]>([]) // screen px from the stage's top left
  const prefersReducedMotion = useAtMedia('(prefers-reduced-motion: reduce)')
  const isEditor = storyblokEditor(useRoute().query) // Vue re-renders the copy there, so leave its DOM alone

  let bump: { node: Text; text: string; span: HTMLSpanElement; tail: Text; animation: Animation } | null = null
  let coins = 0
  let spent: { node: Text; text: string; span: HTMLSpanElement; tail: Text } | null = null // wrapped and faded once the coins run out
  let coinId = 0

  const unbumpWord = () => {
    if (!bump) return

    const { node, text, span, tail, animation } = bump

    // Put the text node back exactly as Vue rendered it
    animation.cancel()
    span.remove()
    tail.remove()
    node.data = text
    bump = null
  }

  const unspendWord = () => {
    if (!spent) return
    const { node, text, span, tail } = spent
    span.remove()
    tail.remove()
    node.data = text
    spent = null
  }

  // Last text node of the copy's last paragraph, and where its last word ends
  const coinWord = () => {
    const copy = [...(toValue(lockup)?.querySelectorAll('p') ?? [])].at(-1)
    if (!copy) return null

    const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT)
    let last: Text | null = null

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node instanceof Text && /\S/.test(node.data)) last = node
    }

    return last && { node: last, end: last.data.trimEnd().length }
  }

  // Out of the word, centred on it with its bottom on the baseline
  const popCoin = (word: HTMLSpanElement, stageRect: DOMRect) => {
    const rect = word.getBoundingClientRect()
    const { ascent, descent } = fontMetrics(word)
    const baseline = (rect.top + rect.bottom) / 2 + (ascent - descent) / 2

    flyingCoins.value = [
      ...flyingCoins.value.slice(1 - MAX_FLYING_COINS),
      {
        id: coinId++,
        x: (rect.left + rect.right) / 2 - (COIN_WIDTH / 2) * scale() - stageRect.left,
        y: baseline - SIZE * scale() - stageRect.top,
      },
    ]
  }

  const removeCoin = (id: number) => {
    flyingCoins.value = flyingCoins.value.filter((coin) => coin.id !== id)
  }

  // Pops the word at a stage point up and back, like a bonked block
  const bumpWord = (x: number, y: number) => {
    unbumpWord()

    const stageEl = toValue(stage)
    if (isEditor || !stageEl) return playSound('bump')

    const stageRect = stageEl.getBoundingClientRect()
    const caret = caretAt(stageRect.left + x * scale(), stageRect.top + y * scale())
    const node = caret?.node

    // A spent coin block just thuds
    if (!caret || !(node instanceof Text) || !toValue(lockup)?.contains(node) || spent?.span.contains(node))
      return playSound('bump')

    const text = node.data
    let start = caret.offset
    let end = caret.offset

    while (start > 0 && /\S/.test(text[start - 1] ?? '')) start--
    while (end < text.length && /\S/.test(text[end] ?? '')) end++

    if (start === end) return playSound('bump')

    const coin = coinWord()
    const isCoin = coins < COINS && coin?.node === node && coin.end === end
    const isSpent = isCoin && ++coins === COINS

    playSound(isCoin ? 'coin' : 'bump')

    if (prefersReducedMotion.value && !isSpent) return

    const word = node.splitText(start)
    const tail = word.splitText(end - start)
    const span = document.createElement('span')

    // Inline-block, as transforms don't apply to plain inline boxes. Layered over the stage, so the coin comes out from
    // behind this word but passes in front of the rest.
    span.className = isSpent ? 'relative z-1 inline-block opacity-50' : 'relative z-1 inline-block'
    word.replaceWith(span)
    span.append(word)

    if (isCoin && !prefersReducedMotion.value) popCoin(span, stageRect)

    const animation = prefersReducedMotion.value
      ? null
      : span.animate([{ translate: '0 0' }, { translate: `0 ${-BUMP_HEIGHT}em` }, { translate: '0 0' }], {
          duration: BUMP_DURATION,
        })

    // Spent: stays wrapped, so it keeps its fade
    if (isSpent) {
      spent = { node, text, span, tail }
      return
    }

    if (!animation) return

    animation.onfinish = unbumpWord
    bump = { node, text, span, tail, animation }
  }

  // The copy as Vue rendered it, every coin back in the block
  const resetWords = () => {
    unbumpWord()
    unspendWord()
    coins = 0
    flyingCoins.value = []
  }

  onScopeDispose(unbumpWord)

  return { flyingCoins, removeCoin, bumpWord, resetWords }
}
