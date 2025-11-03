# Quick Start: Image Upload Feature

## 🎉 What's New

Your message wall now supports **image attachments**! Users can upload images along with their messages.

## 🚀 Quick Setup (Before First Use)

### 1. Enable Firebase Storage

Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Storage:

1. Click **"Get Started"**
2. Choose **"Start in test mode"** (for development)
3. Click **"Done"**

### 2. Update Storage Rules (Important for Production!)

In Firebase Console → Storage → Rules, use these rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /message-images/{imageId} {
      // Anyone can read images
      allow read: if true;
      
      // Only allow image uploads under 20MB
      allow write: if request.resource.size < 20 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 3. Verify Environment Variables

Make sure your `.env.local` has the storage bucket:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

You can find this in Firebase Console → Project Settings.

## ✨ Features

- **📤 Easy Upload**: Click to select image or drag & drop
- **👀 Live Preview**: See your image before sending
- **🗜️ Auto Compression**: Images automatically optimized to reduce file size
- **✅ Validation**: Max 20MB, supports JPEG, PNG, GIF, WebP
- **🎨 Beautiful Display**: Images shown elegantly in message cards
- **📱 Responsive**: Works great on mobile and desktop
- **💾 Optional**: Messages can be sent with or without images

## 📋 Usage

1. **Create a message** as usual (fill in name, recipients, content)
2. **Click "Click to upload an image"** in Step 3
3. **Select an image** from your device (max 20MB)
4. **Preview** appears - you can remove it if you change your mind
5. **Send** the message!

## 🔧 Technical Details

- Images stored in Firebase Storage under `message-images/` folder
- Automatic compression to 1200px width (maintains aspect ratio)
- Download URLs saved in Firestore with message data
- Next.js Image component for optimized delivery
- Share modal includes images too!

## 🐛 Troubleshooting

**"Failed to upload image"**
- Check that Firebase Storage is enabled
- Verify storage rules are set correctly
- Check browser console for specific errors

**Image not displaying**
- Verify `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set in `.env.local`
- Check that image was actually uploaded (check Firebase Storage console)
- Clear browser cache and reload

**File size error**
- Images must be under 20MB
- Try compressing your image first using an online tool

## 📁 What Was Changed

### New Files:
- `lib/storage.ts` - Image upload utilities

### Modified Files:
- `lib/types.ts` - Added image support to types
- `lib/firebase.ts` - Added Storage initialization
- `lib/firestore.ts` - Handles image uploads
- `components/MessageComposer.tsx` - Image upload UI
- `components/MessageCard.tsx` - Image display
- `components/ShareModal.tsx` - Images in shared cards
- `next.config.ts` - Firebase Storage domain allowed

## 🎯 Next Steps

1. **Enable Firebase Storage** (see step 1 above)
2. **Update storage rules** for security
3. **Test it out** by creating a message with an image!
4. **Deploy** your updated app

## 💡 Tips

- Use high-quality images for best results (they'll be auto-compressed)
- Landscape images work better than portrait for most displays
- Test with different image sizes to see how they look
- Images are optional - not every message needs one!

---

Happy messaging! 🎊

