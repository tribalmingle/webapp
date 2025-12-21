// Test script to send OTP to both phone and email
async function testOTP() {
  const testEmail = 'hostpennyuk@gmail.com'
  const testPhone = '+2348012345678' // Replace with your actual phone number
  
  try {
    console.log('📱 Testing OTP system...\n')
    console.log(`📧 Email: ${testEmail}`)
    console.log(`📞 Phone: ${testPhone}\n`)
    
    console.log('🔄 Sending verification code...')
    
    const response = await fetch('http://localhost:3000/api/onboarding/verify-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        phone: testPhone
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('\n✅ Verification code sent successfully!')
      console.log('\n📬 Check BOTH:')
      console.log(`   1. SMS on ${testPhone}`)
      console.log(`   2. Email at ${testEmail}`)
      console.log('\n🔑 The same 6-digit code was sent to both!')
      console.log('\n📝 To verify the code, you can use:')
      console.log(`   - Prospect ID: ${data.prospectId}`)
      console.log(`   - Session ID: ${data.sid}`)
      console.log('\n💡 Enter the code in the signup form (Step 5)')
    } else {
      console.log('\n❌ Failed to send code:', data.error || data.message)
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    console.log('\n💡 Make sure the dev server is running: npm run dev')
  }
}

testOTP()
