<script lang="ts" setup>
import type { BlockProjects } from '#storyblok-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface Props {
  block: BlockProjects
}

const { block } = defineProps<Props>()

const projects = computed(() => block.projects?.filter((project) => typeof project !== 'string') || [])

const projectRefs = useTemplateRef('project')

const brightnessStep = 10

let ctx: gsap.Context | null = null

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)

  ctx = gsap.context(() => {
    projectRefs.value?.forEach((el, index) => {
      const sign = index % 2 === 0 ? 1 : -1
      const rotateFrom = sign * gsap.utils.random(1, 4)
      const rotateTo = -sign * gsap.utils.random(1, 4)

      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
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
            ease: 'power2.in',
            scale: 1,
            rotate: rotateTo,
          },
          0,
        )

      const subsequent = projectRefs.value?.slice(index + 1) ?? []
      subsequent.forEach((triggerEl, stepsBelow) => {
        const fromBrightness = Math.max(0, 100 - stepsBelow * brightnessStep)
        const toBrightness = Math.max(0, 100 - (stepsBelow + 1) * brightnessStep)

        gsap.fromTo(
          el,
          {
            filter: `brightness(${fromBrightness}%)`,
          },
          {
            filter: `brightness(${toBrightness}%)`,
            ease: 'power2.in',
            immediateRender: false,
            scrollTrigger: {
              trigger: triggerEl,
              start: 'top bottom',
              end: 'center center',
              scrub: true,
            },
          },
        )
      })
    })
  })
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<template>
  <div
    class="relative overflow-clip"
    :class="{
      'pt-(--app-vertical-rhythm)': block.spacing_top,
      'pb-(--app-vertical-rhythm)': block.spacing_bottom,
    }"
  >
    <div class="absolute inset-0">
      <div class="sticky top-0">
        <UiTicker
          v-if="block.ticker"
          spacing-classes="gap-10 px-5"
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

    <div class="wrapper grid grid-cols-1 md:grid-cols-12 gap-(--app-gutter-inner)">
      <ul class="col-span-1 md:col-start-2 md:col-span-10">
        <li
          v-for="(project, index) in projects"
          :key="`${project.uuid}-${index}`"
          ref="project"
          class="project__wrapper sticky top-0 h-screen w-full flex flex-col items-center py-10"
        >
          <NuxtLink
            :to="`/${project.full_slug}`"
            class="project__item flex flex-col justify-center max-w-full h-full aspect-video"
          >
            <UiCardProject :title="project.content.title">
              <NuxtImg
                v-if="project.content.media?.filename && storyblokAssetType(project.content.media.filename) === 'image'"
                class="block size-full object-cover rounded-20 shadow-xl"
                :src="project.content.media.filename"
                :alt="project.content.title || project.content.media.alt"
                width="16"
                height="9"
                sizes="
                  xs:100vw
                  sm:100vw
                  lg:66vw
                  2xl:1180px
                "
                loading="lazy"
              />
            </UiCardProject>
          </NuxtLink>
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
  font-size: utopia.clamp(120, 160);
}
</style>
