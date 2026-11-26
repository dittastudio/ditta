import { briefTokenSchema } from '#shared/schemas/brief'

// The confirm page's first look at its link. No side effects: email scanners open links before people do, so only
// the page's button (confirm.post.ts) sends the brief.
export default defineEventHandler(async (event) => {
  const { token } = await getValidatedQuery(event, (value) => briefTokenSchema.parse(value))
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return briefLinkState(await briefByToken(event, token))
})
