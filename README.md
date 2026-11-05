# Artemis site (static)

Static Artemis website, served by **GitHub Pages** from the `main` branch of this
repo at https://artemisai-bycutlineindustries.studio (see `CNAME`). Merging to
`main` is what publishes it; there is no build step.

The chat workspace, sign-in/sign-up and account features call the Artemis
gateway at `api.artemisai-bycutlineindustries.studio` with credentialed CORS.

## Look

One dark token set (`tokens.css`): ink `#07080D`, electric blue `#7C9CFF`, teal `#19D3C5`, magenta and lime as glow accents. One arc logo. No palette switcher.

| File | Role |
|---|---|
| `tokens.css` | Shared tokens, type, buttons, focus, reduced motion |
| `home.css` | Homepage chapters |
| `app.css` | Chat, account, and products |
| `fx.js` | One canvas: aurora field, living orb, typed headline. Pauses off-screen, in background tabs, and under reduced motion |
| `voices.js` | Read-aloud. Browser `speechSynthesis` by default. ElevenLabs only through a configured server proxy (see `docs/tts-proxy.md`) |
| `aurora.js` | Mobile menu, pause-motion, scroll reveals, live status |

`/sign-in/`, `/sign-up/`, `/signin/`, `/signup/` and `/login/` redirect to `/account/`.
