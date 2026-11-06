# Artemis site (static)

Static Artemis website, served by **GitHub Pages** from the `main` branch of this
repo at https://artemisai-bycutlineindustries.studio (see `CNAME`). Merging to
`main` is what publishes it; there is no build step.

The chat workspace, sign-in/sign-up and account features call the Artemis
gateway at `api.artemisai-bycutlineindustries.studio` with credentialed CORS.

## Look

One light token set (`tokens.css`): white page, near-black ink, faint borders, black pill actions. No palette switcher. UI type is [Google Sans Flex](https://fonts.google.com/specimen/Google+Sans+Flex) (SIL Open Font License) from Google Fonts, with the system UI as the fallback. Code uses the self-hosted JetBrains Mono file.

| File | Role |
|---|---|
| `tokens.css` | Shared tokens, type, buttons, focus, reduced motion |
| `home.css` | Homepage: nav, hero, chips, cards, wordmark |
| `app.css` | Chat, account, and products |
| `fx.js` | Particle field and the Artemis orb. Pauses off-screen, in background tabs, and under reduced motion. 30fps on phones |
| `voices.js` | Read-aloud. Browser `speechSynthesis` by default. ElevenLabs only through a configured server proxy (see `docs/tts-proxy.md`) |
| `aurora.js` | Mobile menu, pause-motion, scroll reveals, mode chips, live status |

`/sign-in/`, `/sign-up/`, `/signin/`, `/signup/` and `/login/` redirect to `/account/`.

Homepage copy is limited to behavior already described in this site. Plan names, prices, and a privacy policy or terms page are not in the repo; those gaps are marked on the page.
