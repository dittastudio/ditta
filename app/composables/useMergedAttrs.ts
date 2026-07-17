export function useMergedAttrs(classes: string = '') {
  const attrs = useAttrs()

  console.log(attrs.class, typeof attrs.class)

  const merged = computed(() => ({
    ...attrs,
    class: typeof attrs.class === 'string' ? twMerge(classes, attrs.class) : classes,
  }))

  return merged
}
