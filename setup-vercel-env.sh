#!/bin/bash
# Vercel Environment Variables Setup Script
# Run this script to configure all required environment variables for your Vercel deployment

echo "🚀 Setting up Vercel environment variables for chlear-crm..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Link to Vercel project (if not already linked)
echo "🔗 Linking to Vercel project..."
vercel link --yes

echo ""
echo "📝 Adding environment variables..."
echo ""

# Frontend environment variables
echo "Adding VITE_SUPABASE_URL..."
echo "https://qlivxpsvlymxfnamxvhz.supabase.co" | vercel env add VITE_SUPABASE_URL production preview development

echo "Adding VITE_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjU1NDUsImV4cCI6MjA3NDQ0MTU0NX0.p8VSaRJ-vS5ePf_2z_s-hQDrAxpS-r8vZSeijPBngIQ" | vercel env add VITE_SUPABASE_ANON_KEY production preview development

echo "Adding VITE_API_URL..."
echo "/api" | vercel env add VITE_API_URL production preview development

# Backend environment variables
echo "Adding SUPABASE_URL..."
echo "https://qlivxpsvlymxfnamxvhz.supabase.co" | vercel env add SUPABASE_URL production preview development

echo "Adding SUPABASE_SERVICE_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2NTU0NSwiZXhwIjoyMDc0NDQxNTQ1fQ.iqqk4KmhYEGr_2YpfnecGF84b94dQi7riOU8OS96zq0" | vercel env add SUPABASE_SERVICE_KEY production preview development

echo "Adding SUPABASE_JWT_SECRET..."
echo "FU/fPMvOx/Sn8/u5qkZpCU/GZGypuuWTpqIgpnegsp6aeK/iDzD6Wj9Fnn1EUQ4O9zZxE14yVemXXIkWYpxhzQ==" | vercel env add SUPABASE_JWT_SECRET production preview development

echo "Adding GEMINI_API_KEY..."
echo "AIzaSyBQFQJwIAkybhd2AWOl1_jcD1m3XFaVyDY" | vercel env add GEMINI_API_KEY production preview development

echo "Adding NODE_ENV..."
echo "production" | vercel env add NODE_ENV production

echo "Adding FRONTEND_URL..."
echo "https://chlear-crm.vercel.app" | vercel env add FRONTEND_URL production preview development

echo ""
echo "✅ All environment variables added!"
echo ""
echo "🚀 Triggering new deployment..."
vercel --prod

echo ""
echo "✨ Setup complete! Your app will be live at https://chlear-crm.vercel.app in a few moments."
echo ""
