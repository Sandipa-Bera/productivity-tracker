# 🚀 Personal Productivity Dashboard

> A full-stack productivity app built to manage tasks, focus sessions, daily activity, goals, and personal journeys — all in one place.

# Live Website

Visit the deployed application here:
https://productivity-tracker-2hsr.vercel.app/

## ✨ Overview

I built this project to solve a simple problem:

**Make important work visible, trackable, and harder to procrastinate on.**

Instead of using separate tools for tasks, study sessions, activity tracking, goals, and progress, this application brings everything together into one personal productivity workspace.

---

## 🎯 Features

- 📊 **Personal Dashboard** — See today's tasks, progress, activity, and productivity at a glance.
- ✅ **Task Management** — Create, organize, prioritize, complete, and track daily tasks.
- ⏱️ **Focus Timer** — Timestamp-based focus sessions with pause/resume, breaks, notifications, and task association.
- 🚶 **Activity Tracker** — Track daily steps with a configurable walking goal and weekly history.
- 🎯 **Goals** — Create personal goals and track progress toward them.
- 📈 **Progress Analytics** — Monitor study time, completed tasks, focus sessions, walking progress, and streaks.
- 🪔 **Navratri Journey** — Calendar-based journey tracking with daily progress, countdown, productivity health, and diary notes.
- 🔐 **Authentication** — Secure signup, login, email verification, password reset, and protected routes.
- ⚙️ **Personalization** — Theme, font, font size, study goal, step goal, timer preferences, and notifications.
- 📱 **Responsive & PWA** — Designed for desktop, tablet, and mobile with installable PWA support.

---

## 🛠️ Tech Stack

**Frontend**
- React
- JavaScript / JSX
- Vite
- Tailwind CSS
- React Router
- Recharts

**Backend**
- Supabase
- PostgreSQL
- Supabase Authentication
- Row Level Security (RLS)

**Deployment**
- Vercel
- Git & GitHub

---

## 🏗️ Architecture

```text
React + Vite
     │
     ▼
Supabase
 ┌───────────────┐
 │ Authentication│
 │ PostgreSQL    │
 │ RLS           │
 └───────┬───────┘
         │
         ▼
      User Data
