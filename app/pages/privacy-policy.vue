<script lang="ts" setup>
// The site's privacy policy, which the brief's consent line links to (M7 in docs/plans/brief-builder-milestones.md).
// A draft: the [bracketed] parts are for ditta to fill in, and the whole needs checking before launch.
useSeoMeta({
  title: 'Privacy policy',
  description: 'What ditta collects when you visit the site or send us a brief, why, and how long we keep it.',
})

const updated = '26 November 2026'
</script>

<template>
  <UiTheme
    tag="div"
    theme="light"
    class="wrapper py-40 md:py-60"
  >
    <article class="mx-auto flex max-w-174 flex-col gap-6 text-16 leading-relaxed md:text-18">
      <h1 class="pb-4 text-40 leading-tight text-balance md:text-64">Privacy policy</h1>
      <p class="opacity-60">Last updated {{ updated }}</p>

      <p>
        This explains what [ditta studio ltd, company number 00000000, registered at address] (“ditta”, “we”) collects
        when you visit ditta.studio or send us a brief, why, and how long we keep it. Questions go to
        <a
          href="mailto:hello@ditta.studio"
          class="underline underline-offset-4"
          >hello@ditta.studio</a
        >.
      </p>

      <h2 class="pt-8 text-24 leading-tight md:text-28">When you send us a brief</h2>
      <p>
        The brief asks about your project (what you need, your business, timing, budget, links you choose to share) and
        about you (your name, email, and website if you have one). We use it only to reply about your project and, if we
        work together, to plan it.
      </p>
      <p>
        Until you send it, your brief stays in your own browser. When you send it, we store it and email you a link. It
        only reaches us once you click that link, and an unconfirmed brief is deleted 14 days after we last emailed it.
        Once confirmed, we keep it, and a PDF of it, for [two years], or longer if we go on to work together.
      </p>
      <p>
        Our lawful basis is your request: you ask us to reply about a project, and we need these details to do that
        (steps before a possible contract).
      </p>

      <h2 class="pt-8 text-24 leading-tight md:text-28">Who handles it for us</h2>
      <ul class="flex list-disc flex-col gap-2 pl-5">
        <li>
          <strong class="font-medium">Cloudflare</strong> runs the site and stores briefs and their PDFs (in Western
          Europe). Its Turnstile check makes sure a person, not a bot, is sending the brief.
        </li>
        <li>
          <strong class="font-medium">Resend</strong> sends our emails: your confirm link, your copy of the brief, and
          ours. Resend is based in the United States [transfer safeguard to confirm].
        </li>
        <li>
          <strong class="font-medium">Plausible</strong> counts visits to the site, and how far people get through the
          brief, without cookies and without anything you type into it.
        </li>
        <li>
          <strong class="font-medium">Storyblok</strong> and <strong class="font-medium">Mux</strong> serve the site’s
          images and videos, so your browser fetches them from their servers.
        </li>
      </ul>
      <p>We don’t sell your details or use them for advertising.</p>

      <h2 class="pt-8 text-24 leading-tight md:text-28">Cookies and your browser</h2>
      <p>We don’t use tracking or advertising cookies. The site keeps a few things in your browser so it works:</p>
      <ul class="flex list-disc flex-col gap-2 pl-5">
        <li>the accent colour you picked;</li>
        <li>your brief, while you fill it in, so you can come back to it;</li>
        <li>a cookie linking this browser to a brief you’ve sent, so you can fix your email or resend the link.</li>
      </ul>

      <h2 class="pt-8 text-24 leading-tight md:text-28">Your rights</h2>
      <p>
        You can ask for a copy of what we hold about you, or ask us to correct or delete it, by emailing
        <a
          href="mailto:hello@ditta.studio"
          class="underline underline-offset-4"
          >hello@ditta.studio</a
        >. If you’re unhappy with how we’ve handled your details, you can complain to the Information Commissioner’s
        Office (ico.org.uk).
      </p>
    </article>
  </UiTheme>
</template>
