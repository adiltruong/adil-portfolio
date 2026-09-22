import { useEffect, useState } from 'react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import PickleballPong from './components/PickleballPong.jsx'
import Projects from './components/Projects.jsx'
import About from './components/About.jsx'
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

  return (
    <div className="min-h-screen bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <Nav />
      <main>
        <Hero />
        {showGame && <PickleballPong />}
        <Projects />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
