// Small Mario with Super Mario Bros. (NES) physics: pure state and stepping, no DOM or Vue.
// Everything runs in sprite pixels per 1/60s frame; one sprite pixel = brick size / 16.

export const SIZE = 16 // sprite px, and a brick is the same
export const STEP = 1000 / 60 // ms per physics frame
export const HITBOX_INSET = 2 // sprite px off each side: a 12px-wide body, like SMB's small Mario

// SMB's fixed-point values, kept in its hex so they can be checked against the original: 0x01000 = 1 px/frame
const nes = (value: number) => value / 0x1000
// Horizontal values only, so running faster than the NES leaves jump height alone
const SPEED_BOOST = 1.5
const nesX = (value: number) => nes(value) * SPEED_BOOST
// Takeoff velocity only; height grows with its square, so 1.1 is about 20% higher
const JUMP_BOOST = 1.1
const nesY = (value: number) => nes(value) * JUMP_BOOST

const MIN_WALK = nesX(0x00130) // starting from a standstill snaps straight to this
const WALK_ACCEL = nesX(0x00098)
const RUN_ACCEL = nesX(0x000e4) // B held
const RELEASE_DECEL = nesX(0x000d0) // no input, or over the speed cap
const SKID_DECEL = nesX(0x001a0) // input against current direction
const SKID_TURN = nesX(0x00900) // a skid below this stops dead and turns round
const WALK_SPEED = nesX(0x01900)
const RUN_SPEED = nesX(0x02900)
const RUN_HOLD = 10 // frames run speed lingers after B is released
const AIR_FAST = nesX(0x01d00) // takeoff speed that keeps run speed in the air and softens backward braking
const FALL_SPEED = nes(0x04800) // reaching this knocks him back to FALL_RESET
const FALL_RESET = nes(0x04000)
const ANIM_RUN = nesX(0x01c00) // walk cycle: 2 frames per step above this
const ANIM_WALK = nesX(0x00e00) // 4 above this, 7 below

// Picked by horizontal speed at takeoff and kept for the whole jump.
// Holding A while rising uses the light gravity: tap for a hop, hold for full height.
const JUMPS = [
  { from: nesX(0x02500), velocity: nesY(0x05000), gravityHeld: nes(0x00280), gravity: nes(0x00900) },
  { from: nesX(0x01000), velocity: nesY(0x04000), gravityHeld: nes(0x001e0), gravity: nes(0x00600) },
  { from: 0, velocity: nesY(0x04000), gravityHeld: nes(0x00200), gravity: nes(0x00700) },
] as const
const JUMP_STILL = JUMPS[2]

const PIPE_SPEED = 0.25 // sprite px per frame sliding out of the pipe

// Dying: a hop up, then a drop through everything, slower than a jump so it reads
const DEATH_JUMP = 3 // sprite px per frame
const DEATH_GRAVITY = 0.12

// Sprite sheet columns
const Frame = { Idle: 0, Walk: 1, Jump: 4, Die: 5 } as const
const WALK_FRAMES = 3

// A line of text, from cap height down to the baseline. One-way platform: he passes up through it and
// lands on top. Only a block's last line is also a ceiling, so he bonks jumping from underneath but can
// jump in from the side and climb the ragged edge.
export interface Line {
  left: number
  right: number
  top: number
  bottom: number
}

// Lines per heading or paragraph, top to bottom. The bricks are the floor at y = 0.
export type Blocks = Line[][]

// A brick-sized block, solid from every side, even before it's seen. Top left, in sprite px.
export interface Box {
  left: number
  top: number
}

// The box, or a text line by its place in the blocks
export type Ledge = [block: number, line: number] | 'box'

export interface Input {
  left: boolean
  right: boolean
  jump: boolean // A held
  run: boolean // B held
  jumpPressed: boolean // A went down since the last step
}

export interface Hooks {
  onJump: () => void
  onBump: (x: number, y: number) => void // ceiling hit, at a point on the line he hit
  onBumpBox: () => void
  onBumpRoof: () => void
  onFloor: () => void // landed on the bricks
}

export const createInput = (): Input => ({ left: false, right: false, jump: false, run: false, jumpPressed: false })

export const createMario = () => ({
  x: 0,
  y: 0, // feet
  vx: 0,
  vy: 0,
  facing: 1,
  frame: Frame.Idle as number,
  animTimer: 0,
  walkFrame: 0,
  grounded: true,
  runTimer: 0,
  jump: JUMP_STILL as (typeof JUMPS)[number],
  isAirFast: false,
  ledge: null as Ledge | null, // text line or box he's standing on; null for the bricks
})

export type Mario = ReturnType<typeof createMario>

const approach = (value: number, target: number, delta: number) =>
  value < target ? Math.min(value + delta, target) : Math.max(value - delta, target)

// Built once per box, not on every collision check of every frame. A new box comes with each measure.
const boxLines = new WeakMap<Box, Line>()

const boxLine = (box: Box): Line => {
  let line = boxLines.get(box)
  if (!line)
    boxLines.set(box, (line = { left: box.left, right: box.left + SIZE, top: box.top, bottom: box.top + SIZE }))
  return line
}

