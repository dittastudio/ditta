# Brief Builder: content and flow

This file covers **what the brief builder asks and how each question is answered**: the 13 screens, their wording, field types, options, follow-up logic, validation, buttons and the summary.

The technical design (D1, Resend, tokens, PDF, endpoints) is in the separate **Brief Builder: UX Flow & System Plan** doc. Where the two meet, this file says so. If they disagree, raise it rather than guessing.

Source of truth for the wording: the repo. Questions, hints and options live in `app/utils/brief.ts` and `shared/schemas/brief.ts`; keep this file in step with them. The "Brief Builder Plan" artifact on claude.ai is retired.

---

## Who it's for and the rules it follows

The form is for prospective clients who often don't know exactly what they want yet. It has to help them work it out without feeling like a survey.

1. **One question per screen.** A follow-up question can appear underneath its parent on the same screen. Follow-ups don't count as a second question.
2. **Tap rather than type.** Use cards and sliders wherever there's a known set of answers. Only use text fields for things only the client can know (their business, name, email, links).
3. **Single-line by default.** Text answers are single-line inputs. A textarea is allowed where an answer genuinely needs more room, but none of the current questions use one.
4. **Every screen fits a small phone (320 × 568) without scrolling before a follow-up opens.** The exceptions are screen 1 (its cards keep their descriptions, so they stack one per row) and screen 3 (eight cards), plus the summary. Once a follow-up opens or a link row is added, the screen may scroll: the brief keeps the active field and the nav in view.
5. **Email comes last.** Nothing is sent to the server until the client presses **Send brief** on the summary (see the technical doc).
6. **UK English. Prices in GBP (£).** Plain, friendly copy, no jargon.

---

## Screen layout (every step)

```
┌──────────────────────────────┐
│ 3 of 13            ~3 min    │  progress text + bar, pinned top
│ ███████░░░░░░░░░░░░░░░░░░░░  │
│                              │
│  Question title (large)      │  question block vertically centred
│  Hint line (italic, muted)   │  in the remaining space
│  [ answer field / options ]  │
│  [ follow-up, if open ]      │
│                              │
├──────────────────────────────┤
│ [Back]              [Next]   │  buttons pinned to the bottom
└──────────────────────────────┘
```

- Use `min-height: 100dvh` (not `100vh`), so mobile address bars don't hide the buttons.
- Centre the content with `margin-block: auto` on the content, not `justify-content: center`, so a tall screen scrolls instead of clipping at the top.
- Progress reads "{current} of {total}". The bar fills to the same fraction.
- Screens slide in from the right going forward and from the left going back (short, eased; respect `prefers-reduced-motion`).

---

## Navigation and validation rules

| Rule                               | Behaviour                                                                                                                                                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Back**                           | Hidden on screen 1. From screen 2 it blurs and scales in.                                                                                                                                                                     |
| **Primary button label**           | `Next` by default. `Skip` on an optional screen that hasn't been answered. `Review` on the email screen (12). `Send brief` on the summary (13). `Back to summary` when the client got there from an Edit link on the summary. |
| **Required question not answered** | Next doesn't advance. The button shakes and a small message appears between the buttons: "Answer to continue".                                                                                                                |
| **Invalid email**                  | Same, with the message "Enter a valid email".                                                                                                                                                                                 |
| **Enter key**                      | In a text, URL or email field, Enter acts as the primary button.                                                                                                                                                              |
| **Autosave**                       | Every answer is saved locally as it changes (Pinia + localStorage, per the technical doc).                                                                                                                                    |

### Follow-up (conditional) questions

- A follow-up belongs to a **parent** question on the same screen and opens when the parent's answer **includes** a specific option (the "shows when" value).
- It appears directly under the parent's options. When the parent answer changes so it no longer matches, the follow-up hides.
- A follow-up is required **only while it's visible**.
- **Answers to hidden follow-ups are ignored**: they don't show in the summary and aren't submitted. Example: someone ticks Other, types something, then unticks Other.

### Personalisation

- `[name]` in a question title is replaced with the **first word** of the answer to "What's your full name?".
- If there's no name yet, remove `, [name]` entirely: "And your current website?"

---

## The 13 screens

Suggested `key`s are stable names for the answers JSON (the `answers` blob in D1), so the data doesn't depend on wording. The plan's internal ids are listed for cross-reference.

Contact screens 9–12 were labelled a–d in the original plan. The client sees plain numbering ("9 of 12"); the progress counts the 12 question screens, and the summary shows "Review".

---

### 1. Help needed

**What do you need help with?** · required
_Hint:_ Select all that apply.

|          |                                                   |
| -------- | ------------------------------------------------- |
| Field    | Multi-select cards                                |
| Options  | Web Design · Web Build · Existing project · Other |
| Key / id | `services` / `q1`                                 |
| Answer   | Array of chosen options, at least 1               |

**Follow-up:** shown when `services` includes **Other**

