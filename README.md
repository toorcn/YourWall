# KiyokoCon 2025 Message Platform 💌

A beautiful, dreamy message platform where KiyokoCon 2025 attendees can leave heartfelt messages for volunteers, committees, and fellow attendees.

## ✨ Features

- **Anonymous Messaging**: Leave messages with or without your name
- **Dynamic Groups**: Address messages to specific groups (Volunteers, Committees, etc.) or create new ones on the fly
- **Real-time Updates**: Messages appear instantly using Firebase Firestore
- **Elegant UI/UX**: Dreamy gradient backgrounds, glass morphism effects, and smooth animations
- **Filtering**: Filter messages by recipient group
- **Responsive Design**: Beautiful on all devices from mobile to desktop

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Firebase project (free tier works great!)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd kiyoko-for-you
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Firestore Database**:
   - Go to Firestore Database in the sidebar
   - Click "Create database"
   - Start in **production mode** or **test mode** (test mode is easier for development)
   - Choose a location close to your users
4. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" and click the web icon `</>`
   - Register your app and copy the config values

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

### 5. Build for Production

```bash
npm run build
npm start
```

## 🎨 Design Philosophy

This platform embodies a dreamy, elegant aesthetic perfect for heartfelt messages:

- **Soft Gradients**: Lavender, pink, and blue create a warm, nostalgic atmosphere
- **Glass Morphism**: Frosted glass effects add depth and sophistication
- **Fluid Animations**: Gentle, organic movements create a magical feel
- **Typography**: Mix of serif headers and clean sans-serif body text
- **Pastel Colors**: Each message card has a unique pastel accent
- **Generous Spacing**: Breathing room makes the interface feel calm and focused

## 📁 Project Structure

```
kiyoko-for-you/
├── app/
│   ├── page.tsx          # Main message wall
│   ├── layout.tsx        # Root layout with fonts
│   └── globals.css       # Global styles
├── components/
│   ├── MessageComposer.tsx    # Form to create messages
│   ├── MessageCard.tsx        # Individual message display
│   ├── FilterBar.tsx          # Group filter buttons
│   └── RecipientSelector.tsx  # Multi-select recipient input
├── lib/
│   ├── firebase.ts       # Firebase initialization
│   ├── firestore.ts      # Database operations
│   └── types.ts          # TypeScript interfaces
└── public/               # Static assets
```

## 🔥 Firebase Setup Details

### Firestore Collections

The app uses two collections:

**messages**
- `from`: string (author name or "Anonymous")
- `to`: string[] (array of recipient groups)
- `content`: string (message text)
- `timestamp`: timestamp
- `color`: string (pastel accent color)

**groups**
- `id`: string (lowercase group name)
- `displayName`: string (formatted name)
- `createdAt`: timestamp
- `messageCount`: number (for sorting)

### Security Rules (Optional)

For production, add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{message} {
      allow read: if true;
      allow create: if request.resource.data.content.size() <= 500;
    }
    match /groups/{group} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

## 🎯 Usage Tips

1. **Pre-populated Groups**: The app automatically creates popular groups (Volunteers, Committees, Attendees, Everyone)
2. **Create New Groups**: Just type a new group name when composing a message
3. **Anonymous Messages**: Leave the "From" field blank to post anonymously
4. **Character Limit**: Messages are limited to 500 characters for better readability

## 📱 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add your environment variables in Vercel's dashboard
5. Deploy!

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 🤝 Contributing

Feel free to customize this platform for your event! Some ideas:

- Add image uploads
- Add reactions/likes to messages
- Add message moderation
- Change color scheme to match your event branding
- Add user authentication

## 📄 License

MIT License - feel free to use this for your own events!

## 💜 Made with Love

Created for KiyokoCon 2025 with React, Next.js, Firebase, and lots of pastel gradients.
