import type { BriefAnswersInput } from '#shared/schemas/brief'

// A brief with every required answer, and nothing optional
export const completeAnswers = (): BriefAnswersInput => ({
  services: ['Web Design'],
  business: 'Independent coffee roaster in Hackney',
  objectives: ['Explain what we do'],
  timing: 'ASAP',
  contentStage: 'Ready to go',
  budget: '£10k–£20k',
  name: 'Sam Taylor',
  email: 'sam@example.com',
})