export const isSameLedge = (a: Ledge | null, b: Ledge | null) =>
  Array.isArray(a) && Array.isArray(b) ? a[0] === b[0] && a[1] === b[1] : a === b

export const ledgeLine = (ledge: Ledge | null, blocks: Blocks, box: Box | null) => {
  if (ledge === 'box') return box ? boxLine(box) : undefined
  return ledge ? blocks[ledge[0]]?.[ledge[1]] : undefined
}

// Falling from prevFeet to feet with a body spanning left to right: the first top crossed, the box before any text
export const findLanding = (
  left: number,
  right: number,
  prevFeet: number,
  feet: number,
  blocks: Blocks,
  box: Box | null,
) => {
  const isCrossed = (line: Line) => prevFeet <= line.top && feet >= line.top && right > line.left && left < line.right
  const solid = box && boxLine(box)
  if (solid && isCrossed(solid)) return { top: solid.top, ledge: 'box' as Ledge }

  let landing: { top: number; ledge: Ledge } | null = null

  for (const [blockIndex, lines] of blocks.entries()) {
    for (const [lineIndex, line] of lines.entries()) {
      if (isCrossed(line) && line.top < (landing?.top ?? Infinity))
        landing = { top: line.top, ledge: [blockIndex, lineIndex] }
    }
  }

  return landing
}

const land = (mario: Mario, top: number, ledge: Ledge) => {
  mario.y = top
  mario.vy = 0
  mario.grounded = true
  mario.ledge = ledge
}

const startJump = (mario: Mario, speed: number) => {
  mario.jump = JUMPS.find((jump) => speed >= jump.from) ?? JUMP_STILL
  mario.isAirFast = speed >= AIR_FAST
}

// Feet at (x, y), about to slide down out of a pipe
export const enterPipe = (mario: Mario, x: number, y: number) => {
  Object.assign(mario, createMario(), { x, y, grounded: false })
}

// Caught: frozen on his death frame, facing out as drawn
export const catchMario = (mario: Mario) => {
  Object.assign(mario, { vx: 0, vy: 0, facing: 1, frame: Frame.Die })
}

// Then the hop up, before the drop
export const startDeath = (mario: Mario) => {
  Object.assign(mario, { vy: -DEATH_JUMP, grounded: false, ledge: null })
}

// No collisions: he falls straight through the text and the bricks
export const stepDeath = (mario: Mario) => {
  mario.vy += DEATH_GRAVITY
  mario.y += mario.vy
}

// True once he's fully out of a pipe whose mouth his feet started at
export const stepPipe = (mario: Mario, mouth: number) => {
  mario.y = Math.min(mario.y + PIPE_SPEED, mouth + SIZE)
  return mario.y === mouth + SIZE
}

// Text reflowed under his feet: stay on the same line, or fall if it's gone
export const settleOnLedge = (body: Pick<Mario, 'ledge' | 'y' | 'grounded'>, blocks: Blocks, box: Box | null) => {
  if (!body.ledge) return

  const line = ledgeLine(body.ledge, blocks, box)

  if (line) {
    body.y = line.top
  } else {
    body.ledge = null
    body.grounded = false
  }
}

const collide = (mario: Mario, blocks: Blocks, box: Box | null, roof: number, hooks: Hooks, prevFeet: number) => {
  const left = mario.x + HITBOX_INSET
  const right = mario.x + SIZE - HITBOX_INSET
  const overlaps = (line: Line) => right > line.left && left < line.right
  const solid = box && boxLine(box)
  const isOverSolid = solid && overlaps(solid)

  if (mario.y < prevFeet) {
    // Rising: the first ceiling crossed is the lowest
    const prevHead = prevFeet - SIZE
    const head = mario.y - SIZE
    let ceiling: Line | undefined

    // The box before any text, as it's solid and text is one-way
    if (isOverSolid && prevHead >= solid.bottom && head < solid.bottom) {
      mario.y = solid.bottom + SIZE
      mario.vy = 0
      hooks.onBumpBox()
      return
    }

    for (const lines of blocks) {
      const line = lines.at(-1)

      if (
        line &&
        prevHead >= line.bottom &&
        head < line.bottom &&
        overlaps(line) &&
        line.bottom > (ceiling?.bottom ?? -Infinity)
      )
        ceiling = line
    }

    if (ceiling) {
      mario.y = ceiling.bottom + SIZE
      mario.vy = 0
      hooks.onBump(
        Math.min(Math.max(mario.x + SIZE / 2, ceiling.left), ceiling.right),
        (ceiling.top + ceiling.bottom) / 2,
      )
      return
    }

    if (head < roof) {
      mario.y = roof + SIZE
      mario.vy = 0
      hooks.onBumpRoof()
    }

    return
  }

  const landing = findLanding(left, right, prevFeet, mario.y, blocks, box)
  if (landing) land(mario, landing.top, landing.ledge)
}

