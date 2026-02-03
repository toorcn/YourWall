# Quick Start Guide 🚀

Get YourWall Message Platform running in 5 minutes!

## Prerequisites

- Node.js 18 or higher installed
- A Firebase account (free)

## Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

Follow the detailed guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md), or here's the quick version:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database (start in test mode for easy setup)
4. Get your config from Project Settings > Your apps > Web app
5. Copy `.env.example` to `.env.local` and fill in your Firebase credentials

### 3. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## First Test

1. **Write a message**:
   - Leave "From" blank or add your name
   - Add recipients (try "Volunteers" or create your own)
   - Write a message
   - Click "Send Message"

2. **See it appear**: The message should appear on the wall immediately!

3. **Try filtering**: Click on a group badge to filter messages

## What's Next?

- Customize the colors in `app/globals.css`
- Add your event branding to `app/page.tsx`
- Deploy to Vercel or Firebase Hosting (see [README.md](./README.md))

## Troubleshooting

**Messages not appearing?**
- Check browser console for errors
- Verify Firebase config in `.env.local`
- Make sure Firestore is enabled in Firebase Console

**Can't send messages?**
- Check Firestore security rules (use test mode for development)
- Verify all required fields are filled

**Build errors?**
- Try deleting `node_modules` and `.next` folders
- Run `npm install` again
- Make sure you're using Node.js 18+

## Need Help?

Check out:
- [README.md](./README.md) - Full documentation
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Detailed Firebase guide
- Firebase Console for error logs

Happy messaging! 💌

