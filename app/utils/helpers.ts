const wait = (ms: number = 0) => new Promise((resolve) => setTimeout(resolve, ms))

const clearSelection = () => {
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) selection.removeAllRanges()
}

// For lazy blocks: hydrate a screen ahead of arriving, so their scroll animations are set up before they're on screen
const HYDRATE_NEARBY = { rootMargin: '100%' }

export { HYDRATE_NEARBY, clearSelection, wait }
