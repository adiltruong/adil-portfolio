import Section from './Section.jsx'
import { about } from '../data/content.js'

export default function About() {
  return (
    <Section id="about" title="About">
      <div className="space-y-4 text-slate-600 dark:text-slate-400">
        {about.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)} className="leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      <h3 className="mt-8 text-sm font-medium text-slate-900 dark:text-white">
        Tools I work with
      </h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {about.skills.map((skill) => (
          <li
            key={skill}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400"
          >
            {skill}
          </li>
        ))}
      </ul>
    </Section>
  )
}
