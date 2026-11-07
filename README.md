# Friendly AI

Friendly AI is a responsive learning and productivity workspace with an optional Groq-powered chat backend. The existing React + Vite starter has been extended with study, math, science, translation, writing, coding, document-text, and image tools. Unconfigured services are clearly identified rather than simulated.

## Run locally

Requirements: Node.js 20 or newer and npm.

```sh
npm install
cp .env.example .env
npm run dev
```

The Vite frontend is available at the URL printed in your terminal. API routes run as Netlify Functions, so use the Netlify CLI for a fully integrated local setup:

```sh
npm install --save-dev netlify-cli
npx netlify dev
```

Set `GROQ_API_KEY` in `.env` or your Netlify environment settings for real AI chat. The browser never receives the key. Optional `GROQ_API_URL` and `GROQ_MODEL` support OpenAI-compatible chat-completion providers.

## Deploy to Netlify

Connect this repository to Netlify. The checked-in `netlify.toml` sets `npm run build`, `dist`, and the serverless function directory. Add `GROQ_API_KEY` in **Site configuration → Environment variables**, then redeploy. Never put secrets in `VITE_*` variables, commit `.env`, or expose keys in frontend code.

The optional image function expects `IMAGE_API_URL` and `IMAGE_API_KEY` on the server. It sends `{ "prompt": "..." }` and expects a JSON response with an HTTPS `imageUrl`, `image_url`, `url`, or `data[0].url`. Most providers have different request/response formats; adapt the server-side function for your chosen provider. Image generation remains unavailable until configured.

## What's implemented and what's not

- **Implemented:** responsive PWA shell, light/dark theme, local conversation list, clear/delete chat, assistant copy, stop request, study/class/board/language context, focused tutor prompts, and server-side Groq-compatible chat API with validation, response limits, and timeout.
- **Implemented with limits:** text/Markdown/CSV document context is read locally in the browser (2 MB upload limit); the browser keeps conversation history in local storage on this device.
- **Not configured:** streaming (the API returns complete responses), account/authentication, server-synced user history, password recovery, PDF parsing, real live web search and citations, premium/subscriptions/payments, admin dashboards, provider-backed image generation, usage analytics, and server-side distributed rate limiting. These require additional provider, database, identity, and operational configuration; the UI does not claim they are active.
- **Security note:** the function enforces request-size/content checks and a provider timeout. Production public deployments should add a persistent per-user/IP rate limiter and authentication before offering unrestricted API access. Local browser storage is not an account or cloud backup.

## Environment variables

See `.env.example` for placeholders. Configure secrets in Netlify settings, not Vite-prefixed client variables. `GROQ_API_KEY` is required for chat. `IMAGE_API_URL` and `IMAGE_API_KEY` are optional.

## Checks

Run `npm run build` to create the production bundle. The GitHub file-editing environment does not execute this build or deploy the Netlify functions; verify both in CI/Netlify after configuring environment variables.
