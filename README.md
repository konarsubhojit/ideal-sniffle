# Expense Manager

A full-stack expense tracking application with React + Material UI frontend and Node.js + Express + Neon PostgreSQL backend.

## Features

- **Google Authentication**: Secure login with Google OAuth to track who's making changes
- **Clean & Modern UI**: Built with Material UI components for a professional look
- **Expense Management**: Add, edit, and delete expenses with full CRUD operations
- **User Tracking**: Track who added, edited, or deleted each expense
- **Activity Log**: View complete history of all changes made by users
- **Live Settlement Dashboard**: Real-time calculation of who owes what (calculated on backend)
- **Fair Share Calculation**: Sophisticated algorithm for splitting costs
- **Optimized Settlements**: Minimizes number of transactions needed to settle all debts
- **Data Persistence**: PostgreSQL database via Neon for reliable storage
- **RESTful API**: Node.js/Express backend for all business logic and data management

## Tech Stack

### Frontend
- React 19
- Material UI (MUI)
- Vite 7

### Backend
- Node.js with Express
- Neon PostgreSQL (Serverless)
- Passport.js with Google OAuth 2.0
- Express Sessions for authentication
- REST API with full CRUD operations

## Project Structure

```
.
├── frontend/           # React frontend application
│   ├── src/           # Source files
│   ├── public/        # Static assets
│   ├── index.html     # HTML entry point
│   └── package.json   # Frontend dependencies
├── backend/           # Node.js backend API
│   ├── index.js       # Express server & routes
│   └── package.json   # Backend dependencies
├── README.md          # This file
├── TESTING.md         # Testing guide
└── UI_DOCUMENTATION.md # UI documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Neon PostgreSQL database account (free tier available at https://neon.tech)
- A Google Cloud Platform account for OAuth setup (free tier available at https://console.cloud.google.com)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/konarsubhojit/ideal-sniffle.git
   cd ideal-sniffle
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configure Google OAuth**
   
   a. Go to [Google Cloud Console](https://console.cloud.google.com)
   
   b. Create a new project or select an existing one
   
   c. Enable Google+ API
   
   d. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
   
   e. Configure OAuth consent screen with your app information
   
   f. Create OAuth 2.0 Client ID:
      - Application type: Web application
      - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` (for local development)
   
   g. Copy the Client ID and Client Secret
   
5. **Configure environment variables**
   
   Backend (.env file in `backend/` directory):
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env` and add your configuration:
   ```
   DATABASE_URL=postgresql://your-neon-host/database?sslmode=require
   PORT=3000
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   SESSION_SECRET=your_random_session_secret_here
   FRONTEND_URL=http://localhost:5173
   ```
   
   Frontend (.env file in `frontend/` directory):
   ```bash
   cd ../frontend
   cp .env.example .env
   ```
   
   Edit `frontend/.env`:
   ```
   VITE_API_URL=http://localhost:3000
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   
   The backend will:
   - Start on port 3000 (or your configured PORT)
   - Automatically create the required database tables (users, expenses, activity_log)
   - Initialize Google OAuth authentication
   - Be ready to accept API requests

7. **Start the frontend (in a new terminal)**
   ```bash
   cd frontend
   npm run dev
   ```
   
   The frontend will start on http://localhost:5173

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/user` - Get current authenticated user
- `GET /api/auth/logout` - Logout current user

### Expenses
- `GET /api/expenses` - Get all expenses (with creator/updater info)
- `POST /api/expenses` - Add new expense (requires authentication)
- `PUT /api/expenses/:id` - Update expense (requires authentication)
- `DELETE /api/expenses/:id` - Delete specific expense (requires authentication)
- `DELETE /api/expenses` - Reset all expenses (requires authentication)

### Calculations (Backend)
- `GET /api/settlement` - Get settlement calculations for all groups
- `GET /api/settlement/optimized` - Get optimized settlement transactions
- `GET /api/groups` - Get all groups/people

### Activity Log
- `GET /api/activity` - Get activity log with optional limit and offset

### Health
- `GET /api/health` - Health check and authentication status

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  paid_by INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Calculation Logic

**All calculations are now performed on the backend** for better performance and maintainability.

1. **Total Billable Heads**: 27 people (28 total minus one 5-year-old who is free)
2. **Base Unit Cost**: Total Expense ÷ 27
3. **Other Family** (External): Pays Base Unit Cost × 3 (only for their 3 members)
4. **Main Family** (Internal): 18 paying members split the remaining cost equally, subsidizing 6 non-paying staff/children
5. **Optimized Settlements**: Backend calculates the minimum number of transactions needed to settle all debts

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development (with auto-reload)
```bash
cd backend
npm run dev
```

### Build for Production
```bash
cd frontend
npm run build
```

### Preview Production Build
```bash
cd frontend
npm run preview
```

## Deployment

### Deploying to Vercel

This application is optimized for deployment on Vercel. Follow these steps:

#### Backend Deployment

1. **Push your code to GitHub** (if not already done)

2. **Import the backend project to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Set the **Root Directory** to `backend`

3. **Configure Environment Variables**
   
   In Vercel project settings, add these environment variables:
   ```
   DATABASE_URL=your_neon_database_connection_string
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=https://your-backend.vercel.app/api/auth/google/callback
   SESSION_SECRET=your_random_session_secret
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   ```
   
   > **Note**: 
   > - Get your DATABASE_URL from [Neon Console](https://console.neon.tech)
   > - Update Google OAuth redirect URIs in Google Cloud Console to include production URLs

4. **Deploy**
   - Vercel will automatically detect the configuration from `vercel.json`
   - Click "Deploy"
   - Note the deployment URL (e.g., `https://your-backend.vercel.app`)

#### Frontend Deployment

1. **Import the frontend project to Vercel**
   - In Vercel Dashboard, click "Add New" → "Project"
   - Import the same GitHub repository
   - Set the **Root Directory** to `frontend`

2. **Configure Environment Variables**
   
   In Vercel project settings, add:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```
   
   > Replace with your actual backend URL from step 4 above

3. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Deploy**
   - Click "Deploy"
   - Your app will be available at the provided URL

5. **Update Backend CORS**
   
   After frontend is deployed, update the backend's `ALLOWED_ORIGINS` environment variable:
   ```
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
   
   This ensures proper CORS configuration for production.

### Production Checklist

- [ ] Database is properly configured on Neon
- [ ] Backend environment variables are set in Vercel
- [ ] Frontend environment variable (`VITE_API_URL`) points to backend
- [ ] Backend `ALLOWED_ORIGINS` includes frontend URL
- [ ] Both deployments are successful
- [ ] Test the health endpoint: `https://your-backend.vercel.app/api/health`
- [ ] Test the frontend and verify it connects to the backend

### Logging

The backend includes comprehensive logging for:
- All incoming requests (method, path, query params, IP)
- All responses (status code, duration)
- Database operations (queries, errors)
- Application events (startup, errors, warnings)

Logs are output in JSON format for easy parsing and can be viewed in Vercel's deployment logs.

## License

This project is licensed under the MIT License.
