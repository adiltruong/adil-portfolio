import { profile } from '../data/content.js'
import avatar from '../assets/avatar.jpg'
import ThemeToggle from './ThemeToggle.jsx'

const links = [
  { href: '#work', label: 'Work' },
  { href: '#projects', label: 'Projects' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-3">
          <a href="#top" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight whitespace-nowrap sm:gap-3">
            <img
              src={avatar}
              alt=""
              width="36"
              height="36"
              className="h-9 w-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            {profile.name}
          </a>
          <ThemeToggle />
        </div>
        <ul className="flex gap-3 text-sm sm:gap-6">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-slate-600 transition hover:text-court dark:text-slate-400 dark:hover:text-court-light"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
