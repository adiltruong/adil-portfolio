import { profile } from '../data/content.js'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 py-8 dark:border-slate-800">
      <div className="mx-auto max-w-4xl px-4 text-sm text-slate-500 sm:px-6 dark:text-slate-500">
        © {new Date().getFullYear()} {profile.name}. Built with React, Vite and
        Tailwind.
      </div>
    </footer>
  )
}
