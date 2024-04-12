export default function useAtMedia(query: string) {
  const mediaQuery = ref<MediaQueryList | undefined>(undefined)
  const matches = ref<boolean>(false)

  const setMatches = (value: boolean) => {
    matches.value = value
  }

  const onChange = (e: any) => {
    setMatches(e.matches)
  }

  onMounted(() => {
    mediaQuery.value = window.matchMedia(query)
    setMatches(mediaQuery.value.matches)
    mediaQuery.value.addEventListener('change', onChange)
  })

  onUnmounted(() => {
    mediaQuery.value?.removeEventListener('change', onChange)
  })

  return matches
}
