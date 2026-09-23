// Fetches recent League of Legends matches from the Riot API and writes a
// trimmed summary to public/lol-matches.json, which the League section reads.
//
// Runs in CI before the build (see .github/workflows/deploy.yml). The API key
// never reaches the browser — only the summary JSON is published.
//
// Env:
//   RIOT_API_KEY   required — from https://developer.riotgames.com
//   RIOT_ID        required — your Riot ID, e.g. "Adil#NA1"
//   RIOT_REGION    optional — regional route: americas | europe | asia | sea (default americas)
//   LOL_MATCH_COUNT optional — how many matches to keep (default 10, max 20)
//
// If the key or ID is missing, or Riot errors out, it logs a warning and exits
// 0 so a stale/expired key never breaks the deploy.

import { mkdir, writeFile } from 'node:fs/promises'

const OUT = new URL('../public/lol-matches.json', import.meta.url)

const { RIOT_API_KEY, RIOT_ID, RIOT_REGION = 'americas' } = process.env
const COUNT = Math.min(Number(process.env.LOL_MATCH_COUNT) || 10, 20)

const QUEUES = {
  400: 'Normal Draft',
  420: 'Ranked Solo/Duo',
  430: 'Normal Blind',
  440: 'Ranked Flex',
  450: 'ARAM',
  480: 'Swiftplay',
  490: 'Quickplay',
  700: 'Clash',
  900: 'URF',
  1700: 'Arena',
  1900: 'URF',
}

async function riot(path) {
  const res = await fetch(`https://${RIOT_REGION}.api.riotgames.com${path}`, {
    headers: { 'X-Riot-Token': RIOT_API_KEY },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`)
  return res.json()
}

async function main() {
  if (!RIOT_API_KEY || !RIOT_ID?.includes('#')) {
    console.warn('[lol] RIOT_API_KEY or RIOT_ID ("Name#TAG") not set — skipping match fetch.')
    return
  }

  const [gameName, tagLine] = RIOT_ID.split('#')
  const account = await riot(
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
  )
  const ids = await riot(`/lol/match/v5/matches/by-puuid/${account.puuid}/ids?start=0&count=${COUNT}`)

  // Sequential keeps us well inside the dev-key rate limit (20 req/s).
  const matches = []
  for (const id of ids) {
    const { info } = await riot(`/lol/match/v5/matches/${id}`)
    const me = info.participants.find((p) => p.puuid === account.puuid)
    if (!me) continue
    matches.push({
      id,
      queue: QUEUES[info.queueId] ?? info.gameMode,
      endedAt: info.gameEndTimestamp ?? info.gameStartTimestamp + info.gameDuration * 1000,
      duration: info.gameDuration,
      // Arena has no win/loss by team; placement 1–2 counts as a win.
      win: info.queueId === 1700 ? me.placement <= 2 : me.win,
      remake: me.gameEndedInEarlySurrender,
      champion: me.championName,
      kills: me.kills,
      deaths: me.deaths,
      assists: me.assists,
      cs: me.totalMinionsKilled + me.neutralMinionsKilled,
      position: me.teamPosition || null,
    })
  }

  // Champion icons come from Data Dragon, keyed by patch version.
  const [ddragon] = await fetch('https://ddragon.leagueoflegends.com/api/versions.json').then((r) => r.json())

  await mkdir(new URL('.', OUT), { recursive: true })
  await writeFile(
    OUT,
    JSON.stringify(
      { riotId: `${account.gameName}#${account.tagLine}`, ddragon, fetchedAt: Date.now(), matches },
      null,
      2,
    ),
  )
  console.log(`[lol] wrote ${matches.length} matches for ${account.gameName}#${account.tagLine}`)
}

main().catch((err) => {
  console.warn(`[lol] fetch failed, keeping site build going: ${err.message}`)
})
