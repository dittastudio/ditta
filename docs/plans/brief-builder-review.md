# Brief builder review

A review of the brief builder on `develop` (27 Nov 2026), covering correctness, performance, Nuxt 4 conventions and testing. Every decision below has been agreed. The work is listed at the end as ordered commits on `develop`, and nothing has been changed yet.

The code reviewed: `app/components/brief/`, `app/composables/useBrief*`, `app/stores/brief.ts`, `app/pages/brief/`, `server/api/brief/`, `server/utils/{briefs,briefPdf,email}.ts`, `server/tasks/brief/sweep.ts`, `server/database/migrations/`, `shared/{schemas,utils}/brief.ts`, `test/e2e/`, `nuxt.config.ts`, `wrangler.jsonc`, `playwright.config.ts` and `.github/workflows/check.yml`.

## What's already solid

- One Zod schema (`shared/schemas/brief.ts`) drives the per-step validation, the review, the server and the stored JSON. Whether a field is required is read off the schema rather than declared twice.
- Confirming is a single `UPDATE … RETURNING`, so two clicks can't both send a brief.
- Email links do nothing on a GET. Only the confirm button sends, so email scanners that open links can't confirm a brief.
- Resend calls carry idempotency keys, and the sweep retries failed emails. A failed PDF never holds a brief up.
- Tokens and the owner cookie are stored only as SHA-256 hashes. Someone else's brief id gets a 404.
- Heavy client assets (sounds, physics, the burger's tunes) load only on intent. Turnstile's script loads only on the review.
- The e2e tests go through `@nuxt/test-utils/playwright` with their own build dir, and every secret is blanked so nothing leaves the machine.

## Findings and decisions

### 1. Turnstile's site key is empty on prerendered pages

**Problem.** `runtimeConfig.public.turnstileSiteKey` defaults to `''` and was meant to come from `wrangler.jsonc`'s `vars` at runtime. A prerendered page bakes in the public config from build time, when those vars don't exist. Checked against the live site on 27 Nov:

- `https://ditta.studio/brief` (still rendered by the Worker on `main`): `turnstileSiteKey:"0x4AAA…"`
- `https://ditta.studio/` (prerendered): `turnstileSiteKey:""`

A navigation inside the app to `/brief` keeps the config of the page it started on, so the brief would say "The brief isn't set up to send yet" (`Shell.vue`, `turnstileReady`). Once `91afc40` (prerender `/brief`) reaches `main`, direct visits break too. The e2e tests can't see it: under `nuxt dev`, `import.meta.dev` swaps in Cloudflare's test key.

It isn't live-critical yet: `/brief` is noindex on `main` and the menu link to it is still a Storyblok draft. It has to be fixed before the release.

**Decision.** Hardcode the public site key in `nuxt.config.ts` and remove it from both `vars` blocks in `wrangler.jsonc`. No hotfix to `main`; it goes out with the release.

**Is that safe?** Yes. The site key is public by design (like a Stripe publishable key). It has to be in every visitor's HTML for the widget to work, and it's already committed in `wrangler.jsonc`. The **secret** key is what matters, and it stays a Worker secret. What stops someone reusing the site key on their own site is the widget's hostname allowlist in the Turnstile dashboard. Make sure it lists only `ditta.studio` and the `workers.dev` previews.

**Also fix** the comments this makes wrong: `wrangler.jsonc` ("Read at runtime, since /brief is rendered by the Worker, not prerendered"), `brief-builder-milestones.md` ("`/brief` isn't prerendered, so a build variable wouldn't reach it"), and the old `server/api/brief.post.ts` path in `wrangler.jsonc` and `shared/schemas/brief.ts`.

### 2. "Confirm and send" can hang for over a minute

**Problem.** `confirm.post.ts` waits for `notifyBrief` before it replies. That means rendering the PDF through Browser Run (a 30s timeout, then a 10s wait and a 30s retry) and then the Resend calls. On the free plan (one render every 10 seconds), someone can watch "Sending…" for over a minute. If they give up and reload, the brief is already confirmed, so they see "Your brief has reached us" instead of the thank-you.

**Decision.**

- Reply as soon as the `UPDATE` succeeds, and run `notifyBrief` in `event.waitUntil(...)`.
- `waitUntil` only gets about 30s after the response, so give the PDF a budget there: a 15s timeout and no retry. If the PDF misses, both emails go without it straight away, and the sweep archives the PDF to R2 later. The trade-off is that the team's email will sometimes arrive without the PDF. It's still kept in R2.
- Run the sweep every 15 minutes instead of hourly: `*/15 * * * *` in both `nuxt.config.ts` (`scheduledTasks`) and `wrangler.jsonc` (`triggers`), which have to match.

**Will it cost anything?** Not on the free plans, where a request over the limit is refused rather than billed. This assumes the Cloudflare account is on Workers Free, as the comments in the repo suggest. On Workers Paid ($5) overages are billed, but these numbers are tiny either way:

- **`waitUntil`:** free.
- **The cron:** 96 runs a day instead of 24, against 100k requests a day. Changing the schedule doesn't add a trigger.
- **Browser Run:** dropping the retry means fewer renders, not more.
- **Resend:** no extra emails; the idempotency keys prevent duplicates.

The two things that could creep are dealt with in 11 and 12.

### 3. Resend and renew kill the old link before the new email has gone

**Problem.** `renew.post.ts`, `[id]/resend.post.ts` and the edit-and-send-again path in `index.post.ts` all update `token_hash`, `send_count` and `last_sent_at`, and only then call `sendBriefLink`. If Resend fails:

- The old link is already dead.
- The 20-second wait has started, and one of the 10 sends is used up.
- **Renew is the worst case:** the expired link the person is holding now shows "This link doesn't work", and no new email arrives. They're stuck, with nothing telling them what to do.

The new-brief path in `index.post.ts` already cleans up by deleting the row when the send fails.

**Decision.** On a failed send, put back the previous `token_hash`, `token_expires_at`, `send_count` and `last_sent_at` (and `email` and `answers.email` on a resend), the same way the new-brief path cleans up.

### 4. No unit tests

**Problem.** Every rule is tested only through Playwright, at 60–90 seconds per test. The pure logic would be fast to test directly, and some of it breaks quietly. The store's `afterHydrate` upgrades (`upgradeSavedAnswers`, `dropStaleChoices`) are exactly what breaks when an option is renamed.

**Decision.** Add Vitest with two projects, the current `@nuxt/test-utils` convention:

- `test/unit/`, in a plain Node environment: `briefStepSchemas`, `briefAnswersSchema`, `stripHiddenFollowUps`, `isBriefFieldRequired`, `briefLinkState`, `personaliseBrief`, `briefFirstName`, `suggestBriefEmail`, `formatBriefAnswer`, `isPrivateByDefault`.
- `test/nuxt/`, using `defineVitestProject` from `@nuxt/test-utils/config`: the store (hydrate upgrades, `goTo`/`next`/`back`, `markConfirmed`, `reset`), `followBriefUrl` (stopping at the first unanswered step), `useBriefResendWait` with fake timers, and components through `mountSuspended` where it's worth it.

Run through `vp test` if it picks up the projects config, plain `vitest` otherwise. No coverage threshold for now. The D1-backed routes stay covered by e2e rather than adding `@cloudflare/vitest-pool-workers`.

### 5. E2E never runs in CI

**Problem.** `check.yml` only runs `vp check` and the typecheck. The Playwright config already blanks every secret and uses the local D1, so it can run on a GitHub runner as it is.

**Decision.**

- Add an e2e job to `check.yml` for pull requests into `develop` and `main`, with the Playwright browsers cached, and make it a required check. The unit tests run in the existing job.
- In CI, use `retries: 1` and `trace: 'on-first-retry'`, so one flaky run doesn't block a merge but still leaves a trace to look at.
- The job skips itself when nothing relevant changed (13).

The job runs on GitHub, not in Cloudflare's build. Cloudflare deploys `main` regardless, so the only wait is a PR waiting on the check before it can be merged.

### 6. Nothing checks the production config

**Problem.** Finding 1 got through because the tests only see `nuxt dev`. A smoke test against a prerendered build was considered, but prerendering crawls the whole site from Storyblok, and CI has no `NUXT_STORYBLOK_TOKEN`.

**Decision.** A build-time check in `nuxt.config.ts` instead: a production build fails if public config the client needs (`turnstileSiteKey` for a start) is empty. It runs in Workers Builds itself, so a bad deploy stops before it ships. It only checks a few values, so it takes milliseconds and doesn't slow builds down.

### 7. `storyblok.spec.ts` uses Vue's internals

**Problem.** `fetchInBrowser` calls `__vue_app__.config.globalProperties.$router.push`. A visitor clicks a link, and a link click is the path where finding 1 breaks.

**Decision.** Open `/brief/confirm` with no token, which shows "This link doesn't work", and click its "start a new brief" link, still blocking `/brief/_payload.json`. That `NuxtLink` comes from code, so it's predictable. The menu's "Start a brief" depends on Storyblok draft content that isn't mocked, which would make the test flaky.

### 8. Two tests sit through 20-second sleeps

**Problem.** `waitForTimeout(20_500)` waits out the resend wait, and the countdown test also takes about 20s, because `BRIEF_RESEND_COOLDOWN_MS` is a constant the tests can't change.

**Decision.**

- Move the wait to `runtimeConfig.public.brief.resendCooldownMs` (default 20000), read by both the server and the countdown. The e2e dev server sets `NUXT_PUBLIC_BRIEF_RESEND_COOLDOWN_MS=3000`. That's about 35 seconds off a run and no fixed sleeps.
- **It's set only in `nuxt.config.ts`**, with a comment saying so, never through `wrangler.jsonc` vars. Otherwise it's finding 1 again: the client would bake in the build-time value while the server read the runtime one, and the countdown and the server would disagree. Under `nuxt dev` both sides read the same env, so the e2e override is safe.
- The 6-second wait in "opening the link changes nothing" stays, since that test really does need to sit through polls.

### 9. Cloudflare bindings are typed by hand

**Problem.** `D1Database`, `R2Bucket` and `RateLimiter` are each partly hand-written, and `env` is cast in three places.

**Decision.** Generate the types with `wrangler types` (an `npm run cf:types` script). The generated `worker-configuration.d.ts` is committed and regenerated whenever `wrangler.jsonc` changes. `event.context.cloudflare.env` is typed once, and the hand-written interfaces and casts are deleted. The generated file is added to the lint and format ignores only if `vp check` objects to it.

### 10. Dev-only server routes ship to production

**Problem.** `server/routes/_dev/*` and `devOutbox` are bundled into the production Worker and 404 at runtime through `import.meta.dev`. The `/_dev` pages are already stripped from production builds with `pages:extend`.

**Decision.** Register them under `$development: { serverHandlers: [...] }` so they aren't in the production bundle at all. Low priority.

### 11. The sweep reads the whole table on every run

**Problem.** D1 bills by rows _read_, not rows returned. None of the sweep's four queries uses an index, so each one reads every row. With 1,000 briefs at 96 runs a day, that's roughly 400k rows read a day. That's under the free 5M, but it grows with every brief. `briefs_status_created` isn't used by any query.

**Decision.** Add `0003_brief_sweep_indexes.sql`, with one partial index per sweep query (each covers only the rows that query is after), and drop `briefs_status_created`. A plain `(status, confirmed_at)` index would still read every confirmed brief for the PDF query, so partial indexes it is; `EXPLAIN QUERY PLAN` shows each query reading only its own index. Apply it with `--local` and `--remote`, and on the preview database too.

### 12. A PDF that always fails would be retried forever

**Problem.** The sweep re-renders briefs with no `pdf_key`. A PDF that fails every time (bad content, a template bug) would use up Browser Run time every 15 minutes, forever.

**Decision.** Add a `pdf_attempts` column (in the same migration as 11). The sweep stops after 3 failed renders and logs it, so it shows up in Workers Logs.

### 13. Running e2e only when brief code changes

**Problem.** A required check plus GitHub's `paths:` filter leaves PRs that don't match stuck on "pending" forever.

**Decision.** The job always starts, checks what changed (`dorny/paths-filter`), and passes early when nothing relevant changed. A style-only change skips in seconds. These count as relevant:

- `app/components/brief/**`
- `app/composables/useBrief*`
- `app/pages/brief/**`
- `app/stores/brief.ts`
- `server/**`
- `shared/**`
- `test/e2e/**`
- `nuxt.config.ts`
- `wrangler.jsonc`
- `playwright.config.ts`
- `package-lock.json`

The known risk: a global CSS or layout change that breaks the brief without touching these files won't be caught.

## The work, in order

Each line is one commit on `develop`:

1. `fix(brief): bake the public Turnstile site key in at build`: finding 1, with the stale comments and docs.
2. `feat: fail a production build missing public config`: finding 6.
3. `fix(brief): restore a brief's link when its email fails`: finding 3.
4. `perf(brief): confirm at once and send its emails after`: finding 2, the 15-second PDF budget and the 15-minute sweep.
5. `perf(brief): index the sweep's queries and cap PDF retries`: findings 11 and 12, migration `0003`.
6. `refactor(brief): type Cloudflare bindings from wrangler types`: finding 9.
7. `refactor(brief): keep dev-only routes out of production`: finding 10.
8. `refactor(brief): read the resend wait from runtime config`: finding 8.
9. `test: add Vitest unit and nuxt projects`: finding 4.
10. `test(brief): reach /brief by a link in the Storyblok tests`: finding 7.
11. `test(brief): run e2e in CI when brief code changes`: findings 5 and 13.

After step 5, apply the migration to both D1 databases with `--remote` before the release is merged.

## Before the release to `main`

- Steps 1–5 are in.
- Migration `0003` is applied to `ditta-briefs` and `ditta-briefs-preview`.
- The Turnstile widget's hostname allowlist is checked in the dashboard.
- A brief is sent on the `develop` preview after reaching `/brief` from a link in the app, not by typing the URL.
- `NUXT_STORYBLOK_TOKEN` (the public token) is added as a GitHub Actions secret.

## How it went (27 Nov 2026)

All 11 commits are in on `develop`. Where the work moved away from the plan above:

- **Turnstile key (1).** `nuxt dev` still gets Cloudflare's always-pass test key: `$development` sets the site key back to empty, so local dev doesn't hit the real widget on localhost.
- **Indexes (11).** Partial indexes, one per sweep query, rather than `(status, …)` pairs. A pair would still have read every confirmed brief for the PDF query. `EXPLAIN QUERY PLAN` shows each query reading only its own index. Migration `0003_brief_sweep_indexes.sql` also adds `pdf_attempts` (12). The cap of 3 is written into both the index and the query, so change both together.
- **Binding types (9).** `npm run cf:types` generates only `Env` (`--include-runtime=false`). Workers' full runtime types redefine DOM globals (`Element`, `Response`) and broke the app's typecheck, because the app's typed `$fetch` reads the server routes' types. The binding types come from `@cloudflare/workers-types`' importable form instead, in the root `cloudflare.d.ts`, which also types `event.context.cloudflare` once. The generated file is left out of formatting so it stays exactly as wrangler writes it.
- **Dev routes (10).** They moved to `server/dev/` and are registered under `$development.serverHandlers`. The URLs are the same.
- **Resend wait (8).** It's 4 seconds in the e2e tests (`test/e2e/settings.ts`). The e2e suite now takes about 30 seconds.
- **Vitest (4).** The config lives in `vitest.config.ts`, not `vite.config.ts`. The Nuxt project boots Nuxt to load, which `vp check` would otherwise do on every run. `npm test` runs 41 tests in about 2 seconds. Component tests through `mountSuspended` aren't added yet: they'd need `@vue/test-utils`, and the store and composables were the higher-value targets.
- **CI (5, 13).** Every page loads a Storyblok story, so the e2e job needs `NUXT_STORYBLOK_TOKEN` as a repo secret and reads published content.

Done by hand on 27 Nov: migration `0003` applied to both databases with `--remote`, the Actions secret added, and the Turnstile hostnames checked (only `ditta.studio` and `ditta.workers.dev`, in Managed mode). The first CI run passed, `e2e` included.

Not required checks: on the org's free plan, rulesets on a private repo aren't enforced, and the checks already show on every push and PR. The `e2e` job still passes at once when nothing relevant changed, so it can be made required if the plan changes.

Checked on the `develop` preview (27 Nov): a brief sent after reaching `/brief` from a link in the app passed Turnstile, confirmed at once, and both emails arrived with the PDF. The review is done.
