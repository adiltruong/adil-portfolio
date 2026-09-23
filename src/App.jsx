import { useEffect, useState } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import PickleballPong from './components/PickleballPong.jsx'
import Work from './components/Work.jsx'
import Projects from './components/Projects.jsx'
import About from './components/About.jsx'
import WordRally from './components/WordRally.jsx'
import League from './components/League.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  // The game section stays hidden until someone clicks the hero court.
  const [showGame, setShowGame] = useState(() => window.location.hash === '#play')

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#play') setShowGame(true)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Written in CI by scripts/fetch-lol.mjs; the League section stays hidden when it's absent.
  const [league, setLeague] = useState(null)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}lol-matches.json`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.matches?.length && setLeague(data))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <Nav showLeague={!!league} />
      <main>
        <Hero />
        {showGame && <PickleballPong />}
        <Work />
        <Projects />
        <About />
        <WordRally />
        {league && <League data={league} />}
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
