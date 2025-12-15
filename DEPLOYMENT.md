# Deployment Guide for Vercel

This guide provides step-by-step instructions for deploying the Expense Manager application to Vercel.

## Prerequisites

- A [Vercel](https://vercel.com) account
- A [Neon](https://neon.tech) PostgreSQL database account
- Your code pushed to a GitHub repository

## Backend Deployment

### Step 1: Create a Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy your database connection string (it will look like: `postgresql://user:password@host.neon.tech/database?sslmode=require`)

### Step 2: Deploy Backend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. **Important:** Set the **Root Directory** to `backend`
5. Click on **"Environment Variables"**
6. Add the following environment variables:

   ```
   DATABASE_URL=your_neon_database_connection_string
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
   ```

   > **Note:** You'll update `ALLOWED_ORIGINS` later after deploying the frontend

7. Click **"Deploy"**
8. Wait for deployment to complete
9. **Save your backend URL** (e.g., `https://your-backend.vercel.app`)

### Step 3: Test Backend Deployment

Test your backend by visiting: `https://your-backend.vercel.app/api/health`

You should see a JSON response like:
```json
{
  "status": "ok",
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## Frontend Deployment

### Step 1: Deploy Frontend to Vercel

1. In Vercel Dashboard, click **"Add New"** → **"Project"**
2. Import the **same GitHub repository**
3. **Important:** Set the **Root Directory** to `frontend`
4. Click on **"Environment Variables"**
5. Add the following environment variable:

   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```

   > Replace with your actual backend URL from Backend Step 2

6. Verify build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

7. Click **"Deploy"**
8. Wait for deployment to complete
9. **Save your frontend URL** (e.g., `https://your-frontend.vercel.app`)

### Step 2: Update Backend CORS Configuration

1. Go back to your backend project in Vercel Dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Update the `ALLOWED_ORIGINS` variable:

   ```
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

   > If you have a custom domain, add it too (comma-separated):
   > `ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://www.yourdomain.com`

4. **Important:** After updating environment variables, go to **Deployments** and click **"Redeploy"** on the latest deployment

### Step 3: Test the Full Application

1. Visit your frontend URL
2. Try adding an expense
3. Verify that the expense appears in the list
4. Check the settlement calculations

If everything works, your deployment is complete! 🎉

## Custom Domain (Optional)

### For Frontend

1. In your frontend project, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `expenses.yourdomain.com`)
3. Follow Vercel's DNS configuration instructions
4. Update backend's `ALLOWED_ORIGINS` to include your custom domain

### For Backend

1. In your backend project, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `api.yourdomain.com`)
3. Follow Vercel's DNS configuration instructions
4. Update frontend's `VITE_API_URL` to use your custom backend domain
5. Redeploy the frontend

## Monitoring & Logs

### View Logs

1. Go to your project in Vercel Dashboard
2. Click on **"Deployments"**
3. Click on any deployment
4. Click on **"Functions"** to see serverless function logs
5. All logs are in JSON format for easy parsing

### Log Format

The backend logs all events in JSON format:

```json
{
  "level": "INFO",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Request completed",
  "method": "POST",
  "path": "/api/expenses",
  "statusCode": 201,
  "duration": "45ms"
}
```

### What's Logged

- All incoming HTTP requests (method, path, query params, IP, user agent)
- All HTTP responses (status code, duration)
- All database operations
- All errors with stack traces
- Application startup events
- CORS blocked requests
- Validation errors

## Troubleshooting

### Frontend can't connect to backend

**Problem:** Frontend shows "Failed to load expenses" error

**Solutions:**
1. Verify `VITE_API_URL` is set correctly in frontend environment variables
2. Check that backend is deployed and `/api/health` endpoint responds
3. Verify `ALLOWED_ORIGINS` in backend includes your frontend URL
4. Check browser console for CORS errors
5. View backend logs in Vercel for detailed error information

### Backend shows index.js source code

**Problem:** Visiting backend URL shows the source code of index.js

**Solution:** This issue is fixed by the `vercel.json` configuration file. Make sure:
1. `backend/vercel.json` exists in your repository
2. The file contains the correct Vercel configuration
3. Redeploy the backend after adding the file

### Database connection errors

**Problem:** Logs show "Error connecting to database"

**Solutions:**
1. Verify `DATABASE_URL` is set correctly in backend environment variables
2. Make sure the Neon database is active (free tier databases may sleep)
3. Check that the database connection string includes `?sslmode=require`
4. Visit Neon Console to ensure the database is running

### Environment variables not updating

**Problem:** Changes to environment variables don't take effect

**Solution:**
1. After changing environment variables in Vercel
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Wait for redeployment to complete

## Production Checklist

Before going live, verify:

- [ ] Backend deployed and `/api/health` responds correctly
- [ ] Frontend deployed and loads without errors
- [ ] Database connection is working
- [ ] Frontend can communicate with backend (test adding an expense)
- [ ] `ALLOWED_ORIGINS` includes all frontend domains
- [ ] `VITE_API_URL` points to correct backend URL
- [ ] Custom domains configured (if applicable)
- [ ] Logs are being generated correctly
- [ ] No sensitive data in logs or environment variables
- [ ] SSL/HTTPS is working on both frontend and backend

## Support

If you encounter issues:

1. Check the **Logs** in Vercel Dashboard for detailed error messages
2. Verify all environment variables are set correctly
3. Test each component separately (backend health check, then frontend)
4. Refer to this guide's troubleshooting section

## Updates and Redeployment

Vercel automatically redeploys your application when you push changes to your repository:

1. Make changes to your code
2. Commit and push to GitHub
3. Vercel will automatically detect the changes and redeploy

You can also manually redeploy:

1. Go to Vercel Dashboard
2. Navigate to **Deployments**
3. Click **"Redeploy"** on any deployment
