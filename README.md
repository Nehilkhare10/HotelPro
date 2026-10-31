# HotelPro — Hotel Management System

Your ultimate hotel management solution. A secure, scalable backend (Node.js + Express + JWT auth) with a simple built-in frontend, for booking management, guest management, and payment processing.

## Features

- 🔐 JWT-based authentication (register/login, staff & admin roles)
- 🛏️ Room management (CRUD, availability tracking)
- 🧑‍🤝‍🧑 Guest management (profiles, ID proof)
- 📅 Booking management (create, check-in, check-out, cancel — auto-calculates nights & total)
- 💳 Payment processing (simulated gateway, transaction references, booking payment status)
- 📊 Dashboard with live stats (rooms, occupancy, revenue)
- No external database required — runs instantly with a local JSON file (`backend/data/db.json`). Swap in MongoDB/Postgres later if you want to productionize it.

## Tech stack

- Backend: Node.js, Express, JWT, bcrypt, lowdb (JSON file database)
- Frontend: Plain HTML/CSS/JavaScript (no build step, served directly by Express)

## Run it in VS Code

1. Open the `hotelpro` folder in VS Code.
2. Open a terminal in VS Code (`` Ctrl+` ``) and run:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm start
   ```
3. Open your browser at **http://localhost:5000** — register an account (pick role "admin" to manage rooms), then log in.
4. (Optional) For auto-restart on file changes while developing: `npm run dev` instead of `npm start`.

That's it — no database server, no extra setup.

## Project structure

```
hotelpro/
├── backend/
│   ├── data/db.json          # local JSON "database" (seeded with 3 sample rooms)
│   ├── middleware/auth.js    # JWT auth + role guard
│   ├── routes/                # auth, rooms, guests, bookings, payments
│   ├── server.js
│   ├── db.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── README.md
```

## Push this to your own GitHub (for your portfolio / "skill wallet")

Run these from the `hotelpro` folder (the one containing this README):

```bash
git init
git add .
git commit -m "Initial commit: HotelPro hotel management system"
git branch -M main
git remote add origin https://github.com/<your-username>/hotelpro.git
git push -u origin main
```

Steps before that, if you haven't already:
1. Create a new empty repository named `hotelpro` on github.com (don't initialize it with a README — this project already has one).
2. Copy its HTTPS URL and use it in the `git remote add origin ...` line above.
3. If prompted for credentials, use a GitHub Personal Access Token (not your password) — GitHub → Settings → Developer settings → Personal access tokens.

Once pushed, your repo link (`https://github.com/<your-username>/hotelpro`) is what you can add to your portfolio/skill wallet. Anyone can then clone it and run it with the 3 commands above.

## API overview

| Method | Endpoint                     | Description                  |
|--------|-------------------------------|-------------------------------|
| POST   | /api/auth/register            | Create account                |
| POST   | /api/auth/login               | Login, get JWT                |
| GET    | /api/rooms                    | List rooms                    |
| POST   | /api/rooms                    | Add room (admin)              |
| GET    | /api/guests                   | List guests                   |
| POST   | /api/guests                   | Add guest                     |
| POST   | /api/bookings                 | Create booking                |
| POST   | /api/bookings/:id/checkin     | Check in a booking             |
| POST   | /api/bookings/:id/checkout    | Check out a booking (frees room) |
| POST   | /api/bookings/:id/cancel      | Cancel a booking (frees room)  |
| POST   | /api/payments                 | Record a payment for a booking |

All routes except register/login require `Authorization: Bearer <token>`.

## Next steps / ideas to extend

- Swap the JSON file DB for MongoDB (Mongoose) or PostgreSQL (Prisma) for production use.
- Integrate a real payment gateway (Razorpay/Stripe) in `routes/payments.js`.
- Add email/SMS confirmations on booking.
- Add a reports/analytics page (occupancy rate, revenue by month).
- Deploy the backend (Render/Railway/Fly.io) to get a live public demo link.
