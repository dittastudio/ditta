# Brief Builder: milestones

The order in which the brief builder gets built. What each screen asks lives in [brief-builder-flow.md](./brief-builder-flow.md). The technical design (D1, Resend, tokens, PDF) lives in [brief-builder.md](./brief-builder.md). This file only covers **order and scope**: what each milestone ships, and when it's done.

Each milestone should leave the site deployable. The builder stays unlinked and `noindex` until M7.

---

## M0: Settle the open questions ✅

**Goal:** the two plan docs agree with each other and with what we're building.

Decided (18 Nov 2026), and written into both docs:

- **Order:** the contact screens (9–12) come **before** the Summary, and **Send brief** on the Summary is the Submit.
- **Uploads:** screen 6 takes **links only** for v1 (up to 3, like screen 5, with a sharing reminder for Drive, Dropbox, Figma and the like). No file uploads: clients reply to their copy of the brief with any files. (Links revised 24 Nov 2026; uploads dropped 26 Nov 2026.)
- **Budget bands:** Under £5k · £5k–£10k · £10k–£20k · £20k–£40k · £40k+ stay. The slider **starts with nothing chosen** and needs a drag, tap or arrow key before Next works.
- **Consent:** a line on screen 12, no checkbox: "We'll only use this to reply about your project. See our privacy policy." The `/privacy-policy` page doesn't exist yet (see M7).
- **Numbering:** plain "9 of 12", no a–d lettering.
- **Small phones:** every screen fits 320 × 568 before a follow-up opens, except screens 1 and 3 and the summary. Revised in M2 (19 Nov 2026) after measuring; follow-ups and extra link rows may scroll.
- **Source of truth:** the repo (`app/utils/brief.ts`, `shared/schemas/brief.ts`). The claude.ai artifact is retired.
- **Response time:** "within two working days", on the thank-you screen and in the emails.
- **"Not sure" tips** on the summary: dropped for v1.
- **Honeypot:** added in M3 with the endpoint.

- **Budget hint:** "Most of our projects are between £10k and £20k." (settled 19 Nov 2026)

---

## M1: Clickable prototype at `/brief` (built; testing parked)

Built. The phone testing below is parked until later (19 Nov 2026) and doesn't block M2 or M3.

**Goal:** find out whether the form itself works (length, wording, feel) before building any backend.

- Client-only page at `/brief` (`ssr: false`, not prerendered, `noindex`, not linked anywhere).
- All 13 screens come from one config, with follow-ups, validation, `[name]` personalisation, Summary with Edit, and a "Review" button back to it.
- Answers persist in localStorage, so a refresh resumes where you left off.
- **Send brief** goes to a mocked "Check your inbox" screen, which links on to a mocked "Thank you". Nothing is sent.
- Visual design is deliberately plain.

**Done when:** at least 3–5 people outside the team have filled it in on their phones, and the findings have gone back into M0's docs (questions to cut, reword or reorder).

---

## M1.5: Validation on Regle + Zod

**Goal:** the prototype validates the way the real thing will (see "Validation — Regle + Zod" in `brief-builder.md` and "Forms & Validation" in `AGENTS.md`), so M2 designs the final field components and M3 reuses the rules.

- `shared/schemas/brief.ts` holds the options, one Zod schema per screen (`briefStepSchemas`), the whole-brief `briefAnswersSchema`, and the follow-up rules (when each shows, required only while shown, dropped when hidden).
- Each question screen binds its schema with `useRegleSchema`. Next calls `r$.$validate()`, and errors show under the field they belong to, linked with `useId()` and `aria-describedby`.
- Links accept "acme.com" and are stored as "https://acme.com".
- The draft store is typed from the schema (`z.input`). Send brief checks the whole brief against `briefAnswersSchema`.
- Still to add in M3: `briefDetailsSchema` (consent, honeypot) and the resend/confirm schemas, once those fields exist.

**Done when:** every check from M1 still behaves the same, with no hand-written validation left in `app/`.

---

## M2: Design and feel ✅

**Goal:** the builder looks and feels like ditta.

