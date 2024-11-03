<script lang="ts" setup>
import type { BlockMarqueesStoryblok } from '@/types/storyblok'

interface Props {
  block: BlockMarqueesStoryblok
}

const { block } = defineProps<Props>()

const sequenceBg = ['offblack', 'offwhite', 'offblack', 'pink']
const sequenceText = ['offwhite', 'offblack', 'pink', 'offblack']

const getRandomNumberInRange = () => {
  const min = 60
  const max = 90
  const increment = 5

  const numIncrements = (max - min) / increment + 1

  const randomIndex = Math.floor(Math.random() * numIncrements)

  return min + randomIndex * increment
}
</script>

<template>
  <div
    v-editable="block"
    class="block-marquees"
  >
    <ElementMarquee
      v-for="(word, index) in block.words"
      :key="index"
      :background-color="sequenceBg[index % 4]"
      :text-color="sequenceText[index % 4]"
      :copy="[`${word.word}`]"
      :duration="`${getRandomNumberInRange()}s`"
      :direction="index % 2 ? 'left' : 'right'"
    />
  </div>
</template>
