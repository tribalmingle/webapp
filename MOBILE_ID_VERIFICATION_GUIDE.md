# ID Verification & Selfie Implementation Guide for Mobile App

**Date:** December 28, 2025  
**For:** Mobile App Developer  
**Priority:** HIGH - Core Registration Feature

---

## 📋 Overview

This guide explains how to implement **ID verification** and **selfie capture** in the mobile app registration/profile setup process. This is a **critical trust & safety feature** for the dating platform.

---

## 🎯 When to Capture ID & Selfie

### During Registration Flow (Profile Setup Wizard)

The Profile Setup Wizard has **9 steps**. Add ID verification and selfie as:

**Recommended Position:** Between Step 1 (Photo Upload) and Step 2 (Location)

```
✅ Step 1: Photo Upload (1-10 photos)
✅ Step 1.5: ID Verification (NEW - capture government ID)
✅ Step 1.6: Selfie Verification (NEW - capture live selfie)
→ Step 2: Location (country + city)
→ Step 3: Heritage (origin + tribe)
... (continue remaining steps)
```

**Why this order?**
- Users have already uploaded photos (committed to registration)
- ID/selfie verification feels natural after photo upload
- Captures high-quality verification early before user fatigue

---

## 📸 Step 1.5: ID Verification Implementation

### Screen Design

**Title:** "Verify Your Identity"  
**Subtitle:** "Take a photo of your government-issued ID to help us keep TribalMingle safe"

**Accepted ID Types:**
- National ID Card
- Driver's License
- Passport
- Voter's Card
- Residence Permit

### UI Components

```typescript
// Screen Layout
- Header: "Step 2 of 11" (updated total)
- Icon: ID card icon (large, centered)
- Instructions: 
  "• Make sure your ID is clearly visible
   • All text should be readable
   • Avoid glare or shadows
   • Your face should be visible on the ID"
  
- Camera Button: "Take Photo of ID"
- Upload Button: "Choose from Gallery" (alternative)
- Preview Area: Shows captured ID image
- Retake Button: "Retake Photo"
- Continue Button: "Continue" (enabled after capture)
- Skip Button: "Skip for Now" (bottom, subtle)
```

### Camera Implementation

**React Native (Expo):**
```typescript
import { Camera } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'

const IDVerificationScreen = () => {
  const [permission, requestPermission] = Camera.useCameraPermissions()
  const [idImage, setIdImage] = useState<string | null>(null)

  const takeIDPhoto = async () => {
    const permissionResult = await requestPermission()
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to verify your ID')
      return
    }

    // Open camera with ID capture guidelines
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10], // ID card aspect ratio
      quality: 1, // High quality for text readability
    })

    if (!result.canceled) {
      setIdImage(result.assets[0].uri)
    }
  }

  const uploadFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 10],
      quality: 1,
    })

    if (!result.canceled) {
      setIdImage(result.assets[0].uri)
    }
  }

  const uploadIDImage = async () => {
    if (!idImage) return

    const formData = new FormData()
    formData.append('file', {
      uri: idImage,
      type: 'image/jpeg',
      name: 'id-verification.jpg',
    } as any)
    formData.append('folder', 'id-verification') // Separate folder for security

    try {
      const response = await fetch('https://tribalmingle.vercel.app/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (data.success) {
        // Store ID URL for later submission with profile
        return data.imageUrl
      }
    } catch (error) {
      console.error('ID upload failed:', error)
      Alert.alert('Upload Failed', 'Please try again')
    }
  }
}
```

### Data Storage

**Store temporarily during registration:**
```typescript
// In registration wizard state
const [registrationData, setRegistrationData] = useState({
  // ... other fields
  idVerificationUrl: '', // URL from upload endpoint
  idVerificationType: 'national_id', // or 'drivers_license', 'passport', etc.
  idVerificationStatus: 'pending', // pending, verified, rejected
})
```

---

## 🤳 Step 1.6: Selfie Verification Implementation

### Screen Design

**Title:** "Take a Selfie"  
**Subtitle:** "We'll use this to verify your photos match your ID"

**Instructions:**
- "Look directly at the camera"
- "Remove sunglasses or hats"
- "Make sure your face is well lit"
- "Hold your phone at eye level"

### UI Components

```typescript
// Screen Layout
- Header: "Step 3 of 11"
- Face outline guide: Oval outline showing where to position face
- Live camera preview: Real-time face detection feedback
- Capture Button: Large circular button (center bottom)
- Preview Area: Shows captured selfie
- Retake Button: "Retake Selfie"
- Continue Button: "Continue"
- Skip Button: "Skip for Now" (bottom, subtle)
```

### Camera Implementation with Face Detection

