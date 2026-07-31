# Firebase production security

The production rules are versioned in `firestore.rules` and `storage.rules`.
They do not contain a date and therefore do not expire.

## Security model

- Wall content and wall images are publicly readable.
- All writes require Firebase Anonymous Authentication.
- Space, message, reply, and upload payloads are validated by Security Rules.
- One like document is allowed per anonymous uid and message.
- Group suggestions are derived from spaces and messages; clients cannot write
  aggregate or group-counter documents.
- Firebase App Check uses reCAPTCHA Enterprise and is initialized before the
  Firestore and Storage clients when a site key is configured.

## Required Firebase Console settings

1. Authentication > Sign-in method > Anonymous: enabled.
2. App Check > Web app: reCAPTCHA Enterprise provider registered.
3. Add the provider site key as `NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY` in
   each deployment environment.
4. Deploy the updated app before enforcing App Check or the new rules.
5. Monitor App Check metrics, then enforce Cloud Firestore and Cloud Storage.

## Local verification

```bash
env JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home \
  PATH=/Library/Java/JavaVirtualMachines/temurin-24.jdk/Contents/Home/bin:$PATH \
  npm run test:rules
npm run build
```

## Deployment

Deploy the versioned rules to the explicitly linked project:

```bash
npm run firebase:deploy:rules
```

Do not paste ad-hoc test-mode rules into the console. Update and test the
versioned rule files instead.
