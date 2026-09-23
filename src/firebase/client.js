import { firebaseConfig, isFirebaseConfigured, useEmulators } from './config.js'

// Firebase is loaded on demand so it never slows the first paint. Every
// visitor gets an anonymous account; the security rules key writes to it.
let ready = null
const emulated = new Set() // SDK instances already pointed at local emulators

export function getFirebase() {
  if (!isFirebaseConfigured) return Promise.resolve(null)
  ready ??= (async () => {
    const [{ initializeApp }, auth] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
    ])
    const app = initializeApp(firebaseConfig)
    const a = auth.getAuth(app)
    if (useEmulators) auth.connectAuthEmulator(a, 'http://127.0.0.1:9099', { disableWarnings: true })
    await a.authStateReady()
    const user = a.currentUser ?? (await auth.signInAnonymously(a)).user
    return { app, uid: user.uid }
  })().catch((err) => {
    console.warn('Firebase unavailable:', err)
    return null
  })
  return ready
}

export async function getFirestoreClient() {
  const fb = await getFirebase()
  if (!fb) return null
  // Lite build: plain reads and writes, no realtime listeners, a fraction of the size.
  const fs = await import('firebase/firestore/lite')
  const db = fs.getFirestore(fb.app)
  if (useEmulators && !emulated.has('firestore')) {
    fs.connectFirestoreEmulator(db, '127.0.0.1', 8080)
    emulated.add('firestore')
  }
  return { fs, db, uid: fb.uid }
}

export async function getDatabaseClient() {
  const fb = await getFirebase()
  if (!fb) return null
  const rtdb = await import('firebase/database')
  const db = rtdb.getDatabase(fb.app)
  if (useEmulators && !emulated.has('database')) {
    rtdb.connectDatabaseEmulator(db, '127.0.0.1', 9000)
    emulated.add('database')
  }
  return { rtdb, db, uid: fb.uid }
}

const NAME_KEY = 'playerName'

export function loadPlayerName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function savePlayerName(name) {
  try {
    localStorage.setItem(NAME_KEY, name)
  } catch {
    // Storage blocked: the name just isn't remembered next visit.
  }
}

export const MAX_NAME_LENGTH = 20
export const cleanName = (name) => name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH)
