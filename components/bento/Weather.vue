<script lang="ts" setup>
import type { BentoWeatherStoryblok } from '@/types/storyblok'
// import WeatherCloud from '@/assets/icons/weather/cloud.svg'
import WeatherCloudy from '@/assets/icons/weather/cloudy.svg'
import WeatherDrizzle from '@/assets/icons/weather/drizzle.svg'
import WeatherFog from '@/assets/icons/weather/fog.svg'
import WeatherFrost from '@/assets/icons/weather/frost.svg'
import WeatherRainHeavy from '@/assets/icons/weather/rain-heavy.svg'
import WeatherRain from '@/assets/icons/weather/rain.svg'
import WeatherSunny from '@/assets/icons/weather/sunny.svg'
import WeatherSunshine from '@/assets/icons/weather/sunshine.svg'
import WeatherThunder from '@/assets/icons/weather/thunder.svg'

const info = {
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
  301: { icon: WeatherDrizzle, description: `Drizzle` },
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

  701: { icon: WeatherFog, description: `Mist` },
  711: { icon: WeatherFog, description: `Smoke` },
  721: { icon: WeatherFog, description: `Haze haze` },
  731: { icon: WeatherFog, description: `Dust sand/dust whirls` },
  741: { icon: WeatherFog, description: `Fog` },
  751: { icon: WeatherFog, description: `Sand` },
  761: { icon: WeatherFog, description: `Dust` },
  762: { icon: WeatherFog, description: `Ash volcanic ash` },
  771: { icon: WeatherFog, description: `Squall` },
  781: { icon: WeatherFog, description: `Tornado` },

  800: { icon: WeatherSunny, description: `Clear skies out there. Unusual for London town.` },
  801: { icon: WeatherCloudy, description: `It's a bit cloudy out, innit?` },
  802: { icon: WeatherCloudy, description: `Scattered clouds` },
  803: { icon: WeatherCloudy, description: `Broken clouds` },
  804: { icon: WeatherCloudy, description: `That British classic of overcast clouds` },
}

interface Props {
  block: BentoWeatherStoryblok
}

const { block } = defineProps<Props>()
const runtimeConfig = useRuntimeConfig()
const latitude = 51.509865
const longitude = -0.118092
const payload = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${runtimeConfig.public.WEATHER_API_KEY}&units=metric`

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

const { data, error } = await useAsyncData<WeatherResponse>('weather', async () => await $fetch(payload), {
  transform: (data: WeatherResponse): TransformedWeatherData => ({
    main: data.main,
    weather: data.weather[0],
  }),
})
</script>

<template>
  <div
    v-editable="block"
    class="@container w-full h-full flex flex-col p-20 bg-gradient-to-t from-pink to-orange"
  >
    <h4 class="text-20 font-bold text-offblack">
      Londinium
    </h4>

    <template v-if="data">
      <div class="grid grid-cols-2 gap-8 items-center">
        <p class="text-40 @3xs:text-65 @2xs:text-[85px] @xs:text-[110px] text-offblack font-bold">
          {{ Math.round(data.main.temp) }}&deg;
        </p>

        <Component
          :is="info[data.weather.id as keyof typeof info].icon || WeatherSunshine"
          class="size-full ml-auto"
        />
      </div>

      <p class="text-12 font-bold text-offblack mt-auto">
        {{ info[data.weather.id as keyof typeof info]?.description || data.weather.description }}
      </p>
    </template>

    <template v-else-if="error || !data">
      <p>Problem getting weather</p>
    </template>
  </div>
</template>
