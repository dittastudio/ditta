# Brief Builder — UX Flow & System Plan

## Context

ditta wants a "brief builder": a guided, multi-step form where a prospective client gives their details, budget, timings, services needed and so on. Two goals:

1. **Real leads only.** A brief only reaches the team once someone has proved they control a real email address.
2. **Low friction, honest input.** Let people explore the form freely. Ask for their email **at the end**, once they've invested in the brief and mean to send it. At that point they're far more likely to give their real address than a throwaway one, and to type it carefully.

This plan covers the **flow**: the screens, the states a brief moves through, the email loop, and the data behind it. Which questions to ask is left out on purpose; the flow treats "the questions" as a list of steps that can change.

### What the current codebase means for this

- The site is **prerendered/SSG** (`routeRules '/**': prerender`) but already ships Nitro server routes (`server/api/weather.ts`, `server/api/sitemap.ts`), and `nitro.experimental.wasm` points at **Cloudflare Workers**. So server endpoints are available, and a Cloudflare-native store (D1) fits without new hosting.
- `pinia` + `pinia-plugin-persistedstate` are already installed. They're ideal for holding the whole in-progress brief **client-side** until submission.
- No forms, email sending or database exist yet. All of this is new.

### Settled decisions

- **Database:** Cloudflare D1
- **Email:** Resend
- **Deliverable:** when a brief is confirmed, it's summarised into a **branded PDF** and attached to both the internal email to ditta and the client's copy.

---

## Core principle: nothing touches the server until they submit

- The brief is filled in entirely in the browser. Answers live in a persisted Pinia store (localStorage), so a refresh or coming back later on the same browser resumes where they left off.
- The **last step** asks for name and email (and consent).
- Pressing **Submit** is the first moment a DB record is created and an email is sent.
- The brief only counts as **received** once they click the link in that email.

## Happy path

```
[CTA "Start a brief"] → /brief
        │
        ▼
[Steps 1…N: the brief]          answers saved locally only (Pinia + localStorage)
        │
        ▼
[Review]                         summary of all answers, "Edit" per section
        │
        ▼
[Final step: name + email + consent]
        │  Submit
        ▼
POST /api/brief  ──►  create record (status: pending), store answers,
                      generate token, send "Confirm your brief" email
                      return brief id → kept in local store
        │
        ▼
[Check your inbox to finish]
  "We've sent a link to jo@acme.com. Click it to send your brief to us."
  link: "Not received your email?"
        │
        │        [Email: "Confirm & send your brief to ditta"]
        │              │ click
        │              ▼
        │        /brief/confirm?token=…  → [Confirm & send] button
        │              │ POST /api/brief/confirm
        │              ▼
        │        status: confirmed → generate branded PDF
        │                          → Resend: email ditta + client, PDF attached
        │              ▼
        │        [Thank you — brief received]
        │
        └── the original tab polls / checks on focus → also flips to "Thank you"
```

The local draft is cleared once the brief is confirmed.

## "Not received your email?"

This is the recovery loop. Clicking it opens a panel on the Check-your-inbox screen:

```
[Not received your email?]
   • Check spam/promotions
   • Email shown, editable:  [ jo@acme.co      ]   ← fix a typo here
   • [Resend]  (rate-limited, e.g. once per 60s)
```

What happens on **Resend**:

- The client sends the **brief id it already holds** plus the (possibly corrected) email. `POST /api/brief/:id/resend`
- The server checks the DB: the record exists, it's still `pending`, and the request comes from the same browser (draft cookie, see below).
  - **Email changed**: update the email on the record, **invalidate the old token**, issue a new one, and send to the new address.
  - **Email unchanged**: rotate the token and resend.
- No new record is created. One brief stays one row however many times they retry.

If they go **back** to edit answers while pending, the next Submit updates the same record (by id) and re-sends. It doesn't create a duplicate.

## Other paths to handle

| Situation                                                   | Behaviour                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clicks the link on another device (e.g. phone)              | Works fine. The token alone confirms. The phone shows Thank you, and the desktop tab picks it up on its next poll.                                                                                                                                                 |
| Link expired (e.g. after 72h)                               | Page says "This link has expired", with a button to email a fresh link to the same address.                                                                                                                                                                        |
| Link already used                                           | Page says "Your brief was received on {date}". Idempotent, no error.                                                                                                                                                                                               |
| Closes the tab while pending, returns later on same browser | The local store still has the id, so `/brief` reopens on Check your inbox (with resend), not a blank form.                                                                                                                                                         |
| Returns on a **different** browser before submitting        | There's no server copy yet, so they start again. This is the accepted cost of email-at-the-end. Keep the "~5 minutes" promise honest.                                                                                                                              |
| Never confirms                                              | No reminders: finishing the brief is up to the client. Their browser session (the local store with answers and brief id) still lets them come back to Check your inbox and resend whenever they like. The `pending` record is auto-deleted after N days (e.g. 14). |
| Submits a second, separate brief with the same email        | Allowed. Each brief is its own record.                                                                                                                                                                                                                             |

