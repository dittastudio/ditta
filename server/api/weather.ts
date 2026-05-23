interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    weather_code: number
  }
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code === 1) return '🌤️'
  if (code === 2) return '⛅️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌧️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

export default defineCachedEventHandler(
  async () => {
    try {
      const data = await $fetch<OpenMeteoResponse>('https://api.open-meteo.com/v1/forecast', {
        query: {
          latitude: 51.5074,
          longitude: -0.1278,
          current: 'temperature_2m,weather_code',
          timezone: 'Europe/London',
          forecast_days: 1,
        },
      })

      return {
        temperature: Math.round(data.current.temperature_2m),
        emoji: weatherEmoji(data.current.weather_code),
      }
    } catch {
      return {
        temperature: 0,
        emoji: weatherEmoji(3),
      }
    }
  },
  { maxAge: 60 * 10 },
)
