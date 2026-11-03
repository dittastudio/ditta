import { ensureReady, defineSound, getDestination } from '@web-kits/audio'
// Available sounds: tap, click, keyPress, toggleOn, toggleOff, checkbox, select,
// deselect, hover, tabSwitch, expand, collapse, pageEnter, pageExit, success,
// error, warning, notification, info, copy, send, _delete, undo, pop, swoosh, slide
import { toggleOn, toggleOff } from '@@/.web-kits/playful'

const isAudioOn = ref(false)
const soundOn = defineSound(toggleOn)
const soundOff = defineSound(toggleOff)

const samples = new Map<string, Promise<AudioBuffer>>() // decoded once per URL, shared across components
const voices = new Set<AudioBufferSourceNode>() // every sample playing, so turning audio off silences them
let mutes = 0 // a play still waiting on its sample when this moves on was muted, even if audio has come back on since

const stopVoices = (playing: Set<AudioBufferSourceNode>) => playing.forEach((voice) => voice.stop())

const loadSample = (url: string) => {
  let sample = samples.get(url)

  if (!sample) {
    sample = ensureReady().then(async (context) => context.decodeAudioData(await (await fetch(url)).arrayBuffer()))
    sample.catch(() => samples.delete(url)) // let a failed load try again
    samples.set(url, sample)
  }

  return sample
}

// An audio file played through the same output as the synthesised sounds: no <audio> latency, overlapping
// plays, and stopped when audio is turned off or the component that defined it unmounts.
export const defineSample = (url: string) => {
  const playing = new Set<AudioBufferSourceNode>()
  let stops = 0 // a play still waiting on its sample when this moves on has been stopped

  const load = () => {
    loadSample(url).catch(() => {})
  }

  // Resolves when the sample ends or is stopped, or straight away if it can't play
  const play = async () => {
    if (!isAudioOn.value) return

    const stopsAtStart = stops
    const mutesAtStart = mutes
    const [context, buffer] = await Promise.all([ensureReady(), loadSample(url)]).catch(() => [])
    if (!context || !buffer || mutes !== mutesAtStart || stops !== stopsAtStart) return

    const voice = context.createBufferSource()
    voice.buffer = buffer
    voice.connect(getDestination())
    voices.add(voice)
    playing.add(voice)

    return new Promise<void>((resolve) => {
      voice.onended = () => {
        voices.delete(voice)
        playing.delete(voice)
        resolve()
      }
      voice.start()
    })
  }

  const stop = () => {
    stops++
    stopVoices(playing)
  }

  if (getCurrentScope()) onScopeDispose(stop)

  return { load, play, stop }
}

export const useAudio = () => {
  const toggle = async () => {
    await ensureReady()

    isAudioOn.value = !isAudioOn.value

    if (isAudioOn.value) {
      soundOn()
    } else {
      mutes++
      stopVoices(voices)
      soundOff()
    }
  }

  const play = (sound: () => void) => {
    if (isAudioOn.value) sound()
  }

  return { isAudioOn: readonly(isAudioOn), toggle, play }
}
