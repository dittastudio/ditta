import sgMail from '@sendgrid/mail'
import { z } from 'zod'
import type { HandlerEvent } from '@netlify/functions'

type Fields = {
  name: string
  company: string
  email: string
  message: string
}

exports.handler = async (event: HandlerEvent) => {
  const { SENDGRID_API_KEY } = process.env

  if (!SENDGRID_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'SENDGRID_API_KEY is not defined',
        error: true,
        errors: []
      })
    }
  }

  if (!event.body?.length) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'No fields posted on request',
        error: true,
        errors: []
      })
    }
  }

  const data = JSON.parse(event.body) as Fields

  const validationSchema = z.object({
    name: z.string().trim().min(1, 'Please provide your name').default(''),
    company: z.string().trim().min(1, 'Please provide your company').default(''),
    email: z
      .string()
      .trim()
      .min(1, 'Please provide your email')
      .email({ message: 'Email address must be valid' })
      .default(''),
    message: z.string().trim().min(1, 'Please provide a message').default('')
  })

  const validation = validationSchema.safeParse(data)

  if (!validation.success) {
    return {
      statusCode: 422,
      body: JSON.stringify({
        message: 'Please check the form and try again.',
        error: true,
        errors: validation.error.errors
      })
    }
  }

  sgMail.setApiKey(SENDGRID_API_KEY ?? '')

  const message = {
    to: 'hello@ditta.studio',
    from: 'hello@ditta.studio',
    replyTo: `${data.name} <${data.email}>`,
    subject: `Ditta: ${data.name} from ${data.company}`,
    text: `${data.message}`,
    html: data.message
      .split('\n')
      .filter(item => item.trim().length)
      .map(item => `<p>${item}</p>`)
      .join('')
  }

  try {
    await sgMail.send(message)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Thank you for your message. We're looking into it and will be in contact soon.`,
        error: false,
        errors: []
      })
    }
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'An error occured trying to send the email. Please try again.',
        error: true,
        errors: []
      })
    }
  }
}
