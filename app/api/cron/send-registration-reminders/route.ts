import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { sendRegistrationReminderEmail } from '@/lib/vendors/resend-client'

/**
 * Background job to send reminder emails to users with incomplete registrations
 * Should be called every 5-10 minutes via cron or scheduled job
 * 
 * Can be triggered by:
 * 1. Vercel Cron Jobs
 * 2. External cron service (cron-job.org, etc.)
 * 3. Manual admin trigger
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication check here for security
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'change-me-in-production'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    // Find users who:
    // 1. Have incomplete registration (registrationComplete: false)
    // 2. Created more than 5 minutes ago
    // 3. Haven't received reminder email yet
    // 4. Updated less than 15 minutes ago (not actively registering)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

    const incompleteUsers = await db
      .collection('users')
      .find({
        registrationComplete: false,
        registrationReminderSent: { $ne: true },
        createdAt: { $lt: fiveMinutesAgo },
        updatedAt: { $lt: fifteenMinutesAgo },
      })
      .limit(50) // Process 50 at a time to avoid overload
      .toArray()

    console.log(`[reminder-job] Found ${incompleteUsers.length} users to remind`)

    const results = {
      total: incompleteUsers.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Send reminder emails
    for (const user of incompleteUsers) {
      try {
        const continueUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tribalmingle.com'}/login`

        await sendRegistrationReminderEmail({
          to: user.email,
          name: user.name,
          continueUrl,
        })

        // Mark as sent
        await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              registrationReminderSent: true,
              reminderSentAt: new Date(),
            },
          }
        )

        results.sent++
        console.log(`[reminder-job] Sent reminder to ${user.email}`)
      } catch (error: any) {
        results.failed++
        results.errors.push(`${user.email}: ${error.message}`)
        console.error(`[reminder-job] Failed to send to ${user.email}:`, error)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Processed ${results.total} incomplete registrations`,
        results,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[reminder-job] Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check how many users need reminders (for monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

    const count = await db.collection('users').countDocuments({
      registrationComplete: false,
      registrationReminderSent: { $ne: true },
      createdAt: { $lt: fiveMinutesAgo },
      updatedAt: { $lt: fifteenMinutesAgo },
    })

    const totalIncomplete = await db.collection('users').countDocuments({
      registrationComplete: false,
    })

    const remindersSent = await db.collection('users').countDocuments({
      registrationComplete: false,
      registrationReminderSent: true,
    })

    return NextResponse.json(
      {
        success: true,
        stats: {
          needingReminder: count,
          totalIncomplete,
          remindersSent,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[reminder-job] Error fetching stats:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
