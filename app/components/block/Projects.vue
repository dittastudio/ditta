<script lang="ts" setup>
import type { BlockProjects } from '#storyblok-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  block: BlockProjects
}

const { block } = defineProps<Props>()

const projects = computed(() => block.projects?.filter((project) => typeof project !== 'string') || [])

const tickerWrapper = useTemplateRef('tickerWrapper')
const projectRefs = useTemplateRef('project')
const overlayRefs = useTemplateRef('overlay')
const opacityStep = 0.1

const scrollTriggers: ScrollTrigger[] = []

onMounted(async () => {
  await nextTick()

  projectRefs.value?.forEach((el, index) => {
    const sign = index % 2 === 0 ? 1 : -1
    const rotateFrom = sign * gsap.utils.random(1, 4)
    const rotateTo = -sign * gsap.utils.random(1, 4)

    const tl = gsap
      .timeline({
        scrollTrigger: {
          trigger: el,
          start: '25% bottom',
          end: 'center center',
          scrub: true,
        },
      })
      .fromTo(
        el,
        {
          scale: 1.1,
          rotate: rotateFrom,
        },
        {
          ease: 'power1.in',
          scale: 1,
          rotate: rotateTo,
        },
      )

    if (tl.scrollTrigger) scrollTriggers.push(tl.scrollTrigger)

    if (index === 0) return

    const overlayTl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'center center',
        scrub: true,
      },
    })

    const opacityFrom = Math.min(1, (index - 1) * opacityStep)
    const opacityTo = Math.min(1, index * opacityStep)

    overlayRefs.value?.forEach((overlayEl, i) => {
      overlayTl.fromTo(
        overlayEl,
        {
          opacity: opacityFrom,
        },
        {
          opacity: opacityTo,
          ease: 'none',
          immediateRender: false,
        },
        0,
      )
    })

    if (overlayTl.scrollTrigger) scrollTriggers.push(overlayTl.scrollTrigger)
  })

  ScrollTrigger.refresh()
})

onUnmounted(() => {
  scrollTriggers.forEach((st) => st.kill())
  scrollTriggers.length = 0
  gsap.killTweensOf(projectRefs.value ?? [])
  gsap.killTweensOf(overlayRefs.value ?? [])
})
</script>

<template>
  <div
    v-editable="block"
    class="relative overflow-clip"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div
      ref="tickerWrapper"
      class="absolute inset-0"
    >
      <div class="sticky top-0">
        <UiTicker
          v-if="block.ticker"
          spacing-classes="gap-10 px-5"
          :trigger-el="tickerWrapper"
        >
          <template
            v-for="i in 4"
            :key="i"
          >
            <div class="project__ticker text-display trim-both">
              {{ block.ticker }}
            </div>

            <div
              aria-hidden="true"
              class="project__ticker text-display trim-both"
            >
              &mdash;
            </div>
          </template>
        </UiTicker>
      </div>
    </div>

    <div
      class="wrapper max-md:px-[calc(var(--app-gutter-outer)*2)] grid grid-cols-1 md:grid-cols-12 gap-(--app-gutter-inner)"
    >
      <ul class="col-span-1 md:col-start-2 md:col-span-10">
        <li
          v-for="(project, index) in projects"
          :key="`${project.uuid}-${index}`"
          ref="project"
          class="project__wrapper sticky top-0 h-screen w-full flex flex-col items-center py-10 pointer-events-none will-change-transform"
        >
          <div class="flex flex-col justify-center max-w-full h-full aspect-3/4 md:aspect-video">
            <NuxtLink
              class="block pointer-events-auto"
              :to="`/${project.full_slug}`"
            >
              <UiCardProject
                :title="project.content.title"
                class="aspect-3/4 md:aspect-video"
              >
                <div
                  ref="overlay"
                  aria-hidden="true"
                  class="absolute inset-0 z-1 bg-black opacity-0 pointer-events-none rounded-20 squircle-40 transform-gpu"
                />

                <picture
                  v-if="
                    project.content.media?.filename && storyblokAssetType(project.content.media.filename) === 'image'
                  "
                >
                  <MediaSource
                    :media="getMediaQuery('md')"
                    :width="16"
                    :height="9"
                    :src="project.content.media.filename"
                    :focus="project.content.media.focus"
                    sizes="md:66vw lg:66vw 2xl:1180px"
                  />

                  <MediaSource
                    :width="3"
                    :height="4"
                    :src="project.content.media.filename"
                    :focus="project.content.media.focus"
                    sizes="2xs:85vw xs:85vw sm:85vw"
                  />

                  <NuxtImg
                    srcset=""
                    class="size-full object-cover"
                    :src="project.content.media.filename"
                    :alt="project.content.media.alt"
                    :modifiers="
                      project.content.media.focus ? { filters: { focal: project.content.media.focus } } : undefined
                    "
                    loading="lazy"
                  />
                </picture>
              </UiCardProject>
            </NuxtLink>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.project__wrapper {
  padding-top: utopia.clamp(120, 160);
}

.project__ticker {
  font-size: utopia.clamp(90, 160);
}
</style>
