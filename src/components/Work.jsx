import Section from './Section.jsx'
import { work } from '../data/content.js'

const domain = (url) => new URL(url).hostname.replace(/^www\./, '')

export default function Work() {
  return (
    <Section id="work" title="Work">
      <ul className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {work.map((job) => (
          <li key={job.company}>
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
            >
              <div>
                <h3 className="font-semibold text-slate-900 transition group-hover:text-court dark:text-white dark:group-hover:text-court-light">
                  {job.company}
                </h3>
                {job.role && (
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{job.role}</p>
                )}
              </div>
              <div className="flex items-baseline gap-4 text-sm text-slate-500 dark:text-slate-400">
                {job.dates && <span className="tabular-nums">{job.dates}</span>}
                <span className="underline-offset-4 group-hover:underline">
                  {domain(job.url)} ↗
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}
