# Local Testing Guide

This guide will help you set up and test the Expense Manager application locally.

## Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Neon PostgreSQL Account** (Free) - [Sign up](https://neon.tech/)

## Step-by-Step Setup

### 1. Get Your Neon Database URL

1. Go to [https://neon.tech/](https://neon.tech/) and create a free account
2. Create a new project (give it any name you like)
3. Once created, navigate to your project dashboard
4. Click on "Connection Details" or "Connection String"
5. Copy the connection string - it will look like:
   ```
   postgresql://user:pass@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### 2. Configure Backend Environment

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and paste your Neon database URL:
   ```
   DATABASE_URL=postgresql://your-actual-connection-string-here
   PORT=3000
   ```

### 3. Configure Frontend Environment

1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```

2. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

3. The default configuration should work:
   ```
   VITE_API_URL=http://localhost:3000
   ```

### 4. Install Dependencies

1. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

### 5. Start the Application

You'll need **two terminal windows**.

**Terminal 1 - Backend Server:**
```bash
cd backend
npm start
```

You should see:
```
Server running on port 3000
Database initialized successfully
```

**Terminal 2 - Frontend Development Server:**
```bash
cd frontend
npm run dev
```

You should see something like:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 6. Test the Application

1. Open your browser and go to: http://localhost:5173/

2. You should see a clean interface with:
   - **Header** at the top with "Expense Manager"
   - **Dashboard** showing "Who Owes Who" (initially empty)
   - **Add Expense** section with a form
   - **Expense History** section

3. **Test Adding an Expense:**
   - Select a person from "Who Paid?" dropdown
   - Enter an amount (e.g., 100)
   - Optionally add a description
   - Click "Add Expense"
   - The expense should appear in the history below
   - The dashboard should update with calculated balances

4. **Test Deleting an Expense:**
   - Click the delete icon next to any expense
   - The expense should be removed
   - The dashboard should update

5. **Test Reset:**
   - Click "Reset All" button
   - Confirm the action
   - All expenses should be cleared

### 7. Verify Database Persistence

1. Add a few expenses
2. Stop the frontend server (Ctrl+C in Terminal 2)
3. Restart the frontend: `npm run dev`
4. Navigate back to http://localhost:5173/
5. **Your expenses should still be there!** (They're stored in PostgreSQL)

## Troubleshooting

### Backend won't start / Database connection error

**Error:** `Error initializing database`
**Solution:** 
- Verify your `DATABASE_URL` in `backend/.env` is correct
- Make sure you copied the complete connection string from Neon
- Check that your Neon project is active

### Frontend shows "Failed to load expenses"

**Error message in the UI or console**
**Solution:**
- Make sure the backend server is running on port 3000
- Check that `VITE_API_URL` in `frontend/.env` is set to `http://localhost:3000`
- Restart the frontend dev server after changing `.env` files

### Port already in use

**Error:** `EADDRINUSE: address already in use :::3000`
**Solution:**
- Another application is using port 3000
- Either stop that application or change the port in `backend/.env`:
  ```
  PORT=3001
  ```
  And update frontend `.env`:
  ```
  VITE_API_URL=http://localhost:3001
  ```

## API Testing (Optional)

You can test the API endpoints directly using curl or Postman:

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Get All Expenses
```bash
curl http://localhost:3000/api/expenses
```

### Add Expense
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{"paidBy": 1, "amount": 150.50, "description": "Test expense"}'
```

### Delete Expense (replace :id with actual ID)
```bash
curl -X DELETE http://localhost:3000/api/expenses/1
```

## Success Checklist

- [ ] Backend server starts without errors
- [ ] Database connection successful
- [ ] Frontend loads at http://localhost:5173/
- [ ] Can add expenses
- [ ] Expenses appear in the dashboard
- [ ] Can delete expenses
- [ ] Dashboard calculations update correctly
- [ ] Data persists after refresh
- [ ] No console errors in browser

If all items are checked, congratulations! Your setup is working perfectly! 🎉