- Figma design for the screen layout, cards, chips, slider, links and summary, implemented with the `@theme` tokens.
- Motion: screen slides, card selection, the shake. Respect `prefers-reduced-motion`.
- Keyboard: focus management between screens, visible focus states.
- Accessibility: grouped inputs labelled with fieldset/legend, live region for errors and step changes, screen-reader pass.
- Big-number style for the timing cards. Rotating placeholder examples on screen 2.

**Done when:** it matches the design on a 320 × 568 phone and on desktop, and passes a keyboard-only run-through.

Done (19 Nov 2026). Letter shortcuts were dropped. Measured at 320 × 568, every screen fits before a follow-up opens except 1 and 3 (see Small phones in M0). Still worth a pass with a real screen reader (VoiceOver) before M7.

---

## M3: Simple submission ✅

**Goal:** real leads arrive with the smallest backend that's safe to run.

- `POST /api/brief` (Nitro server route) validates the answers server-side against the same step config.
- Spam protection: honeypot, minimum time-on-form, Cloudflare Turnstile, and per-IP rate limiting.
- One Resend email to the team, with the answers inline and `reply_to` set to the client.
- Verify `ditta.studio` in Resend (SPF, DKIM, DMARC). Store `NUXT_RESEND_API_KEY` as a Worker secret.
- The client sees "Thanks, we've got it".

No database and no email verification yet. This milestone tells us how much spam and how many fake addresses actually come in. If there are few, M4 can wait.

Built (24 Nov 2026), waiting on accounts:

- `server/api/brief.post.ts` parses `briefSubmitSchema` (answers, `elapsed`, honeypot, Turnstile token). Order: rate limit, parse, honeypot and 20-second minimum (a quiet fake success), Turnstile, then Resend.
- Rate limit: the Workers `BRIEF_RATE_LIMIT` binding in `wrangler.jsonc`, 3 a minute per IP (Workers only count over 10 or 60 seconds). Absent on previews, where it's skipped. Since M4 runs `nuxt dev` on the `cloudflare-dev` preset, dev has it too.
- Resend through its REST API with `$fetch`, not the SDK: one call doesn't need the dependency. Template in `server/emails/brief.ts`, written from the same question copy (`shared/utils/brief.ts`).
- Turnstile in managed, interaction-only mode on the summary. `nuxt dev` falls back to Cloudflare's always-pass test keys; built sites refuse to send without real ones.
- After a send the answers are cleared and the thank-you screen shows. The mocked Check your inbox screen is unreachable until M4.

**To launch:** `ditta.studio` is verified in Resend (EU), and a sending-only key has delivered a test brief locally (24 Nov 2026). The addresses and Turnstile's public site key are in `wrangler.jsonc` (read at runtime: `/brief` isn't prerendered, so a build variable wouldn't reach it). `NUXT_RESEND_API_KEY` and `NUXT_TURNSTILE_SECRET_KEY` are Worker secrets, on Previews Base too.

**Done when:** a brief submitted from production arrives in the team inbox, and the spam checks reject a scripted submission.

Done (24 Nov 2026). A real brief from ditta.studio reached hello@. Scripted posts to production: a fake Turnstile token gets 403, a filled honeypot gets the quiet fake success, and invalid answers get 400. The rate limit is loose: Cloudflare counts per data centre and syncs late, so a burst of 30 saw only five 429s. Treat it as a brake; Turnstile is the gate.

---

## M4: Verified submission ✅

**Goal:** only briefs with a confirmed email reach the team (the full flow in `brief-builder.md`).

- D1 `briefs` table and migrations under `server/database/migrations/`.
- `pending` → `confirmed` states. Hashed, expiring, single-use tokens. Draft cookie.
- Endpoints: create/update, resend (with email edit), status poll, confirm GET (no side effects), confirm POST.
- Screens: Check your inbox (with the "Not received your email?" panel), confirm landing, expired, already confirmed, thank you.
- Client copy email. A cron trigger deletes stale `pending` rows.

**Done when:** every item in the Verification section of `brief-builder.md` passes, except the PDF items.

Built (26 Nov 2026):

