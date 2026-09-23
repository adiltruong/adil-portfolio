// Security-rules tests: plays honest visitors and cheaters against the local
// Firebase emulators and checks firestore.rules / database.rules.json allow
// exactly what they should.
//
//   npm run emulators      (in one terminal)
//   npm run test:rules     (in another)
//
// Clears the emulators' Firestore data first so counts start from zero.
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, signInAnonymously } from 'firebase/auth'
import * as fs from 'firebase/firestore/lite'
import * as rtdb from 'firebase/database'

const config = { apiKey: 'demo-key', projectId: 'demo-portfolio', databaseURL: 'http://127.0.0.1:9000/?ns=demo-portfolio-default-rtdb', appId: 'x' }
let n = 0
async function user(signIn = true) {
  const app = initializeApp(config, `u${n++}`)
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  const db = fs.getFirestore(app)
  fs.connectFirestoreEmulator(db, '127.0.0.1', 8080)
  const rt = rtdb.getDatabase(app)
  rtdb.connectDatabaseEmulator(rt, '127.0.0.1', 9000)
  const uid = signIn ? (await signInAnonymously(auth)).user.uid : 'nobody'
  return { db, rt, uid }
}

let pass = 0, fail = 0
async function expect(label, shouldSucceed, fn) {
  let ok
  try { await fn(); ok = true } catch (e) { ok = false; if (shouldSucceed) console.log('   ', e.code || e.message) }
  const good = ok === shouldSucceed
  good ? pass++ : fail++
  console.log(`${good ? 'PASS' : 'FAIL'}  ${shouldSucceed ? 'allow' : 'deny '}  ${label}`)
}

const ts = fs.serverTimestamp
const pong = (u, uid = u.uid) => fs.doc(u.db, 'leaderboards', 'pong', 'scores', uid)
const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
const dayRef = (u, d = today) => fs.doc(u.db, 'wordRallyDays', d)
const player = (u, d = today, uid = u.uid) => fs.doc(u.db, 'wordRallyDays', d, 'players', uid)
function dailyBatch(u, { guesses, bucket, by = 1, d = today, name = '' }) {
  const b = fs.writeBatch(u.db)
  b.set(player(u, d), { name, guesses, createdAt: ts() })
  b.set(dayRef(u, d), { [bucket]: fs.increment(by) }, { merge: true })
  return b.commit()
}

await fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-portfolio/databases/(default)/documents', { method: 'DELETE' })

const a = await user(), b = await user(), c = await user(), anon = await user(false)

console.log('\n-- Pong leaderboard')
await expect('create valid 11-3 win', true, () => fs.setDoc(pong(a), { name: 'Adil', you: 11, cpu: 3, margin: 8, createdAt: ts() }))
await expect('overwrite with a worse 11-5 win', false, () => fs.setDoc(pong(a), { name: 'Adil', you: 11, cpu: 5, margin: 6, createdAt: ts() }))
await expect('overwrite with a better 11-0 win', true, () => fs.setDoc(pong(a), { name: 'Adil', you: 11, cpu: 0, margin: 11, createdAt: ts() }))
await expect('11-10 (not win by 2)', false, () => fs.setDoc(pong(b), { name: 'B', you: 11, cpu: 10, margin: 1, createdAt: ts() }))
await expect('14-11 (overtime must be exactly +2)', false, () => fs.setDoc(pong(b), { name: 'B', you: 14, cpu: 11, margin: 3, createdAt: ts() }))
await expect('margin that lies about the score', false, () => fs.setDoc(pong(b), { name: 'B', you: 11, cpu: 5, margin: 11, createdAt: ts() }))
await expect('13-11 overtime win', true, () => fs.setDoc(pong(b), { name: 'B', you: 13, cpu: 11, margin: 2, createdAt: ts() }))
await expect("write someone else's score", false, () => fs.setDoc(pong(b, a.uid), { name: 'Hax', you: 11, cpu: 0, margin: 11, createdAt: ts() }))
await expect('extra field', false, () => fs.setDoc(pong(c), { name: 'C', you: 11, cpu: 0, margin: 11, createdAt: ts(), admin: true }))
await expect('30-character name', false, () => fs.setDoc(pong(c), { name: 'x'.repeat(30), you: 11, cpu: 0, margin: 11, createdAt: ts() }))
await expect('client-chosen timestamp', false, () => fs.setDoc(pong(c), { name: 'C', you: 11, cpu: 0, margin: 11, createdAt: fs.Timestamp.fromMillis(0) }))
await expect('signed-out write', false, () => fs.setDoc(fs.doc(anon.db, 'leaderboards', 'pong', 'scores', a.uid), { name: 'N', you: 11, cpu: 0, margin: 11, createdAt: ts() }))
await expect('delete a score', false, () => fs.deleteDoc(pong(a)))
await expect('signed-out read of the board', true, () => fs.getDocs(fs.collection(anon.db, 'leaderboards', 'pong', 'scores')))