// Walked or jumped into the box's side: back out to it, and stop
const collideSides = (mario: Mario, box: Box | null) => {
  if (!box) return

  const { left, right, top, bottom } = boxLine(box)
  const isLevel = mario.y > top && mario.y - SIZE < bottom
  const isInside = mario.x + SIZE - HITBOX_INSET > left && mario.x + HITBOX_INSET < right

  if (!isLevel || !isInside) return

  // By which half he's in, so it also holds if the box reflows onto him
  mario.x = mario.x + SIZE / 2 < left + SIZE / 2 ? left - SIZE + HITBOX_INSET : right - HITBOX_INSET
  mario.vx = 0
}

// One frame on a stage `width` sprite px wide, wrapping at the edges, under a solid `roof` (a y above the bricks)
export const step = (
  mario: Mario,
  input: Input,
  blocks: Blocks,
  box: Box | null,
  roof: number,
  width: number,
  hooks: Hooks,
) => {
  const direction = Number(input.right) - Number(input.left)
  const speed = Math.abs(mario.vx)
  const isForward = mario.vx === 0 || Math.sign(mario.vx) === direction

  if (input.run) mario.runTimer = RUN_HOLD
  else if (mario.runTimer > 0) mario.runTimer--

  if (mario.grounded) {
    const maxSpeed = mario.runTimer > 0 ? RUN_SPEED : WALK_SPEED

    if (direction === 0) {
      mario.vx = approach(mario.vx, 0, RELEASE_DECEL)
    } else if (!isForward) {
      mario.vx = speed < SKID_TURN ? 0 : approach(mario.vx, 0, SKID_DECEL)
    } else if (speed > maxSpeed) {
      // Let go of B at full tilt: bleed back down to walk speed
      mario.vx = approach(mario.vx, direction * maxSpeed, RELEASE_DECEL)
    } else if (speed < MIN_WALK) {
      mario.vx = direction * MIN_WALK
    } else {
      mario.vx = direction * Math.min(speed + (input.run ? RUN_ACCEL : WALK_ACCEL), maxSpeed)
    }
  } else if (direction !== 0) {
    // No friction in the air: momentum only changes with input, capped by how fast he took off
    const maxSpeed = mario.isAirFast ? RUN_SPEED : WALK_SPEED

    if (isForward) {
      const accel = speed >= WALK_SPEED ? RUN_ACCEL : WALK_ACCEL
      mario.vx = direction * Math.max(speed, Math.min(speed + accel, maxSpeed))
    } else {
      const decel = speed >= WALK_SPEED ? RUN_ACCEL : mario.isAirFast ? RELEASE_DECEL : WALK_ACCEL
      mario.vx = approach(mario.vx, direction * maxSpeed, decel)
    }
  }

  // Facing only turns on the ground, like the original
  if (mario.grounded && direction !== 0) mario.facing = direction

  // No buffering, like the original: A has to be pressed on the ground
  if (input.jumpPressed && mario.grounded) {
    startJump(mario, Math.abs(mario.vx))
    mario.vy = -mario.jump.velocity
    mario.grounded = false
    mario.ledge = null
    hooks.onJump()
  }

  input.jumpPressed = false

  if (!mario.grounded) {
    // Light gravity only while rising with A held; releasing early or starting to fall switches to heavy
    mario.vy += mario.vy < 0 && input.jump ? mario.jump.gravityHeld : mario.jump.gravity
    if (mario.vy >= FALL_SPEED) mario.vy = FALL_RESET

    const prevFeet = mario.y
    mario.y += mario.vy

    collide(mario, blocks, box, roof, hooks, prevFeet)

    if (!mario.grounded && mario.y >= 0) {
      mario.y = 0
      mario.vy = 0
      mario.grounded = true
      hooks.onFloor()
    }
  }

  mario.x += mario.vx
  collideSides(mario, box)

  // Ran off the end of a line
  const ledge = ledgeLine(mario.ledge, blocks, box)
  if (ledge && (mario.x + SIZE - HITBOX_INSET <= ledge.left || mario.x + HITBOX_INSET >= ledge.right)) {
    startJump(mario, Math.abs(mario.vx))
    mario.ledge = null
    mario.grounded = false
    mario.vy = 0
  }

  // Wrap once fully off either edge
  if (mario.x > width) mario.x -= width + SIZE
  else if (mario.x < -SIZE) mario.x += width + SIZE

  if (!mario.grounded) {
    mario.frame = Frame.Jump
  } else if (mario.vx === 0) {
    mario.frame = Frame.Idle
    mario.animTimer = 0
  } else {
    // Walk cycle steps through SMB's three speeds
    const animSpeed = Math.abs(mario.vx)
    const delay = animSpeed >= ANIM_RUN ? 2 : animSpeed >= ANIM_WALK ? 4 : 7

    if (mario.frame === Frame.Idle || mario.frame === Frame.Jump) {
      mario.animTimer = 0
    } else if (++mario.animTimer >= delay) {
      mario.walkFrame = (mario.walkFrame + 1) % WALK_FRAMES
      mario.animTimer = 0
    }

    mario.frame = Frame.Walk + mario.walkFrame
  }
}
