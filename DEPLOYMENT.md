# 🚀 CHLEAR CRM Deployment Guide

## Overview
This guide will help you deploy your CHLEAR CRM application to production. The application consists of:
- **Frontend**: React app (deploy to Vercel)
- **Backend**: Node.js API (deploy to Railway/Render/Heroku)
- **Database**: PostgreSQL (use Neon/Supabase/Railway)

## 🎯 Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   Neon/Supabase │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│   React App     │    │   Node.js API   │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

1. **GitHub Repository**: Your code is already pushed to GitHub ✅
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Railway Account**: Sign up at [railway.app](https://railway.app) (for backend)
4. **Neon Account**: Sign up at [neon.tech](https://neon.tech) (for database)

## 🎨 Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import your GitHub repository**: `Thepushpendra68/chlearCRM`
4. **Configure the project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Environment Variables

In Vercel dashboard, go to **Settings > Environment Variables** and add:

```
VITE_API_URL=https://your-backend-url.railway.app/api
VITE_APP_NAME=CHLEAR CRM
VITE_APP_VERSION=1.0.0
```

### Step 3: Deploy

Click **Deploy** and wait for the build to complete. Your frontend will be available at `https://your-project.vercel.app`

## 🔧 Backend Deployment (Railway)

### Step 1: Prepare Backend

1. **Go to [railway.app](https://railway.app)** and sign in
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository**: `Thepushpendra68/chlearCRM`
5. **Configure the project**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 2: Environment Variables

In Railway dashboard, go to **Variables** and add:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://your-frontend-url.vercel.app

# Database (from Neon)
DB_HOST=your-neon-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-username
DB_PASSWORD=your-password
```

### Step 3: Database Setup

1. **Go to [neon.tech](https://neon.tech)** and create a new project
2. **Copy the connection string** from the dashboard
3. **Update the environment variables** in Railway with your database credentials
4. **Run migrations** (Railway will do this automatically if you add a build script)

## 🗄️ Database Setup (Neon)

### Step 1: Create Database

1. **Sign up at [neon.tech](https://neon.tech)**
2. **Create a new project**
3. **Copy the connection details**:
   - Host
   - Database name
   - Username
   - Password
   - Port (usually 5432)

### Step 2: Run Migrations

Add this to your Railway deployment:

```json
{
  "scripts": {
    "postinstall": "npm run migrate && npm run seed"
  }
}
```

## 🔄 Alternative Backend Deployment Options

### Option 1: Render
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Set root directory to `backend`
5. Add environment variables

### Option 2: Heroku
1. Go to [heroku.com](https://heroku.com)
2. Create a new app
3. Connect to GitHub
4. Set buildpacks and environment variables

## 🌐 Domain Configuration

### Custom Domain (Optional)

1. **In Vercel**: Go to Settings > Domains
2. **Add your custom domain**: `crm.yourdomain.com`
3. **Configure DNS** as instructed by Vercel

## 🔐 Security Checklist

- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS (automatic with Vercel/Railway)
- [ ] Set proper CORS origins
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Regular security updates

## 📊 Monitoring & Analytics

### Vercel Analytics
- Enable Vercel Analytics in your dashboard
- Monitor performance and user behavior

### Railway Monitoring
- Use Railway's built-in monitoring
- Set up alerts for downtime

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Update `FRONTEND_URL` in backend environment variables
   - Check CORS configuration in backend

2. **Database Connection Issues**:
   - Verify database credentials
   - Check if database is accessible from Railway

3. **Build Failures**:
   - Check build logs in Vercel/Railway
   - Ensure all dependencies are in package.json

4. **Environment Variables**:
   - Make sure all required variables are set
   - Check variable names (case-sensitive)

### Debug Commands

```bash
# Check if backend is running
curl https://your-backend-url.railway.app/health

# Check if frontend can reach backend
curl https://your-frontend-url.vercel.app
```

## 📈 Performance Optimization

1. **Enable Vercel Edge Functions** for better performance
2. **Use CDN** for static assets
3. **Optimize images** and assets
4. **Enable compression** in backend
5. **Use database connection pooling**

## 🔄 CI/CD Pipeline

### Automatic Deployments
- **Vercel**: Automatically deploys on push to main branch
- **Railway**: Automatically deploys on push to main branch
- **Database**: Migrations run automatically on deployment

### Manual Deployments
```bash
# Trigger manual deployment
git push origin main
```

## 📞 Support

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity

## 🎉 Success!

Once deployed, your CRM will be available at:
- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-backend.railway.app`
- **Database**: Managed by Neon/Supabase

Your CRM is now live and ready for production use! 🚀
