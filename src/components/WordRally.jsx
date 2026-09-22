import { useCallback, useEffect, useRef, useState } from 'react'
import Section from './Section.jsx'
import { WORDS } from '../data/words.js'

const WORD_LENGTH = 5
const MAX_GUESSES = 6
const KEY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']

// hit: right letter, right spot. near: in the word, wrong spot. miss: not in it.
const RANK = { miss: 1, near: 2, hit: 3 }

const TILE_STYLES = {
  hit: 'border-green-300 bg-green-300 text-slate-900',
  near: 'border-ball bg-ball text-slate-900',
  miss: 'border-slate-300 bg-slate-300 text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

const KEY_STYLES = {
  hit: 'bg-green-300 text-slate-900',
  near: 'bg-ball text-slate-900',
  miss: 'bg-slate-300 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  none: 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
}

const LABELS = { hit: 'correct', near: 'in the word, wrong spot', miss: 'not in the word' }

function pickWord(previous) {
  let word
  do word = WORDS[Math.floor(Math.random() * WORDS.length)]
  while (word === previous && WORDS.length > 1)
  return word
}

// Two passes so repeated letters are marked like Wordle: exact matches claim
// their letter first, then leftovers are handed out left to right.
function scoreGuess(guess, answer) {
  const result = Array(WORD_LENGTH).fill('miss')
  const remaining = {}
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) result[i] = 'hit'
    else remaining[answer[i]] = (remaining[answer[i]] || 0) + 1
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] !== 'hit' && remaining[guess[i]] > 0) {
      result[i] = 'near'
      remaining[guess[i]] -= 1
    }
  }
  return result
}

// Typing into these belongs to them, not the game (the Pong canvas included).
const TEXT_TARGETS = ['INPUT', 'TEXTAREA', 'SELECT', 'CANVAS']
// A focused link or button should still activate on Enter.
const ENTER_TARGETS = ['A', 'BUTTON']

function keyBelongsTo(el, key) {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable || TEXT_TARGETS.includes(el.tagName)) return true
  return key === 'ENTER' && ENTER_TARGETS.includes(el.tagName)
}

