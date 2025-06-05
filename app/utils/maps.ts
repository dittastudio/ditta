const colStartMap: Record<string, string> = {
  1: 'md:col-start-1',
  2: 'md:col-start-2',
  3: 'md:col-start-3',
  4: 'md:col-start-4',
  5: 'md:col-start-5',
  6: 'md:col-start-6',
  7: 'md:col-start-7',
  8: 'md:col-start-8',
  9: 'md:col-start-9',
  10: 'md:col-start-10',
  11: 'md:col-start-11',
  12: 'md:col-start-12',
} as const

const colEndMap: Record<string, string> = {
  2: 'md:col-end-2',
  3: 'md:col-end-3',
  4: 'md:col-end-4',
  5: 'md:col-end-5',
  6: 'md:col-end-6',
  7: 'md:col-end-7',
  8: 'md:col-end-8',
  9: 'md:col-end-9',
  10: 'md:col-end-10',
  11: 'md:col-end-11',
  12: 'md:col-end-12',
  13: 'md:col-end-13',
} as const

export {
  colEndMap,
  colStartMap,
}
