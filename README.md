# 💕 Finderito (MeritoMatch)

A modern dating/matching application exclusively for WSB Merito Gdańsk students. Built with Next.js 15, Supabase, and TypeScript.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8?logo=tailwindcss)

## ✨ Features

- **🔐 University-Only Access** - Restricted to `@student.gdansk.merito.pl` emails
- **💘 Swipe Matching** - Tinder-style card swiping with animations
- **💬 Real-time Chat** - Instant messaging with typing indicators
- **🔔 Unread Badges** - Visual indicators for new messages
- **🚫 Block & Report** - User safety with blocking and reporting system
- **👮 Admin Panel** - Moderate reports, ban users, view chat transcripts
- **📱 Mobile First** - Fully responsive design with bottom navigation
- **🌙 Dark Mode** - Beautiful dark theme with pink accents
- **🔑 Microsoft SSO** - Optional Azure AD authentication

## 🛠️ Tech Stack

| Layer          | Technology                            |
| -------------- | ------------------------------------- |
| **Frontend**   | Next.js 15 (App Router)               |
| **Styling**    | Tailwind CSS 4, shadcn/ui             |
| **Backend**    | Supabase (PostgreSQL, Auth, Realtime) |
| **Language**   | TypeScript                            |
| **Deployment** | DigitalOcean                          |

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/merito-match.git
cd merito-match

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Database Setup

Run the SQL scripts in Supabase SQL Editor:

1. `supabase_setup.sql` - Core tables (profiles, likes, matches, messages)
2. `update_schema_nickname.sql` - Add nickname field
3. `update_schema_unread.sql` - Add unread tracking

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
merito-match/
├── app/
│   ├── (dashboard)/       # Protected routes
│   │   ├── browse/        # Swipe deck
│   │   ├── chat/          # Chat list & rooms
│   │   └── profile/       # User profile
│   ├── admin/             # Admin panel
│   ├── auth/              # Auth callback
│   ├── banned/            # Banned user page
│   ├── login/             # Login/signup
│   └── onboarding/        # New user setup
├── components/
│   ├── ui/                # shadcn components
│   └── dashboard-nav.tsx  # Navigation
├── lib/
│   └── supabase/          # Supabase clients
└── DEPLOYMENT.md          # Hosting guide
```

## 🔐 Admin Panel

To access the admin panel:

1. Set `is_admin = true` for your user in the `profiles` table
2. Navigate to `/admin`
3. Manage reports, ban users, view evidence

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full DigitalOcean hosting instructions.

**Quick Overview:**

- **Frontend**: DigitalOcean App Platform
- **Backend**: Self-hosted Supabase on 8GB Droplet
- **Cost**: ~$60/month (covered by GitHub Student Pack)

## 📝 License

This project is for educational purposes at WSB Merito University.

## 👨‍💻 Author

Created by Dawid - WSB Merito Gdańsk Student

---

<p align="center">
  Made with ❤️ for Merito students
</p>
