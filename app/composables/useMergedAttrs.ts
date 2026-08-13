export function useMergedAttrs(classes: string = '') {
  const attrs = useAttrs()

  const merged = computed(() => ({
    ...attrs,
    class: typeof attrs.class === 'string' ? twMerge(classes, attrs.class) : classes,
  }))

  return merged
}