**React Native (Expo with face detection):**
```typescript
import { Camera, FaceDetectionResult } from 'expo-camera'
import * as FaceDetector from 'expo-face-detector'

const SelfieVerificationScreen = () => {
  const [permission, requestPermission] = Camera.useCameraPermissions()
  const [selfieImage, setSelfieImage] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const cameraRef = useRef<Camera>(null)

  const handleFacesDetected = ({ faces }: FaceDetectionResult) => {
    // Check if exactly one face is detected
    if (faces.length === 1) {
      setFaceDetected(true)
      // Optional: Check if face is centered, looking at camera, well-lit
      const face = faces[0]
      const isCentered = face.bounds.origin.x > 50 && face.bounds.origin.x < 250
      const isLookingAtCamera = face.yawAngle < 15 && face.rollAngle < 15
      
      if (isCentered && isLookingAtCamera) {
        // Ready to capture!
      }
    } else {
      setFaceDetected(false)
    }
  }

  const takeSelfie = async () => {
    if (!cameraRef.current || !faceDetected) {
      Alert.alert('Position Your Face', 'Make sure your face is visible in the frame')
      return
    }

    const photo = await cameraRef.current.takePictureAsync({
      quality: 1,
      base64: false,
      exif: false,
    })

    setSelfieImage(photo.uri)
  }

  const uploadSelfie = async () => {
    if (!selfieImage) return

    const formData = new FormData()
    formData.append('file', {
      uri: selfieImage,
      type: 'image/jpeg',
      name: 'selfie-verification.jpg',
    } as any)
    formData.append('folder', 'selfie') // Dedicated selfie folder

    try {
      const response = await fetch('https://tribalmingle.vercel.app/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      
      if (data.success) {
        // Store selfie URL
        return data.imageUrl
      }
    } catch (error) {
      console.error('Selfie upload failed:', error)
      Alert.alert('Upload Failed', 'Please try again')
    }
  }

  return (
    <View style={styles.container}>
      {!selfieImage ? (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.front} // Front-facing camera for selfie
          onFacesDetected={handleFacesDetected}
          faceDetectorSettings={{
            mode: FaceDetector.FaceDetectorMode.fast,
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
            runClassifications: FaceDetector.FaceDetectorClassifications.none,
            minDetectionInterval: 100,
            tracking: true,
          }}
        >
          {/* Face outline guide */}
          <View style={styles.faceGuide}>
            <Text>Position your face in the oval</Text>
          </View>
          
          {faceDetected && (
            <View style={styles.faceDetectedIndicator}>
              <Text style={styles.successText}>✓ Face detected</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.captureButton}
            onPress={takeSelfie}
            disabled={!faceDetected}
          >
            <View style={[styles.captureButtonInner, faceDetected && styles.readyToCapture]} />
          </TouchableOpacity>
        </Camera>
      ) : (
        <SelfiePreview image={selfieImage} onRetake={() => setSelfieImage(null)} />
      )}
    </View>
  )
}
```

### Data Storage

```typescript
// In registration wizard state
const [registrationData, setRegistrationData] = useState({
  // ... other fields
  selfiePhoto: '', // URL from upload endpoint (PRIMARY VERIFICATION SELFIE)
  selfieVerificationStatus: 'pending', // pending, verified, rejected
  profilePhoto: '', // This will be set to selfie initially
  profilePhotos: [], // Selfie will be first in array
})
```

---

## 🔄 Complete Registration Flow with ID & Selfie

### Updated Profile Setup Wizard Steps

```typescript
const registrationSteps = [
  { id: 1, name: 'Photos', route: '/onboarding/photos' },
  { id: 2, name: 'ID Verification', route: '/onboarding/id-verification' },  // NEW
  { id: 3, name: 'Selfie', route: '/onboarding/selfie' },                    // NEW
  { id: 4, name: 'Location', route: '/onboarding/location' },
  { id: 5, name: 'Heritage', route: '/onboarding/heritage' },
  { id: 6, name: 'Personal Details', route: '/onboarding/personal' },
  { id: 7, name: 'Work', route: '/onboarding/work' },
  { id: 8, name: 'Faith', route: '/onboarding/faith' },
  { id: 9, name: 'Interests', route: '/onboarding/interests' },
  { id: 10, name: 'Bio', route: '/onboarding/bio' },
  { id: 11, name: 'Looking For', route: '/onboarding/looking-for' },
]
```

### Final Registration Submission

When user completes all 11 steps, submit to `/api/auth/signup`:

