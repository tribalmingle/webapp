/**
 * HostGator File Server Client
 * Handles file uploads/downloads to tm.dnd.ng
 */

const HOSTGATOR_BASE_URL = 'https://tm.dnd.ng'
const HOSTGATOR_API_KEY = process.env.HOSTGATOR_API_KEY || '6f273bc1-23b9-435c-b9ad-53c7ec2a1b19'

export interface UploadOptions {
  contentType?: string
  metadata?: Record<string, string>
  folder?: string
}

/**
 * Upload a file to HostGator
 */
export async function uploadToHostGator(
  buffer: Buffer,
  filename: string,
  folder: string = 'general',
  options: UploadOptions = {}
) {
  try {
    const formData = new FormData()
    formData.append('file', new Blob([buffer]), filename)
    formData.append('folder', folder)

    const response = await fetch(`${HOSTGATOR_BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HOSTGATOR_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.error || 'Upload failed')
    }

    // Construct the media URL
    const mediaUrl = `${HOSTGATOR_BASE_URL}/media/${data.path}`

    console.log('[hostgator] File uploaded', { filename, folder, url: mediaUrl })

    return {
      filename: data.filename,
      folder: data.folder,
      path: data.path,
      url: mediaUrl,
      size: data.size,
    }
  } catch (error) {
    console.error('[hostgator] Upload error:', error)
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

    console.log('[hostgator] File deleted', { folder, filename })

    return { deleted: true, folder, filename }
  } catch (error) {
    console.error('[hostgator] Delete error:', error)
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
    console.error('[hostgator] Metadata fetch error:', error)
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
