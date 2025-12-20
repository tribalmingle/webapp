/**
 * Test with tribemingle sender ID
 */

const TERMII_API_KEY = 'TLV90GetIWWqamdROrodTl3QUF6Crr6atRpxQ6S4f4Wilp61QWzxftmXSTNbNv'
const TERMII_BASE_URL = 'https://api.termii.com/api'
const TEST_PHONE = '+2347064849292'

async function testWithTribemingleSender() {
  console.log('📱 Testing with "tribemingle" sender ID...\n')
  
  const requestBody = {
    to: TEST_PHONE,
    from: 'tribemingle', // Using the newer sender ID registered specifically for Tribal Mingle
    sms: `Hello from Tribal Mingle! This is a test SMS at ${new Date().toLocaleTimeString()}. If you receive this, please confirm!`,
    type: 'plain',
    channel: 'generic',
    api_key: TERMII_API_KEY,
  }
  
  console.log('Sending SMS with sender ID: tribemingle')
  console.log('To:', TEST_PHONE)
  
  const response = await fetch(`${TERMII_BASE_URL}/sms/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })
  
  const data = await response.json()
  console.log('\nResponse:', JSON.stringify(data, null, 2))
  
  if (data.code === 'ok') {
    console.log('\n✅ Message accepted by Termii!')
    console.log('Message ID:', data.message_id)
    console.log('Balance remaining: ₦' + data.balance)
    console.log('\n⏱️  Please wait 30-60 seconds and check your phone.')
  }
}

testWithTribemingleSender()