## Brief states

```
(local draft) ──Submit──► pending ──click link + confirm──► confirmed
                             │  ▲
                   resend /  └──┘  (email edit, token rotated)
                             │
                             └──(expiry)──► deleted
```

`confirmed` is locked. Any changes after that go through a human conversation, not the form.

---

## Screens

1. **Brief steps**: one topic per step, progress indicator, Back/Next, local autosave.
2. **Review**: grouped summary with edit links.
3. **Your details**: name, email (with a light "did you mean gmail.com?" check), consent, Submit. Honeypot field here.
4. **Check your inbox**: shows the address, "Not received your email?" panel, auto-advances on confirm.
5. **Confirm landing** (`/brief/confirm`): a short summary and a **Confirm & send** button. A button rather than auto-confirm on GET, because email link scanners (Outlook Safe Links and similar) pre-fetch URLs and would otherwise "confirm" on the person's behalf.
6. **Thank you**: what happens next and expected response time.
7. **Expired / already-confirmed** landing states.

The step list comes from one config (or Storyblok), so the questions can change without touching the flow.

---

## Data & system design

### Storage — one table (Cloudflare D1)

Bind D1 in `wrangler.toml`/Nitro config and access it through Nitro's `useDatabase` / `db0` (D1 connector). Locally, use `wrangler dev`'s D1 emulation, or `better-sqlite3` (already a dev dependency) through the same `db0` interface. Keep migrations as SQL files under `server/database/migrations/`. A scheduled Worker (cron trigger) deletes expired `pending` rows.

`briefs`

| column                                     | notes                                                               |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `id`                                       | random UUID                                                         |
| `name`, `email`                            | from the final step                                                 |
| `status`                                   | `pending` \| `confirmed`                                            |
| `answers`                                  | JSON blob, so the table schema stays stable as the questions change |
| `token_hash`                               | **hash** of the current email token, never the raw value            |
| `token_expires_at`                         | e.g. 72h                                                            |
| `resend_count`, `last_sent_at`             | for rate limiting                                                   |
| `pdf_key`                                  | R2 object key of the generated PDF (if stored)                      |
| `pdf_status`, `notified_at`                | for retrying PDF generation and email sending                       |
| `confirmed_at`, `created_at`, `updated_at` |                                                                     |

### Id vs token vs cookie

- **Brief id**: identifies the record. The client keeps it after Submit so it can resend or update the same row.
- **Email token**: random, single-purpose, in the link only. It proves control of the inbox. Stored hashed, and rotated on every resend or email change.
- **Draft cookie** (httpOnly, set by `POST /api/brief`): ties resend and update requests to the browser that created the brief. Someone who guesses or sees an id can't change its email.

### Endpoints (`server/api/brief/…`)

