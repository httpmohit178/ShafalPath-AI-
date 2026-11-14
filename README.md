# SafalPath

SafalPath is a MERN career practice app for resume feedback, adaptive mock interviews, coding challenges, and daily/weekly preparation goals. Its shared book-and-pen wordmark appears in the landing page, sign-in screens, and sidebar.

## Run locally

1. Install dependencies in `backend` and `frontend` with `npm install`.
2. Copy `backend/.env.example` to `backend/.env`. Set `MONGO_URI`, a long `JWT_SECRET`, and your private `GROQ_API_KEY`. `GROQ_MODEL` can be changed to a model available to your Groq account.
3. Start the API with `cd backend && npm run dev`.
4. In another terminal, start the app with `cd frontend && npm run dev`.
5. Open the Vite URL printed in the terminal. Camera and microphone controls require browser permission and a secure context (localhost is supported).

Without a backend connection, the app opens an interactive local demo: account progress and XP are stored in this browser, JavaScript can run in a short-lived browser worker, and the other screens use clearly labeled preview responses. These preview responses are not live AI. Configure the backend below for Groq responses and multi-language code execution.

Aria runs a five-question practice round with role-specific questions, resume-aware prompts, voice playback, answer scoring, and feedback. If Groq is unavailable, the backend and browser UI fall back to local question banks and transparent heuristic feedback. Margdarshak also provides local guidance for common resume, interview, DSA, and planning questions. Live Groq responses are used when configured.

All workspace routes require a registered account and a valid server session. The backend must be available for sign-up and sign-in; the app does not create a demo account when authentication fails. Use Log out in the top bar to end the local session. Aria reads questions aloud, and the microphone button uses the browser's speech-recognition service to transcribe your answer into the interview form for you to review before sending.

The connected code runner uses the Piston execution service and checks the displayed sample output. It does not run hidden test cases yet. Resume analysis accepts pasted text or text-based PDF files up to 5 MB; it flags issues and produces a corrected ATS-friendly draft without inventing experience. Scanned PDFs need OCR before analysis. Use Resume Builder to edit, print/save as PDF, or download a text copy, and Job Boards to search external sites. The interview camera preview stays in the browser; it is not uploaded. Speech input depends on browser speech-recognition support, while Aria's spoken prompts use the browser speech engine.

`GET /api/health` reports database connectivity and whether a Groq key is configured. Daily spin rewards and weekly challenge XP are awarded once per day/week in the backend.

## AI configuration

Aria and Margdarshak continue with local guidance when `GROQ_API_KEY` is missing or temporarily unavailable. Resume analysis and other generative tools require the key. Code execution remains available without it; complexity coaching is optional. Keep `.env` files private and never commit API keys.

The resume analyzer extracts selectable text from PDFs and reports common content, contact, date, structure, and readability issues. Scanned/image-only PDFs need OCR first. The builder offers a print-to-PDF layout; replace draft placeholders and check the final PDF before applying. Automated resume reviews cannot guarantee a shortlist.
