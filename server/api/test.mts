export default defineEventHandler(async (event) => {
  console.log(event)

  return {
    data: {},
    error: false,
  }
})
