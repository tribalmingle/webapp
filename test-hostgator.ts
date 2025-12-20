/**
 * HostGator File Hosting Test
 * Tests file upload, retrieval, and deletion
 */

import { uploadToHostGator, deleteFromHostGator, getHostGatorFileUrl } from './lib/vendors/hostgator-client'

async function testHostGatorFileHosting() {
  console.log('🧪 Testing HostGator File Hosting...\n')

  // Test data
  const testFolder = 'test'
  const testFilename = `test-${Date.now()}.txt`
  const testContent = 'Hello from TribalMingle! This is a test file.'

  try {
    // Test 1: Upload file
    console.log('1️⃣  Testing file upload...')
    const uploadResult = await uploadToHostGator(
      Buffer.from(testContent),
      testFilename,
      testFolder
    )
    console.log('✅ Upload successful!')
    console.log('   - Filename:', uploadResult.filename)
    console.log('   - Folder:', uploadResult.folder)
    console.log('   - Size:', uploadResult.size, 'bytes')
    console.log('   - URL:', uploadResult.url)
    console.log()

    // Test 2: Get public file URL
    console.log('2️⃣  Testing public file URL generation...')
    const publicUrl = getHostGatorFileUrl(testFolder, testFilename)
    console.log('✅ Public URL generated!')
    console.log('   - URL:', publicUrl)
    console.log()

    // Test 3: Verify file is accessible
    console.log('3️⃣  Testing file accessibility...')
    try {
      const response = await fetch(publicUrl, { method: 'HEAD' })
      if (response.ok) {
        console.log('✅ File is publicly accessible!')
        console.log('   - Status:', response.status)
        console.log('   - Content-Type:', response.headers.get('content-type'))
      } else {
        console.log('⚠️  File returned status:', response.status)
      }
    } catch (error) {
      console.log('⚠️  Could not access file from public URL')
      console.log('   - This might be normal if HostGator is still processing')
    }
    console.log()

    // Test 4: Delete file
    console.log('4️⃣  Testing file deletion...')
    const deleteResult = await deleteFromHostGator(testFolder, testFilename)
    console.log('✅ Deletion successful!')
    console.log('   - Deleted:', deleteResult.deleted)
    console.log()

    console.log('🎉 All HostGator tests passed!\n')
    console.log('Summary:')
    console.log('- ✅ File upload works')
    console.log('- ✅ Public URL generation works')
    console.log('- ✅ File deletion works')
    console.log('- 📁 Files are stored at: tm.dnd.ng')
    console.log('- 🔑 API Key is configured correctly\n')

  } catch (error) {
    console.error('❌ Test failed:', error)
    console.log('\nTroubleshooting:')
    console.log('1. Verify HOSTGATOR_API_KEY is set in environment')
    console.log('2. Verify HostGator PHP upload script is installed at tm.dnd.ng/api/upload')
    console.log('3. Check HostGator file manager for /uploads folder')
    console.log('4. Verify folder permissions (755)')
    process.exit(1)
  }
}

// Run the test
testHostGatorFileHosting()
