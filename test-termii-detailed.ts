/**
 * Detailed Termii API Test
 * Check account balance, sender ID, and full API responses
 */

const TERMII_API_KEY = 'TLV90GetIWWqamdROrodTl3QUF6Crr6atRpxQ6S4f4Wilp61QWzxftmXSTNbNv'
const TERMII_BASE_URL = 'https://api.termii.com/api'
const TEST_PHONES = ['+2347064849292', '+2348063009268']

async function checkBalance() {
  console.log('\n💰 Checking Termii Account Balance...')
  console.log('=' .repeat(50))
  
  try {
    const response = await fetch(`${TERMII_BASE_URL}/get-balance?api_key=${TERMII_API_KEY}`)
    const data = await response.json()
    
    console.log('Response Status:', response.status, response.statusText)
    console.log('Balance Data:', JSON.stringify(data, null, 2))
    
    return data
  } catch (error) {
    console.error('Balance check error:', error)
  }
}

async function checkSenderId() {
  console.log('\n📝 Checking Sender IDs...')
  console.log('=' .repeat(50))
  
  try {
    const response = await fetch(`${TERMII_BASE_URL}/sender-id?api_key=${TERMII_API_KEY}`)
    const data = await response.json()
    
    console.log('Response Status:', response.status, response.statusText)
    console.log('Sender IDs:', JSON.stringify(data, null, 2))
    
    return data
  } catch (error) {
    console.error('Sender ID check error:', error)
  }
}

async function sendDetailedSMS(phoneNumber: string) {
  console.log(`\n📱 Sending SMS to ${phoneNumber}...`)
  console.log('=' .repeat(50))
  
  const requestBody = {
    to: phoneNumber,
    from: 'tribemingle',
    sms: `Test SMS from Tribal Mingle at ${new Date().toLocaleTimeString()}. Please reply if received!`,
    type: 'plain',
    channel: 'generic',
    api_key: TERMII_API_KEY,
  }
  
  console.log('\nRequest Body:')
  console.log(JSON.stringify({ ...requestBody, api_key: TERMII_API_KEY.substring(0, 15) + '...' }, null, 2))
  
  try {
    const response = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const responseText = await response.text()
    console.log('\nResponse Status:', response.status, response.statusText)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    console.log('Response Body:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
      console.log('\nParsed Response:', JSON.stringify(data, null, 2))
    } catch (e) {
      console.error('Failed to parse response as JSON')
    }
    
    return data
  } catch (error) {
    console.error('SMS send error:', error)
  }
}

async function runDetailedTests() {
  console.log('🔍 DETAILED TERMII API DIAGNOSTICS')
  console.log('=' .repeat(50))
  console.log('Timestamp:', new Date().toISOString())
  console.log('API Key:', TERMII_API_KEY.substring(0, 20) + '...')
  console.log('Test Phones:', TEST_PHONES.join(', '))
  
  // Check account status
  await checkBalance()
  await checkSenderId()
  
  // Try sending to both numbers
  for (const phone of TEST_PHONES) {
    await sendDetailedSMS(phone)
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between sends
  }
  
  console.log('\n\n✅ Diagnostics Complete!')
  console.log('\nAnalysis:')
  console.log('- Check if balance is sufficient')
  console.log('- Verify sender ID "tribemingle" is approved')
  console.log('- Look for any error messages in responses')
  console.log('- Check if message_id is returned (indicates API accepted)')
  console.log('- If message_id exists but no SMS received:')
  console.log('  * Check phone network coverage')
  console.log('  * Verify phone can receive SMS from other sources')
  console.log('  * Check Termii dashboard for delivery status')
  console.log('  * Contact Termii support if issue persists')
}

runDetailedTests()
