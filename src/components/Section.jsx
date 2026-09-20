export default function Section({ id, title, children }) {
  return (
    <section
      id={id}
      className="border-t border-slate-200 py-16 sm:py-20 dark:border-slate-800"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}
