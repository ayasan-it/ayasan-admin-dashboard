# Ayasan Admin Dashboard

  Admin dashboard for the **Ayasan Thailand** home services platform.

  Built with **React + Vite + Tailwind CSS v4 + wouter**.

  ## Features

  - 📊 Dashboard — Revenue, bookings, KPIs overview
  - 📅 Daily & Subscription Bookings — Assign workers, manage status
  - 👷 Workers — Manage worker profiles, ratings, availability
  - 🎁 Gift Catalog & Redemptions — Point-based gift system
  - ⭐ Reviews — Customer feedback management
  - 📣 Marketing & Promotions — Promo codes, campaigns
  - 💬 App Feedback — In-app customer feedback
  - 📍 Area Pricing — Per-area service pricing
  - 🔔 Subscription Cancellations — Approve/reject cancellation requests
  - 🌐 5-language support (TH / EN / JA / ZH / KO)

  ## Worker Assignment Flow

  When admin assigns a worker via the dashboard, the assignment is sent to the API server (`/api/booking-assignments`), and the worker can see it in real time in the mobile app.

  ## Setup

  ```bash
  npm install
  npm run dev
  ```

  ## API Connection

  Set the `VITE_API_URL` (defaults to `/api`) to point to your API server.

  ## Tech Stack

  - React 18
  - Vite
  - Tailwind CSS v4
  - wouter (routing)
  - shadcn/ui components
  - Primary color: #F47A20
  