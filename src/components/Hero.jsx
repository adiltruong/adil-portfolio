import { profile, socials } from '../data/content.js'

export default function Hero() {
  return (
    <section id="top" className="mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28">
      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
        {profile.role}
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
        {profile.name}
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
        {profile.tagline}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <a
          href="#projects"
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          See my work
        </a>
        {profile.resumeUrl && (
          <a
            href={profile.resumeUrl}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium transition hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
          >
            Résumé
          </a>
        )}
      </div>

      <ul className="mt-8 flex flex-wrap gap-5 text-sm">
        {socials.map((social) => (
          <li key={social.label}>
            <a
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 underline-offset-4 transition hover:text-blue-600 hover:underline dark:text-slate-400 dark:hover:text-blue-400"
            >
              {social.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
