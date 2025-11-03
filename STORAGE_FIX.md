# Firebase Storage Upload Timeout Fix

## What Was Fixed

The "Max retry time for operation exceeded" and "Upload timeout" errors have been resolved with the following improvements:

### 1. **Enhanced Upload Method** (`lib/storage.ts`)
- Switched from `uploadBytes` to `uploadBytesResumable` for better control and monitoring
- **Increased timeout to 2 minutes** (from 60 seconds) for slower connections
- Implemented proper error handling with specific error codes
- Added upload progress tracking in console
- Included upload metadata for better file management

### 2. **Improved Firebase Initialization** (`lib/firebase.ts`)
- Added validation for Firebase configuration fields
- Explicit storage bucket URL initialization
- Better error messages for missing configuration
- Added support for Firebase emulators in development

### 3. **Aggressive Image Compression** (`lib/storage.ts`)
- **Reduced max file size to 5MB** (from 20MB) for better reliability
- Skip compression only for files under 300KB
- **Adaptive compression based on file size:**
  - Files > 2MB: Resize to 800px width, 60% quality
  - Files > 1MB: Resize to 1000px width, 70% quality
  - Files < 1MB: Resize to 1200px width, 80% quality
- Automatic JPEG conversion for all images (except GIF animations)
- Added detailed compression logging with reduction percentage

### 4. **Better File Validation** (`lib/storage.ts`)
- Hard limit at 5MB with clear error messages
- Warning for files over 2MB (recommended size)
- Shows current file size in error messages

### 5. **Enhanced Error Handling** (`lib/firestore.ts`)
- Removed duplicate timeout (handled in storage layer)
- More specific error messages for different failure scenarios
- Better logging with emojis for easy debugging
- Shows file sizes before and after compression

## How to Verify Your Setup

### 1. Check Environment Variables

Make sure you have all required Firebase configuration in your `.env.local` file:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Critical**: The `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` must be set correctly!

### 2. Check Firebase Storage Rules

In your Firebase Console, go to **Storage** → **Rules** and ensure you have proper permissions:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /message-images/{imageId} {
      // Allow public read
      allow read: if true;
      
      // Allow write with file validation
      allow write: if request.resource.size < 20 * 1024 * 1024 // Max 20MB
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 3. Test the Upload

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try uploading an image through the message composer
3. Check the browser console for detailed logs:
   - 📤 "Starting image upload process..."
   - 📊 "Original file size: XKB"
   - "Compressing image (XKB)..." 
   - ✅ "Image compressed: XKB → YKB (X% reduction)"
   - 📊 "After compression: XKB"
   - ☁️ "Uploading to Firebase Storage..."
   - "Upload progress: X%"
   - ✅ "Image uploaded successfully!"

### 4. Common Issues and Solutions

#### Issue: "Upload failed: Permission denied"
**Solution**: Update your Firebase Storage rules (see step 2 above)

#### Issue: "Upload timeout"
**Solution**: 
- Check your internet connection (timeout is now 2 minutes)
- Try with a smaller image (max 5MB, recommended 2MB or less)
- The compression will automatically reduce large images by 60-80%
- If file is over 5MB, you'll get an error before upload starts
- Try compressing the image yourself using online tools before uploading

#### Issue: "Storage quota exceeded"
**Solution**: 
- Check your Firebase plan limits
- Delete old files from Storage
- Upgrade your Firebase plan if needed

#### Issue: Missing storage bucket configuration
**Solution**: 
- Check browser console for warnings about missing configuration
- Verify `.env.local` has `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` set
- Restart your dev server after adding environment variables

## What Changed in the Code

### Storage Operations Now Include:
- ✅ **2-minute timeout** to prevent indefinite retries
- ✅ **5MB hard limit** with upfront validation
- ✅ Progress tracking and detailed logging with emojis
- ✅ Specific error codes handling
- ✅ **Aggressive automatic compression:**
  - Large files (>2MB): 60% quality, 800px max width
  - Medium files (>1MB): 70% quality, 1000px max width
  - Small files (<1MB): 80% quality, 1200px max width
- ✅ Upload metadata (content type, cache control)
- ✅ Resumable uploads with cancellation support
- ✅ JPEG conversion for better compression (except GIF)

### Better User Feedback:
- Clear error messages for different failure scenarios
- Progress indication in console
- File size reduction logging
- Configuration validation on app startup

## Testing Checklist

- [ ] Environment variables are set correctly
- [ ] Firebase Storage rules allow uploads
- [ ] Dev server restarted after changes
- [ ] Browser console shows no configuration warnings
- [ ] Test image upload completes successfully
- [ ] Check Firebase Console Storage for uploaded files

## Need Help?

If you're still experiencing issues:

1. Check the browser console for specific error messages
2. Verify your Firebase project has Storage enabled
3. Ensure your Firebase plan supports Storage (Blaze plan recommended)
4. Check Firebase Console → Storage → Usage to see if you're within limits
5. Try with a very small image first (< 100KB) to rule out network issues

