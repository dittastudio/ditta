<script lang="ts" setup>
import type { StoryblokMultilink } from "#storyblok-types";

interface Props {
  item: StoryblokMultilink;
}

const { item } = defineProps<Props>();

const route = useRoute();

const determineHref = (item: StoryblokMultilink) => {
  switch (item.linktype) {
    case "story": {
      const path = `/${item.cached_url}`.replace("/home", "/").trim();
      return path === "/" ? path : path.replace(/\/$/, "");
    }
    case "email": {
      return `mailto:${item.email}`;
    }
    default: {
      return item.cached_url;
    }
  }
};

const isActiveLink = computed(() => {
  const href = determineHref(item);
  return route.path === href || (href !== "/" && route.path.startsWith(`${href}/`));
});

const attributes = {
  title: item?.title,
  rel: item?.rel,
  to: determineHref(item),
  target: (item?.target ?? item?.linktype === "asset") ? "_blank" : null,
};
</script>

<template>
  <NuxtLink v-bind="attributes" :class="{ 'router-link-active': isActiveLink }">
    <slot />
  </NuxtLink>
</template>
