export const useNowIsBetween = (from = '09:00', to = '18:00') => {
  const getTimeNow = (): string =>
    new Intl.DateTimeFormat('en-GB', {
      timeStyle: 'short',
      timeZone: 'Europe/London',
    })
      .format(new Date())

  const isBetween = ref(false)
  let raf: number | undefined

  const timeNow = getTimeNow()

  const setBetween = (time: string) => {
    isBetween.value = Boolean(time >= from && time <= to)
  }

  setBetween(timeNow)

  const update = () => {
    const timeNow = getTimeNow()

    setBetween(timeNow)
    raf = window.requestAnimationFrame(update)
  }

  onMounted(() => {
    raf = window.requestAnimationFrame(update)
  })

  onUnmounted(() => {
    if (raf) {
      window.cancelAnimationFrame(raf)
    }
  })

  return isBetween
}
