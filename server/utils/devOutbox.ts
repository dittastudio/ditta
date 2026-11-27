// Dev only: the emails `sendEmails` would have sent, when there's no Resend key, for the e2e tests to read the confirm
// link from (server/dev/outbox.ts). Lost on restart, which is all a test run needs.
export interface DevOutboxEmail {
  to: string
  subject: string
  html: string
  text: string
  attachments: string[]
}

export const devOutbox: DevOutboxEmail[] = []
