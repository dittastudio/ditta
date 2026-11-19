/** One filled pixel of the art, in grid cells from its top left */
export interface BiteCell {
  x: number
  y: number
  color: string
}

interface Point {
  x: number
  y: number
}

// About this many bites to finish it. The last one takes whatever's left, so there are never crumbs to hunt down.
const BITES = 8
// Bits cut off from the rest by a bite go with it rather than floating on their own
const ISLAND = 15

type Grid = (string | null)[][]

// Reads pixel art saved as one path per colour, each a run of `M x y h w v h h-w z` rectangles on a whole-cell grid
function parse(svg: string) {
  const [, , width = 0, height = 0] =
    svg
      .match(/viewBox="([\d.\s]+)"/)?.[1]
      ?.split(/\s+/)
      .map(Number) ?? []
  const grid: Grid = Array.from({ length: height }, () => Array<string | null>(width).fill(null))

  for (const [, fill = '', d = ''] of svg.matchAll(/<path fill="([^"]+)" d="([^"]+)"/g)) {
    for (const [, x, y, w, h] of d.matchAll(/M(\d+) (\d+)h(\d+)v(\d+)/g)) {
      for (let row = Number(y); row < Number(y) + Number(h); row++) {
        for (let col = Number(x); col < Number(x) + Number(w); col++) grid[row]![col] = fill
      }
    }
  }

  return { grid, width, height }
}

/**
 * Pixel art that can be eaten a bite at a time. `paths` redraws what's left, one path per colour, and `bite` takes a
 * scalloped chunk out at the nearest edge to a point, returning the cells it took so they can fall as crumbs.
 */
