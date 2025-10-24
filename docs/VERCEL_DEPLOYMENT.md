# Vercel Deployment Guide

This guide explains how to deploy **Sakha CRM** on Vercel with Supabase.

## Architecture

- **Frontend**: React app hosted on Vercel
- **Backend**: Node.js/Express API running as Vercel serverless functions
- **Database**: Supabase (hosted PostgreSQL + Auth + Real-time)

## Deployment Steps

### 1. Environment Variables

Add these environment variables in your Vercel project settings:

#### Frontend Environment Variables

```bash
VITE_SUPABASE_URL=https://qlivxpsvlymxfnamxvhz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjU1NDUsImV4cCI6MjA3NDQ0MTU0NX0.p8VSaRJ-vS5ePf_2z_s-hQDrAxpS-r8vZSeijPBngIQ
VITE_API_URL=/api
```

**Note**: `VITE_API_URL=/api` uses a relative path since the backend runs on the same Vercel domain.

#### Backend Environment Variables

```bash
SUPABASE_URL=https://qlivxpsvlymxfnamxvhz.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2NTU0NSwiZXhwIjoyMDc0NDQxNTQ1fQ.iqqk4KmhYEGr_2YpfnecGF84b94dQi7riOU8OS96zq0
SUPABASE_JWT_SECRET=FU/fPMvOx/Sn8/u5qkZpCU/GZGypuuWTpqIgpnegsp6aeK/iDzD6Wj9Fnn1EUQ4O9zZxE14yVemXXIkWYpxhzQ==
GEMINI_API_KEY=AIzaSyBQFQJwIAkybhd2AWOl1_jcD1m3XFaVyDY
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Important**: Replace `https://your-vercel-app.vercel.app` with your actual Vercel deployment URL.

### 2. Add Environment Variables in Vercel

1. Go to your Vercel project: https://vercel.com/pushpendrachl-gmailcoms-projects/chlear-crm
2. Click **Settings** → **Environment Variables**
3. Add all variables listed above
4. Make sure to select the correct environment (Production, Preview, Development)

### 3. Deploy

Once environment variables are set:

```bash
git push
```

Vercel will automatically:
1. Build the frontend (`npm run build` in `frontend/`)
2. Deploy the serverless API function (`api/index.js`)
3. Serve everything from your Vercel domain

### 4. Verify Deployment

After deployment completes:

1. **Frontend**: Visit `https://your-app.vercel.app`
2. **Backend Health Check**: Visit `https://your-app.vercel.app/api/health`
3. **Login**: Use your Supabase credentials

## How It Works

### Frontend (Static Files)
- Built with Vite and served from `frontend/dist`
- Routing handled by `vercel.json` rewrites

### Backend (Serverless Function)
- Express app wrapped in `/api/index.js`
- All API routes work: `/api/auth`, `/api/leads`, `/api/dashboard`, etc.
- Runs on-demand (cold starts ~1-2 seconds)

### Database (Supabase)
- PostgreSQL database hosted on Supabase
- Row Level Security (RLS) enabled
- Real-time subscriptions available

## Troubleshooting

### 404 Errors

If you get 404 errors on API routes:
- Check that environment variables are set in Vercel
- Verify `VITE_API_URL=/api` is set for frontend
- Check Vercel deployment logs for errors

### API Timeout Errors

If functions timeout:
- Check `vercel.json` has `maxDuration: 60` for the API function
- Upgrade to Vercel Pro if you need longer execution times (60s limit on free tier)

### CORS Errors

If you see CORS errors:
- Verify `FRONTEND_URL` environment variable matches your Vercel domain
- Check that Supabase CORS settings allow your Vercel domain

### Slow Cold Starts

Serverless functions have cold starts (~1-2 seconds). This is normal on the free tier.
- Upgrade to Vercel Pro for better performance
- Keep functions warm by pinging `/api/health` periodically

## Local Development

To test the serverless setup locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally
vercel dev
```

This will start:
- Frontend on `http://localhost:3000`
- Backend on `http://localhost:3000/api`

## Cost Breakdown

- **Vercel Free Tier**: Includes serverless functions, frontend hosting
- **Supabase Free Tier**: 500MB database, 50,000 monthly active users
- **Google Gemini API**: Free tier with quotas

Total cost: **$0/month** for small usage 🎉

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs: https://vercel.com/pushpendrachl-gmailcoms-projects/chlear-crm
2. Check Supabase logs: https://supabase.com/dashboard/project/qlivxpsvlymxfnamxvhz
3. Review backend logs in Vercel Functions tab
