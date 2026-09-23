import { profile, socials } from '../data/content.js'
import { Court } from './Pickleball.jsx'
import GoldenGate from './GoldenGate.jsx'

export default function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <GoldenGate className="absolute inset-x-0 bottom-0 -z-20 aspect-[3/1] min-h-72 w-full opacity-45 dark:opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_80%,transparent)]" />
      {/* keep the intro text readable over the bridge */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-white/85 via-white/40 to-transparent dark:from-slate-950/80 dark:via-slate-950/30" />

      <div className="mx-auto grid max-w-4xl items-center gap-12 px-4 pt-20 pb-40 sm:px-6 sm:pt-28 sm:pb-56 md:grid-cols-[1fr_18rem]">
        <div>
          <p className="text-sm font-medium text-court dark:text-court-light">
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
              className="rounded-lg bg-court px-5 py-2.5 text-sm font-medium text-white transition hover:bg-court-deep dark:bg-ball dark:text-slate-900 dark:hover:bg-ball/85"
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
                  className="text-slate-500 underline-offset-4 transition hover:text-court hover:underline dark:text-slate-400 dark:hover:text-court-light"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <a
          href="#play"
          aria-label="Play Pickleball Pong"
          className="group relative block w-full max-w-sm rounded-[18px] outline-none focus-visible:ring-4 focus-visible:ring-ball/60 md:max-w-none"
        >
          <Court className="w-full drop-shadow-md transition duration-300 group-hover:-translate-y-1 group-hover:drop-shadow-xl" />
          <span className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-ball px-3 py-1 text-xs font-semibold whitespace-nowrap text-slate-900 shadow transition md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
            Click to play
          </span>
        </a>
      </div>
    </section>
  )
}
