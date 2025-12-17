# Khen Backend (Node.js + Express + MongoDB) — Manual & Setup

This repository is a ready-to-run backend for the Khen Funeral Grocery Scheme frontend.
It includes:
- Express server (`server.js`)
- MongoDB models (`models/Claim.js`)
- Claim submission API (`routes/claims.js`) with file upload via `multer`
- Email notification to admin via `nodemailer`
- Basic rate-limiting and security headers

## Files created
- `server.js` - main server
- `routes/claims.js` - API endpoints (`POST /api/claims`, `GET /api/claims`)
- `models/Claim.js` - Mongoose schema
- `.env.example` - environment variables
- `package.json` - dependencies/scripts

## Requirements
- Node.js 18+ installed
- npm (or yarn)
- MongoDB (Atlas recommended) or local MongoDB (tested with 7.x)
- SMTP credentials for email notifications (Gmail app password, Mailgun, SendGrid, etc.)

## Quickstart (local)
1. Copy repository to your machine.
2. Run `cp .env.example .env` and fill values.
3. Install dependencies:
   ```
   npm install
   ```
4. Create `uploads` directory in project root (server will attempt to create it automatically).
5. Start server:
   ```
   npm run start
   ```
   or for development with auto-reload:
   ```
   npm run dev
   ```

The server will connect to the MongoDB URI in `MONGO_URI` and listen on `PORT`.

## Environment variables
See `.env.example`. Important values:
- `MONGO_URI` - MongoDB connection string. For Atlas, create a cluster, create a database user, and allow your IP address.
- `ADMIN_EMAIL` - where claim notifications are sent.
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - SMTP settings
- `ADMIN_API_KEY` - admin-only key used to GET `/api/claims`
- `CORS_ORIGIN` - origin allowed for CORS (e.g. your frontend URL)
- `FRONTEND_PATH` - optional: point to your built frontend folder to serve static files

## Connect your frontend
If your front-end has a form (e.g. `SIgn Up Application.html`), set the form attributes:

```
<form action="https://your-backend.example.com/api/claims" method="POST" enctype="multipart/form-data">
  <input name="fullName" required />
  <input name="phone" required />
  <input type="file" name="document" />
  ...
</form>
```

For local development, use `http://localhost:4000/api/claims`.

## Testing the API
- Example `curl`:
  ```
  curl -X POST http://localhost:4000/api/claims \
    -F "fullName=Thabiso" \
    -F "phone=+2783XXXXXXX" \
    -F "claimDetails=My claim details" \
    -F "document=@/path/to/file.pdf"
  ```

- GET (admin only):
  ```
  curl -H "x-api-key: <ADMIN_API_KEY>" http://localhost:4000/api/claims
  ```

## Deployment tips
- Use environment variables (don’t commit `.env`).
- Use MongoDB Atlas for ease of deployment.
- For email in production:
  - Use SendGrid/Mailgun/Postmark with API keys or SMTP credentials.
  - For Gmail, create an App Password if using 2FA.
- Platforms: Render, Railway, Heroku (deprecated buildpack), DigitalOcean App Platform, or your own VPS.

## Security & Maintenance
- Use HTTPS in production.
- Rotate `ADMIN_API_KEY` occasionally.
- Run regular backups for MongoDB (Atlas has automatic backups).
- Limit file upload size (currently 5MB).
- Validate file types if you expect only PDFs or images.

## What I tested
- This scaffold is syntactically valid ES module Node.js code (uses `import` / `export`).
- You must run `npm install` in the backend folder to install dependencies before starting.

## Next steps I can do for you (optional)
- Add user authentication (JWT + admin panel).
- Add an admin dashboard to list and change claim status.
- Add client-side form validation and friendly UI messages integrated into your provided frontend.
- Deploy to Render or Railway and configure domain.

---
If you want, I can also copy your frontend into `public/` of this backend and wire the form on your `SIgn Up Application.html` file to point to the API endpoint — tell me if you want me to do that and I will update the bundle.
