/**
 * Test Termii SMS Service
 * Run with: TEST_PHONE=+2348012345678 npx tsx test-termii-sms.ts
 * Or set environment variables manually below
 */

// Set API key BEFORE importing (important!)
process.env.TERMII_API_KEY = process.env.TERMII_API_KEY || 'TLV90GetIWWqamdROrodTl3QUF6Crr6atRpxQ6S4f4Wilp61QWzxftmXSTNbNv'
process.env.TERMII_SENDER_ID = 'tribemingle'


import { sendSMS, sendOTP, verifyOTP } from './lib/services/sms-service'

async function testTermiiSMS() {
  console.log('🧪 Testing Termii SMS Service\n')
  
  // Test phone number - CHANGE THIS to your actual phone number
  // Format: +[country code][number] (e.g., +2348012345678 for Nigeria)
  const testPhoneNumber = process.env.TEST_PHONE || '+2347064849292'
  
  console.log('📋 Test Configuration:')
  console.log('- API Key:', process.env.TERMII_API_KEY ? `✅ Set (${process.env.TERMII_API_KEY.substring(0, 10)}...)` : '❌ Not set')
  console.log('- Test Phone:', testPhoneNumber)
  console.log('\n⚠️  IMPORTANT: Update testPhoneNumber to your actual phone number!\n')

  if (!process.env.TERMII_API_KEY) {
    console.error('❌ TERMII_API_KEY is not set!')
    return
  }

  try {
    // Test 1: Send SMS
    console.log('📱 Test 1: Sending SMS...')
    console.log('DEBUG: TERMII_API_KEY in test:', process.env.TERMII_API_KEY ? 'SET' : 'NOT SET')
    const smsResult = await sendSMS({
      to: testPhoneNumber,
      message: 'Hello from Tribal Mingle! This is a test message via Termii.',
    })
    
    console.log('SMS Result:', {
      success: smsResult.success,
      provider: smsResult.provider,
      messageId: smsResult.messageId,
      error: smsResult.error,
    })
    console.log('')

    // Test 2: Send OTP
    console.log('🔐 Test 2: Sending OTP...')
    const otpResult = await sendOTP({
      phoneNumber: testPhoneNumber,
      length: 6,
      expiry: 10, // 10 minutes
    })
    
    console.log('OTP Result:', {
      success: otpResult.success,
      provider: otpResult.provider,
      sessionId: otpResult.sessionId,
      error: otpResult.error,
    })
    console.log('')

    if (otpResult.success && otpResult.sessionId) {
      console.log('⏳ Please check your phone and enter the OTP code...')
      console.log('Note: You can test verification by calling verifyOTP with the received code')
      console.log('Example:')
      console.log(`  const verifyResult = await verifyOTP({`)
      console.log(`    phoneNumber: '${testPhoneNumber}',`)
      console.log(`    otp: 'YOUR_CODE_HERE'`)
      console.log(`  })`)
    }

    console.log('\n✅ All tests completed!')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error)
  }
}

// Run tests
testTermiiSMS()
