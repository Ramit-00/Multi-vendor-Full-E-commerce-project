Project setup and common troubleshooting

Backend
- Copy `backend/.env.example` to `backend/.env` and populate values (Mongo URI, email creds).
- To install dependencies:
  - `cd backend && npm install`
- To run dev server:
  - `cd backend && npm run dev`

Frontend
- To install dependencies:
  - `cd frontend && npm install`
- To run dev server:
  - `cd frontend && npm run dev`

Notes
- If MongoDB Atlas connection fails, add your IP to Network Access (Atlas) or set `ALLOW_OFFLINE=true` for local testing.
- For testing OTP without email, set `DEBUG_SHOW_OTP=true` in `backend/.env` (will return OTP in API response). Disable in production.
- Add `EMAIL_USER` and `EMAIL_PASS` to enable real email sending.
- Run `npm audit` and `npm audit fix` occasionally to keep dependencies secure.
