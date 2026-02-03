# Deployment Guide 🚀

Deploy your YourWall Message Platform to production.

## Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps and it's free for most use cases.

### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Configure:
     - Framework Preset: **Next.js** (auto-detected)
     - Root Directory: `./`
     - Build Command: `npm run build` (default)
     - Output Directory: `.next` (default)

3. **Add Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add all your Firebase config variables:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
     NEXT_PUBLIC_FIREBASE_PROJECT_ID
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
     NEXT_PUBLIC_FIREBASE_APP_ID
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live! 🎉

### Automatic Deployments

Every push to `main` branch will automatically deploy to production.

### Custom Domain

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

---

## Option 2: Firebase Hosting

Deploy directly to Firebase Hosting alongside your Firestore database.

### Steps:

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Initialize Firebase Hosting**
   ```bash
   firebase init hosting
   ```
   
   Select:
   - Use an existing project (your Firebase project)
   - Public directory: `out`
   - Configure as single-page app: **No**
   - Set up automatic builds with GitHub: **Optional**

4. **Update `next.config.ts`**
   
   Add this to enable static export:
   ```typescript
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true,
     },
   };
   ```

5. **Build and Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

6. **Access Your App**
   - Your app will be at: `https://your-project-id.web.app`

### Continuous Deployment

Set up GitHub Actions to auto-deploy on push:

Create `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

---

## Option 3: Netlify

Another great free option for static sites.

### Steps:

1. **Push to GitHub** (if not already done)

2. **Deploy to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign in with GitHub
   - Click "Add new site" > "Import an existing project"
   - Choose your repository
   - Configure:
     - Build command: `npm run build`
     - Publish directory: `.next`

3. **Add Environment Variables**
   - Site settings > Environment variables
   - Add all Firebase config variables

4. **Deploy**
   - Click "Deploy site"
   - Your app is live!

---

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Update Firebase security rules (see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md))
- [ ] Test all features locally
- [ ] Set proper character limits and validation
- [ ] Configure CORS if needed
- [ ] Set up monitoring/analytics (optional)
- [ ] Test on mobile devices
- [ ] Check accessibility
- [ ] Update metadata in `app/layout.tsx`

## Production Firebase Security Rules

Make sure to update Firestore rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{message} {
      allow read: if true;
      allow create: if request.resource.data.content is string
                    && request.resource.data.content.size() > 0
                    && request.resource.data.content.size() <= 500
                    && request.resource.data.to is list
                    && request.resource.data.to.size() > 0;
      allow update, delete: if false;
    }
    
    match /groups/{group} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

## Monitoring

### Firebase Console

Monitor your app usage:
- Go to Firebase Console > Firestore Database
- Check "Usage" tab for read/write counts
- Set up billing alerts if needed

### Vercel Analytics

If using Vercel, enable analytics:
1. Go to project settings
2. Navigate to "Analytics"
3. Enable analytics (free tier available)

## Custom Domain Setup

### With Vercel:
1. Vercel dashboard > Domains
2. Add your domain
3. Update DNS records at your registrar

### With Firebase Hosting:
```bash
firebase hosting:channel:deploy production --domain your-domain.com
```

## Scaling Considerations

For large events (1000+ users):

1. **Firebase Firestore**:
   - Monitor quota usage
   - Consider upgrading to Blaze plan if needed
   - Set up composite indexes for better performance

2. **Caching**:
   - Enable CDN caching on Vercel/Netlify
   - Consider Redis for frequently accessed data

3. **Rate Limiting**:
   - Implement client-side rate limiting
   - Consider Firebase App Check for abuse prevention

## Troubleshooting Deployment

### Build fails
- Check Node.js version matches production (18+)
- Verify all dependencies are in `package.json`
- Run `npm run build` locally first

### Environment variables not working
- Make sure they're prefixed with `NEXT_PUBLIC_`
- Redeploy after adding variables
- Check they're added to the correct environment

### Firebase connection issues
- Verify Firebase config is correct
- Check security rules allow access
- Ensure Firestore is enabled

## Post-Deployment

After deploying:

1. **Test Everything**
   - Create messages
   - Test filtering
   - Check on mobile
   - Verify real-time updates work

2. **Share with Users**
   - Post the URL to your community
   - Consider creating a QR code
   - Add to event website

3. **Monitor Performance**
   - Check Firebase usage
   - Monitor for errors
   - Gather user feedback

## Need Help?

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)

Happy deploying! 🚀

