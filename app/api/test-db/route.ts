import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
    
    // Test the connection by pinging the database
    await db.command({ ping: 1 })
    
    // Get database stats
    const stats = await db.stats()
    
    return NextResponse.json({
      success: true,
      message: 'Connected to MongoDB successfully!',
      database: db.databaseName,
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexes: stats.indexes,
    })
  } catch (error) {
    console.error('MongoDB connection error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to connect to MongoDB',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
