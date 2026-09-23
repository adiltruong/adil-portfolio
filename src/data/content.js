// Everything you'll want to edit lives here. Components read from this file.

export const profile = {
  name: 'Adil Truong',
  role: 'AI Engineer',
  tagline:
    'I build with AI, backed by intensive evaluation work: writing rubrics, running evals, and setting baseline models so every improvement is measured, not guessed.',
  location: 'San Francisco',
  email: 'adiltruong75@gmail.com',
  resumeUrl: '', // e.g. '/resume.pdf' — drop the file in public/
}

export const socials = [
  { label: 'GitHub', url: 'https://github.com/adiltruong' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/adiltruong' },
  { label: 'Instagram', url: 'https://www.instagram.com/adiltruong' },
  { label: 'Email', url: 'mailto:adiltruong75@gmail.com' },
]

export const about = {
  paragraphs: [
    'Write two or three sentences about who you are and what kind of work you want to be doing. Keep it concrete — the tools you reach for, the problems you like solving.',
    'A second paragraph is a good place for background: what you studied, where you have worked, or what you are learning right now.',
  ],
  skills: [
    'JavaScript', 'TypeScript', 'React', 'Node.js',
    'Java', 'Python', 'SQL', 'Git', 'Docker', 'AWS',
  ],
}

// Shown in this order. role and dates are optional; they appear when filled in.
export const work = [
  { company: 'Mercor', url: 'https://mercor.com', role: 'AI Engineer', dates: '2025 – Present' },
  { company: 'Outlier AI', url: 'https://outlier.ai', role: 'AI Engineer', dates: '2023 – 2025' },
  { company: 'Ally Bank', url: 'https://ally.com', role: 'Software Engineer', dates: '2020 – 2023' },
]

// League of Legends match history section and nav link. Matches are still
// fetched in CI either way; flip to true to show them.
export const showLeague = false

export const projects = [
  {
    title: 'Project One',
    description:
      'One or two sentences on what it does and, more importantly, what was hard about building it.',
    tags: ['React', 'Node.js', 'PostgreSQL'],
    repo: 'https://github.com/adiltruong/project-one',
    demo: '',
  },
  {
    title: 'Project Two',
    description:
      'Swap in something you are proud of. Screenshots go in public/ and can be referenced as /shot.png.',
    tags: ['TypeScript', 'Vite'],
    repo: 'https://github.com/adiltruong/project-two',
    demo: '',
  },
  {
    title: 'Project Three',
    description:
      'Three is a good number for a portfolio. Delete this entry if you only have two worth showing.',
    tags: ['Python', 'FastAPI'],
    repo: 'https://github.com/adiltruong/project-three',
    demo: '',
  },
]
