import Section from './Section.jsx'
import { projects } from '../data/content.js'

export default function Projects() {
  return (
    <Section id="projects" title="Projects">
      <div className="grid gap-5 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.title}
            className="flex flex-col rounded-xl border border-slate-200 p-5 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:hover:border-slate-700"
          >
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {project.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {project.description}
            </p>

            <ul className="mt-4 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                >
                  {tag}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex gap-4 text-sm">
              {project.repo && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
                >
                  Code
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
                >
                  Live demo
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
