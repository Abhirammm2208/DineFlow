# 🚀 DineFlow Deployment Guide

This guide will help you deploy DineFlow to production using Railway (backend) and Vercel (frontend).

## Prerequisites

- GitHub repository with your DineFlow code pushed
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Supabase project with schema created

---

## Part 1: Backend Deployment to Railway

### Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial DineFlow commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dineflow.git
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to [https://railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize GitHub and select your `dineflow` repository
5. Click "Deploy"

### Step 3: Configure Environment Variables

In Railway dashboard for your project:

1. Click on the `backend` service
2. Go to "Variables" tab
3. Add the following variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_public_key
SUPABASE_SECRET=your_service_role_key
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
JWT_SECRET=your_random_secret_key_min_32_chars
TWILIO_ACCOUNT_SID=your_twilio_account_sid (if using Twilio)
TWILIO_AUTH_TOKEN=your_twilio_auth_token (if using Twilio)
TWILIO_PHONE_NUMBER=your_twilio_phone (if using Twilio)
TWILIO_WHATSAPP_NUMBER=your_whatsapp_number (if using Twilio)
```

### Step 4: Configure Root Directory

1. In Railway project settings
2. Set "Root Directory" to `backend`
3. Click "Deploy"

### Step 5: Get Backend URL

After deployment completes:
- Railway will show you a public URL (e.g., `https://dineflow-backend-xxx.railway.app`)
- Save this URL - you'll need it for frontend configuration

---

## Part 2: Frontend Deployment to Vercel

### Step 1: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the repository

### Step 2: Configure Project Settings

In the import dialog:

1. **Framework Preset**: Select "Vite"
2. **Root Directory**: Select `frontend`
3. **Build Command**: Keep default (npm run build)
4. **Output Directory**: Keep default (dist)

### Step 3: Add Environment Variables

Click "Environment Variables" and add:

```
VITE_API_URL=https://your-railway-backend-url/api
```

(Replace with your actual Railway backend URL from Step 1)

### Step 4: Deploy

Click "Deploy" and wait for the deployment to complete.

Vercel will provide you with a public URL (e.g., `https://dineflow-frontend.vercel.app`)

---

## Part 3: Update Backend CORS

Now that you have both URLs:

1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` variable to your Vercel frontend URL
3. Railway will automatically redeploy

---

## Testing Your Deployment

1. Open your Vercel frontend URL in browser
2. You should see the DineFlow login page
3. Create a new merchant account
4. Add menu items and create test bills
5. Check that everything works

---

## Post-Deployment Checklist

- [ ] Backend running on Railway
- [ ] Frontend running on Vercel
- [ ] CORS properly configured
- [ ] Database schema created in Supabase
- [ ] Environment variables set correctly
- [ ] Test merchant account created
- [ ] Test bill creation works
- [ ] Notifications configured (if using Twilio)

---

## Troubleshooting

### Frontend shows "Failed to connect to backend"
- Check that `VITE_API_URL` environment variable is set correctly in Vercel
- Verify backend URL is accessible and running
- Check CORS configuration in backend

### 404 errors on frontend assets
- Vercel might be redirecting incorrectly
- Check that Root Directory is set to `frontend`

### Backend crashes on startup
- Check Railway logs for errors
- Verify all environment variables are set
- Make sure Supabase URL and keys are correct
- Check that database schema exists

### Bills not punching/notifications not working
- If using Twilio, verify credentials are correct
- Check Railway logs for notification service errors
- Ensure customer phone numbers are in correct format

---

## Database Backups (Supabase)

Supabase automatically backs up your data, but you can:

1. Go to Supabase dashboard
2. Settings → Backups
3. Manually trigger a backup anytime
4. Download backup if needed

---

## Scaling & Performance

As your users grow:

1. **Database**: Supabase handles scaling automatically
2. **Backend**: Railway can auto-scale with plan upgrades
3. **Frontend**: Vercel handles CDN distribution globally
4. **Monitoring**: Set up Railway and Vercel alerts

---

## Security Best Practices

1. Never commit `.env` files with secrets
2. Use strong JWT secrets (minimum 32 characters)
3. Rotate Twilio credentials if compromised
4. Enable Supabase RLS policies
5. Keep dependencies updated
6. Monitor Railway and Vercel logs for suspicious activity
7. Use HTTPS everywhere (Vercel and Railway provide this by default)

---

## Custom Domain

### Connect custom domain to Vercel

1. In Vercel project settings
2. Go to "Domains"
3. Add your domain
4. Follow DNS configuration instructions

### Connect custom domain to Railway

1. In Railway project settings
2. Go to "Domains"
3. Add your custom domain
4. Update DNS records accordingly

---

## Updating Deployed Code

After making changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Both Railway and Vercel will automatically redeploy when you push to main branch!

---

## Cost Estimation (as of 2024)

- **Vercel**: Free tier sufficient for small usage
- **Railway**: Free tier ($5/month) for basic usage
- **Supabase**: Free tier sufficient for thousands of transactions

---

## Support

If you encounter issues:

1. Check Railway logs: Project → Deployments → View Logs
2. Check Vercel logs: Project → Deployments → Logs
3. Check browser console for frontend errors
4. Check Supabase status at https://status.supabase.com

---

**Happy deploying! 🎉**
