const wait = (ms: number = 0) => new Promise((resolve) => setTimeout(resolve, ms))

export { wait }
