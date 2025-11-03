# Image Upload Feature

## Overview
Added the ability to include images in messages with automatic compression, preview, and cloud storage.

## Changes Made

### 1. Type Definitions (`lib/types.ts`)
- Added `imageUrl?: string` to the `Message` interface
- Added `imageFile?: File` to the `MessageFormData` interface

### 2. Firebase Configuration (`lib/firebase.ts`)
- Added Firebase Storage initialization
- Exported `storage` instance for use throughout the app

### 3. Storage Utilities (`lib/storage.ts`) - NEW FILE
- **`validateImageFile()`**: Validates file type and size (max 5MB)
- **`uploadMessageImage()`**: Uploads images to Firebase Storage with unique filenames
- **`compressImage()`**: Compresses images to max 1200px width before upload
- Supported formats: JPEG, PNG, GIF, WebP

### 4. Firestore Operations (`lib/firestore.ts`)
- Updated `addMessage()` to handle image uploads
- Automatically compresses and uploads images before saving message
- Stores download URL in Firestore message document

### 5. Message Composer (`components/MessageComposer.tsx`)
- Added image upload button with drag-and-drop style interface
- Real-time image preview with remove option
- Error handling and validation feedback
- Image is optional - messages can still be sent without images
- Clears image state after successful submission

### 6. Message Card (`components/MessageCard.tsx`)
- Displays uploaded images in messages
- Uses Next.js `Image` component for optimized loading
- Smooth animation when images appear
- Responsive image sizing with max height constraint

### 7. Share Modal (`components/ShareModal.tsx`)
- Updated to include images in shared message cards
- Images appear in the downloadable/shareable version
- Responsive sizing with proper constraints

### 8. Next.js Configuration (`next.config.ts`)
- Added Firebase Storage domain to allowed image sources
- Enables optimized loading of images from `firebasestorage.googleapis.com`

## Features

✅ **File Validation**
- Maximum file size: 20MB
- Allowed types: JPEG, PNG, GIF, WebP
- Clear error messages for invalid files

✅ **Image Optimization**
- Automatic compression to reduce file size
- Max width: 1200px (maintains aspect ratio)
- 80% quality compression

✅ **User Experience**
- Live preview before upload
- Easy remove option
- Upload progress indication
- Optional attachment (not required)

✅ **Display Optimization**
- Next.js Image component for automatic optimization
- Lazy loading for better performance
- Responsive sizing
- Smooth animations

## Firebase Storage Setup

Before using the image feature, you need to set up Firebase Storage:

1. **Enable Firebase Storage** in your Firebase Console:
   - Go to Storage in the Firebase Console
   - Click "Get Started"
   - Choose your security rules (start in test mode for development)

2. **Update Storage Rules** (for production):
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /message-images/{imageId} {
         allow read: if true;  // Anyone can read
         allow write: if request.resource.size < 20 * 1024 * 1024  // Max 20MB
                      && request.resource.contentType.matches('image/.*');
       }
     }
   }
   ```

3. **Verify Storage Bucket** in `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   ```

## Usage

Users can now:
1. Fill out the message form as usual
2. Optionally click "Click to upload an image" 
3. Select an image from their device
4. Preview the image before sending
5. Remove the image if they change their mind
6. Send the message with or without the image

Images will be:
- Automatically compressed and optimized
- Uploaded to Firebase Storage
- Displayed beautifully in the message feed

## File Structure
```
lib/
├── firebase.ts        # Firebase initialization + Storage
├── storage.ts         # NEW: Image upload utilities
├── firestore.ts       # Updated: Handles image URLs
└── types.ts           # Updated: Message & Form types

components/
├── MessageComposer.tsx  # Updated: Image upload UI
├── MessageCard.tsx      # Updated: Image display
└── ShareModal.tsx       # Updated: Images in shared cards

next.config.ts           # Updated: Image domain config
```

## Testing

To test the feature:
1. Make sure Firebase Storage is enabled
2. Run the development server: `npm run dev`
3. Create a new message
4. Click the image upload button
5. Select an image (under 5MB)
6. See the preview
7. Submit the message
8. View the message in the feed with the image displayed

## Notes

- Images are stored in the `message-images/` folder in Firebase Storage
- File names are auto-generated with timestamp and random string
- The feature gracefully handles errors (network issues, file too large, etc.)
- All linter warnings are minor (stylistic preferences) and don't affect functionality

