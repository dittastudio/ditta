// An alien that crawls Mario's world on its own: up out of the box and right along the text, down onto the bricks,
// turning on Mario whenever he's on the same line, box or bricks as it. Pure state and stepping, in sprite px per 1/60s frame like
// physics.ts.
import type { Blocks, Box, Ledge, Mario } from '@/utils/mario/physics'

import { HITBOX_INSET, SIZE, findLanding, isSameLedge, ledgeLine, settleOnLedge } from '@/utils/mario/physics'

export const ALIEN_WIDTH = 32 // sprite px, a sheet frame
export const ALIEN_HEIGHT = 21
export const ALIEN_FRAMES = 4

const CRAWL_SPEED = 0.5 // sprite px per frame, a Goomba's pace
const CHASE_SPEED = CRAWL_SPEED * 3 // walking Mario's pace; he can still outrun it
const RISE_SPEED = ALIEN_HEIGHT / 60 // out of the box in a second
const GRAVITY = 0.25
const FALL_SPEED = 4
const FRAME_DISTANCE = 4 // sprite px crawled per sheet frame, so the legs keep pace at either speed
const TURN_DISTANCE = 8 // sprite px past his centre before it turns back, so it never dithers under a jump
const REACT_FRAMES = 18 // ~300ms stock-still on spotting Mario, before it turns to him
const FOOT_INSET = 12 // off each side: it stands on its middle 8px, so it tips off an edge once halfway over
const BODY_INSET_X = 3 // hitbox off each side, clear of its antenna and tail tips
const BODY_INSET_TOP = 4

const centredOn = (box: Box) => box.left + SIZE / 2 - ALIEN_WIDTH / 2

// Sunk into the box to rise out of it, or already standing on top
export const createAlien = (box: Box, isRising: boolean) => {
  const depth = isRising ? ALIEN_HEIGHT : 0

  return {
    x: centredOn(box),
    y: box.top + depth, // feet
    vy: 0,
    depth, // sprite px still inside the box; drawn clipped at its top until 0
    direction: 1, // the sheet faces left, so this flips it
    frame: 0,
    distance: 0, // crawled since the last sheet frame
    grounded: !isRising,
    ledge: (isRising ? null : 'box') as Ledge | null, // null for the bricks
    isChasing: false,
    reactTimer: 0,
  }
}

export type Alien = ReturnType<typeof createAlien>

// Text reflowed: still rising out of the box wherever it went, or on the same line
export const settleAlien = (alien: Alien, blocks: Blocks, box: Box | null) => {
  if (alien.depth > 0 && box) {
    alien.x = centredOn(box)
    alien.y = box.top + alien.depth
  } else {
    settleOnLedge(alien, blocks, box)
  }
}

// Harmless while it's still rising
export const isTouching = (alien: Alien, mario: Mario) =>
  alien.depth === 0 &&
  mario.x + SIZE - HITBOX_INSET > alien.x + BODY_INSET_X &&
  mario.x + HITBOX_INSET < alien.x + ALIEN_WIDTH - BODY_INSET_X &&
  mario.y > alien.y - ALIEN_HEIGHT + BODY_INSET_TOP &&
  mario.y - SIZE < alien.y

// Where Mario is: his centre, and his last surface (null for the bricks), so a jump doesn't shake it off
export interface Target {
  x: number
  ledge: Ledge | null
}

// One frame on a stage `width` sprite px wide, wrapping at the edges
export const stepAlien = (alien: Alien, blocks: Blocks, box: Box | null, width: number, mario: Target) => {
  if (alien.depth > 0) {
    alien.depth = box ? Math.max(alien.depth - RISE_SPEED, 0) : 0
    if (box) alien.y = box.top + alien.depth

    if (alien.depth === 0) {
      alien.grounded = true
      alien.ledge = 'box'
    }

    return
  }

  // On the same line, box or bricks: it freezes, then turns to him and gives chase. Mid-fall it pays him no mind.
  const isChasing = alien.grounded && isSameLedge(alien.ledge, mario.ledge)
  if (isChasing && !alien.isChasing) alien.reactTimer = REACT_FRAMES
  alien.isChasing = isChasing

  if (alien.reactTimer > 0 && --alien.reactTimer > 0) return

  if (isChasing) {
    const offset = mario.x - (alien.x + ALIEN_WIDTH / 2)
    if (Math.abs(offset) > TURN_DISTANCE) alien.direction = Math.sign(offset)
  }

  const left = () => alien.x + FOOT_INSET
  const right = () => alien.x + ALIEN_WIDTH - FOOT_INSET

  if (!alien.grounded) {
    alien.vy = Math.min(alien.vy + GRAVITY, FALL_SPEED)

    const prevFeet = alien.y
    alien.y += alien.vy

    const landing = findLanding(left(), right(), prevFeet, alien.y, blocks, box)

    if (landing || alien.y >= 0) {
      alien.y = landing?.top ?? 0
      alien.vy = 0
      alien.grounded = true
      alien.ledge = landing?.ledge ?? null
    }
  }

  // Keeps crawling as it falls, like a Goomba off a ledge
  const speed = isChasing ? CHASE_SPEED : CRAWL_SPEED
  alien.x += alien.direction * speed
  alien.distance += speed

  if (alien.distance >= FRAME_DISTANCE) {
    alien.distance -= FRAME_DISTANCE
    alien.frame = (alien.frame + 1) % ALIEN_FRAMES
  }

  // Crawled off the end of a line or the box
  if (alien.ledge) {
    const ledge = ledgeLine(alien.ledge, blocks, box)

    if (!ledge || right() <= ledge.left || left() >= ledge.right) {
      alien.ledge = null
      alien.grounded = false
    }
  }

  // Wrap once fully off either edge
  if (alien.x > width) alien.x -= width + ALIEN_WIDTH
  else if (alien.x < -ALIEN_WIDTH) alien.x += width + ALIEN_WIDTH
}
