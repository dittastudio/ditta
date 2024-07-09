import { colours } from '@/tailwind.config'

export default function useAccentColour() {
  const accent = useState('accent', (): keyof typeof colours => 'pink')
  const hex = computed(() => colours[accent.value])
  const keys: (keyof typeof colours)[] = [
    'blue',
    'pink',
    'pink-darker',
    'orange',
    'green',
    'purple',
  ]

  const setRandom = () => {
    const selection = keys[Math.floor(Math.random() * keys.length)]
    accent.value = selection
  }

  return ({
    name: accent,
    hex,
    setRandom,
  })
}
