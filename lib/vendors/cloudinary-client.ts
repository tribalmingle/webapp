/**
 * Cloudinary File Upload Client
 * Primary upload service with HostGator as fallback
 */

import { v2 as cloudinary } from 'cloudinary'

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || ''
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || ''
const isDev = process.env.NODE_ENV === 'development'

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
})

export interface CloudinaryUploadOptions {
  folder?: string
  publicId?: string
  transformation?: any
}

/**
 * Upload a file to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = 'general',
  options: CloudinaryUploadOptions = {}
) {
  try {
    // Validate configuration
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials not configured')
    }

    // Convert buffer to base64 data URI for upload
    const base64 = buffer.toString('base64')
    const mimeType = getMimeType(filename)
    const dataUri = `data:${mimeType};base64,${base64}`

    // Build upload options
    const uploadOptions = {
      folder: `tribalmingle/${folder}`,
      public_id: options.publicId || filename.split('.')[0],
      resource_type: 'auto' as const,
      overwrite: false,
      ...options,
    }

    if (isDev) console.log('[cloudinary] Uploading file', { filename, folder, options: uploadOptions })

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, uploadOptions)

    if (isDev) console.log('[cloudinary] Upload successful', { url: result.secure_url, publicId: result.public_id })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      filename: result.original_filename || filename,
      folder,
      size: result.bytes,
      width: result.width,
      height: result.height,
      format: result.format,
    }
  } catch (error) {
    if (isDev) console.error('[cloudinary] Upload error:', error)
    throw error
  }
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string) {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    if (isDev) console.log('[cloudinary] File deleted', { publicId, result })
    return result
  } catch (error) {
    if (isDev) console.error('[cloudinary] Delete error:', error)
    throw error
  }
}

/**
 * Get file metadata from Cloudinary
 */
export async function getCloudinaryMetadata(publicId: string) {
  try {
    const result = await cloudinary.api.resource(publicId)
    return result
  } catch (error) {
    if (isDev) console.error('[cloudinary] Metadata fetch error:', error)
    throw error
  }
}

/**
 * Helper: Determine MIME type from filename
 */
function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  if (!extension) return 'image/jpeg'

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    pdf: 'application/pdf',
  }

  return mimeTypes[extension] || 'application/octet-stream'
}
