export type CsfleFieldMap = Record<string, string[]>

export const csfleFieldMap: CsfleFieldMap = {
  users: ['email', 'phone', 'passwordHash', 'trustedDevices.deviceId'],
  profiles: ['location', 'mediaGallery.url', 'promptResponses.answer'],
  chat_messages: ['body', 'attachments.url'],
  payments: ['providerPaymentId', 'amount', 'feeAmount'],
  subscriptions: ['providerCustomerId', 'providerSubscriptionId'],
  guardian_invite_requests: ['contact'],
  reports: ['details', 'evidence'],
  moderation_actions: ['notes'],
}

export function toCsfleJson() {
  return Object.entries(csfleFieldMap).map(([collection, fields]) => ({
    collection,
    fields,
  }))
}
