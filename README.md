# Artemis site (static)

Static Artemis website, served by **GitHub Pages** from the `main` branch of this
repo at https://artemisai-bycutlineindustries.studio (see `CNAME`). Merging to
`main` is what publishes it; there is no build step.

The chat workspace, sign-in/sign-up and account features call the Artemis
gateway at `api.artemisai-bycutlineindustries.studio` with credentialed CORS.

## Look: "Aurora" (Figma redesign v1, file rEnLGj5NHTFy6BjQNBzcAm)

| File | Role |
|---|---|
| `aurora-core.css` | Tokens, the four live palettes (Aurora, Nebula, Sunset, Dusk), aurora sky + starfield, gradient primitives, Pause-motion and reduced-motion rules |
| `aurora.css` | Homepage layout |
| `aurora-shell.css` | Restyle of the app pages (chat, products, account). Visual only |
| `aurora.js` | Palette cycle (12 s hold + 4 s crossfade, paused when the tab is hidden), footer palette picker, Pause motion, card pointer glow, section reveal, live status |

`liftoff.css` / `liftoff.js` are the previous homepage and are no longer loaded.
`/sign-in/`, `/sign-up/`, `/signin/`, `/signup/` and `/login/` redirect to `/account/`.

## Legal, SEO and security files

| File | Role |
|---|---|
| `privacy/`, `terms/` | Privacy Policy and Terms of Service (styled by `legal.css`). Items marked `[OWNER TO CONFIRM: …]` still need the owner's answer. |
| `robots.txt`, `sitemap.xml` | Crawl rules and the list of indexable pages. `/chat/` and `/account/` carry `noindex` instead of a robots block, so crawlers can read it. |
| `.well-known/security.txt` | Security contact (RFC 9116). Renew `Expires` before 2027-10-31. |
| `og-image.png` | 1200×630 link preview used by every page's Open Graph and Twitter tags. |
| `artemisai/` | Old copy of the app shell, now a redirect to `/chat/`. |

`node tests/status-card.test.cjs` checks the homepage status card renders from a `/api/status` payload.
