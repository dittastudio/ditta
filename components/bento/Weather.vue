<script lang="ts" setup>
import type { BentoWeatherStoryblok } from '@/types/storyblok'
// import WeatherCloud from '@/assets/icons/weather/cloud.svg'
import WeatherCloudy from '@/assets/icons/weather/cloudy.svg'
import WeatherDrizzle from '@/assets/icons/weather/drizzle.svg'
import WeatherFog from '@/assets/icons/weather/fog.svg'
import WeatherFrost from '@/assets/icons/weather/frost.svg'
import WeatherMoon from '@/assets/icons/weather/moon.svg'
import WeatherRainHeavy from '@/assets/icons/weather/rain-heavy.svg'
import WeatherRain from '@/assets/icons/weather/rain.svg'
import WeatherSunny from '@/assets/icons/weather/sunny.svg'
import WeatherSunshine from '@/assets/icons/weather/sunshine.svg'
import WeatherThunder from '@/assets/icons/weather/thunder.svg'

interface Props {
  block: BentoWeatherStoryblok
}

const { block } = defineProps<Props>()
const runtimeConfig = useRuntimeConfig()
const latitude = 51.509865
const longitude = -0.118092
const payload = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${runtimeConfig.public.WEATHER_API_KEY}&units=metric`
const isNight = useNowIsBetween('21:00', '23:59') // https://openweathermap.org/weather-conditions
const classes = computed(() => isNight.value ? 'from-purple-darker to-pink' : 'from-pink to-orange')

const info = computed(() => ({
  200: { icon: WeatherThunder, description: `Thunderstorm with light rain` },
  201: { icon: WeatherThunder, description: `Thunderstorm with rain` },
  202: { icon: WeatherThunder, description: `Thunderstorm with heavy rain` },
  210: { icon: WeatherThunder, description: `Light thunderstorm` },
  211: { icon: WeatherThunder, description: `Thunderstorm` },
  212: { icon: WeatherThunder, description: `Heavy thunderstorm` },
  221: { icon: WeatherThunder, description: `Ragged thunderstorm` },
  230: { icon: WeatherThunder, description: `Thunderstorm with light drizzle` },
  231: { icon: WeatherThunder, description: `Thunderstorm with drizzle` },
  232: { icon: WeatherThunder, description: `Thunderstorm with heavy drizzle` },

  300: { icon: WeatherDrizzle, description: `Light intensity drizzle` },
  301: { icon: WeatherDrizzle, description: `Drizzle...oh we love it` },
  302: { icon: WeatherDrizzle, description: `Heavy intensity drizzle` },
  310: { icon: WeatherDrizzle, description: `Light intensity drizzle rain` },
  311: { icon: WeatherDrizzle, description: `Drizzle rain` },
  312: { icon: WeatherDrizzle, description: `Heavy intensity drizzle rain` },
  313: { icon: WeatherDrizzle, description: `Shower rain and drizzle` },
  314: { icon: WeatherDrizzle, description: `Heavy shower rain and drizzle` },
  321: { icon: WeatherDrizzle, description: `Shower drizzle` },

  500: { icon: WeatherRain, description: `Light rain. Classic London!` },
  501: { icon: WeatherRain, description: `Moderate rain. Classic London!` },
  502: { icon: WeatherRainHeavy, description: `Heavy intensity rain. Classic London!` },
  503: { icon: WeatherRainHeavy, description: `Very heavy rain. Classic London!` },
  504: { icon: WeatherRainHeavy, description: `Extreme rain. Classic London!` },
  511: { icon: WeatherRain, description: `Freezing rain. Classic London!` },
  520: { icon: WeatherRain, description: `Light intensity showers. Classic London!` },
  521: { icon: WeatherRain, description: `Showery rain. Classic London!` },
  522: { icon: WeatherRainHeavy, description: `Heavily intense rain. Classic London!` },
  531: { icon: WeatherRain, description: `Ragged shower rain. Classic London!` },

  600: { icon: WeatherFrost, description: `Light snow` },
  601: { icon: WeatherFrost, description: `Snow` },
  602: { icon: WeatherFrost, description: `Heavy snow` },
  611: { icon: WeatherFrost, description: `Sleet` },
  612: { icon: WeatherFrost, description: `Light shower sleet` },
  613: { icon: WeatherFrost, description: `Shower sleet` },
  615: { icon: WeatherFrost, description: `Light rain and snow` },
  616: { icon: WeatherFrost, description: `Rain and snow` },
  620: { icon: WeatherFrost, description: `Light shower snow` },
  621: { icon: WeatherFrost, description: `Shower snow` },
  622: { icon: WeatherFrost, description: `Heavy shower snow` },

  701: { icon: WeatherFog, description: `Mist. Kinda creepy` },
  711: { icon: WeatherFog, description: `Smokey fog out there` },
  721: { icon: WeatherFog, description: `Hazey atmosphere` },
  731: { icon: WeatherFog, description: `Dust sand/dust whirls` },
  741: { icon: WeatherFog, description: `Dickensian style fog` },
  751: { icon: WeatherFog, description: `Sand from the Sahara maybe?` },
  761: { icon: WeatherFog, description: `Dust gettin' up in ya business` },
  762: { icon: WeatherFog, description: `Volcanic ash from distant lands` },
  771: { icon: WeatherFog, description: `Beware of the squalls!` },
  781: { icon: WeatherFog, description: `Tornado party time` },

  800: { icon: isNight.value ? WeatherMoon : WeatherSunny, description: `Clear skies out there.` },
  801: { icon: WeatherCloudy, description: `It's a bit cloudy out, innit?` },
  802: { icon: WeatherCloudy, description: `Scattered clouds there be` },
  803: { icon: WeatherCloudy, description: `Broken clouds overhead` },
  804: { icon: WeatherCloudy, description: `That classic British overcast` },
}))

