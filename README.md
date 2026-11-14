# SafalPath

SafalPath is a MERN career practice app for resume feedback, adaptive mock interviews, coding challenges, and daily/weekly preparation goals. Its shared book-and-pen wordmark appears in the landing page, sign-in screens, and sidebar.

## Run locally

1. Install dependencies in `backend` and `frontend` with `npm install`.
2. Copy `backend/.env.example` to `backend/.env`. Set `MONGO_URI`, a long `JWT_SECRET`, and `GEMINI_API_KEY`. `GEMINI_MODEL` can be changed to a model available to your Gemini account.
3. Start the API with `cd backend && npm run dev`.
4. In another terminal, start the app with `cd frontend && npm run dev`.
5. Open the Vite URL printed in the terminal. Camera and microphone controls require browser permission and a secure context (localhost is supported).

Without a backend connection, the app opens an interactive local demo: account progress and XP are stored in this browser, JavaScript can run in a short-lived browser worker, and the other screens use clearly labeled preview responses. These preview responses are not live AI. Configure the backend below for actual Gemini responses and multi-language code execution.

In local demo mode, Aria still runs a complete five-question practice round with random, role-specific questions, resume-aware prompts, voice playback, answer scoring, and feedback. Question banks include software, data, sales, marketing, HR, customer support, education, healthcare, finance, and operations roles. The resume builder, job-board links, company-style DSA recommendations, avatar choices, badges, and daily spin remain interactive. Live Gemini is used when configured; otherwise the app labels and uses its local practice mode.

The connected code runner uses the Piston execution service and checks the displayed sample output. It does not run hidden test cases yet. Resume analysis accepts pasted text or text-based PDF files up to 5 MB; it flags issues and produces a corrected ATS-friendly draft without inventing experience. Scanned PDFs need OCR before analysis. Use Resume Builder to edit, print/save as PDF, or download a text copy, and Job Boards to search external sites. The interview camera preview stays in the browser; it is not uploaded. Speech input depends on browser speech-recognition support, while Aria's spoken prompts use the browser speech engine.

`GET /api/health` reports database connectivity and whether the Gemini key is configured. Daily spin rewards and weekly challenge XP are awarded once per day/week in the backend.

## AI configuration

AI routes return a clear setup error when `GEMINI_API_KEY` is missing. Code execution remains available without the AI key; complexity coaching is optional. Keep `.env` files private and never commit API keys.
