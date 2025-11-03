# Firebase Setup Guide 🔥

This guide will walk you through setting up Firebase for the KiyokoCon Message Platform.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter a project name (e.g., "kiyokocon-messages")
4. (Optional) Enable Google Analytics
5. Click **"Create project"**

## Step 2: Enable Firestore Database

1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose a security mode:
   - **Test mode**: Good for development (allows all reads/writes for 30 days)
   - **Production mode**: Requires security rules (see below)
4. Select a Firestore location (choose one close to your users)
   - Example: `us-central1` for North America
   - Example: `asia-northeast1` for Japan
5. Click **"Enable"**

## Step 3: Get Your Firebase Configuration

1. In the Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to **"Your apps"**
4. Click the **web icon** `</>`
5. Register your app:
   - App nickname: "KiyokoCon Message Wall" (or any name)
   - Don't check "Firebase Hosting" (unless you want to deploy there)
6. Click **"Register app"**
7. Copy the `firebaseConfig` object

## Step 4: Add Configuration to Your App

1. Create a `.env.local` file in your project root
2. Add your Firebase config (replace with your actual values):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

3. Save the file
4. Restart your development server

## Step 5: Set Up Firestore Security Rules (Production)

For production use, set up proper security rules:

1. Go to **Firestore Database** in Firebase Console
2. Click the **"Rules"** tab
3. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anyone to read messages
    match /messages/{message} {
      allow read: if true;
      
      // Allow creating messages with validation
      allow create: if request.resource.data.content is string
                    && request.resource.data.content.size() > 0
                    && request.resource.data.content.size() <= 500
                    && request.resource.data.to is list
                    && request.resource.data.to.size() > 0
                    && request.resource.data.timestamp == request.time;
      
      // Don't allow updates or deletes
      allow update, delete: if false;
    }
    
    // Allow reading and writing groups
    match /groups/{group} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

4. Click **"Publish"**

## Step 6: Test Your Setup

1. Start your Next.js app: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Try creating a message
4. Check Firebase Console > Firestore Database to see the data

## Firestore Data Structure

Your Firestore will have these collections:

### `messages` Collection

Each document contains:
```javascript
{
  from: "John Doe",           // or "Anonymous"
  to: ["Volunteers", "Attendees"], // array of recipients
  content: "Thank you all!",   // message text
  timestamp: Timestamp,         // when created
  color: "#FFE4E1"             // pastel color
}
```

### `groups` Collection

Each document contains:
```javascript
{
  id: "volunteers",            // lowercase ID
  displayName: "Volunteers",   // formatted name
  createdAt: Timestamp,        // when created
  messageCount: 42             // number of messages
}
```

## Common Issues

### Issue: "Permission denied" errors

**Solution**: Make sure you've set up Firestore security rules. In test mode, they expire after 30 days.

### Issue: "Firebase not initialized"

**Solution**: Check that your `.env.local` file exists and has the correct values. Restart your dev server.

### Issue: Messages not appearing

**Solution**: 
1. Check browser console for errors
2. Verify Firestore is enabled in Firebase Console
3. Check security rules allow reads

### Issue: Can't create messages

**Solution**:
1. Check security rules allow creates
2. Verify all required fields are being sent
3. Check character limit (500 max)

## Cost Considerations

Firebase Firestore has a generous free tier:

**Free Tier Includes:**
- 1 GB storage
- 50,000 reads/day
- 20,000 writes/day
- 20,000 deletes/day

For a small to medium-sized convention, this should be more than enough. Monitor usage in Firebase Console > Usage and billing.

## Optional: Indexes

If you have many messages and filtering is slow, you might need to create indexes:

1. Go to Firestore Database > Indexes
2. Click "Add index"
3. Create a composite index for:
   - Collection: `messages`
   - Fields: `to` (Arrays), `timestamp` (Descending)

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Getting Started](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Support](https://firebase.google.com/support)

## Next Steps

Once your Firebase is set up:

1. ✅ Test creating messages locally
2. ✅ Test filtering by groups
3. ✅ Deploy to production (Vercel, Firebase Hosting, etc.)
4. ✅ Share the URL with your community!

Happy messaging! 💌

