import Section from './Section.jsx'

const ago = (ms) => {
  const mins = Math.round((Date.now() - ms) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

const clock = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`

function result(m) {
  if (m.remake) return { label: 'Remake', className: 'text-slate-500 dark:text-slate-400', bar: 'bg-slate-400' }
  return m.win
    ? { label: 'Win', className: 'text-kitchen', bar: 'bg-kitchen' }
    : { label: 'Loss', className: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' }
}

// data comes from public/lol-matches.json, written in CI by scripts/fetch-lol.mjs.
export default function League({ data }) {
  const played = data.matches.filter((m) => !m.remake)
  const wins = played.filter((m) => m.win).length

  return (
    <Section id="league" title="League">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
        <p>
          Last {data.matches.length} games as{' '}
          <a
            href={`https://www.op.gg/summoners/na/${encodeURIComponent(data.riotId.replace('#', '-'))}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white"
          >
            {data.riotId}
          </a>
        </p>
        {played.length > 0 && (
          <p className="tabular-nums">
            {wins}W {played.length - wins}L · {Math.round((wins / played.length) * 100)}% win rate
          </p>
        )}
      </div>

      <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {data.matches.map((m) => {
          const r = result(m)
          const kda = m.deaths ? ((m.kills + m.assists) / m.deaths).toFixed(1) : 'Perfect'
          return (
            <li key={m.id} className="relative flex items-center gap-4 py-3 pl-3">
              <span className={`absolute inset-y-3 left-0 w-1 rounded-full ${r.bar}`} aria-hidden="true" />
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/${data.ddragon}/img/champion/${m.champion}.png`}
                alt=""
                width="44"
                height="44"
                loading="lazy"
                onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                className="h-11 w-11 shrink-0 rounded-md bg-slate-200 dark:bg-slate-800"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {m.champion.replace(/([a-z])([A-Z])/g, '$1 $2')}
                  <span className={`ml-2 text-sm font-medium ${r.className}`}>{r.label}</span>
                </p>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                  {m.queue} · {clock(m.duration)} · {ago(m.endedAt)}
                </p>
              </div>
              <div className="text-right text-sm tabular-nums">
                <p className="font-medium text-slate-900 dark:text-white">
                  {m.kills} / <span className="text-rose-600 dark:text-rose-400">{m.deaths}</span> / {m.assists}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {kda} KDA · {m.cs} CS
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
        Updated {ago(data.fetchedAt)} via the Riot Games API.
      </p>
    </Section>
  )
}
