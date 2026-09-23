import { getDatabaseClient } from './client.js'

// Live viewer count. Each open tab writes presence/{uid}/{tabId}; the server
// deletes it when the tab disconnects. Counting uids counts people, not tabs.
export function watchViewers(onCount) {
  let cleanup = () => {}
  let cancelled = false
  const tabId = Math.random().toString(36).slice(2, 12)

  getDatabaseClient().then((client) => {
    if (!client || cancelled) return
    const { rtdb, db, uid } = client
    const me = rtdb.ref(db, `presence/${uid}/${tabId}`)

    const stopConnected = rtdb.onValue(rtdb.ref(db, '.info/connected'), (snap) => {
      if (snap.val() !== true) return
      rtdb.onDisconnect(me).remove().then(() => rtdb.set(me, true))
    })
    const stopCount = rtdb.onValue(rtdb.ref(db, 'presence'), (snap) => onCount(snap.size))

    cleanup = () => {
      stopConnected()
      stopCount()
      rtdb.remove(me)
    }
  })

  return () => {
    cancelled = true
    cleanup()
  }
}
