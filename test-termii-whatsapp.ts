/**
 * Test Termii WhatsApp Messaging
 * Run with: npx tsx test-termii-whatsapp.ts
 */

// Set environment variables BEFORE importing
process.env.TERMII_API_KEY = 'TLV90GetIWWqamdROrodTl3QUF6Crr6atRpxQ6S4f4Wilp61QWzxftmXSTNbNv'
process.env.TERMII_SENDER_ID = 'tribemingle'
process.env.NODE_ENV = 'development'

const TERMII_BASE_URL = 'https://api.termii.com/api'
const TEST_PHONE = '+2348063009268' // User's test phone number

interface SendWhatsAppOptions {
  to: string
  message: string
  caption?: string
  media_url?: string
}

/**
 * Send WhatsApp message via Termii
 */
async function sendWhatsAppViaTermii(options: SendWhatsAppOptions) {
  const apiKey = process.env.TERMII_API_KEY
  if (!apiKey) {
    throw new Error('TERMII_API_KEY not configured')
  }

  try {
    const requestBody = {
      api_key: apiKey,
      to: options.to,
      type: 'plain',
      channel: 'whatsapp',
      text: options.message,
      ...(options.media_url && { 
        media_url: options.media_url,
        media_caption: options.caption || options.message 
      })
    }
    
    console.log('\n📱 Sending WhatsApp message...')
    console.log('Request:', {
      ...requestBody,
      api_key: apiKey.substring(0, 15) + '...'
    })
    
    const response = await fetch(`${TERMII_BASE_URL}/send/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    const responseText = await response.text()
    console.log('\nResponse Status:', response.status, response.statusText)
    console.log('Response Body:', responseText)
    
    if (!response.ok) {
      throw new Error(`Termii WhatsApp API error: ${response.statusText} - ${responseText}`)
    }

    const data = JSON.parse(responseText)

    if (!data.message_id) {
      throw new Error(data.message || 'Failed to send WhatsApp message via Termii')
    }

    console.log('\n✅ WhatsApp message sent successfully!')
    console.log('Message ID:', data.message_id)
    console.log('To:', options.to)

    return {
      success: true,
      provider: 'termii-whatsapp',
      messageId: data.message_id,
      to: options.to,
    }
  } catch (error) {
    console.error('\n❌ WhatsApp send error:', error)
    throw error
  }
}

/**
 * Run tests
 */
async function runTests() {
  console.log('🧪 Testing Termii WhatsApp Integration')
  console.log('======================================\n')
  console.log('Configuration:')
  console.log('- API Key:', process.env.TERMII_API_KEY?.substring(0, 15) + '...')
  console.log('- Test Phone:', TEST_PHONE)
  console.log()

  try {
    // Test 1: Simple text WhatsApp message
    console.log('\n📋 Test 1: Send Simple WhatsApp Message')
    console.log('----------------------------------------')
    const result = await sendWhatsAppViaTermii({
      to: TEST_PHONE,
      message: 'Hello from Tribal Mingle! 🎉 This is a test WhatsApp message via Termii.',
    })
    console.log('\n✅ Test 1 Result:', result)

    // Test 2: WhatsApp with media (if supported)
    console.log('\n\n📋 Test 2: Send WhatsApp Message with Media')
    console.log('--------------------------------------------')
    const mediaResult = await sendWhatsAppViaTermii({
      to: TEST_PHONE,
      message: 'Check out this Tribal Mingle welcome image!',
      caption: 'Welcome to Tribal Mingle! 🎉',
      media_url: 'https://tm.d2d.ng/media/profile-photos/profile-photo-1766267786419.png'
    })
    console.log('\n✅ Test 2 Result:', mediaResult)

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message)
    if (error.message.includes('404')) {
      console.log('\n⚠️ Note: WhatsApp endpoint may not be available on your Termii account.')
      console.log('Check if WhatsApp Business API is enabled in your Termii dashboard.')
    }
    process.exit(1)
  }

  console.log('\n\n✅ All tests completed!')
  console.log('\nNext steps:')
  console.log('1. Check your WhatsApp at', TEST_PHONE, 'for received messages')
  console.log('2. Verify Termii dashboard shows WhatsApp messages sent')
  console.log('3. Add WhatsApp functionality to sms-service.ts if working')
}

// Run the tests
runTests()
