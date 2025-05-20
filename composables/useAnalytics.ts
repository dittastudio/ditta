export function useAnalytics() {
  // <script defer data-domain="ditta.studio" src="https://plausible.io/js/script.outbound-links.js"></script>
  // <script>window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }</script>

  return useScript({
    src: 'https://plausible.io/js/script.outbound-links.js',
    defer: true,
    attributes: {
      'data-domain': 'ditta.studio',
    },
  })
}