```typescript
const completeRegistration = async () => {
  const registrationPayload = {
    // Basic info (already collected)
    email: registrationData.email,
    password: registrationData.password,
    name: registrationData.name,
    age: registrationData.age,
    gender: registrationData.gender,
    dateOfBirth: registrationData.dateOfBirth,
    
    // Photos (Step 1)
    profilePhotos: registrationData.profilePhotos, // Array of 1-10 URLs
    
    // ID Verification (Step 2) - NEW
    idVerificationUrl: registrationData.idVerificationUrl,
    idVerificationType: registrationData.idVerificationType,
    
    // Selfie (Step 3) - NEW - THIS IS CRITICAL!
    selfiePhoto: registrationData.selfiePhoto, // PRIMARY verification selfie
    profilePhoto: registrationData.selfiePhoto, // Use selfie as initial profile photo
    
    // Location (Step 4)
    country: registrationData.country,
    city: registrationData.city,
    
    // Heritage (Step 5)
    countryOfOrigin: registrationData.countryOfOrigin,
    tribe: registrationData.tribe,
    
    // Personal Details (Step 6)
    height: registrationData.height,
    bodyType: registrationData.bodyType,
    maritalStatus: registrationData.maritalStatus,
    education: registrationData.education,
    
    // Work (Step 7)
    occupation: registrationData.occupation,
    workType: registrationData.workType,
    
    // Faith (Step 8)
    religion: registrationData.religion,
    
    // Interests (Step 9)
    interests: registrationData.interests, // Array of strings
    
    // Bio (Step 10)
    bio: registrationData.bio,
    
    // Looking For (Step 11)
    lookingFor: registrationData.lookingFor,
  }

  try {
    const response = await fetch('https://tribalmingle.vercel.app/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationPayload),
    })

    const data = await response.json()

    if (data.success && data.token) {
      // Store token securely
      await SecureStore.setItemAsync('auth_token', data.token)
      
      // Navigate to dashboard
      navigation.navigate('Dashboard')
    } else {
      Alert.alert('Registration Failed', data.message)
    }
  } catch (error) {
    console.error('Registration error:', error)
    Alert.alert('Error', 'Registration failed. Please try again.')
  }
}
```

---

## 📤 File Upload API

### Endpoint: POST /api/upload

**Purpose:** Upload ID photos, selfies, and profile photos to HostGator storage

**Request Format:**
```typescript
// FormData (multipart/form-data)
const formData = new FormData()
formData.append('file', {
  uri: imageUri,        // Local file URI from camera/gallery
  type: 'image/jpeg',   // MIME type
  name: 'photo.jpg',    // Filename
} as any)
formData.append('folder', 'selfie') // Folder: 'profile', 'selfie', 'id-verification', 'general'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "imageUrl": "https://tribalmingle.com/uploads/selfie/1703721234-abc123.jpg",
  "filename": "1703721234-abc123.jpg",
  "folder": "selfie",
  "path": "/home/tribalmi/public_html/uploads/selfie/1703721234-abc123.jpg",
  "size": 245678
}
```

**Upload Folders:**
- `profile` - Regular profile photos (1-10 photos from Step 1)
- `selfie` - Verification selfies (Step 3)
- `id-verification` - Government ID photos (Step 2)
- `general` - Other uploads

**File Constraints:**
- Max size: 50 MB
- Supported formats: JPG, PNG, HEIC
- Auto-generated unique filenames
- Secure storage on HostGator

---

## 🔐 Backend Data Storage

### User Schema (MongoDB)

The backend already supports selfie storage in the User schema:

```typescript
interface User {
  // ... other fields
  
  // Photos
  profilePhoto: string        // Initially set to selfiePhoto URL
  profilePhotos: string[]     // Array of 1-10 photos, selfie should be first
  selfiePhoto: string         // PRIMARY verification selfie - REQUIRED FOR TRUST
  
  // Verification (you'll need to add these fields)
  idVerificationUrl?: string
  idVerificationType?: string // 'national_id', 'drivers_license', 'passport', etc.
  idVerificationStatus?: 'pending' | 'verified' | 'rejected'
  selfieVerificationStatus?: 'pending' | 'verified' | 'rejected'
  
  verified: boolean           // Overall verification status
  // ... other fields
}
```

**Note:** The `selfiePhoto` field already exists in the backend! You just need to populate it during registration.

---

## ✅ Implementation Checklist

### Phase 1: Basic Implementation (Week 1)
- [ ] Update Profile Setup Wizard to 11 steps (add ID & Selfie)
- [ ] Create ID Verification screen (Step 2)
  - [ ] Camera integration
  - [ ] Gallery picker fallback
  - [ ] Image preview & retake
  - [ ] Upload to `/api/upload` with folder='id-verification'
- [ ] Create Selfie Verification screen (Step 3)
  - [ ] Front camera integration
  - [ ] Face detection (optional but recommended)
  - [ ] Capture & preview
  - [ ] Upload to `/api/upload` with folder='selfie'
- [ ] Update registration state to include:
  - [ ] `idVerificationUrl`
  - [ ] `idVerificationType`
  - [ ] `selfiePhoto`
- [ ] Update final `/api/auth/signup` call to include new fields
- [ ] Test complete registration flow end-to-end

