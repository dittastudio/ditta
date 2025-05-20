export function useAnalytics() {
  return useScript({
    src: 'https://plausible.io/js/script.outbound-links.js',
    defer: true,
  })
}
