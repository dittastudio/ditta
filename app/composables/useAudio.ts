import { ensureReady, defineSound } from '@web-kits/audio'
// Available sounds: tap, click, keyPress, toggleOn, toggleOff, checkbox, select,
// deselect, hover, tabSwitch, expand, collapse, pageEnter, pageExit, success,
// error, warning, notification, info, copy, send, _delete, undo, pop, swoosh, slide
import { toggleOn, toggleOff } from '@@/.web-kits/playful'

const isAudioOn = ref(false)
const soundOn = defineSound(toggleOn)
const soundOff = defineSound(toggleOff)

export const useAudio = () => {
  const toggle = async () => {
    await ensureReady()

    isAudioOn.value = !isAudioOn.value

    if (isAudioOn.value) {
      soundOn()
    } else {
      soundOff()
    }
  }

  const play = (sound: () => void) => {
    if (isAudioOn.value) sound()
  }

  return { isAudioOn: readonly(isAudioOn), toggle, play }
}
