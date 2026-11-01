// The coin that pops out of a coin block (SMB's SetupJumpCoin / ProcJumpCoin / JCoinGfxHandler), precomputed
// once as a flipbook. Sprite pixels and 1/60s frames, like physics.ts.

import { STEP } from '@/utils/mario/physics'

export const COIN_WIDTH = 8 // sprite px; 16 tall, the same as a brick
export const COIN_FRAMES = 4 // sheet columns: front, ¾, edge, ¾ mirrored

// Speed is a signed whole-pixel byte, with gravity carried into it from a fraction byte, as on the NES
const SPEED = -5 // 0xfb px/frame, straight up
const GRAVITY = 0x50 // per 0x100 of a px/frame, each frame
const END_SPEED = 5 // falling this fast, it turns into the floatey score; here it just goes
const SPIN_EVERY = 2 // frames per sheet column

const RENDER_EVERY = 2 // drawn frames, matching Mario's ~30fps choppiness

const simulate = () => {
  const offsets = [0]
  let y = 0
  let speed = SPEED
  let force = 0
  let dummy = 0

  // ImposeGravity: the fraction accumulates into position, then gravity accumulates into speed
  while (speed !== END_SPEED) {
    dummy += force
    y += speed + (dummy >> 8)
    dummy &= 0xff

    force += GRAVITY
    speed += force >> 8
    force &= 0xff

    offsets.push(y)
  }

  return offsets.slice(0, -1) // the last frame is already the score
}

const offsets = simulate()

// Up 43 px and back down near where it started, 4 full spins over 32 frames
export const COIN_DURATION = offsets.length * STEP // ms

export const COIN_STEPS = offsets
  .filter((_, frame) => frame % RENDER_EVERY === 0)
  .map((y, index) => ({ y, frame: Math.floor((index * RENDER_EVERY) / SPIN_EVERY) % COIN_FRAMES }))
