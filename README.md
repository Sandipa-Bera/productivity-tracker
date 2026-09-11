# Productivity

A personal productivity workspace for managing tasks, running focused work sessions, tracking daily activity, and measuring progress over time.

This is a full-stack web application built as part of a 13-step development plan.
**Current status: Step 4 — Project foundation (routing and layout scaffold).**

---

## Technology Stack

| Layer | Technology |
|---|---|
| UI | React 19 |
| Language | JavaScript (ES2022) |
| Bundler | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Backend/Auth | Supabase |
| Icons | Lucide React |
| Charts | Recharts |
| Linting | ESLint v10 |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install dependencies

```bash
npm install
```

### Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Never commit `.env` to version control.** It is already listed in `.gitignore`.

### Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Other commands

```bash
npm run build    # Production build
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Your Supabase project anon (public) key |

> Only the **anon key** should be used in frontend code. Never expose the service-role key.

---

## Project Structure

```
src/
  assets/              Static assets
  components/
    ui/                Primitive UI components (Button, Input, Card, Badge, ProgressBar, IconButton)
    layout/            App shell (AppLayout, Sidebar, TopBar, BottomNav, NavItem)
    shared/            Cross-cutting shared components
  pages/
    auth/              Auth pages (Login, Signup, ForgotPassword)
    DashboardPage.jsx
    TasksPage.jsx
    FocusPage.jsx
    ActivityPage.jsx
    ProgressPage.jsx
    HistoryPage.jsx
    SettingsPage.jsx
  lib/
    supabase.js        Supabase client
  hooks/               Custom React hooks
  services/            Data/API layer
  utils/               Pure utility functions
  constants/
    navigation.js      Nav items configuration
    theme.js           Design token constants
  routes/
    index.jsx          Route definitions
    PrivateRoute.jsx   Auth guard (stub — Step 5)
  App.jsx
  main.jsx
  index.css            Tailwind + design tokens
```

---

## Routes

| Path | Type | Page |
|---|---|---|
| `/` | Public | Landing |
| `/login` | Public | Login |
| `/signup` | Public | Signup |
| `/forgot-password` | Public | Forgot Password |
| `/dashboard` | Private | Dashboard |
| `/tasks` | Private | Tasks |
| `/focus` | Private | Focus Timer |
| `/activity` | Private | Activity |
| `/progress` | Private | Progress |
| `/history` | Private | History |
| `/settings` | Private | Settings |

---

## Development Plan

1. Requirements
2. UI/UX Architecture
3. Database Architecture
4. **Project Foundation** ← current step
5. Authentication
6. Database Schema
7. Task Management
8. Focus Timer
9. Activity Tracking
10. Progress & Charts
11. History
12. Settings & Preferences
13. Polish & Deployment
