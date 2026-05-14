export default defineEventHandler(async () => {
  return `Hello, World! The current time is ${new Date().toLocaleTimeString()}`
})
