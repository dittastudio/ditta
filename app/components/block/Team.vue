<script lang="ts" setup>
import type { Themes } from '@/types/app'
import type { BlockTeam } from '#storyblok-components'

interface Props {
  block: BlockTeam
}

const { block } = defineProps<Props>()
const humans = computed(() => block.humans?.filter((human) => typeof human !== 'string') || [])
const button = computed(() => block.cta?.[0])

const contentRef = useTemplateRef('content')
const headingRef = useTemplateRef('heading')

const fitsViewport = ref(true)
const paraOffset = ref('0px')
const stickyTop = ref('0px')

function update() {
  if (!contentRef.value || !headingRef.value) return

  const flexGapHeight = parseFloat(getComputedStyle(contentRef.value).rowGap)
  const stickyOffset = (window.innerHeight - contentRef.value.offsetHeight) / 2

  paraOffset.value = `${headingRef.value.offsetHeight + flexGapHeight}px`
  fitsViewport.value = stickyOffset >= 80
  stickyTop.value = `${stickyOffset}px`
}

let ro: ResizeObserver

onMounted(() => {
  ro = new ResizeObserver(update)
  ro.observe(contentRef.value as HTMLDivElement)
  window.addEventListener('resize', update, { passive: true })
  update()
})

onUnmounted(() => {
  ro?.disconnect()
  window.removeEventListener('resize', update)
})
</script>

<template>
  <div
    v-editable="block"
    class="@container wrapper"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      class="grid grid-cols-1 gap-x-(--app-gutter-inner) gap-y-20 @4xl:grid-cols-12"
      :style="{ '--team-para-offset': paraOffset }"
    >
      <div
        ref="content"
        class="flex flex-col items-start gap-10 md:gap-20 @4xl:col-span-6 @4xl:self-start"
        :class="fitsViewport && '@4xl:sticky'"
        :style="{ top: stickyTop }"
      >
        <h2
          v-if="block.heading"
          ref="heading"
          class="text-display whitespace-pre-wrap trim-both"
        >
          {{ block.heading }}
        </h2>

        <div class="team__copy flex flex-col items-start gap-10 md:gap-20">
          <UiLockup
            v-if="storyblokRichTextContent(block.copy)"
            :copy="block.copy"
          />

          <StoryblokLink
            v-if="button?.link"
            :item="button.link"
          >
            <UiButton
              :text="button.text"
              :theme="button.theme as Themes"
            />
          </StoryblokLink>
        </div>
      </div>

      <div class="@container/team @4xl:col-span-5 @4xl:col-end-13 @4xl:pt-(--team-para-offset)">
        <ul
          class="flex flex-col gap-[calc(var(--app-gutter-inner)*4)] @2xl/team:gap-(--app-gutter-inner) @2xl/team:flex-row"
        >
          <li
            v-for="human in humans"
            :key="human.uuid"
            v-memo="[human.uuid]"
          >
            <UiPerson
              :image="human.content.image"
              :name="human.content.name"
              :position="human.content.position"
            />
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