interface WeatherMain {
  feels_like: number
  humidity: number
  pressure: number
  temp: number
  temp_max: number
  temp_min: number
}

interface WeatherWeather {
  description: string
  icon: string
  id: number
  main: string
}

interface WeatherResponse {
  main: WeatherMain
  weather: WeatherWeather[]
}

interface TransformedWeatherData {
  main: WeatherMain
  weather: WeatherWeather
}

const { data, error, refresh } = await useAsyncData<WeatherResponse>(
  'weather',
  async () => await $fetch(payload),
  {
    transform: (data: WeatherResponse): TransformedWeatherData => ({
      main: data.main,
      weather: data.weather[0],
    }),
  },
)

let intervalRefresh: NodeJS.Timeout | undefined

onMounted(() => {
  refresh()

  intervalRefresh = setInterval(() => {
    refresh()
  }, 60 * 1000)
})

onUnmounted(() => {
  if (intervalRefresh) {
    clearInterval(intervalRefresh)
  }
})
</script>

<template>
  <div
    v-editable="block"
    class="w-full h-full grid grid-cols-1 grid-rows-[26px_1fr_20px] p-20 bg-gradient-to-t"
    :class="classes"
  >
    <h4 class="text-20 font-bold text-offblack">
      Londinium
    </h4>

    <template v-if="data">
      <div class="grid grid-cols-2 gap-8 items-center overflow-hidden">
        <svg
          viewBox="0 0 100 50"
          xmlns="http://www.w3.org/2000/svg"
          class="w-full h-auto"
        >
          <text
            x="0"
            y="0"
            dy="0.5em"
            class="text-offblack font-bold text-65"
            dominant-baseline="middle"
          >
            {{ Math.round(data.main.temp) }}&deg;
          </text>
        </svg>

        <Component
          :is="info[data.weather.id as keyof typeof info].icon || WeatherSunshine"
          class="w-auto h-full ml-auto"
        />
      </div>

      <p class="text-12 font-bold text-offblack mt-auto">
        {{ info[data.weather.id as keyof typeof info]?.description || data.weather.description }}
      </p>
    </template>

    <template v-else-if="error || !data">
      <p>Oh no, there was a problem getting the weather</p>
    </template>
  </div>
</template>
