# adil-portfolio

Personal portfolio site — React 19, Vite 7, Tailwind CSS 4.

**Live:** https://adiltruong.github.io/adil-portfolio/

## Requirements

Node.js 20 or newer (Vite 7 and Tailwind 4 both require it). See `.nvmrc`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build    # production build into dist/
npm run preview  # serve the built dist/ locally
```

## Editing the content

Almost everything you'll want to change lives in **`src/data/content.js`** —
your name, tagline, socials, about text, skill list and the project cards.
The components read from that file, so you rarely need to touch JSX.

Images and a résumé PDF go in `public/` and are referenced from the root,
e.g. a file at `public/resume.pdf` becomes `/resume.pdf`.

## Layout

```
src/
  data/content.js     all editable copy
  components/         Nav, Hero, Projects, About, Contact, Footer, Section
  App.jsx             page composition
  index.css           Tailwind import + theme tokens
```

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
site and publishes it to GitHub Pages. Enable it once under
**Settings → Pages → Source → GitHub Actions**.

The Vite `base` is set to `/adil-portfolio/` in CI so asset URLs match the
Pages sub-path. If you move to a custom domain, change `base` to `/` in
`vite.config.js`.
