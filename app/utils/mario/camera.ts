// Scrolls the page after Mario, the way Super Mario World's camera works:
// - Platform snapping: it re-frames him 3/4 of the way down when he lands on a new surface, and holds still through
//   jumps, so the page never bobs.
// - Cue focus: it nudges just far enough to bring the alien into view too, as long as he stays clear of the edges.
//   Too far apart, and he wins.
// - Looking: scrolling by hand is like SMW's L/R. It holds that view until he lands somewhere new.
// Either way he's never let near the top or bottom edge. Pure maths in page px; the caller reads the page and scrolls.
import type { Ledge } from '@/utils/mario/physics'

import { isSameLedge } from '@/utils/mario/physics'

const ANCHOR = 0.75 // of the visible height from its top, where he lands: low, so there's room to see him jump
const EDGE_TOP = 0.15 // of the visible height he's kept clear of at the top
const EDGE_BOTTOM = 0.1 // and at the bottom
const EASE = 0.12 // of the gap closed each display frame
const LOOK_TOLERANCE = 2 // px the page can sit off where the camera left it before it counts as scrolled by hand
const LOOK_GRACE = 30 // display frames after a hand scroll before the edges can pull back, so they never fight it

export const createCamera = (scroll: number) => ({
  y: scroll, // where it has scrolled to, unrounded, so the last few px of easing still land
  base: scroll, // the framing from his last landing, before any nudge for the alien
  target: scroll,
  ledge: undefined as Ledge | null | undefined, // the surface it last framed him on; undefined until the first
  isLooking: false, // scrolled by hand since
  sinceLook: 0, // display frames since the page last moved by hand
  lastTop: 0, // his top last frame, to tell when he moves
})

export type Camera = ReturnType<typeof createCamera>

interface Span {
  top: number
  bottom: number
}

interface View {
  scroll: number // where the page is now
  height: number // of the visible area: above the gamepad on touch screens
  maxScroll: number
  mario: Span // page px
  alien: Span | null // page px, once it's out
  grounded: boolean
  ledge: Ledge | null
}

// One display frame. Returns where to scroll to, or null to leave the page be.
export const stepCamera = (camera: Camera, { scroll, height, maxScroll, mario, alien, grounded, ledge }: View) => {
  // Moved by hand: wheel, scrollbar, keys or a finger, it's all the same from here
  if (Math.abs(scroll - camera.y) > LOOK_TOLERANCE) {
    camera.isLooking = true
    camera.sinceLook = 0
    camera.y = camera.base = camera.target = scroll
  } else {
    camera.sinceLook++
  }

  // A new surface: frame him on it, and any look is over
  if (grounded && (camera.ledge === undefined || !isSameLedge(camera.ledge, ledge))) {
    camera.ledge = ledge
    camera.isLooking = false
    camera.base = mario.bottom - height * ANCHOR
  }

  // The window he must stay inside: the range of scrolls that keep him clear of both edges
  const highest = mario.bottom - height * (1 - EDGE_BOTTOM)
  const lowest = mario.top - height * EDGE_TOP
  const isMoving = mario.top !== camera.lastTop
  camera.lastTop = mario.top

  // Near an edge, whether framed or looking: the view is pushed along with him. While looking, only once he moves,
  // and not straight after a hand scroll, so scrolling him off screen to read the page is allowed.
  if (!camera.isLooking || (isMoving && camera.sinceLook > LOOK_GRACE)) {
    camera.base = Math.min(Math.max(camera.base, highest), lowest)
  }

  camera.target = camera.base

  // Bring the alien in if it fits without pushing him out
  if (alien && !camera.isLooking) {
    const wanted = Math.min(
      Math.max(camera.base, alien.bottom - height * (1 - EDGE_BOTTOM)),
      alien.top - height * EDGE_TOP,
    )
    if (wanted >= highest && wanted <= lowest) camera.target = wanted
  }

  camera.target = Math.min(Math.max(camera.target, 0), maxScroll)

  const gap = camera.target - camera.y
  if (gap === 0) return null

  camera.y = Math.abs(gap) < 0.5 ? camera.target : camera.y + gap * EASE
  return camera.y
}