- D1: `ditta-briefs` for production and `ditta-briefs-preview` for branch previews (Western Europe), both bound as `DB` in `wrangler.jsonc`. Migrations in `server/database/migrations/`, applied to both. `nuxt dev` runs on Nitro's `cloudflare-dev` preset, so it gets a local D1 from `.wrangler/state`.
- To migrate: `npx wrangler d1 migrations apply ditta-briefs --remote` (and `--local`). The preview database lives in the `previews` block, which `wrangler d1` can't find by name, so apply it with a throwaway config naming it.
- Routes in `server/api/brief/`: `index.post` (create, or update this browser's pending brief), `[id]/resend.post` (20 seconds apart, 10 sends at most), `[id]/status.get`, `confirm.get` (no side effects), `confirm.post`, and `renew.post` (a new link from an expired one, on any device). Shared logic in `server/utils/briefs.ts`; emails in `server/emails/brief.ts`.
- Tokens: 32 random bytes, stored as SHA-256, 72 hours. The draft cookie `brief_owner` is httpOnly, scoped to `/api/brief`, and stored hashed. A confirmed brief keeps its token hash so a second click can say when it arrived.
- On confirm, the team email and the client's copy go in one Resend batch. If that fails the brief still counts, and the hourly sweep (`server/tasks/brief/sweep.ts`, cron in `wrangler.jsonc`) retries. The sweep also deletes briefs left pending for 14 days after their last send.
- Screens: Check your inbox (`BriefInbox`, polls every 4 seconds and on focus; the nav's main button is Resend, which counts down the 20 seconds between sends, dimmed), `/brief/confirm` (send, already received, expired, new link sent, invalid), and the thanks (`BriefThanks`). The answers stay in the browser until the brief is confirmed, so Back from Check your inbox edits and re-sends the same brief.

Tried locally (26 Nov 2026), with Resend's test address and the team email pointed at it:

- Typo recovery: one row however many sends, and only the newest link works. Confirming flips the waiting tab to Thank you.
- Links: opening one changes nothing until its button is pressed. Already confirmed, replaced and expired links each get their page, and an expired one sends a new link that retires it.
- Resend failing at confirm (a broken key): the brief still counts, and the sweep (`/_nitro/tasks/brief:sweep` in dev) sends it once, and only once.
- Spam checks: a filled honeypot and a brief sent too fast get the quiet fake success with nothing stored. Invalid answers get 400, and a fourth post in a minute gets 429.
- Resend limits: 20 seconds apart, 10 sends at most, also when edited and sent again. At the cap the client goes back to the review, and Send starts a new brief.

The prerender build passes: the home page and the work pages are prerendered, and `/brief` and `/brief/confirm` are left to the Worker.

Done (26 Nov 2026). On the `brief-builder` preview, a brief sent from desktop passed the real Turnstile, its link (on the preview's own host) was confirmed from a phone, the desktop tab flipped to Thank you, and both the team email and the client's copy arrived. The link, spam and failure checks above are the same code, so they weren't repeated there.

---

## M5: Branded PDF ✅

**Goal:** the confirmed brief arrives as an on-brand PDF.

- **First:** check the Workers plan. `wrangler.jsonc` notes the free plan, and Browser Rendering's limits depend on the plan.
- HTML print template built from the site's fonts, tokens and logo, rendered with Browser Rendering. `pdf-lib` is the fallback.
- Archive the PDF in R2 (`briefs/{id}.pdf`). Retry when generation fails. If it still fails, send the internal email without the attachment.
- Needs the branding template as a design reference.

Built (26 Nov 2026):

- No branding template exists, so the PDF is a light A4 page built from the site's own font (Saans, embedded), tokens and logo: the brief at a glance, then every step's answer with its follow-ups inside it, and the reference and page count in the footer. Template in `server/pdf/brief.ts`; `/_dev/brief-pdf` (dev only, `?long` for every answer at its limit) shows it in a browser.
- Rendered by Browser Run's `/pdf` REST action with an account token (`NUXT_CLOUDFLARE_BROWSER_TOKEN`, "Browser Run: Edit" on this account only), not the Worker's `browser` binding, which would mean moving the compatibility date. The free plan is enough (see "Branded PDF" in `brief-builder.md`).
- `server/utils/briefPdf.ts` renders it at confirm and keeps it in R2 (`BRIEF_PDFS`: `ditta-briefs`, `ditta-briefs-preview` for previews) with its key in `pdf_key` (migration 0002). Resend's batch call takes no attachments, so the two emails now go one at a time, each with an idempotency key so a retry doesn't send one twice.
- A PDF that fails never holds a brief up: the emails go without it, and the sweep keeps the PDF later (three a run).
- Tried locally: confirm attaches it and keeps it in R2; a broken token sends the emails without it; the sweep archives the missed ones.

Set up (26 Nov 2026): R2 enabled (free allowance: 10 GB, about 50,000 PDFs at roughly 200 KB each; beyond it R2 bills the card, so a budget alert is the guard), both buckets created in Western Europe, migration 0002 applied to both databases, and `NUXT_CLOUDFLARE_BROWSER_TOKEN` set on production, the `brief-builder` preview and Previews Base.

**Done when:** a long brief paginates cleanly, and when PDF generation fails on purpose, the brief still counts as confirmed and is delivered.

Done (26 Nov 2026). On the `brief-builder` preview, a confirmed brief arrived with its PDF attached to both emails. On the Worker, the logo's SVG is read from server assets as bytes rather than text, so it's decoded explicitly (`server/pdf/brief.ts`); the first preview PDF printed it as a row of numbers.

---

## Tests

End-to-end tests (Playwright) cover the flow M4 was checked by hand against: `npm run test:e2e` (`test:e2e:ui` to watch them). Local only for now.

- They start their own `nuxt dev` on port 3100, beside `npm run dev` (its own build dir, `.nuxt-e2e`), applying D1 migrations first. Config in `playwright.config.ts`, tests in `tests/e2e/`.
- Nothing leaves the machine: no Resend key, so emails land in the dev outbox (`/_dev/outbox?to=`), where the tests read the confirm link. No Browser Run token, so no PDF.
- Turnstile's script is swapped for a stand-in giving Cloudflare's dummy token (the real one hangs in Playwright's browser); the server still checks it against the always-pass test secret. Each test has its own email and `cf-connecting-ip`, so the rate limit counts them apart, and its sends add 25 seconds to `elapsed` to clear the too-fast check.
- Covered: confirm through to Thank you in the waiting tab, with the team email and the client's copy; opening a link changes nothing; typo recovery (the old link stops working, one brief); the Resend countdown; a link opened again after confirming; validation; the too-fast quiet success; the rate limit.
- Not covered, so still checked on the preview: real delivery, the PDF, the real Turnstile, and expired links (72 hours).

---

## M7: Launch

**Goal:** the builder is the main way new enquiries come in.

- "Start a brief" CTA from the site (Storyblok-managed, so it can be placed without a deploy). Remove `noindex`.
- Plausible custom events for each step reached, Send brief and confirmed, so we can see where people drop off.
- A privacy policy page at `/privacy-policy` (it doesn't exist yet; the consent line already links to it) covering brief data and how long it's kept.
- Team process: who answers a brief, and how they keep to "within two working days".

**Done when:** it's live, linked from the site, and the funnel shows up in Plausible.

In progress (26 Nov 2026):

- Plausible: `Brief: Started`, `Brief: Step` (props `step` and `number`), `Brief: Review`, `Brief: Sent`, and `Brief: Confirmed` from the confirm page (`app/composables/useBriefTracking.ts`). No answers are sent; an e2e test (`tests/e2e/plausible.spec.ts`) checks the sequence. **To do in Plausible:** add the five as custom event goals and a funnel Started → Review → Sent → Confirmed; break `Brief: Step` down by `number` to see where people stop.
- `/brief` is indexed. `/brief/confirm` stays noindex, as header and meta: it's only reached from an email.
- The menu's main button is now "Start a brief" (it was a "Talk to us" mailto). Any Storyblok link can point at `/brief` as a URL link.
- `/privacy-policy` is a Storyblok story (`privacy-policy`, a page with one Text block), unpublished. Page templates now render Text blocks. **Before launch:** fill in the [bracketed] parts (legal name and address, how long confirmed briefs are kept, Resend's transfer safeguard), have it checked, and publish it. `app.vue` looks up a Storyblok story only for the catch-all's pages, so code pages don't 404.
- Still open: the team process (who answers a brief, keeping to two working days).
