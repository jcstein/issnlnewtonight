# is SNL new tonight?

A small static site that answers the question from the live [TVmaze](https://www.tvmaze.com/api) schedule, in the visitor's browser. No rebuilds, no API key.

Saturday Night Live airs Saturdays at 11:30 PM Eastern. The page decides "tonight" from that air date: the night rolls over at 6:00 AM ET, so Sunday at 1:00 AM (and a west-coast Saturday evening) still belongs to Saturday's show. A new episode whose air date matches that night is a yes. A Saturday inside the season with no new episode is a rerun or no show. A gap longer than six weeks is the off-season.

## Develop

```shell
npm test
npm run dev
```

Production build:

```shell
npm run build
```

That writes the same site to `dist/` and `public/`. There are no runtime dependencies. Node 22 runs the tests. The copy step is plain Node, so an older Pages image can still publish it.

## Cloudflare Pages

This stays on the existing Pages project (production branch `main`).

- Build command: `npm run build`
- Output directory: `public`
- Node.js: 22 when the project can set it (`.node-version` and `.nvmrc`)

`public` is the directory this Gatsby project already publishes, so that setting does not have to change. `dist/` is the same files if the output directory is switched later. The previous build command (`rm -rf node_modules && npm install --legacy-peer-deps --no-audit --no-fund && npm run build`) still ends in `npm run build` and works.

Preview and production environment variables are separate. Set `NODE_VERSION` to `22` on both if a build image is still pinned to an older Node.
