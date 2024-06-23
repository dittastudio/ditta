export const useNowIsBetween = (from = '09:00', to = '18:00') => {
  const getTimeNow = (): string =>
    new Intl.DateTimeFormat('en-GB', {
      timeStyle: 'short',
      timeZone: 'Europe/London',
    })
      .format(new Date())

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const isBetween = ref(false)
  let interval: ReturnType<typeof setInterval>

  const setBetween = () => {
    const timeNow = getTimeNow()
    const timeMinutes = timeToMinutes(timeNow)
    const startMinutes = timeToMinutes(from)
    const endMinutes = timeToMinutes(to)

    if (endMinutes < startMinutes) {
      isBetween.value = timeMinutes >= startMinutes || timeMinutes <= endMinutes
    }
    else {
      isBetween.value = timeMinutes >= startMinutes && timeMinutes <= endMinutes
    }

    console.log('time now', timeNow)
    console.log('minutes', timeMinutes, startMinutes, endMinutes)
    console.log(`${timeNow} is between ${from} ${to}? `, isBetween.value)
  }

  setBetween()

  onMounted(() => {
    interval = setInterval(() => {
      setBetween()
    }, 1000)
  })

  onUnmounted(() => {
    clearInterval(interval)
  })

  return isBetween
}
