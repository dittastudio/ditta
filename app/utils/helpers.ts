const wait = (ms: number = 0) => new Promise((resolve) => setTimeout(resolve, ms))

const clearSelection = () => {
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) selection.removeAllRanges()
}

export { clearSelection, wait }
