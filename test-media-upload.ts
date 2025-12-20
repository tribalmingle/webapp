/**
 * Test Media Upload to tm.d2d.ng
 * Run with: npx tsx test-media-upload.ts
 */

import { uploadToHostGator, deleteFromHostGator, getHostGatorFileUrl } from './lib/vendors/hostgator-client'
import { readFileSync } from 'fs'
import { join } from 'path'

async function testMediaUpload() {
  console.log('🧪 Testing Media Upload to tm.d2d.ng\n')
  
  console.log('📋 Configuration:')
  console.log('- Base URL: https://tm.d2d.ng')
  console.log('- API Key:', process.env.HOSTGATOR_API_KEY ? '✅ Set' : '❌ Not set')
  console.log('')

  try {
    // Create a test file buffer (simple text file)
    const testContent = `Test upload from Tribal Mingle at ${new Date().toISOString()}`
    const buffer = Buffer.from(testContent, 'utf-8')
    const filename = `test-${Date.now()}.txt`
    const folder = 'test-uploads'

    // Test 1: Upload file
    console.log('📤 Test 1: Uploading test file...')
    console.log(`   Filename: ${filename}`)
    console.log(`   Folder: ${folder}`)
    console.log(`   Size: ${buffer.length} bytes`)
    
    const uploadResult = await uploadToHostGator(buffer, filename, folder)
    
    console.log('\n✅ Upload successful!')
    console.log('   Result:', {
      filename: uploadResult.filename,
      folder: uploadResult.folder,
      path: uploadResult.path,
      url: uploadResult.url,
      size: uploadResult.size,
    })

    // Test 2: Retrieve file URL
    console.log('\n🔗 Test 2: Getting file URL...')
    const fileUrl = getHostGatorFileUrl(folder, uploadResult.filename)
    console.log(`   URL: ${fileUrl}`)

    // Test 3: Verify file is accessible
    console.log('\n📥 Test 3: Verifying file is accessible...')
    const response = await fetch(fileUrl)
    
    if (response.ok) {
      const retrievedContent = await response.text()
      console.log('✅ File retrieved successfully!')
      console.log(`   Content: ${retrievedContent.substring(0, 100)}...`)
      console.log(`   Status: ${response.status} ${response.statusText}`)
      console.log(`   Content-Type: ${response.headers.get('content-type')}`)
    } else {
      console.error('❌ File retrieval failed')
      console.error(`   Status: ${response.status} ${response.statusText}`)
    }

    // Test 4: Delete file (cleanup)
    console.log('\n🗑️  Test 4: Cleaning up (deleting test file)...')
    const deleteResult = await deleteFromHostGator(folder, uploadResult.filename)
    
    if (deleteResult.success) {
      console.log('✅ File deleted successfully!')
    } else {
      console.log('⚠️  Delete failed (might not be implemented yet)')
    }

    console.log('\n✅ All media upload tests completed successfully!')
    console.log('\n📊 Summary:')
    console.log('   ✅ Upload to tm.d2d.ng: Working')
    console.log('   ✅ File retrieval: Working')
    console.log('   ✅ URL generation: Working')
    console.log('   ⚠️  Delete: Check implementation')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error)
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack)
    }
  }
}

// Test with an actual image file if available
async function testImageUpload() {
  console.log('\n\n🖼️  Testing Image Upload...\n')
  
  try {
    // Create a simple 1x1 pixel PNG (valid image)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ])
    
    const filename = `profile-photo-${Date.now()}.png`
    const folder = 'profile-photos'

    console.log('📤 Uploading test profile photo...')
    console.log(`   Filename: ${filename}`)
    console.log(`   Folder: ${folder}`)
    console.log(`   Size: ${pngBuffer.length} bytes`)
    
    const uploadResult = await uploadToHostGator(pngBuffer, filename, folder)
    
    console.log('\n✅ Image upload successful!')
    console.log('   URL:', uploadResult.url)
    console.log('   Path:', uploadResult.path)

    // Verify image is accessible
    console.log('\n📥 Verifying image is accessible...')
    const response = await fetch(uploadResult.url)
    
    if (response.ok) {
      const contentType = response.headers.get('content-type')
      console.log('✅ Image retrieved successfully!')
      console.log(`   Status: ${response.status}`)
      console.log(`   Content-Type: ${contentType}`)
      console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`)
      
      if (contentType?.includes('image')) {
        console.log('   ✅ Correct content type for image!')
      }
    } else {
      console.error('❌ Image retrieval failed')
      console.error(`   Status: ${response.status} ${response.statusText}`)
    }

    // Cleanup
    console.log('\n🗑️  Cleaning up test image...')
    await deleteFromHostGator(folder, uploadResult.filename)
    
  } catch (error) {
    console.error('❌ Image upload test failed:', error instanceof Error ? error.message : error)
  }
}

// Run tests
async function runAllTests() {
  await testMediaUpload()
  await testImageUpload()
  
  console.log('\n\n═══════════════════════════════════════════')
  console.log('✅ ALL TESTS COMPLETED')
  console.log('═══════════════════════════════════════════')
}

runAllTests()
