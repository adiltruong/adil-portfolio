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

## Firebase features

The Pong leaderboard, Word Rally daily stats and leaderboard, and the live
"viewing now" count run on Firebase's free Spark plan. They stay hidden until
`src/firebase/config.js` is filled in, and the Firebase SDK only loads then.

### One-time setup

1. Create a project at https://console.firebase.google.com (Google Analytics
   isn't needed). Stay on the free **Spark** plan.
2. **Build → Authentication → Get started → Sign-in method → Anonymous →
   Enable.** Every visitor gets an anonymous ID that the rules key writes to.
3. **Build → Firestore Database → Create database** (production mode, any
   region). Open **Rules**, paste in `firestore.rules`, and **Publish**.
4. **Build → Realtime Database → Create database** (locked mode). Open
   **Rules**, paste in `database.rules.json`, and **Publish**.
5. **Project settings → General → Your apps → Web (`</>`)**: register an app
   (no Hosting needed) and copy the `firebaseConfig` values into
   `projectConfig` in `src/firebase/config.js`. Make sure it includes
   `databaseURL`.
6. **Authentication → Settings → Authorized domains**: add
   `adiltruong.github.io`.

The config values are public by design; the rules are what protect the data.
To remove a leaderboard entry, delete its document in the Firestore console.

### Working locally with emulators

```bash
npm run emulators       # local Auth, Firestore and Realtime Database (needs Java)
npm run dev:emulators   # the site, pointed at the emulators
npm run test:rules      # 36 checks that the rules allow players and block cheats
```

## Deploying

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
site and publishes it to GitHub Pages. Enable it once under
**Settings → Pages → Source → GitHub Actions**.

The Vite `base` is set to `/adil-portfolio/` in CI so asset URLs match the
Pages sub-path. If you move to a custom domain, change `base` to `/` in
`vite.config.js`.
