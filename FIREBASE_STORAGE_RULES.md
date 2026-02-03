# Firebase Storage Rules Setup

## Your Storage Bucket
`gs://yourwall-messages.firebasestorage.app` (example)

## Required Storage Rules

To allow image uploads, you need to configure your Firebase Storage rules properly.

### Step-by-Step Instructions:

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. Navigate to your project: **yourwall-messages** (or your project name)
3. Click on **Storage** in the left sidebar
4. Click on the **Rules** tab at the top
5. Replace the current rules with the following:

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Allow anyone to read all files
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // Allow uploads to message-images folder with validation
    match /message-images/{imageId} {
      allow write: if request.resource != null
                   && request.resource.size <= 5 * 1024 * 1024  // Max 5MB
                   && request.resource.contentType.matches('image/.*');  // Only images
    }
  }
}
```

6. Click **Publish** to save the rules

### What These Rules Do:

✅ **Allow Reading**: Anyone can view/download images (for displaying messages)
✅ **Allow Writing**: Anyone can upload images to `message-images/` folder
✅ **Size Validation**: Blocks files larger than 5MB
✅ **Type Validation**: Only allows image files (image/jpeg, image/png, etc.)

### Alternative: More Permissive Rules (for testing only)

If you want to test quickly without restrictions (NOT recommended for production):

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Warning**: This allows anyone to upload anything. Only use temporarily for testing!

### Verify Rules are Applied:

After publishing the rules:

1. **Wait 1-2 minutes** for rules to propagate
2. **Restart your dev server**:
   ```bash
   npm run dev
   ```
3. **Try uploading** an image again
4. **Check the console** - you should no longer see "Permission denied" or timeout errors

### Common Issues:

#### Issue: "Upload failed: Permission denied"
**Cause**: Storage rules are too restrictive
**Fix**: Update rules as shown above

#### Issue: Still timing out after updating rules
**Cause**: Rules might not have propagated yet
**Fix**: 
- Wait 2-3 minutes
- Clear browser cache (Cmd+Shift+R)
- Restart dev server
- Try again

#### Issue: "storage/unauthorized"
**Cause**: Storage rules don't allow the specific operation
**Fix**: 
- Verify the rules match exactly as shown above
- Check that you clicked "Publish"
- Verify you're uploading to the correct bucket

### Test Your Setup:

Once rules are configured, test with this checklist:

- [ ] Rules published in Firebase Console
- [ ] Waited 2 minutes for propagation
- [ ] Dev server restarted
- [ ] Browser cache cleared
- [ ] Test upload with small image (< 1MB)
- [ ] Check console for detailed logs
- [ ] Verify upload completes successfully

### Expected Console Output:

```
📤 Starting image upload process...
📊 Original file size: 282KB
Image is small enough (282KB), skipping compression
📊 After compression: 282KB
☁️ Uploading to Firebase Storage...
Upload progress: 25%
Upload progress: 50%
Upload progress: 75%
Upload progress: 100%
✅ Image uploaded successfully!
```

### Need More Help?

If uploads still fail after configuring rules:

1. **Check Firebase Console → Storage → Files**
   - See if any files are being created
   - Check if failed uploads appear

2. **Check Firebase Console → Storage → Usage**
   - Verify you're within quota limits
   - Confirm storage is enabled for your plan

3. **Check browser Network tab**
   - Look for failed requests to `firebasestorage.googleapis.com`
   - Check the error response details

4. **Verify your Firebase plan**
   - Spark (free) plan: 5GB storage, 1GB/day downloads
   - Blaze (pay-as-you-go): Unlimited (charges apply)

### Firebase Storage URL Format:

Your images will be stored at:
- **Path**: `message-images/{timestamp}_{random}.{ext}`
- **Full URL**: `https://firebasestorage.googleapis.com/v0/b/yourwall-messages.firebasestorage.app/o/message-images%2F{filename}?alt=media&token={token}` (example)

The download URLs are automatically generated and include authentication tokens for security.




