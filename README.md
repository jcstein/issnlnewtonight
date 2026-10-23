# is SNL new tonight?

A small static site that answers the question from the live [TVmaze](https://www.tvmaze.com/api) schedule, in the visitor's browser. No rebuilds, no API key.

Saturday Night Live airs Saturdays at 11:30 PM Eastern. The page decides "tonight" from that air date: the night rolls over at 6:00 AM ET, so Sunday at 1:00 AM (and a west-coast Saturday evening) still belongs to Saturday's show. A new episode whose air date matches that night is a yes. A Saturday inside the season with no new episode is a rerun or no show. A gap longer than six weeks is the off-season.

## Develop

```shell
npm install
npm test
npm run dev
```

Production build:

```shell
npm run build
```

The site is static files in `dist/`. Node 22.

## Cloudflare Pages

This stays on the existing Pages project (`main`).

- Build command: `npm run build`
- Output directory: `dist`
- Node.js: 22 (`.node-version`)

Pages installs dependencies before the build command. The previous command (`rm -rf node_modules && npm install --legacy-peer-deps --no-audit --no-fund && npm run build`) was there because `node_modules` used to be committed, and Gatsby wrote to `public/`. That output directory has to change to `dist`, or the deploy publishes an empty folder.
