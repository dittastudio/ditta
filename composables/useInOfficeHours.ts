export const useInOfficeHours = () => {
  const getTimeNow = (): string[] =>
    new Intl.DateTimeFormat('en-GB', {
      timeStyle: 'short',
      timeZone: 'Europe/London',
    })
      .format(new Date())
      .split(' ')

  const isOpen = ref(false)
  let raf: number | undefined

  const [timeNow] = getTimeNow()

  const setOpen = (time: string) => {
    if (time >= '09:00' && time <= '18:00') {
      isOpen.value = true
    }
    else if (time >= '18:01' && time <= '08:59') {
      isOpen.value = false
    }
  }

  setOpen(timeNow)

  const update = () => {
    const [timeNow] = getTimeNow()

    setOpen(timeNow)
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

  return isOpen
}