### Phase 2: Enhanced Features (Week 2)
- [ ] Add face detection for better selfie quality
- [ ] Add "Why we verify" educational modal
- [ ] Add retry logic for failed uploads
- [ ] Add image compression before upload
- [ ] Add progress indicators during upload
- [ ] Add skip functionality (with warning message)
- [ ] Store incomplete registrations locally (in case user exits app)

### Phase 3: Polish (Week 3)
- [ ] Add animations for face detection feedback
- [ ] Improve camera UI/UX with guides
- [ ] Add haptic feedback for successful capture
- [ ] Add tutorial/tips for first-time users
- [ ] Test on various devices and lighting conditions
- [ ] Handle edge cases (no camera permission, low storage, etc.)

---

## 🎨 Design Guidelines

### ID Verification Screen
**Colors:** Use trust-building colors (blue, green)  
**Icon:** ID card or shield icon  
**Tone:** Professional, security-focused  
**Copy:** Emphasize safety and privacy

### Selfie Screen
**Colors:** Use vibrant colors (pink, purple from brand)  
**Icon:** Camera or face outline  
**Tone:** Friendly, encouraging  
**Copy:** "Look your best!" / "Show your beautiful self"

### UI Consistency
- Match existing purple/pink gradient theme
- Use glass-morphism cards (20px radius)
- Follow standard navigation (top bar + bottom nav)
- Progress indicator: "Step X of 11"

---

## 🚨 Important Security Notes

### DO:
✅ Use HTTPS for all uploads  
✅ Store ID images in separate folder (`id-verification`)  
✅ Compress images before upload to save bandwidth  
✅ Validate image quality (not blurry, not too dark)  
✅ Allow retakes if image quality is poor  
✅ Show privacy policy link explaining ID usage

### DON'T:
❌ Store ID images in device cache after upload  
❌ Allow screenshots on ID verification screen (Android: `FLAG_SECURE`)  
❌ Store unencrypted IDs locally  
❌ Upload to public folders  
❌ Skip HTTPS validation

### Privacy Considerations
- Explain why ID is needed: "To verify you're a real person and keep the community safe"
- Assure users: "Your ID is securely stored and never shared publicly"
- Provide opt-out: Allow "Skip for now" but require verification before accessing premium features

---

## 📞 Backend Support

### If You Need Backend Changes

**Contact backend team if you need:**
1. Additional fields in User schema (e.g., `idVerificationUrl`, `idVerificationType`)
2. New verification status endpoints (e.g., `/api/verification/status`)
3. Admin dashboard for manual verification review
4. Automated ID verification integration (OCR, face matching)

**Current backend support:**
- ✅ `/api/upload` - Fully functional for all image types
- ✅ `selfiePhoto` field - Already in User schema
- ✅ `/api/auth/signup` - Accepts custom fields
- ⚠️ New fields needed: `idVerificationUrl`, `idVerificationType`, status fields

---

## 🧪 Testing Checklist

### Test Scenarios
- [ ] User completes ID verification with good photo
- [ ] User retakes ID photo multiple times
- [ ] User skips ID verification
- [ ] User uploads from gallery instead of camera
- [ ] Upload fails (network error) - retry logic works
- [ ] User denies camera permission - shows proper error
- [ ] Selfie capture with face detection works
- [ ] Selfie capture without face detection (fallback)
- [ ] Complete registration with all fields including ID & selfie
- [ ] Token is returned and stored correctly
- [ ] User can access dashboard after registration

---

## 📖 Additional Resources

### Libraries to Install

**React Native (Expo):**
```bash
npx expo install expo-camera expo-image-picker expo-face-detector
npm install react-native-image-picker @react-native-camera-roll/camera-roll
```

**Flutter:**
```yaml
dependencies:
  camera: ^0.10.5
  image_picker: ^1.0.4
  google_ml_kit: ^0.16.3  # For face detection
  dio: ^5.4.0  # For file upload
```

### Documentation Links
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo Face Detector](https://docs.expo.dev/versions/latest/sdk/face-detector/)
- [Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [FormData Upload Guide](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

---

## 🎯 Success Criteria

**You've successfully implemented ID & Selfie verification when:**
1. ✅ User can capture ID photo during registration
2. ✅ User can capture selfie with face detection
3. ✅ Both images upload successfully to backend
4. ✅ `selfiePhoto` is included in `/api/auth/signup` request
5. ✅ User completes full 11-step registration flow
6. ✅ JWT token is returned and user is authenticated
7. ✅ Images are viewable in admin dashboard (future feature)

---

**Questions?** Contact backend team with specific implementation questions.

**Ready to implement?** Start with Phase 1 checklist above! 🚀

---

**Document Created:** December 28, 2025  
**Last Updated:** December 28, 2025  
**Version:** 1.0  
**Status:** Ready for Implementation
