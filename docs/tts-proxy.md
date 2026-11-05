# ElevenLabs voice proxy

The site never calls ElevenLabs and never sees an API key. Browser `speechSynthesis` is the default and the fallback. ElevenLabs is used only when a proxy on the existing API is configured.

Set one of these in the page (do not commit a secret with it):

- `window.ARTEMIS_TTS_ENDPOINT = "https://api.artemisai-bycutlineindustries.studio/api/tts"` before `voices.js` loads, or
- `<meta name="artemis-tts-endpoint" content="https://api.artemisai-bycutlineindustries.studio/api/tts">`

If neither is set, or the proxy errors, the voice picker lists this browser's voices and read-aloud stays on `speechSynthesis`.

The key lives only on the API server, in the env var `ELEVENLABS_API_KEY`.

## GET `{endpoint}/voices`

The proxy calls `GET https://api.elevenlabs.io/v1/voices` with header `xi-api-key: $ELEVENLABS_API_KEY`.

It returns JSON to the browser:

```json
{ "voices": [ { "voice_id": "21m00Tcm4TlvDq8ikWAM", "name": "Rachel" } ] }
```

The client lists those voices. It does not send the ElevenLabs key.

## POST `{endpoint}`

Request JSON:

```json
{ "text": "Hi, I am Artemis.", "voice_id": "21m00Tcm4TlvDq8ikWAM" }
```

The proxy calls `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128` with the same `xi-api-key` header and a JSON body `{ "text": "...", "model_id": "eleven_flash_v2_5" }` (or another model you choose).

Response to the browser: `Content-Type: audio/mpeg` (or `audio/wav`) and the audio bytes. The client decodes that with Web Audio and drives the chat orb from an `AnalyserNode` on the real samples.

## Auth, rate limit, CORS

- Require a logged-in Artemis session, the same cookie as `/api/conversations`. Anonymous requests should be `401`.
- Rate-limit per account (for example a small number of clips per hour and a max character count) so a public page cannot spend the ElevenLabs balance.
- Cap `text` length on the server. The client also slices text to 4500 characters.
- Do not log `ELEVENLABS_API_KEY`. Read it only from that env var.
- CORS must allow this site's origin with credentials. The client uses `credentials: 'include'`.

This repository does not deploy the proxy, change DNS, or change the API server.
