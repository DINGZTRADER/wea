<!--
Description: WEA Command System - AI Studio App
Author: Peter Wacha
Version: 1.0.0
-->

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# WEA Command System

An AI-assisted operations platform for WachaExperience-AI (U) Ltd. It manages clients, projects, expenses, invoices, payments, AI operations recommendations, and customer support chat.

View your app in AI Studio: <https://ai.studio/apps/drive/1xHdwbBb_IBSpRmEElGCRgeSKQfQ-uuQr>

## Run Locally

**Prerequisites:** Node.js 20.19+ recommended.

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set:
   - `GEMINI_API_KEY`
   - `SESSION_SECRET`
   - `DATABASE_URL` only when using PostgreSQL
3. Run the API and frontend together:
   `npm run dev`

The frontend runs on <http://localhost:3000>. The secure API runs on <http://localhost:4000>.

On first launch, the app asks you to create the owner account. The local development database is stored in `data/wea.local.json`.

## Production Deployment

1. Set a strong `SESSION_SECRET` with at least 32 random characters.
2. Set `GEMINI_API_KEY` only on the server or hosting provider. Do not expose it as a public frontend variable.
3. Set `DATABASE_URL` to a managed PostgreSQL database.
4. Run `npm run build`.
5. Run `npm start` to serve the built React app and API from one Node process.

The server uses HttpOnly session cookies, CSRF protection for write requests, password hashing via Node `scrypt`, tenant-scoped data access, and backend-only Gemini calls.

## Quality Checks

- `npm test`
- `npm run build`

## Security Notes

The previous prototype called Gemini from browser code. This version routes all AI calls through `/api/ai/*`, so API keys remain server-side. Rotate any Gemini key that may have been used in a publicly served frontend build before this change.
