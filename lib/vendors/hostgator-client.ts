/**
 * HostGator File Server Client
 * Handles file uploads/downloads to tm.d2d.ng
 */

const HOSTGATOR_BASE_URL = process.env.HOSTGATOR_BASE_URL || 'https://tm.d2d.ng'
const HOSTGATOR_API_KEY = process.env.HOSTGATOR_API_KEY || ''
const isDev = process.env.NODE_ENV === 'development'

export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  folder?: string
}

/**
 * Upload a file to HostGator
 */
const buildUploadFormData = (buffer: Buffer, filename: string, folder: string, fieldName: 'image' | 'file') => {
  const formData = new FormData()
  // Convert Buffer to ArrayBuffer for browser compatibility
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
  formData.append(fieldName, new Blob([arrayBuffer]), filename)
  formData.append('folder', folder)
  return formData
}

export async function uploadToHostGator(
  buffer: Buffer,
  filename: string,
  folder: string = 'general',
  options: UploadOptions = {}
) {
  try {
    const tryUpload = async (fieldName: 'image' | 'file') => {
      const formData = buildUploadFormData(buffer, filename, folder, fieldName)
      const response = await fetch(`${HOSTGATOR_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HOSTGATOR_API_KEY}`,
          'X-API-Key': HOSTGATOR_API_KEY,
        },
        body: formData,
      })

      const responseText = await response.text()
      const data = responseText ? JSON.parse(responseText) : undefined

      if (!response.ok || !data?.success) {
        const errorMessage = data?.error || data?.message || response.statusText || 'Upload failed'
        const detail = responseText ? ` | body: ${responseText.slice(0, 400)}` : ''
        const error = new Error(`Upload failed: ${errorMessage}${detail}`)
        ;(error as any).status = response.status
        ;(error as any).fieldName = fieldName
        ;(error as any).responseText = responseText
        throw error
      }

      return data
    }

    let data: any
    try {
      data = await tryUpload('image')
    } catch (error: any) {
      if (isDev) console.warn('[hostgator] upload failed with image field, retrying with file', {
        status: error?.status,
        responseText: error?.responseText?.slice(0, 200),
      })
      data = await tryUpload('file')
    }

    // Construct the media URL
    const mediaUrl = `${HOSTGATOR_BASE_URL}/media/${data.path}`

    if (isDev) console.log('[hostgator] File uploaded', { filename, folder, url: mediaUrl })

    return {
      filename: data.filename,
      folder: data.folder,
      path: data.path,
      url: mediaUrl,
      size: data.size,
    }
  } catch (error) {
    if (isDev) console.error('[hostgator] Upload error:', error)
    throw error
  }
}

/**
 * Delete a file from HostGator
 */
export async function deleteFromHostGator(folder: string, filename: string) {
  try {
    const response = await fetch(`${HOSTGATOR_BASE_URL}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${HOSTGATOR_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folder, filename }),
    })

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Delete failed')
    }

    if (isDev) console.log('[hostgator] File deleted', { folder, filename })

    return { deleted: true, folder, filename }
  } catch (error) {
    if (isDev) console.error('[hostgator] Delete error:', error)
    throw error
  }
}

/**
 * Get file metadata from HostGator
 */
export async function getHostGatorMetadata(folder: string, filename: string) {
  try {
    const response = await fetch(
      `${HOSTGATOR_BASE_URL}/api/metadata?folder=${folder}&filename=${filename}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${HOSTGATOR_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Metadata fetch failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Metadata fetch failed')
    }

    return data
  } catch (error) {
    if (isDev) console.error('[hostgator] Metadata fetch error:', error)
    throw error
  }
}

/**
 * Get a public URL for a file on HostGator
 */
export function getHostGatorFileUrl(folder: string, filename: string): string {
  return `${HOSTGATOR_BASE_URL}/media/${folder}/${filename}`
}

/**
 * Check if a file exists on HostGator
 */
export async function hostGatorFileExists(folder: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(getHostGatorFileUrl(folder, filename), {
      method: 'HEAD',
    })
    return response.ok
  } catch {
    return false
  }
}
