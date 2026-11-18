# Brief Builder: milestones

The order in which the brief builder gets built. What each screen asks lives in [brief-builder-flow.md](./brief-builder-flow.md). The technical design (D1, Resend, tokens, PDF) lives in [brief-builder.md](./brief-builder.md). This file only covers **order and scope**: what each milestone ships, and when it's done.

Each milestone should leave the site deployable. The builder stays unlinked and `noindex` until M7.

---

## M0: Settle the open questions

**Goal:** the two plan docs agree with each other and with what we're building.

- **Order:** the contact screens (9–12) come **before** the Summary, and **Send brief** on the Summary is the Submit. Update the Happy path and Screens sections of `brief-builder.md` to match. With the email visible on the Summary, people catch typos before anything is sent.
- **Uploads:** screen 6 is **link-only** for v1. File uploads move to M6.
- **Budget:** add the real "£X and £Y" figures and check the five bands. Decide whether the slider starts on "Under £5k" (as the docs say now) or starts with nothing selected and needs a touch. Starting on the lowest band anchors people low, and the screen always counts as answered.
- **Screen 12:** wording for the consent line and the privacy link. Decide whether a checkbox is needed.
- **Contact lettering:** show "a–d", or plain "9 of 13". The prototype uses plain numbering.
- **Small-phone rule:** relax "fits 320 × 568 without scrolling" for screen 3. With 8 cards and two follow-ups, it can't fit.
- **Source of truth:** once the copy is in code (`app/utils/brief.ts`), the repo owns it, not the claude.ai artifact. Update the note at the top of `brief-builder-flow.md`.
- **Response-time promise** for the thank-you screen and the emails.

**Done when:** both docs are updated and nothing in "Things still to settle" blocks M1–M3.

---

## M1: Clickable prototype at `/brief`

**Goal:** find out whether the form itself works (length, wording, feel) before building any backend.

- Client-only page at `/brief` (`ssr: false`, not prerendered, `noindex`, not linked anywhere).
- All 13 screens come from one config, with follow-ups, auto-advance, validation, `[name]` personalisation, Summary with Edit, and "Back to summary".
- Answers persist in localStorage, so a refresh resumes where you left off.
- **Send brief** goes to a mocked "Check your inbox" screen, which links on to a mocked "Thank you". Nothing is sent.
- Visual design is deliberately plain.

**Done when:** at least 3–5 people outside the team have filled it in on their phones, and the findings have gone back into M0's docs (questions to cut, reword or reorder).

---

## M1.5: Validation on Regle + Zod

**Goal:** the prototype validates the way the real thing will (see "Validation — Regle + Zod" in `brief-builder.md` and "Forms & Validation" in `AGENTS.md`), so M2 designs the final field components and M3 reuses the rules.

- `shared/schemas/brief.ts` holds the options, one Zod schema per screen (`briefStepSchemas`), the whole-brief `briefAnswersSchema`, and the follow-up rules (when each shows, required only while shown, dropped when hidden).
- Each question screen binds its schema with `useRegleSchema`. Next and auto-advance call `r$.$validate()`, and errors show under the field they belong to, linked with `useId()` and `aria-describedby`.
- Links accept "acme.com" and are stored as "https://acme.com".
- The draft store is typed from the schema (`z.input`). Send brief checks the whole brief against `briefAnswersSchema`.
- Still to add in M3: `briefDetailsSchema` (consent, honeypot) and the resend/confirm schemas, once those fields exist.

**Done when:** every check from M1 still behaves the same, with no hand-written validation left in `app/`.

---

## M2: Design and feel

**Goal:** the builder looks and feels like ditta.

- Figma design for the screen layout, cards, chips, slider, links and summary, implemented with the `@theme` tokens.
- Motion: screen slides, card selection, the shake. Respect `prefers-reduced-motion`.
- Keyboard: letter shortcuts for cards (A, B, C…), focus management between screens, visible focus states.
- Accessibility: grouped inputs labelled with fieldset/legend, live region for errors and step changes, screen-reader pass.
- Big-number style for the timing cards. Rotating placeholder examples on screen 2.

**Done when:** it matches the design on a 320 × 568 phone and on desktop, and passes a keyboard-only run-through.

---

## M3: Simple submission

**Goal:** real leads arrive with the smallest backend that's safe to run.

- `POST /api/brief` (Nitro server route) validates the answers server-side against the same step config.
- Spam protection: honeypot, minimum time-on-form, Cloudflare Turnstile, and per-IP rate limiting.
- One Resend email to the team, with the answers inline and `reply_to` set to the client.
- Verify `ditta.studio` in Resend (SPF, DKIM, DMARC). Store `NUXT_RESEND_API_KEY` as a Worker secret.
- The client sees "Thanks, we've got it".

No database and no email verification yet. This milestone tells us how much spam and how many fake addresses actually come in. If there are few, M4 can wait.

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

## M6: File uploads (if still wanted)

**Goal:** clients can attach designs or brand guidelines on screen 6.

- Upload to R2 at Submit through a presigned or Worker-proxied upload. Validate type and the 10MB limit on the server.
- Link the file in the team email and the PDF. Delete unconfirmed uploads together with their `pending` record.

**Done when:** a 10MB zip goes through end to end, and an oversized file is rejected with a clear message.

---

## M7: Launch

**Goal:** the builder is the main way new enquiries come in.

- "Start a brief" CTA from the site (Storyblok-managed, so it can be placed without a deploy). Remove `noindex`.
- Plausible custom events for each step reached, Send brief and confirmed, so we can see where people drop off.
- Privacy policy covers brief data and how long it's kept.
- Team process: who answers a brief, and how fast (to match the promise on the thank-you screen).

**Done when:** it's live, linked from the site, and the funnel shows up in Plausible.
