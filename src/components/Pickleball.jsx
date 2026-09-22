import { useEffect, useState } from 'react'

// Corner-to-corner rally. Every shot crosses the net: two cross-court
// diagonals joined by two down-the-line shots, which traces an hourglass.
const CORNERS = [
  [60, 50],   // left side, top
  [420, 190], // right side, bottom (cross-court)
  [60, 190],  // left side, bottom (down the line)
  [420, 50],  // right side, top (cross-court)
]
const RALLY_PATH = `M ${CORNERS.map((p) => p.join(' ')).join(' L ')} Z`
const SHOT_SECONDS = 1.1
const RALLY_SECONDS = SHOT_SECONDS * CORNERS.length

// animateMotion keyPoints are fractions of path length, so work out where
// each corner falls; keyTimes then give every shot the same duration.
const segments = CORNERS.map((p, i) => {
  const q = CORNERS[(i + 1) % CORNERS.length]
  return Math.hypot(q[0] - p[0], q[1] - p[1])
})
const totalLength = segments.reduce((a, b) => a + b, 0)
const KEY_POINTS = segments
  .reduce((acc, len) => [...acc, acc.at(-1) + len / totalLength], [0])
  .map((n) => n.toFixed(4))
  .join(';')
const KEY_TIMES = CORNERS.map((_, i) => (i / CORNERS.length).toFixed(4)).concat('1').join(';')
// Fast off the paddle, slowing as it drops toward the corner.
const KEY_SPLINES = CORNERS.map(() => '0.25 0.1 0.5 1').join(';')
// Ball swells at the top of each arc to suggest height.
const BALL_SCALE = CORNERS.map(() => '1;1.4').concat('1').join(';')

function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e) => setReduced(e.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// Small optic-yellow ball with the classic hole pattern. Decorative only.
export function Ball({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <BallShape cx={12} cy={12} r={11} />
    </svg>
  )
}

const HOLES = [
  [0, -0.55], [0.52, -0.17], [0.32, 0.45], [-0.32, 0.45], [-0.52, -0.17], [0, 0],
]

function BallShape({ cx, cy, r }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="fill-ball stroke-ball-ink/40" strokeWidth={r * 0.06} />
      {HOLES.map(([dx, dy]) => (
        <circle
          key={`${dx},${dy}`}
          cx={cx + dx * r}
          cy={cy + dy * r}
          r={r * 0.13}
          className="fill-ball-ink/55"
        />
      ))}
    </g>
  )
}

// Top-down pickleball court (44 × 20 ft, drawn at 10 units per foot) with a
// ball rallying over the net.
export function Court({ className = '' }) {
  const reducedMotion = useReducedMotion()
  const line = 'stroke-white/90'
  return (
    <svg viewBox="0 0 480 240" role="img" aria-label="Pickleball court" className={className}>
      {/* surround */}
      <rect x="0" y="0" width="480" height="240" rx="18" className="fill-kitchen" />
      {/* playing surface */}
      <rect x="20" y="20" width="440" height="200" className="fill-court" />
      {/* kitchens: 7 ft either side of the net */}
      <rect x="170" y="20" width="140" height="200" className="fill-court-deep" />

      <g className={line} strokeWidth="3" fill="none">
        <rect x="20" y="20" width="440" height="200" />
        <line x1="170" y1="20" x2="170" y2="220" />
        <line x1="310" y1="20" x2="310" y2="220" />
        <line x1="20" y1="120" x2="170" y2="120" />
        <line x1="310" y1="120" x2="460" y2="120" />
      </g>

      {/* net */}
      <line x1="240" y1="10" x2="240" y2="230" className="stroke-white" strokeWidth="4" strokeDasharray="2 4" />
      <circle cx="240" cy="10" r="5" className="fill-white" />
      <circle cx="240" cy="230" r="5" className="fill-white" />

      {reducedMotion ? (
        <g transform={`translate(${CORNERS[0].join(' ')})`}>
          <BallShape cx={0} cy={0} r={13} />
        </g>
      ) : (
        <g>
          <animateMotion
            dur={`${RALLY_SECONDS}s`}
            repeatCount="indefinite"
            path={RALLY_PATH}
            keyPoints={KEY_POINTS}
            keyTimes={KEY_TIMES}
            calcMode="spline"
            keySplines={KEY_SPLINES}
          />
          <g>
            <animateTransform
              attributeName="transform"
              type="scale"
              values={BALL_SCALE}
              dur={`${RALLY_SECONDS}s`}
              repeatCount="indefinite"
            />
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="1.6s"
                repeatCount="indefinite"
              />
              <BallShape cx={0} cy={0} r={13} />
            </g>
          </g>
        </g>
      )}
    </svg>
  )
}
