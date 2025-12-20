import { NextRequest, NextResponse } from 'next/server'
import { uploadToHostGator } from '@/lib/vendors/hostgator-client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = (formData.get('folder') as string) || 'general' // 'profile', 'selfie', 'general', etc.

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

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
    const result = await uploadToHostGator(buffer, filename, folder)

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
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    )
  }
}
