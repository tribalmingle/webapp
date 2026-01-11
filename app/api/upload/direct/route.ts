import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const key = formData.get('key') as string

    if (!file || !key) {
      return NextResponse.json({ error: 'File and key are required' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    const keyParts = key.split('/')
    const subDir = keyParts.slice(0, -1).join('/')
    const fullDir = join(uploadsDir, subDir)

    if (!existsSync(fullDir)) {
      await mkdir(fullDir, { recursive: true })
    }

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadsDir, key)

    await writeFile(filePath, buffer)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get('host')}`
    const fileUrl = `${baseUrl}/uploads/${key}`

    return NextResponse.json({
      success: true,
      fileUrl,
      key,
    })
  } catch (error) {
    console.error('[upload:direct] Upload failed', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