export default function WordRally() {
  const sectionRef = useRef(null)
  const [answer, setAnswer] = useState(() => pickWord())
  const [guesses, setGuesses] = useState([]) // [{ word, result }]
  const [current, setCurrent] = useState('')
  const [message, setMessage] = useState('')
  const [shake, setShake] = useState(false)
  const [inView, setInView] = useState(false)
  const [dictionary, setDictionary] = useState(null)

  const won = guesses.at(-1)?.word === answer
  const over = won || guesses.length === MAX_GUESSES

  const keyStatus = {}
  for (const { word, result } of guesses) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const prev = keyStatus[word[i]]
      if (!prev || RANK[result[i]] > RANK[prev]) keyStatus[word[i]] = result[i]
    }
  }

  const reject = (text) => {
    setMessage(text)
    setShake(true)
  }

  const handleKey = useCallback(
    (key) => {
      if (over) return
      if (key === 'ENTER') {
        if (current.length < WORD_LENGTH) return reject('Not enough letters')
        if (!dictionary) return setMessage('One sec, loading the word list…')
        if (!dictionary.has(current)) return reject('Not in word list')
        const next = [...guesses, { word: current, result: scoreGuess(current, answer) }]
        setGuesses(next)
        setCurrent('')
        if (current === answer) {
          setMessage(next.length === 1 ? 'First try. Ace!' : `Got it in ${next.length}!`)
        } else if (next.length === MAX_GUESSES) {
          setMessage(`The word was ${answer}.`)
        } else {
          setMessage('')
        }
      } else if (key === 'BACKSPACE') {
        setCurrent((c) => c.slice(0, -1))
        setMessage('')
      } else if (/^[A-Z]$/.test(key) && current.length < WORD_LENGTH) {
        setCurrent((c) => c + key)
        setMessage('')
      }
    },
    [answer, current, dictionary, guesses, over],
  )

  // Only listen to the physical keyboard while the game is on screen.
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    })
    io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [])

  // The dictionary is ~75 KB, so fetch it only once the game is on screen.
  useEffect(() => {
    if (!inView || dictionary) return
    import('../data/validWords.js').then(({ default: list }) => {
      setDictionary(new Set([...list.toUpperCase().split(' '), ...WORDS]))
    })
  }, [inView, dictionary])

  useEffect(() => {
    if (!inView) return
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key.toUpperCase()
      if (keyBelongsTo(e.target, key)) return
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        e.preventDefault()
        handleKey(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inView, handleKey])

  const newWord = () => {
    setAnswer((a) => pickWord(a))
    setGuesses([])
    setCurrent('')
    setMessage('')
  }

  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    if (i < guesses.length) return guesses[i]
    if (i === guesses.length && !over) return { word: current, result: null, active: true }
    return { word: '', result: null }
  })

  return (
    <Section id="word-rally" title="Word Rally">
      <div ref={sectionRef}>
        <p className="max-w-2xl leading-relaxed text-slate-600 dark:text-slate-400">
          Guess the five-letter word in six tries. Type or tap the keys below.{' '}
          <span className="rounded bg-green-300 px-1 font-medium text-slate-900">Light green</span>{' '}
          means the right letter in the right spot;{' '}
          <span className="rounded bg-ball px-1 font-medium text-slate-900">yellow</span>{' '}
          means it's in the word but somewhere else.
        </p>

        <div className="mt-8 flex flex-col items-center">
          <div className="grid gap-1.5" role="grid" aria-label="Guesses">
            {rows.map((row, r) => (
              <div
                key={r}
                role="row"
                className={`grid grid-cols-5 gap-1.5 ${row.active && shake ? 'animate-[shake_0.35s_ease-in-out]' : ''}`}
                onAnimationEnd={() => setShake(false)}
              >
                {Array.from({ length: WORD_LENGTH }, (_, c) => {
                  const letter = row.word[c] ?? ''
                  const status = row.result?.[c]
                  const style = status
                    ? TILE_STYLES[status]
                    : letter
                      ? 'border-slate-500 text-slate-900 dark:border-slate-400 dark:text-white'
                      : 'border-slate-300 dark:border-slate-700'
                  return (
                    <div
                      key={c}
                      role="gridcell"
                      aria-label={letter ? `${letter}${status ? `, ${LABELS[status]}` : ''}` : 'empty'}
                      className={`flex h-12 w-12 items-center justify-center rounded-md border-2 text-xl font-bold uppercase transition-colors duration-300 sm:h-14 sm:w-14 sm:text-2xl ${style}`}
                      style={status ? { transitionDelay: `${c * 90}ms` } : undefined}
                    >
                      {letter}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          <p className="mt-4 h-6 text-sm font-medium text-slate-700 dark:text-slate-300" aria-live="polite">
            {message}
          </p>

          {over ? (
            <button
              type="button"
              onClick={newWord}
              className="mt-2 rounded-lg bg-court px-5 py-2.5 text-sm font-medium text-white transition hover:bg-court-deep dark:bg-ball dark:text-slate-900 dark:hover:bg-ball/85"
            >
              New word
            </button>
          ) : (
            <div className="mt-2 w-full max-w-lg space-y-1.5" aria-label="Keyboard">
              {KEY_ROWS.map((row, i) => (
                <div key={row} className="flex justify-center gap-1.5">
                  {i === 2 && <Key label="Enter" wide onPress={() => handleKey('ENTER')} />}
                  {[...row].map((k) => (
                    <Key
                      key={k}
                      label={k}
                      status={keyStatus[k]}
                      onPress={() => handleKey(k)}
                    />
                  ))}
                  {i === 2 && <Key label="⌫" ariaLabel="Backspace" wide onPress={() => handleKey('BACKSPACE')} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Section>
  )
}

function Key({ label, ariaLabel, status, wide, onPress }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? (status ? `${label}, ${LABELS[status]}` : label)}
      // Keep focus off the key so a later physical Enter submits the guess
      // instead of re-pressing this button.
      onPointerDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={`h-12 rounded-md text-sm font-semibold transition-colors ${wide ? 'flex-[1.6] text-xs' : 'flex-1'} min-w-0 ${KEY_STYLES[status ?? 'none']}`}
    >
      {label}
    </button>
  )
}
