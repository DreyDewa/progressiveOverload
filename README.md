# Progressive Overload

A free, self-hostable progressive overload tracker. Log your sets at the gym, see what you did last time, and watch your strength score go up.

## Features

- Custom workout days that run in a rotation
- Live set-by-set logging with auto-save
- "Last time" comparison with a ▲ / ▼ / = indicator per set
- Estimated 1RM charts for every exercise
- A single strength score that tracks your overall progress
- kg or lb (weights are always stored in kg)
- Installable on your phone's home screen

## Deploy your own

<!-- TODO: replace REPO_URL with the GitHub URL (URL-encoded) -->
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=REPO_URL&env=MONGODB_URI,AUTH_SECRET&envDescription=MongoDB%20Atlas%20connection%20string%20and%20a%20random%20secret%20for%20sessions)

1. Create a free MongoDB Atlas cluster (M0).
2. Database Access: create a database user.
3. Network Access: allow `0.0.0.0/0` (Vercel has no fixed IPs).
4. Copy the connection string (Connect → Drivers) and replace `<password>` with your database user's password.
5. Generate `AUTH_SECRET`: `openssl rand -base64 32`.
6. Click Deploy and paste both values (`MONGODB_URI` and `AUTH_SECRET`).

## Add to your home screen

- **iPhone:** open the site in Safari → Share → Add to Home Screen.
- **Android:** open the site in Chrome → ⋮ → Add to Home screen / Install app.

## Local development

```bash
cp .env.example .env.local   # then fill in MONGODB_URI and AUTH_SECRET
npm install
npm run dev
```

Run the tests with `npm test`.

## How the strength score works

For every exercise, the app estimates your one-rep max in each workout from your best set (weight × (1 + reps / 30)). Your score compares, for each exercise, your most recent estimate with the first one you ever logged. It averages those ratios (every exercise counts equally, however heavy it is) and multiplies by 100.

So 100 means "where you started", and 112.5 means you are on average 12.5% stronger than in your first logged sessions. The score can go down too. Sets with a weight of 0 are ignored.

## Tech

[Next.js](https://nextjs.org/), MongoDB with [Mongoose](https://mongoosejs.com/), and [Recharts](https://recharts.org/).

## License

MIT
