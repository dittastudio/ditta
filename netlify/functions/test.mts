import type { HandlerEvent } from '@netlify/functions'

export const handler = async (event: HandlerEvent) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      message: `Hello World!`,
      error: false,
    }),
  }
}