- **What else can we help with?** · required while shown · single-line text · key `servicesOther` / `q1b`

> "Web Build" is how we learn the client already has designs. That matters most to us, because we build from designs.

---

### 2. The business

**In a few words, what does your business do?** · required
_Hint:_ Give us your best elevator pitch 🛗

|          |                                                                                       |
| -------- | ------------------------------------------------------------------------------------- |
| Field    | Single-line text, about 100 characters                                                |
| Key / id | `business` / `q2`                                                                     |
| Answer   | String, trimmed, not empty                                                            |
| Notes    | The placeholder rotates real-world examples once, such as "A physio clinic in Ealing" |

---

### 3. Main job

**What are the main objectives for this work?** · required
_Hint:_ Pick what matters most.

|          |                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Field    | Multi-select cards                                                                                                                      |
| Options  | Showcase work · Improve SEO/GEO · Increase enquiries · Take bookings · Sell online · Explain what we do · Bespoke functionality · Other |
| Key / id | `objectives` / `q3`                                                                                                                     |
| Answer   | Array, at least 1                                                                                                                       |

**Follow-ups** (both can be open together):

- When `objectives` includes **Sell online**: **Roughly how many products?** · snapping slider · options _Under 10 · 10–50 · 50–200 · 200–1000 · 1000+_ · key `productCount` / `q3b`. This is the biggest cost driver for a shop.
- When `objectives` includes **Other**: **What else can we help with?** · single-line text · key `objectivesOther` / `qapu9km`

> With 8 cards plus two possible follow-ups, this is the tallest question screen. On a 320 × 568 phone it scrolls a little even before a follow-up opens.

---

### 4. Timing

**When would you like your project ready?** · required

|          |                                                                         |
| -------- | ----------------------------------------------------------------------- |
| Field    | Single-select cards (big-number style, e.g. "3" with "months" under it) |
| Options  | ASAP · 3 months · 6 months · Other                                      |
| Display  | ASAP "right away" · 3 "months" · 6 "months" · Other "something else"    |
| Key / id | `timing` / `q4`                                                         |

**Follow-up:** when `timing` = **Other**

- **Let us know your ideal timing** · required while shown · single-line text · key `timingOther` / `q824c97`

---

### 5. References

**Who are the main competitors in your space?** · optional
_Hint:_ Links and comments to companies you admire

|          |                                 |
| -------- | ------------------------------- |
| Field    | Links, add another              |
| Key / id | `references` / `q6`             |
| Answer   | Up to 3 items: `{ url, note? }` |

Behaviour:

- Starts with **one** URL field.
- Once a URL is typed, a smaller optional note field appears under it: "What do you like about it? (optional)".
- **"+ Add another link"** appears under the last row once it has a URL, up to 3 rows.
- **Pasting several links at once** into a URL field splits them into separate rows, up to 3.
- Button reads **Skip** until at least one URL is entered.

---

### 6. Files or links

**Is there anything you'd like to share?** · optional
_Hint:_ Designs, brand guidelines, a brief — anything that helps.

|          |                                  |
| -------- | -------------------------------- |
| Field    | Links, add another (as screen 5) |
| Key / id | `files` / `q7`                   |
| Answer   | Up to 3 items: `{ url, note? }`  |

Behaviour:

- Same rows as screen 5. The link field's placeholder cycles once through `figma.com/design/…`, `drive.google.com/…`, `docs.google.com/…`, `dropbox.com/…` and rests on "Paste a link", which is also what screen readers hear.
- The note field reads "What is this? (optional)".
- Under a link from Google Drive or Docs, Dropbox, OneDrive/SharePoint or Figma: "Check it's shared so anyone with the link can view."
- A draft saved when `files` was a single link string loads as one row.
- Button reads **Skip** until at least one URL is entered.

File uploads (a drop zone under the links) are M6 in `brief-builder-milestones.md`.

---

### 7. Content

**At what stage is your content?** · required
_Hint:_ Things like your about text, service descriptions and photos.

|          |                                                   |
| -------- | ------------------------------------------------- |
| Field    | Single-select cards                               |
| Options  | Ready to go · Partially ready · Not ready · Other |
| Key / id | `contentStage` / `q7c`                            |

**Follow-up:** when `contentStage` = **Other**

- **Clarify its current state** · required while shown · single-line text · key `contentOther` / `qn8cifh`

> Content readiness is the biggest hidden risk to timelines. Flag "Partially ready" and "Not ready" in the internal email and PDF summary.

---

### 8. Budget

**What budget do you have available?** · required
_Hint:_ Most of our projects are between £10k and £20k.

|          |                                                      |
| -------- | ---------------------------------------------------- |
| Field    | Snapping slider (one handle)                         |
| Points   | Under £5k · £5k–£10k · £10k–£20k · £20k–£40k · £40k+ |
| Key / id | `budget` / `q8`                                      |
| Answer   | The chosen band's label (store the index too)        |

Behaviour:

