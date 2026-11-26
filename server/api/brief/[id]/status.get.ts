// Polled by Check your inbox, so the tab flips to Thank you once the link is clicked, on whichever device
export default defineEventHandler(async (event) => {
  const row = await ownedBrief(event, getRouterParam(event, 'id') ?? '')
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return { status: row.status, email: row.email }
})
