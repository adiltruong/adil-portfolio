// Firebase web config from Firebase console → Project settings → Your apps.
// These values are public by design; the security rules in firestore.rules and
// database.rules.json are what protect the data. Leave them empty and every
// Firebase feature (leaderboards, daily stats, live viewers) simply stays hidden.
const projectConfig = {
  apiKey: 'AIzaSyCt2VggjlWSBSlVcm8XIM2W9--Z4Ic7xZM',
  authDomain: 'portfolio-da694.firebaseapp.com',
  databaseURL: 'https://portfolio-da694-default-rtdb.firebaseio.com',
  projectId: 'portfolio-da694',
  storageBucket: 'portfolio-da694.firebasestorage.app',
  messagingSenderId: '864196600444',
  appId: '1:864196600444:web:accd59076509839bbe5ff9',
}

// `npm run dev:emulators` points the site at local Firebase emulators
// (started with `npm run emulators`) instead of the real project.
export const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === 'true'

const emulatorConfig = {
  apiKey: 'demo-key',
  authDomain: 'demo-portfolio.firebaseapp.com',
  databaseURL: 'http://127.0.0.1:9000/?ns=demo-portfolio-default-rtdb',
  projectId: 'demo-portfolio',
  appId: 'demo-app',
}

export const firebaseConfig = useEmulators ? emulatorConfig : projectConfig

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