- **Starts on £10k–£20k, already chosen**, where most of our projects sit. Next works straight away; the client can move it or accept it as it is.
- Dragging snaps to the nearest point. Tapping a point's label jumps straight to it. Arrow keys move one point.
- The current band shows large above the slider and updates live.
- The same slider is used for the `productCount` follow-up on screen 3, which instead starts with nothing chosen: the large text reads "Drag to choose" and Next stays blocked ("Answer to continue") until a drag, tap or arrow key picks a band.

---

### 9. Name

**What's your full name?** · required

|          |                                                                |
| -------- | -------------------------------------------------------------- |
| Field    | Single-line text (`autocomplete="name"`)                       |
| Key / id | `name` / `q9`                                                  |
| Notes    | Its first word personalises screen 10 and the thank-you screen |

---

### 10. Website

**And your current website, [name]?** · optional
_Hint:_ Skip if you don't have one yet.

|          |                                                                               |
| -------- | ----------------------------------------------------------------------------- |
| Field    | URL                                                                           |
| Key / id | `website` / `q10`                                                             |
| Notes    | Also tells us whether they have a site at all. Button reads Skip until filled |

---

### 11. Source

**How did you find us?** · optional

|          |                                                                                               |
| -------- | --------------------------------------------------------------------------------------------- |
| Field    | Single-select cards                                                                           |
| Options  | Google · Instagram · LinkedIn · ChatGPT · Claude · Referral · From a website you made · Other |
| Key / id | `source` / `q11`                                                                              |

**Follow-up:** when `source` = **Other**

- **Let us know how you found us** · required while shown · single-line text · key `sourceOther` / `qa3t7ed`

---

### 12. Email

**And finally, what's your email?** · required
_Hint:_ So we can reply about your project. (Until M4 sends the client a copy; then: "We'll send you a copy of your brief.")

|                |                                                   |
| -------------- | ------------------------------------------------- |
| Field          | Email (`type="email"`, `autocomplete="email"`)    |
| Key / id       | `email` / `q12`                                   |
| Validation     | Basic format check; message "Enter a valid email" |
| Primary button | **Review**                                        |

This screen also carries:

- a light "did you mean gmail.com?" typo check
- a **consent** line, with no checkbox: "We'll only use this to reply about your project. See our privacy policy." The link goes to `/privacy-policy`, which has to exist before launch (M7).
- the hidden **honeypot** field, added in M3 with the endpoint

---

### 13. Summary

**Review your brief**, with "Check everything's right before you send it" underneath

The review screen. It lists **every visible question in order**, numbered, with the answer underneath and a small **Edit** button.

```
1  What do you need help with?                Edit
   Web Design, Other
2  What else can we help with?                Edit
   A booking system for classes
3  In a few words, what does your business do? Edit
   A physio clinic in Ealing
…
9  Who are the main competitors in your space? Edit
   Skipped
```

- Hidden follow-ups are left out. Visible follow-ups appear straight after their parent.
- Unanswered optional questions show **Skipped**. Unanswered required ones (shouldn't happen) show **Not answered**. Both are muted and italic.
- Answers are formatted as follows:
  - multi-select: comma-separated
  - slider: the band label
  - links: "url (note)", comma-separated
- **Edit** jumps to that screen. Its primary button becomes **Back to summary**, and picking a single-select option returns to the summary automatically.
- This screen may scroll.
- Primary button: **Send brief**. This is the **Submit** in the technical doc: it creates the pending record and sends the "Confirm & send your brief" email. The flow then goes to **Check your inbox** and the rest of the technical doc's screens.

**Thank you** (after confirmation): "Thanks, {first name}. Your brief is on its way. We'll reply within two working days to book a short call." The same two-working-day promise goes in the emails.

---

## Field types reference

| Type                | Looks like                             | Answer shape              | Notes                      |
| ------------------- | -------------------------------------- | ------------------------- | -------------------------- |
| Text                | One-line input                         | `string`                  | Textarea only if needed    |
| Email               | One-line input                         | `string`                  | Format validated           |
| URL                 | One-line input, `https://` placeholder | `string`                  |                            |
| Links, add another  | URL rows + optional note               | `{ url, note? }[]`, max 3 | Paste splitting            |
| Single-select cards | Grid of cards                          | `string`                  | Next to continue           |
| Multi-select cards  | Same, several can be on                | `string[]`                | Hint says "Pick any"       |
| Snapping slider     | One handle + labelled points           | `string` (label)          | Starts with nothing chosen |
| Info                | No input                               | n/a                       | Used for the summary       |

Options marked "Not sure" or "No idea" (none at present) get a dashed border so they read as a valid answer, not a failure.

---

## Things still to settle

Nothing at present. Settled in M0 (see `brief-builder-milestones.md`): order of contact screens and summary, screen 6 as links (uploads in M6), consent wording, plain numbering, the small-phone exception for screen 3, the repo as source of truth, the two-working-day promise, the budget hint figures, and no "not sure" tips on the summary for v1.
