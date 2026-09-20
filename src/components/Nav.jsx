import { profile } from '../data/content.js'

const links = [
  { href: '#projects', label: 'Projects' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
]

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#top" className="font-semibold tracking-tight">
          {profile.name}
        </a>
        <ul className="flex gap-4 text-sm sm:gap-6">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
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
