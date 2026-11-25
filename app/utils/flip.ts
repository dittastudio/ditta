import { gsap } from 'gsap'

interface GlideOptions {
  // Seconds, or worked out from the distance (px) the glide has to cover
  duration: number | ((distance: number) => number)
  ease: string
  // Seconds to hold where it was before easing home
  delay?: number
}

// One query for every glide, made on first use (client only)
let reducedMotion: MediaQueryList | undefined

/**
 * The play half of a FLIP. The layout has already moved `el`; this draws it `offset` px back along `axis`, where it
 * was, and eases it home. A glide still running on the same axis is carried on from wherever it has got to, so the
 * motion never restarts from a jump. Does nothing under reduced motion or for a move under a pixel.
 */
export function glide(el: HTMLElement, axis: 'x' | 'y', offset: number, { duration, ease, delay = 0 }: GlideOptions) {
  reducedMotion ??= matchMedia('(prefers-reduced-motion: reduce)')
  if (reducedMotion.matches) return

  const from = offset + Number(gsap.getProperty(el, axis))
  if (Math.abs(from) < 1) return

  return gsap.fromTo(
    el,
    { [axis]: from },
    {
      [axis]: 0,
      duration: typeof duration === 'function' ? duration(Math.abs(from)) : duration,
      ease,
      delay,
      overwrite: true,
      clearProps: 'transform',
    },
  )
}

/**
 * Takes a leaving element out of the flow where it stands, so it can fade in place while the rest close up around it.
 * `false` puts it back.
 */
export function liftInPlace(el: HTMLElement, lifted = true) {
  Object.assign(el.style, {
    position: lifted ? 'absolute' : '',
    top: lifted ? `${el.offsetTop}px` : '',
    left: lifted ? `${el.offsetLeft}px` : '',
    width: lifted ? `${el.offsetWidth}px` : '',
  })
}
