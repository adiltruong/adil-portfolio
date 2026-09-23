// Stylised Golden Gate Bridge, drawn as a decorative hero backdrop: daytime
// in light mode, dusk in dark mode.
// Everything is laid out on a 1200 × 400 canvas and anchored to the bottom.

const ORANGE = '#c0362c' // the bridge's "International Orange"
const DECK_Y = 268
const WATER_Y = 330
const TOWER_TOP = 92
const TOWERS = [380, 820]
const ANCHORS = [60, 1140]

// Main span: parabola from tower top to tower top, lowest just above the deck.
const MAIN_SAG_Y = 252
const mainCableY = (x) => {
  const half = (TOWERS[1] - TOWERS[0]) / 2
  const mid = TOWERS[0] + half
  return MAIN_SAG_Y - (MAIN_SAG_Y - TOWER_TOP) * ((x - mid) / half) ** 2
}

// Side spans: straight run from anchorage to tower top with a gentle sag.
const sideCableY = (x, from, to) => {
  const t = (x - from) / (to - from)
  const y0 = DECK_Y - 4
  const straight = y0 + (TOWER_TOP - y0) * (from < to ? t : 1 - t)
  return straight + 38 * t * (1 - t)
}

function cableAt(x) {
  if (x <= TOWERS[0]) return sideCableY(x, ANCHORS[0], TOWERS[0])
  if (x >= TOWERS[1]) return sideCableY(x, TOWERS[1], ANCHORS[1])
  return mainCableY(x)
}

function cablePath() {
  const pts = []
  for (let x = ANCHORS[0]; x <= ANCHORS[1]; x += 4) pts.push(`${x},${cableAt(x).toFixed(1)}`)
  return `M ${pts.join(' L ')}`
}

const SUSPENDERS = []
for (let x = ANCHORS[0] + 16; x < ANCHORS[1]; x += 16) {
  if (TOWERS.some((t) => Math.abs(x - t) < 20)) continue
  SUSPENDERS.push(x)
}

function Tower({ x }) {
  const legs = [x - 20, x + 10]
  const bottom = WATER_Y + 8
  // Portal struts get closer together toward the top, like the real towers.
  const struts = [112, 146, 184, 226]
  return (
    <g fill={ORANGE}>
      {legs.map((lx) => (
        <g key={lx}>
          <rect x={lx} y={TOWER_TOP} width="10" height={bottom - TOWER_TOP} />
          <rect x={lx - 2} y={TOWER_TOP + 70} width="14" height={bottom - TOWER_TOP - 70} />
          <rect x={lx - 4} y={TOWER_TOP + 150} width="18" height={bottom - TOWER_TOP - 150} />
        </g>
      ))}
      {struts.map((y) => (
        <rect key={y} x={x - 20} y={y} width="40" height="6" />
      ))}
      <rect x={x - 22} y={TOWER_TOP - 6} width="44" height="8" />
      {/* pier */}
      <rect x={x - 32} y={WATER_Y - 4} width="64" height="14" fill="#3b1512" />
    </g>
  )
}

export default function GoldenGate({ className = '' }) {
  return (
    <svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="gg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#020618" stopOpacity="0" />
          <stop offset="0.6" stopColor="#3a1830" stopOpacity="0.55" />
          <stop offset="0.82" stopColor="#c0562c" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="gg-sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#fde2cf" stopOpacity="0.6" />
          <stop offset="0.9" stopColor="#f8b99a" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="gg-water-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bcd3ea" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="gg-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b1733" />
          <stop offset="1" stopColor="#020618" />
        </linearGradient>
        <filter id="gg-fog" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      {/* sky: day palette in light mode, dusk in dark mode */}
      <rect width="1200" height={WATER_Y} fill="url(#gg-sky-day)" className="dark:hidden" />
      <rect width="1200" height={WATER_Y} fill="url(#gg-sky)" className="hidden dark:block" />

      {/* headlands */}
      <path d="M0 250 C 90 190 170 200 250 262 L 300 330 L 0 330 Z" className="fill-slate-300 dark:fill-[#0c1326]" />
      <path d="M1200 230 C 1100 170 1010 205 940 268 L 900 330 L 1200 330 Z" className="fill-slate-300 dark:fill-[#0c1326]" />
      <path d="M0 290 C 120 262 200 280 330 330 L 0 330 Z" className="fill-slate-400/70 dark:fill-[#070d1d]" />
      <path d="M1200 280 C 1080 258 990 280 880 330 L 1200 330 Z" className="fill-slate-400/70 dark:fill-[#070d1d]" />

      {/* water */}
      <rect y={WATER_Y} width="1200" height={400 - WATER_Y} fill="url(#gg-water-day)" className="dark:hidden" />
      <rect y={WATER_Y} width="1200" height={400 - WATER_Y} fill="url(#gg-water)" className="hidden dark:block" />
      <g stroke={ORANGE} strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round">
        {TOWERS.map((x) => (
          <g key={x}>
            <line x1={x - 24} y1={WATER_Y + 22} x2={x + 20} y2={WATER_Y + 22} />
            <line x1={x - 14} y1={WATER_Y + 36} x2={x + 12} y2={WATER_Y + 36} />
            <line x1={x - 8} y1={WATER_Y + 50} x2={x + 6} y2={WATER_Y + 50} />
          </g>
        ))}
      </g>

      {/* suspenders */}
      <g stroke={ORANGE} strokeWidth="1.2" strokeOpacity="0.7">
        {SUSPENDERS.map((x) => (
          <line key={x} x1={x} y1={cableAt(x)} x2={x} y2={DECK_Y} />
        ))}
      </g>

      {TOWERS.map((x) => (
        <Tower key={x} x={x} />
      ))}

      {/* main cable */}
      <path d={cablePath()} fill="none" stroke={ORANGE} strokeWidth="4" />

      {/* deck and truss */}
      <rect x="0" y={DECK_Y} width="1200" height="7" fill={ORANGE} />
      <rect x="0" y={DECK_Y + 7} width="1200" height="7" fill="#8f2820" />
      <g stroke="#8f2820" strokeWidth="1.5">
        {Array.from({ length: 75 }, (_, i) => (
          <line key={i} x1={i * 16} y1={DECK_Y + 7} x2={i * 16 + 16} y2={DECK_Y + 14} />
        ))}
      </g>

      {/* fog rolling in under the deck */}
      <g fill="#ffffff" filter="url(#gg-fog)">
        <ellipse cx="170" cy="300" rx="220" ry="26" opacity="0.08" />
        <ellipse cx="620" cy="312" rx="260" ry="22" opacity="0.06" />
        <ellipse cx="1060" cy="296" rx="220" ry="28" opacity="0.08" />
      </g>
    </svg>
  )
}
