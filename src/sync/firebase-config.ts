import type { FirebaseOptions } from 'firebase/app';

// The Firebase config comes from the environment, never from the repo:
//   local: .env.local (git-ignored, see .env.example) · CI: GitHub repository secrets.
// `null` when not configured; the app then runs with sync off (ADR-005 fallback links).
const env = import.meta.env;

export const firebaseConfig: FirebaseOptions | null = env.VITE_FIREBASE_API_KEY
  ? {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      databaseURL: env.VITE_FIREBASE_DATABASE_URL,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    }
  : null;

/** Local Firebase emulators, only for test builds (`npm run build:e2e`). */
export const firebaseEmulator = env.VITE_FIREBASE_EMULATOR_HOST
  ? { host: env.VITE_FIREBASE_EMULATOR_HOST, authPort: 9099, databasePort: 9000 }
  : undefined;
