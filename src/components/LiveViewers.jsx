import { useEffect, useState } from 'react'
import { isFirebaseConfigured } from '../firebase/config.js'
import { watchViewers } from '../firebase/presence.js'

// "● 3 viewing now", counted live through Firebase Realtime Database.
export default function LiveViewers() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    return watchViewers(setCount)
  }, [])

  if (!count) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
      </span>
      {count} viewing now
    </span>
  )
}
