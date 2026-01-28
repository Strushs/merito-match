# DigitalOcean Deployment Guide

## Overview

Deploy MeritoMatch with:

- **Supabase** (self-hosted) on 8GB Droplet
- **Next.js App** on App Platform (or same Droplet)

**Total Cost**: ~$60/month → $180 for 3 months (within $200 credit)

---

## Part 1: Create DigitalOcean Account

1. Go to [digitalocean.com](https://www.digitalocean.com)
2. Sign up with GitHub (to link Student Pack credits)
3. Apply your **$200 credit** from GitHub Student Developer Pack

---

## Part 2: Deploy Supabase (Self-Hosted)

### Step 1: Create Droplet

1. Click **Create** → **Droplets**
2. Choose:
   - **Region**: Frankfurt (closest to Poland)
   - **Image**: Ubuntu 24.04 LTS
   - **Size**: 8GB RAM / 4 vCPU ($48/mo)
   - **Authentication**: SSH Key (recommended) or Password
3. Click **Create Droplet**

### Step 2: Connect to Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 3: Install Docker

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

### Step 4: Install Supabase

```bash
# Clone Supabase Docker
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copy environment file
cp .env.example .env
```

### Step 5: Configure Supabase

Edit `.env` file:

```bash
nano .env
```

**CRITICAL**: Change these values:

```env
# Generate new secrets (use: openssl rand -base64 32)
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE
JWT_SECRET=YOUR_JWT_SECRET_HERE
ANON_KEY=generate_new_anon_key
SERVICE_ROLE_KEY=generate_new_service_key

# Your domain (or Droplet IP for testing)
SITE_URL=https://your-domain.com
API_EXTERNAL_URL=https://api.your-domain.com

# SMTP (for auth emails) - use Brevo/SendGrid
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_login
SMTP_PASS=your_brevo_password
SMTP_SENDER_NAME=MeritoMatch
```

### Step 6: Start Supabase

```bash
docker compose up -d
```

### Step 7: Access Supabase Studio

- Open browser: `http://YOUR_DROPLET_IP:3000`
- Login with credentials from `.env`

---

## Part 3: Deploy Next.js App

### Option A: DigitalOcean App Platform (Easiest)

1. Push your code to GitHub
2. Go to DigitalOcean → **Apps** → **Create App**
3. Connect GitHub repo
4. Configure:
   - **Type**: Web Service
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **Plan**: Basic ($12/mo)
5. Add **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://YOUR_DROPLET_IP:8000
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_supabase
   ```
6. Click **Deploy**

### Option B: Same Droplet (Advanced)

```bash
# On the Supabase Droplet
cd ~
git clone https://github.com/YOUR_USERNAME/merito-match.git
cd merito-match

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install nodejs -y

# Install dependencies & build
npm install
npm run build

# Install PM2 (process manager)
npm install -g pm2

# Start the app
pm2 start npm --name "merito-match" -- start
pm2 save
pm2 startup
```

---

## Part 4: Connect Your Domain (Optional)

### DNS Configuration

Add these records to your domain:

| Type  | Name | Value           |
| ----- | ---- | --------------- |
| A     | @    | YOUR_DROPLET_IP |
| A     | api  | YOUR_DROPLET_IP |
| CNAME | www  | @               |

### SSL with Certbot

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## Part 5: Update Your App's Environment

Update `.env.local` in your Next.js app:

```env
NEXT_PUBLIC_SUPABASE_URL=https://api.your-domain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key
```

---

## Quick Checklist

- [ ] DigitalOcean account with $200 credit
- [ ] 8GB Droplet created
- [ ] Docker installed
- [ ] Supabase running
- [ ] Database migrated (run your SQL scripts)
- [ ] Next.js app deployed
- [ ] Environment variables set
- [ ] Domain configured (optional)
- [ ] SSL enabled (optional)

---

## Troubleshooting

### Supabase won't start

```bash
cd ~/supabase/docker
docker compose logs -f
```

### Database connection issues

Check firewall:

```bash
ufw allow 5432  # PostgreSQL
ufw allow 8000  # Supabase API
ufw allow 3000  # Supabase Studio
```

### Need to restart Supabase

```bash
cd ~/supabase/docker
docker compose restart
```
