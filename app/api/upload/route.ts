import { NextRequest, NextResponse } from 'next/server'
import { uploadToHostGator } from '@/lib/vendors/hostgator-client'

// Configure route for larger uploads and longer timeout
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    console.log('[upload] Request received', {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      url: request.url
    })

    const formData = await request.formData()
    const keys = Array.from(formData.keys())
    console.log('[upload] incoming keys', keys)
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general' // 'profile', 'selfie', 'general', etc.

    if (!file) {
      console.error('[upload] No file in formData')
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('[upload] File received', {
      name: file.name,
      size: file.size,
      type: file.type,
      folder
    })

    // Validate file size (50MB max)
    const maxSize = 52428800 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File too large (max 50MB)' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || 'bin'
    const filename = `${timestamp}-${random}.${extension}`

    // Upload to HostGator
    console.log('[upload] Starting HostGator upload...')
    const result = await uploadToHostGator(buffer, filename, folder)
    console.log('[upload] HostGator upload successful', result)

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      imageUrl: result.url,
      filename: result.filename,
      folder: result.folder,
      path: result.path,
      size: result.size,
    })
  } catch (error) {
    console.error('[upload] Upload error:', error)
    console.error('[upload] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to upload file',
        error: String(error)
      },
      { status: 500 }
    )
  }
}
