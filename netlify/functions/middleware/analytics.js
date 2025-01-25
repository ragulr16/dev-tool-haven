import { Axiom } from '@axiomhq/js'

export const trackEvent = async (eventType, metadata) => {
  const axiom = new Axiom({ 
    token: process.env.AXIOM_TOKEN,
    orgId: process.env.AXIOM_ORG_ID
  })
  
  await axiom.ingestEvents('dev-tools', [{
    _time: new Date().toISOString(),
    type: eventType,
    ...metadata
  }])
} 