export const useBites = (svg: string) => {
  const { grid: whole, width, height } = parse(svg)
  const total = whole.flat().filter(Boolean).length

  const cells = shallowRef<Grid>(whole.map((row) => [...row]))
  const remaining = ref(total)
  const taken = ref(0)

  const isEmpty = computed(() => remaining.value === 0)
  const bitesLeft = computed(() => (isEmpty.value ? 0 : BITES - taken.value))

  // Row runs per colour, in the order the colours first appear
  const paths = computed(() => {
    const runs = new Map<string, string>()

    cells.value.forEach((row, y) => {
      let x = 0

      while (x < width) {
        const color = row[x]
        if (!color) {
          x++
          continue
        }

        const start = x
        while (row[x] === color) x++
        runs.set(color, `${runs.get(color) ?? ''}M${start} ${y}h${x - start}v1h-${x - start}z`)
      }
    })

    return [...runs].map(([fill, d]) => ({ fill, d }))
  })

  const filled = () => {
    const list: BiteCell[] = []
    cells.value.forEach((row, y) => row.forEach((color, x) => color && list.push({ x, y, color })))
    return list
  }

  const isFilled = (grid: Grid, x: number, y: number) => !!grid[y]?.[x]

  // A cell with open air on at least one side: where a bite can start
  const isEdge = (grid: Grid, { x, y }: Point) =>
    !isFilled(grid, x - 1, y) || !isFilled(grid, x + 1, y) || !isFilled(grid, x, y - 1) || !isFilled(grid, x, y + 1)

  // Keyboard bites eat from the right, halfway down what's left
  function keyboardPoint(list: BiteCell[]): Point {
    const rows = list.map((cell) => cell.y)
    const middle = Math.round((Math.min(...rows) + Math.max(...rows)) / 2)
    const row = list.filter((cell) => cell.y === middle)
    const right = Math.max(...(row.length ? row : list).map((cell) => cell.x))

    return { x: right + 1.5, y: middle + 0.5 }
  }

  // A round bite centred just past the edge, its rim ringed with teeth: a disc with small circles round its edge, so
  // the inside of the bite is scalloped at any size
  function biteShape(edge: BiteCell, centre: Point, radius: number) {
    let nx = edge.x + 0.5 - centre.x
    let ny = edge.y + 0.5 - centre.y
    const length = Math.hypot(nx, ny) || 1
    nx /= length
    ny /= length

    const tooth = Math.max(1.4, radius * 0.3)
    const ring = radius - tooth
    const middle = { x: edge.x + 0.5 + nx * radius * 0.4, y: edge.y + 0.5 + ny * radius * 0.4 }
    const count = Math.max(5, Math.ceil((2 * Math.PI * ring) / (tooth * 1.7)))
    const teeth = Array.from({ length: count }, (_, i) => ({
      x: middle.x + Math.cos((i / count) * 2 * Math.PI) * ring,
      y: middle.y + Math.sin((i / count) * 2 * Math.PI) * ring,
    }))

    return (x: number, y: number) => {
      const px = x + 0.5
      const py = y + 0.5
      return (
        Math.hypot(px - middle.x, py - middle.y) < ring || teeth.some((t) => Math.hypot(px - t.x, py - t.y) < tooth)
      )
    }
  }

  // Groups left after a bite that are cut off and too small to read as burger
  function islands(grid: Grid) {
    const seen = new Set<string>()
    const groups: Point[][] = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!grid[y]![x] || seen.has(`${x},${y}`)) continue

        const group: Point[] = []
        const stack = [{ x, y }]
        seen.add(`${x},${y}`)

        while (stack.length) {
          const cell = stack.pop()!
          group.push(cell)

          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const) {
            const next = { x: cell.x + dx, y: cell.y + dy }
            const key = `${next.x},${next.y}`
            if (isFilled(grid, next.x, next.y) && !seen.has(key)) {
              seen.add(key)
              stack.push(next)
            }
          }
        }

        groups.push(group)
      }
    }

    const largest = Math.max(0, ...groups.map((group) => group.length))
    return groups.filter((group) => group.length < ISLAND && group.length < largest).flat()
  }

  /**
   * Takes a bite at the edge nearest `at` (in grid cells), or from the right for a keyboard bite. Returns the cells
   * it took, and the direction the bite faces, for the crumbs to fly out along.
   */
  function bite(at?: Point) {
    const list = filled()
    if (!list.length) return { removed: [], direction: { x: 0, y: 0 } }

    const centre = {
      x: list.reduce((sum, cell) => sum + cell.x + 0.5, 0) / list.length,
      y: list.reduce((sum, cell) => sum + cell.y + 0.5, 0) / list.length,
    }

    const point = at ?? keyboardPoint(list)
    const edges = list.filter((cell) => isEdge(cells.value, cell))
    const edge = edges.reduce((best, cell) =>
      Math.hypot(cell.x + 0.5 - point.x, cell.y + 0.5 - point.y) <
      Math.hypot(best.x + 0.5 - point.x, best.y + 0.5 - point.y)
        ? cell
        : best,
    )

    const direction = { x: edge.x + 0.5 - centre.x, y: edge.y + 0.5 - centre.y }
    const isLast = taken.value >= BITES - 1
    const next = cells.value.map((row) => [...row])
    let removed: BiteCell[]

    if (isLast) {
      removed = list
    } else {
      // The smallest bite that takes its share of what's left, so every bite is about the same size. A bigger radius
      // never takes less, so it's found by halving the range rather than trying every size.
      const share = list.length / (BITES - taken.value)
      const take = (radius: number) => {
        const inBite = biteShape(edge, centre, radius)
        return list.filter((cell) => inBite(cell.x, cell.y))
      }

      let low = 3
      let high = 12
      while (high - low > 0.25) {
        const middle = (low + high) / 2
        if (take(middle).length < share) low = middle
        else high = middle
      }

      removed = take(high)
    }

    for (const cell of removed) next[cell.y]![cell.x] = null

    if (!isLast) {
      for (const { x, y } of islands(next)) {
        removed.push({ x, y, color: next[y]![x]! })
        next[y]![x] = null
      }
    }

    cells.value = next
    remaining.value -= removed.length
    taken.value++

    return { removed, direction }
  }

  function reset() {
    cells.value = whole.map((row) => [...row])
    remaining.value = total
    taken.value = 0
  }

  return { width, height, paths, total, remaining, isEmpty, bitesLeft, bite, reset }
}
