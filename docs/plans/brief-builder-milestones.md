# Brief Builder: milestones

The order in which the brief builder gets built. What each screen asks lives in [brief-builder-flow.md](./brief-builder-flow.md). The technical design (D1, Resend, tokens, PDF) lives in [brief-builder.md](./brief-builder.md). This file only covers **order and scope**: what each milestone ships, and when it's done.

Each milestone should leave the site deployable. The builder stays unlinked and `noindex` until M7.

---

## M0: Settle the open questions ✅

**Goal:** the two plan docs agree with each other and with what we're building.

Decided (18 Nov 2026), and written into both docs:

- **Order:** the contact screens (9–12) come **before** the Summary, and **Send brief** on the Summary is the Submit.
- **Uploads:** screen 6 takes **links only** for v1 (up to 3, like screen 5, with a sharing reminder for Drive, Dropbox, Figma and the like). File uploads move to M6. (Links revised 24 Nov 2026.)
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
- All 13 screens come from one config, with follow-ups, validation, `[name]` personalisation, Summary with Edit, and "Back to summary".
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

## M3: Simple submission

**Goal:** real leads arrive with the smallest backend that's safe to run.

- `POST /api/brief` (Nitro server route) validates the answers server-side against the same step config.
- Spam protection: honeypot, minimum time-on-form, Cloudflare Turnstile, and per-IP rate limiting.
- One Resend email to the team, with the answers inline and `reply_to` set to the client.
- Verify `ditta.studio` in Resend (SPF, DKIM, DMARC). Store `NUXT_RESEND_API_KEY` as a Worker secret.
- The client sees "Thanks, we've got it".

No database and no email verification yet. This milestone tells us how much spam and how many fake addresses actually come in. If there are few, M4 can wait.

Built (24 Nov 2026), waiting on accounts:

- `server/api/brief.post.ts` parses `briefSubmitSchema` (answers, `elapsed`, honeypot, Turnstile token). Order: rate limit, parse, honeypot and 20-second minimum (a quiet fake success), Turnstile, then Resend.
- Rate limit: the Workers `BRIEF_RATE_LIMIT` binding in `wrangler.jsonc`, 3 a minute per IP (Workers only count over 10 or 60 seconds). Absent in `nuxt dev` and on previews, where it's skipped.
- Resend through its REST API with `$fetch`, not the SDK: one call doesn't need the dependency. Template in `server/emails/brief.ts`, written from the same question copy (`shared/utils/brief.ts`).
- Turnstile in managed, interaction-only mode on the summary. `nuxt dev` falls back to Cloudflare's always-pass test keys; built sites refuse to send without real ones.
- After a send the answers are cleared and the thank-you screen shows. The mocked Check your inbox screen is unreachable until M4.

**To launch:** verify `ditta.studio` in Resend; create the Turnstile widget; set `NUXT_RESEND_API_KEY`, `NUXT_TURNSTILE_SECRET_KEY`, `NUXT_BRIEF_FROM` (`ditta briefs <briefs@ditta.studio>`) and `NUXT_BRIEF_TO` (`hello@ditta.studio`) as Worker secrets, and `NUXT_PUBLIC_TURNSTILE_SITE_KEY` as a build variable too.

**Done when:** a brief submitted from production arrives in the team inbox, and the spam checks reject a scripted submission.

---

## M4: Verified submission

**Goal:** only briefs with a confirmed email reach the team (the full flow in `brief-builder.md`).

- D1 `briefs` table and migrations under `server/database/migrations/`.
- `pending` → `confirmed` states. Hashed, expiring, single-use tokens. Draft cookie.
- Endpoints: create/update, resend (with email edit), status poll, confirm GET (no side effects), confirm POST.
- Screens: Check your inbox (with the "Not received your email?" panel), confirm landing, expired, already confirmed, thank you.
- Client copy email. A cron trigger deletes stale `pending` rows.

**Done when:** every item in the Verification section of `brief-builder.md` passes, except the PDF items.

---

## M5: Branded PDF

**Goal:** the confirmed brief arrives as an on-brand PDF.

- **First:** check the Workers plan. `wrangler.jsonc` notes the free plan, and Browser Rendering's limits depend on the plan.
- HTML print template built from the site's fonts, tokens and logo, rendered with Browser Rendering. `pdf-lib` is the fallback.
- Archive the PDF in R2 (`briefs/{id}.pdf`). Retry when generation fails. If it still fails, send the internal email without the attachment.
- Needs the branding template as a design reference.

**Done when:** a long brief paginates cleanly, and when PDF generation fails on purpose, the brief still counts as confirmed and is delivered.

---

## M6: File uploads

**Goal:** clients can attach designs or brand guidelines on screen 6, alongside the links. Settled 24 Nov 2026.

**UI**

- A dashed drop zone under the link rows: the inputs' border colour and radius, "Drop files here or browse" with the limits underneath. On touch it reads "Choose files" (no drag and drop there).
- It turns olive, like a selected card, while files are dragged over the page.
- A row per file under the zone: name, size, progress, and a remove (×) button.
- Skip until there's a link or a file. The summary lists the file names after the links.

**Limits**

- Up to 5 files, 25MB each. PDF, images (PNG, JPG, WebP, SVG, GIF), Word, Excel, PowerPoint, Keynote, Pages, ZIP.
- Design-tool files (`.fig`, `.psd`, `.ai`) are refused, with copy suggesting a zip or a link.
- Checked in the browser for instant feedback, and again on the server.

**Upload**

- Each file uploads as soon as it's dropped, straight to R2 with a presigned URL from a Worker route, never through the Worker.
- Files sit under an upload id kept in localStorage with the answers, so a refresh keeps them. Submit attaches them to the brief.
- Uploads not attached to a confirmed brief are deleted after 14 days, with the `pending` records.

**Security and abuse**

- Presigned URLs only for an upload id under its limits, rate-limited per IP (e.g. 20 an hour), behind the M3 honeypot.
- When an upload finishes, the server reads the file's first bytes and deletes it if its real type doesn't match.
- Always served with `Content-Disposition: attachment`, never inline, so an SVG or HTML file can't run on the site.
- No virus scanning: R2 has none, and only the team opens the files.

**Delivery and retention**

- The team email and the PDF list each file as a signed, non-expiring link to a Worker route that streams it from R2. Never email attachments.
- Files from confirmed briefs are kept 12 months, then deleted. The privacy policy (M7) says so.

**Done when:** five 25MB files go through end to end and survive a refresh mid-brief; an oversized or wrong-type file is refused with a clear message; a renamed `.html` posing as a PDF is deleted after upload.

---

## M7: Launch

**Goal:** the builder is the main way new enquiries come in.

- "Start a brief" CTA from the site (Storyblok-managed, so it can be placed without a deploy). Remove `noindex`.
- Plausible custom events for each step reached, Send brief and confirmed, so we can see where people drop off.
- A privacy policy page at `/privacy-policy` (it doesn't exist yet; the consent line already links to it) covering brief data and how long it's kept.
- Team process: who answers a brief, and how they keep to "within two working days".

**Done when:** it's live, linked from the site, and the funnel shows up in Plausible.
