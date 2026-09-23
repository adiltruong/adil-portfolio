import { useState } from 'react'
import { cleanName, loadPlayerName, MAX_NAME_LENGTH } from '../firebase/client.js'

// Top-N list shared by the games. `rows` are { id, name, detail }; the row
// whose id matches `highlightId` (this visitor) is marked "you".
export function Leaderboard({ title, rows, highlightId, empty = 'No scores yet. Be the first!' }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      {rows === null ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{empty}</p>
      ) : (
        <ol className="mt-3 space-y-1.5 text-sm">
          {rows.map((row, i) => {
            const mine = row.id === highlightId
            return (
              <li
                key={row.id}
                className={`flex items-baseline gap-3 rounded-md px-2 py-1 ${mine ? 'bg-ball/25 dark:bg-ball/15' : ''}`}
              >
                <span className="w-5 text-right tabular-nums text-slate-400">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-slate-200">
                  {row.name}
                  {mine && <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">(you)</span>}
                </span>
                <span className="tabular-nums text-slate-600 dark:text-slate-400">{row.detail}</span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

// Asks for a display name once; later games reuse the saved one.
export function NameForm({ prompt, onSubmit }) {
  const [name, setName] = useState(loadPlayerName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const clean = cleanName(name)

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault()
        if (!clean) return
        setBusy(true)
        setError('')
        try {
          await onSubmit(clean)
        } catch (err) {
          console.warn(err)
          setError('Could not save. Try again in a moment.')
          setBusy(false)
        }
      }}
    >
      <label className="text-sm text-slate-700 dark:text-slate-300" htmlFor="player-name">
        {prompt}
      </label>
      <input
        id="player-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        placeholder="Your name"
        autoComplete="nickname"
        className="w-40 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-court dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-ball"
      />
      <button
        type="submit"
        disabled={!clean || busy}
        className="rounded-md bg-court px-3 py-1.5 text-sm font-medium text-white transition hover:bg-court-deep disabled:opacity-50 dark:bg-ball dark:text-slate-900 dark:hover:bg-ball/85"
      >
        {busy ? 'Saving…' : 'Save'}
      </button>
      {error && <span className="w-full text-sm text-red-600 dark:text-red-400">{error}</span>}
    </form>
  )
}
