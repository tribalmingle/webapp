import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      email: email,
      hasPassword: !!password,
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasJwtSecret: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET?.length,
        hasMongoDB: !!process.env.MONGODB_URI,
        mongoDBname: process.env.MONGODB_DB,
      }
    }

    // Test MongoDB connection
    try {
      const client = await clientPromise
      debugInfo.mongoConnection = 'SUCCESS'
      
      const db = client.db(process.env.MONGODB_DB || 'tribalmingle')
      debugInfo.dbName = db.databaseName
      
      // Find user
      const user = await db.collection('users').findOne({ email: email.toLowerCase() })
      debugInfo.userFound = !!user
      
      if (user) {
        debugInfo.userId = user._id.toString()
        debugInfo.userEmail = user.email
        debugInfo.hasPasswordHash = !!user.password
        debugInfo.passwordHashLength = user.password?.length
        
        // Test password comparison
        try {
          const isPasswordValid = await bcrypt.compare(password, user.password)
          debugInfo.passwordValid = isPasswordValid
        } catch (err: any) {
          debugInfo.bcryptError = err.message
        }
      }
    } catch (dbError: any) {
      debugInfo.mongoError = dbError.message
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}
