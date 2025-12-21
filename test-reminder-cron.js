// Test script to manually trigger the registration reminder cron job
async function testReminderCron() {
  const CRON_SECRET = process.env.CRON_SECRET || '21f61607d1d5000d4b78cb8ef82c1316dff6362be05f2f27931190ef548e35cb'
  
  try {
    console.log('🔄 Triggering registration reminder cron job...\n')
    
    const response = await fetch('http://localhost:3000/api/cron/send-registration-reminders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Cron job executed successfully!\n')
      console.log('📊 Results:')
      console.log(`   Total processed: ${data.results.total}`)
      console.log(`   Emails sent: ${data.results.sent}`)
      console.log(`   Failed: ${data.results.failed}`)
      
      if (data.results.errors.length > 0) {
        console.log('\n❌ Errors:')
        data.results.errors.forEach(err => console.log(`   - ${err}`))
      }

      if (data.results.sent > 0) {
        console.log('\n📧 Check your email inbox for the reminder!')
        console.log('🌐 Or check Resend dashboard: https://resend.com/emails')
      } else {
        console.log('\n💡 No reminders sent. This could mean:')
        console.log('   - No incomplete registrations found')
        console.log('   - Users created less than 5 minutes ago')
        console.log('   - Users still actively registering (updated recently)')
        console.log('   - Reminders already sent')
        console.log('\n📝 Try running: node test-backdate-user.js')
      }
    } else {
      console.log('❌ Cron job failed:', data.message)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Make sure the dev server is running: npm run dev')
  }
}

testReminderCron()
