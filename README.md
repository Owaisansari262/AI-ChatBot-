# AI Chatbot — Internship Task

A simple, clean chatbot that connects to Google's **Gemini API**. Built with a React (Vite + Tailwind) frontend and a Node.js/Express backend that keeps the API key secure and streams responses to the UI.

## Features

- Clean, responsive chat UI (desktop + mobile)
- Separate styling for user vs. bot messages
- Streaming AI responses (text appears as it's generated, like ChatGPT)
- Typing indicator while waiting for the first chunk
- Markdown & code block formatting in bot responses
- Suggested question chips on the empty state
- Dark / light mode toggle
- Chat history kept for the current browser session (sessionStorage)
- Clear Chat button
- Friendly error handling for network issues, missing/invalid API key, and rate limits

## Project structure

```
chatbot-project/
├── backend/          Express server — proxies requests to Gemini, keeps the API key server-side
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/          React + Vite + Tailwind chat UI
    ├── src/
    │   ├── App.jsx
    │   └── components/
    └── package.json
```

## 1. Get a free Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **Create API key** and copy it

## 2. Run the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and paste your key:

```
GEMINI_API_KEY=your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=5000
```

Start the server:

```bash
npm start
```

You should see `Server running at http://localhost:5000`.

## 3. Run the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The frontend automatically proxies `/api` calls to the backend during development (see `vite.config.js`), so no extra configuration is needed.

## 4. Build for production

```bash
cd frontend
npm run build
npm run preview   # serves the production build locally to double-check it
```

## How it works (brief)

- The frontend sends the full message history to `POST /api/chat` on the backend.
- The backend forwards it to Gemini's `streamGenerateContent` endpoint and re-streams the text back to the browser chunk by chunk, so the API key never reaches the client.
- The frontend reads the stream and appends each chunk to the current bot message, creating the typewriter effect.
- Messages and the chosen theme are saved to `sessionStorage`, so they survive a page refresh but clear when the tab is closed — matching the "store messages during the current session" requirement.

## Notes on the free Gemini tier

The free tier has modest rate limits (roughly 10–15 requests/minute and a daily cap). That's more than enough for demoing/testing this chatbot. If you see a "rate limit reached" error, just wait a few seconds and try again.
