import { getFirestoreClient } from './client.js'

// Firestore layout (enforced by firestore.rules):
//   leaderboards/pong/scores/{uid}          best win per visitor
//   wordRallyDays/{YYYY-MM-DD}               { g1..g6, fail } counters
//   wordRallyDays/{YYYY-MM-DD}/players/{uid} one result per visitor per day

const TOP_N = 10
// Queries sort on one field only (no composite index needed); ties are
// broken client-side by who got there first.
const FETCH_N = 50
const byTime = (a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)

// ---- Pickleball Pong -------------------------------------------------------

export async function fetchPongLeaders() {
  const c = await getFirestoreClient()
  if (!c) return null
  const { fs, db, uid } = c
  const q = fs.query(
    fs.collection(db, 'leaderboards', 'pong', 'scores'),
    fs.orderBy('margin', 'desc'),
    fs.limit(FETCH_N),
  )
  const snap = await fs.getDocs(q)
  const rows = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => b.margin - a.margin || byTime(a, b))
    .slice(0, TOP_N)
  return { rows, uid }
}

// Saves a win if it beats this visitor's previous best. Returns true if saved.
export async function submitPongWin({ name, you, cpu }) {
  const c = await getFirestoreClient()
  if (!c) return false
  const { fs, db, uid } = c
  const ref = fs.doc(db, 'leaderboards', 'pong', 'scores', uid)
  const margin = you - cpu
  const prev = await fs.getDoc(ref)
  if (prev.exists() && prev.data().margin >= margin) return false
  await fs.setDoc(ref, { name, you, cpu, margin, createdAt: fs.serverTimestamp() })
  return true
}

// ---- Word Rally daily ------------------------------------------------------

export const FAIL = 7 // stored guess count for an unsolved day
export const bucketFor = (guesses) => (guesses === FAIL ? 'fail' : `g${guesses}`)
export const BUCKETS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'fail']

export async function fetchDaily(day) {
  const c = await getFirestoreClient()
  if (!c) return null
  const { fs, db, uid } = c
  const dayRef = fs.doc(db, 'wordRallyDays', day)
  const players = fs.query(
    fs.collection(dayRef, 'players'),
    fs.orderBy('guesses'),
    fs.limit(FETCH_N),
  )
  const [statsSnap, playersSnap, mineSnap] = await Promise.all([
    fs.getDoc(dayRef),
    fs.getDocs(players),
    fs.getDoc(fs.doc(dayRef, 'players', uid)),
  ])
  const stats = Object.fromEntries(BUCKETS.map((b) => [b, statsSnap.data()?.[b] ?? 0]))
  const leaders = playersSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.name && p.guesses < FAIL)
    .sort((a, b) => a.guesses - b.guesses || byTime(a, b))
    .slice(0, TOP_N)
  return { stats, leaders, mine: mineSnap.exists() ? mineSnap.data() : null, uid }
}

// Records today's result and bumps the matching counter in one atomic batch.
export async function submitDaily(day, { guesses, name }) {
  const c = await getFirestoreClient()
  if (!c) return false
  const { fs, db, uid } = c
  const dayRef = fs.doc(db, 'wordRallyDays', day)
  const batch = fs.writeBatch(db)
  batch.set(fs.doc(dayRef, 'players', uid), {
    name,
    guesses,
    createdAt: fs.serverTimestamp(),
  })
  batch.set(dayRef, { [bucketFor(guesses)]: fs.increment(1) }, { merge: true })
  await batch.commit()
  return true
}

// Lets someone who finished anonymously add their name afterwards.
export async function nameDailyResult(day, name) {
  const c = await getFirestoreClient()
  if (!c) return false
  const { fs, db, uid } = c
  await fs.updateDoc(fs.doc(db, 'wordRallyDays', day, 'players', uid), { name })
  return true
}
