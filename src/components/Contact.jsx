import Section from './Section.jsx'
import { profile, socials } from '../data/content.js'

export default function Contact() {
  return (
    <Section id="contact" title="Get in touch">
      <p className="max-w-2xl leading-relaxed text-slate-600 dark:text-slate-400">
        I'm open to new opportunities and interesting problems. The fastest way
        to reach me is email.
      </p>

      <a
        href={`mailto:${profile.email}`}
        className="mt-6 inline-block rounded-lg bg-court px-5 py-2.5 text-sm font-medium text-white transition hover:bg-court-deep dark:bg-ball dark:text-slate-900 dark:hover:bg-ball/85"
      >
        {profile.email}
      </a>

      <ul className="mt-6 flex flex-wrap gap-5 text-sm">
        {socials
          .filter((social) => social.label !== 'Email')
          .map((social) => (
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
    </Section>
  )
}