console.log('\n-- Word Rally daily')
await expect('counter bump without a result', false, () => fs.setDoc(dayRef(c), { g3: fs.increment(1) }, { merge: true }))
await expect('result + wrong counter (3 guesses, bumps g1)', false, () => dailyBatch(c, { guesses: 3, bucket: 'g1' }))
await expect('result + counter bumped by 5', false, () => dailyBatch(c, { guesses: 3, bucket: 'g3', by: 5 }))
await expect("yesterday's day", false, () => dailyBatch(c, { guesses: 3, bucket: 'g3', d: yesterday }))
await expect('8 guesses', false, () => dailyBatch(c, { guesses: 8, bucket: 'g8' }))
await expect('first result, solved in 3', true, () => dailyBatch(a, { guesses: 3, bucket: 'g3' }))
await expect('second result same day', false, () => dailyBatch(a, { guesses: 1, bucket: 'g1' }))
await expect('another visitor, also 3', true, () => dailyBatch(b, { guesses: 3, bucket: 'g3', name: 'B' }))
await expect('a failed day (X)', true, () => dailyBatch(c, { guesses: 7, bucket: 'fail' }))
await expect('add a name afterwards', true, () => fs.updateDoc(player(a), { name: 'Adil' }))
await expect('rename again', false, () => fs.updateDoc(player(a), { name: 'Other' }))
await expect('change guesses afterwards', false, () => fs.updateDoc(player(b), { guesses: 1 }))
await expect("name someone else's result", false, () => fs.updateDoc(player(b, today, c.uid), { name: 'Hax' }))
const stats = (await fs.getDoc(dayRef(anon))).data()
const countsOk = stats.g3 === 2 && stats.fail === 1 && Object.keys(stats).length === 2
countsOk ? pass++ : fail++
console.log(`${countsOk ? 'PASS' : 'FAIL'}  counters end at ${JSON.stringify(stats)} (expect g3:2, fail:1)`)

console.log('\n-- Live viewers (Realtime Database)')
await expect('mark my tab present', true, () => rtdb.set(rtdb.ref(a.rt, `presence/${a.uid}/tab1`), true))
await expect('mark someone else present', false, () => rtdb.set(rtdb.ref(a.rt, `presence/${b.uid}/tab1`), true))
await expect('non-boolean value', false, () => rtdb.set(rtdb.ref(a.rt, `presence/${a.uid}/tab2`), 'hello'))
await expect('overlong tab id', false, () => rtdb.set(rtdb.ref(a.rt, `presence/${a.uid}/${'t'.repeat(40)}`), true))
await expect('write outside presence', false, () => rtdb.set(rtdb.ref(a.rt, 'anything'), true))
await expect('signed-out write', false, () => rtdb.set(rtdb.ref(anon.rt, 'presence/nobody/tab'), true))
await expect('count viewers while signed out', true, () => rtdb.get(rtdb.ref(anon.rt, 'presence')))
await expect('remove my tab', true, () => rtdb.remove(rtdb.ref(a.rt, `presence/${a.uid}/tab1`)))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