- `POST /`: create a pending brief (or update it, if this browser's cookie already owns a pending one), send the email
- `POST /:id/resend`: optional new email; rotate the token; resend
- `GET /:id/status`: the Check-your-inbox screen polls this to know when to flip to Thank you
- `GET /confirm?token=`: validate and return a summary for the landing page (no side effects)
- `POST /confirm`: mark confirmed, clear the token, generate the PDF, then send both emails with it attached (see below)

### Rendering

`/brief/**` is per-user, so exclude it from prerender and render it client-side, e.g. `routeRules: { '/brief/**': { ssr: false, prerender: false } }`. `/api/brief/*` runs on the Worker like the existing `server/api` routes.

### Email — Resend

- Use the `resend` SDK, which works in Workers via `fetch`. Put the API key in private `runtimeConfig` (`NUXT_RESEND_API_KEY`), never `public`.
- Verify the sending domain (`ditta.studio`) in Resend with SPF, DKIM and DMARC, so the magic link reaches the inbox and doesn't land in spam. That matters more here than usual, because the whole flow depends on that email arriving.
- Send from something like `briefs@ditta.studio`. Set `reply_to` on the internal email to the client's address, so the team can reply directly.
- Build the templates with Resend's React Email, or plain HTML strings, kept in `server/emails/`.

| #   | Email                                                         | To     | Attachment    |
| --- | ------------------------------------------------------------- | ------ | ------------- |
| 1   | Confirm & send your brief (magic link), also used for resends | client | none          |
| 2   | "We've got your brief", with a copy                           | client | **brief PDF** |
| 3   | New brief from {name}, {company}                              | ditta  | **brief PDF** |

No reminder emails are sent. Emails 2 and 3 can go in one `resend.batch.send` call, both using the same generated PDF buffer (base64 `attachments[{ filename, content }]`).

### Branded PDF

**When:** generated once, inside `POST /confirm`, after the status flips to `confirmed`. Unconfirmed briefs never produce a PDF.

**Approach:** an **HTML print template rendered to PDF with Cloudflare Browser Rendering** (`@cloudflare/puppeteer`, `page.pdf()`).

- The template is HTML/CSS, so it can use the site's own fonts (`public/fonts/`), the colour and spacing tokens from `app/assets/css/app.css`, and the logo SVG (`app/assets/icons/ditta.svg`). The PDF then stays on-brand automatically as the brand evolves.
- It needs CSS paged-media support for a proper document: A4, margins, a header/footer with page numbers via Puppeteer's `headerTemplate`/`footerTemplate`, and `break-inside: avoid` on answer groups.
- Render it from an internal-only route or a server-side HTML string. It must not be public. For example, a Worker endpoint that takes a signed, short-lived render token and feeds the brief's answers into the template.
- Cost and limits: Browser Rendering needs the Workers Paid plan and has concurrency and time limits. That's fine at the expected brief volume.

**Fallback** if Browser Rendering proves awkward: build the PDF with `pdf-lib`, which is pure JS and runs in Workers. That means more manual layout, but no browser.

(The existing `satori` + `@resvg/resvg-js` in the repo produce SVG/PNG for OG images, not multi-page PDFs, so they aren't a good fit here.)

**Content of the PDF** (structure, not the questions):

1. Cover: logo, "Project brief", client name and company, date, brief reference (short id)
2. Summary: an at-a-glance block with services, budget range, timings and contact details
3. Full answers, grouped by brief section, in step order
4. Footer: ditta contact details and the reference on each page

**Branding template:** the existing branded template (Figma or another source) needs to be supplied as the design reference for the HTML print template.

**Storage (optional but recommended):** also write the PDF to **Cloudflare R2** (`briefs/{id}.pdf`) and save its key on the record. The team can then re-download it later without regenerating it, and an email failure doesn't lose the document.

**Failure handling:** if PDF generation or sending fails, the brief must still count as `confirmed` and the client should still see Thank you. Record `pdf_status` / `notified_at`, retry in the background with Cloudflare Queues or a `waitUntil` retry, and as a last resort send the internal email without an attachment, with the answers inline.

---

## Security & abuse

- Honeypot and a minimum time-on-form before `POST /`. Add Cloudflare Turnstile at the details step if spam appears.
- Rate limit create and resend per IP and per brief/email, so the form can't be used to send email to arbitrary addresses.
- Tokens: 32+ random bytes, hashed, single-use, expiring. The old token dies on resend.
- Cookies: httpOnly, Secure, SameSite=Lax.
- GDPR: consent at the details step, privacy link, auto-delete unconfirmed records, and a retention policy for confirmed ones.

---

## Open decisions (later, not blocking the flow)

- Where confirmed briefs land for the team: email, Slack, a CRM, or an internal view of the table.
- Step list in code vs Storyblok.
- Pending expiry length (how long an unconfirmed record is kept before deletion).
- Supply the branding template (source file) for the PDF.
- Whether to archive PDFs in R2 (recommended).

## Verification (when built)

- Happy path locally with `wrangler dev` (D1 local) and Resend's test addresses (`delivered@resend.dev`).
- The PDF is attached to both the ditta and client emails, renders the brand fonts and logo, paginates cleanly with a long brief, and matches the branding template.
- Make PDF generation or Resend fail on purpose: the brief still shows as confirmed, and the retry delivers it.
- Typo recovery: submit with a wrong email, fix it via "Not received?", confirm that the old link is dead and the new one works, and that there's still one DB row.
- Cross-device confirm: the desktop tab flips to Thank you.
- Expired / reused link states. A GET on the confirm link alone does not confirm.
- Rate limits and the honeypot reject as expected. The prerender build succeeds with `/brief` excluded.
