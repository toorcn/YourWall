# Firebase Storage CORS Setup

If images are not displaying in the ShareModal, you need to configure CORS (Cross-Origin Resource Sharing) on your Firebase Storage bucket.

**Note:** Firebase Storage is built on Google Cloud Storage, so CORS configuration is managed in Google Cloud Console. But you can access it easily from Firebase Console!

## Method 1: Direct Link to Google Cloud Console (Easiest!)

This is the simplest method - just click the link and go straight to your bucket!

### Step-by-Step:

1. **Find your Firebase Project ID:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Your Project ID is shown in the URL or in the project overview

2. **Go directly to Google Cloud Console Storage:**
   - Replace `YOUR-PROJECT-ID` in this URL with your actual project ID:
     ```
     https://console.cloud.google.com/storage/browser?project=YOUR-PROJECT-ID
     ```
   - Or go to [Google Cloud Console](https://console.cloud.google.com/) → Select your project → Navigate to **Cloud Storage** → **Browser**

3. **Click on your bucket** (usually `YOUR-PROJECT-ID.appspot.com`)

4. **Configure CORS:**
   - **IMPORTANT:** Make sure you're on the **"Configuration"** tab (NOT "Permissions" tab)
   - You should see tabs at the top: "Overview", "Objects", "Permissions", **"Configuration"**, etc.
   - Click on the **"Configuration"** tab
   - Scroll down to find the **"CORS configuration"** section
   - If you don't see a CORS section, click **"Edit CORS configuration"** button (it might be at the top of the Configuration tab)
   - Paste this JSON into the editor:
     ```json
     [
       {
         "origin": ["*"],
         "method": ["GET", "HEAD"],
         "maxAgeSeconds": 3600,
         "responseHeader": ["Content-Type", "Access-Control-Allow-Origin"]
       }
     ]
     ```
   - Click **"Save"**

### Can't Find the Configuration Tab?

If you don't see the Configuration tab:
1. Make sure you clicked on the **bucket name** (not just viewing the bucket list)
2. The bucket page should show tabs like: Overview | Objects | Permissions | **Configuration** | Lifecycle
3. If you still don't see it, try this direct link format:
   ```
   https://console.cloud.google.com/storage/browser/YOUR-PROJECT-ID.appspot.com?project=YOUR-PROJECT-ID
   ```
   (Replace both instances of `YOUR-PROJECT-ID` with your actual project ID)

### Alternative: Via Firebase Console

If you prefer starting from Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com/) → Select your project → **Storage**
2. Look for a link or button that says "Open in Google Cloud Console" (location may vary)
3. Or use the direct link method above

---

## Method 2: Via Command Line (Alternative)

If you prefer command line or want to automate this:

### 1. Install Google Cloud SDK (if not already installed)

**macOS:**
```bash
brew install google-cloud-sdk
```

**Or download from:** https://cloud.google.com/sdk/docs/install

### 2. Authenticate with Google Cloud

```bash
gcloud auth login
```

### 3. Find Your Storage Bucket Name

Your bucket name is usually: `YOUR-PROJECT-ID.appspot.com`

You can find it in:
- Firebase Console → Storage → Files
- The URL will show your bucket name

### 4. Apply CORS Configuration

```bash
gsutil cors set cors.json gs://YOUR-BUCKET-NAME
```

Example:
```bash
gsutil cors set cors.json gs://kiyoko-for-you.appspot.com
```

### 5. Verify CORS Configuration

```bash
gsutil cors get gs://YOUR-BUCKET-NAME
```

This should display the CORS configuration you just set.

---

## Troubleshooting

### Images Still Not Loading?

1. **Check the browser console** for CORS errors
2. **Clear browser cache** and hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)
3. **Verify Firebase Storage Rules** allow public read:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /message-images/{imageId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

4. **Check if the image URL is valid** - copy it and try opening in a new browser tab

### Common Error Messages

- **"Failed to load resource: net::ERR_FAILED"** → CORS not configured
- **"No 'Access-Control-Allow-Origin' header"** → CORS not configured correctly
- **"Cross-origin image load denied"** → CORS misconfigured or Storage Rules issue
- **"Tainted canvases may not be exported"** → Images not converted to data URLs (this should be handled automatically)

## Need Help?

Check the console logs:
- Open browser DevTools (F12 or Cmd+Option+I)
- Go to Console tab
- Look for errors related to image loading
- Share the error messages for further assistance
