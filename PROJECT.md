# Expense Manager - Project Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Authentication Flow](#authentication-flow)
6. [Database Schema](#database-schema)
7. [Settlement Calculation Logic](#settlement-calculation-logic)
8. [API Endpoints](#api-endpoints)
9. [Setup & Installation](#setup--installation)
10. [Deployment](#deployment)
11. [Security](#security)
12. [Testing](#testing)

---

## Overview

A full-stack expense tracking application with Google OAuth authentication, real-time settlement calculations, and comprehensive audit logging.

### Key Features
- **Google Authentication**: Secure JWT-based login with Google OAuth 2.0
- **Expense Management**: Full CRUD operations for expenses
- **Activity Log**: Complete audit trail of all user actions
- **Settlement Calculations**: Fair share calculation with optimized payment plans
- **User Tracking**: Track who added, edited, or deleted each expense
- **Data Persistence**: PostgreSQL database via Neon (Serverless)

---

## Architecture

### System Design

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │   Backend    │ ──────> │  PostgreSQL │
│  (React +   │  HTTPS  │  (Express +  │   SSL   │    (Neon)   │
│ Material-UI)│ <────── │  Node.js)    │ <────── │             │
└─────────────┘         └──────────────┘         └─────────────┘
       │                       │
       │                       ├─ JWT Auth (Bearer tokens)
       │                       ├─ Rate Limiting
       │                       ├─ CORS Protection
       │                       └─ Activity Logging
       │
       └─ Google OAuth 2.0
```

### Backend Code Organization

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # DB connection & table initialization
│   │   └── passport.js      # OAuth strategy configuration
│   ├── db/
│   │   └── schema.js        # Drizzle ORM schemas
│   ├── middleware/
│   │   ├── auth.js          # JWT & session authentication
│   │   └── logger.js        # Request/response logging
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── expenses.js      # Expense CRUD operations
│   │   ├── settlement.js    # Calculation endpoints
│   │   └── activity.js      # Activity log endpoints
│   ├── services/
│   │   └── settlement.js    # Business logic for calculations
│   ├── utils/
│   │   ├── logger.js        # Structured logging utility
│   │   └── jwt.js           # JWT token generation/verification
│   └── app.js               # Express app configuration
├── tests/
│   └── settlement-new-logic.test.js  # 20 comprehensive tests
├── index.js                 # Application entry point
└── vercel.json             # Vercel deployment config
```

### Frontend Code Organization

```
frontend/
├── src/
│   ├── components/
│   │   ├── ActivityList.jsx       # Reusable activity list
│   │   ├── ActivityLogDialog.jsx  # Activity quick view dialog
│   │   ├── AddExpenseForm.jsx     # Expense creation form
│   │   ├── EditExpenseDialog.jsx  # Expense edit dialog
│   │   ├── ExpenseList.jsx        # Expense list with actions
│   │   ├── Header.jsx             # App header with user menu
│   │   ├── Layout.jsx             # Tab navigation layout
│   │   ├── LoginPage.jsx          # Google OAuth login page
│   │   ├── PersonView.jsx         # Group/person selector
│   │   ├── SettlementsView.jsx    # Settlement display
│   │   ├── SummaryCards.jsx       # Total/cost summary cards
│   │   └── SummaryTable.jsx       # Settlement table
│   ├── pages/
│   │   ├── ActivityPage.jsx       # Activity log page
│   │   ├── DashboardPage.jsx      # Main dashboard
│   │   ├── ExpensesPage.jsx       # Expense management page
│   │   └── SettlementsPage.jsx    # Settlement view page
│   ├── hooks/
│   │   ├── useActivities.js       # Activity data hook
│   │   ├── useAuth.js             # Authentication hook
│   │   ├── useExpenses.js         # Expense data hooks
│   │   └── useSettlements.js      # Settlement data hooks
│   ├── utils/
│   │   └── auth.js                # Token management utilities
│   ├── App.jsx                    # Main app component
│   └── main.jsx                   # React entry point
└── vite.config.js                 # Vite configuration
```

---

## Tech Stack

### Frontend
- **React 19**: UI framework
- **Material-UI (MUI)**: Component library
- **Vite 7**: Build tool and dev server
- **TanStack Query**: Data fetching and caching
- **React Router**: Client-side routing

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **Neon PostgreSQL**: Serverless database
- **Drizzle ORM**: Type-safe database access
- **Passport.js**: Google OAuth 2.0
- **JWT**: Token-based authentication
- **Express Rate Limit**: API protection

---

## Project Structure

### Design Principles
1. **Separation of Concerns**: Routes, services, and middleware in separate files
2. **Single Responsibility**: Each module has one clear purpose
3. **DRY (Don't Repeat Yourself)**: Shared components and utilities
4. **Self-Documenting Code**: Clear names, no inline comments needed
5. **Test-Driven Development**: Comprehensive test coverage

---

## Authentication Flow

### JWT-Based Authentication (Recommended)

```
1. User clicks "Sign in with Google"
   ↓
2. Frontend → GET /api/auth/google
   ↓
3. Backend redirects to Google OAuth
   ↓
4. User authenticates with Google
   ↓
5. Google → Backend callback with user data
   ↓
6. Backend generates JWT token with user info
   ↓
7. Backend → Frontend redirect with #token=<jwt>
   ↓
8. Frontend extracts token from URL hash
   ↓
9. Frontend stores token in localStorage
   ↓
10. Frontend makes authenticated requests with:
    Authorization: Bearer <token>
```

### Security Features
- **URL Hash Transmission**: Tokens passed via `#token=...` (not query params) to avoid server logs
- **localStorage**: Token stored client-side for subsequent requests
- **Bearer Token**: Standard Authorization header format
- **7-Day Expiry**: Configurable via JWT_EXPIRY environment variable
- **Production Security**: JWT_SECRET required in production (no defaults)

### Session-Based Authentication (Backwards Compatible)
- HTTP-only cookies with SameSite protection
- Express session management
- Fallback when JWT not present

---

## Database Schema

### Users Table
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
```

### Expenses Table
```sql
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
```

### Activity Log Table
```sql
CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,        -- CREATE, UPDATE, DELETE, DELETE_ALL
  entity_type VARCHAR(50) NOT NULL,    -- expense, user, etc.
  entity_id INTEGER,
  details JSONB,                        -- Action-specific data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Settlement Calculation Logic

### Business Rules
- **Total People**: 21 people across 9 groups
- **Fair Share Formula**: `(Total Expense / 21) × Group Size`
- **Balance**: `Amount Paid - Fair Share`

### Group Breakdown
- **Other Family** (External): 3 people
- **Subhojit Konar** (Internal): 3 people
- **Ravi Ranjan Verma** (Internal): 3 people
- **6 other groups** (Internal): 2 people each

### Calculation Example
If total expense is ₹2100:
- Cost per person = ₹2100 ÷ 21 = ₹100
- Other Family (3 people): Fair share = ₹100 × 3 = ₹300
- Group with 2 people: Fair share = ₹100 × 2 = ₹200

### Optimized Settlements
Uses greedy algorithm to minimize transactions:
1. Sort groups by balance (positive to negative)
2. Match highest creditor with highest debtor
3. Create transaction for min(creditor_balance, abs(debtor_balance))
4. Repeat until all balances settled

**Result**: Minimal number of transactions to settle all debts

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/auth/google` | No | Initiate OAuth login |
| GET | `/api/auth/google/callback` | No | OAuth callback |
| GET | `/api/auth/user` | Yes | Get current user |
| GET | `/api/auth/logout` | Yes | Logout user |

### Expenses
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/expenses` | No | List all expenses |
| POST | `/api/expenses` | Yes | Create expense |
| PUT | `/api/expenses/:id` | Yes | Update expense |
| DELETE | `/api/expenses/:id` | Yes | Delete expense |
| DELETE | `/api/expenses` | Yes | Delete all expenses |

### Settlements
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/settlement` | No | Get settlement data |
| GET | `/api/settlement/optimized` | No | Get optimized plan |
| GET | `/api/groups` | No | List all groups |

### Activity Log
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/activity` | No | Get activity log (limit/offset params) |

### Health Check
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/health` | No | Health check |

---

## Setup & Installation

### Prerequisites
- Node.js v18+
- Neon PostgreSQL account (free tier available)
- Google Cloud Platform account (for OAuth)

### 1. Clone Repository
```bash
git clone https://github.com/konarsubhojit/ideal-sniffle.git
cd ideal-sniffle
```

### 2. Setup Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 Client ID:
   - Type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Client Secret

### 3. Setup Neon Database
1. Go to [Neon Console](https://console.neon.tech)
2. Create new project
3. Copy connection string

### 4. Configure Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your values:
# DATABASE_URL=your_neon_connection_string
# GOOGLE_CLIENT_ID=your_client_id
# GOOGLE_CLIENT_SECRET=your_client_secret
# JWT_SECRET=your_random_secret_32plus_chars
# SESSION_SECRET=your_random_secret_32plus_chars

npm install
npm start
```

### 5. Configure Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env:
# VITE_API_URL=http://localhost:3000

npm install
npm run dev
```

### 6. Access Application
Open browser to `http://localhost:5173`

---

## Deployment

### Vercel Deployment (Recommended)

#### Backend Deployment
1. Import GitHub repo to Vercel
2. Set Root Directory: `backend`
3. Add environment variables:
   - `DATABASE_URL`
   - `NODE_ENV=production`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL=https://your-backend.vercel.app/api/auth/google/callback`
   - `JWT_SECRET` (32+ chars)
   - `SESSION_SECRET` (32+ chars)
   - `FRONTEND_URL=https://your-frontend.vercel.app`
   - `ALLOWED_ORIGINS=https://your-frontend.vercel.app`
4. Deploy
5. Update Google OAuth redirect URIs with production URL

#### Frontend Deployment
1. Import same GitHub repo to Vercel
2. Set Root Directory: `frontend`
3. Add environment variable:
   - `VITE_API_URL=https://your-backend.vercel.app`
4. Deploy
5. Update backend `ALLOWED_ORIGINS` with frontend URL

### Production Checklist
- [ ] Database configured on Neon
- [ ] Strong JWT_SECRET set (32+ chars)
- [ ] Strong SESSION_SECRET set (32+ chars)
- [ ] Google OAuth URLs updated for production
- [ ] CORS origins properly configured
- [ ] Both deployments successful
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Health endpoint responding: `/api/health`

---

## Security

### Implemented Protections

#### 1. Authentication & Authorization
- **JWT Tokens**: Modern token-based auth via Authorization header
- **OAuth 2.0**: Google authentication
- **Dual Auth**: JWT (primary) + Session (fallback)
- **Protected Routes**: Auth required for data modifications
- **No Default Secrets**: Production requires explicit JWT_SECRET

#### 2. CSRF Protection
- **SameSite Cookies**: `sameSite: 'lax'`
- **httpOnly Flag**: Prevents XSS access to cookies
- **Secure Flag**: HTTPS-only in production

#### 3. Rate Limiting
- **API Endpoints**: 100 requests / 15 minutes
- **Auth Endpoints**: 10 requests / 15 minutes
- **Trust Proxy**: Configured for serverless environments

#### 4. Input Validation
- Parameter validation on all routes
- NaN checking for numeric inputs
- Type validation via Drizzle ORM
- SQL injection protection (parameterized queries)

#### 5. CORS Protection
- Whitelist-based origin validation
- Credentials only for trusted origins
- Development mode allows localhost

#### 6. Secure Token Transmission
- **URL Hash**: Tokens passed via `#token=...` (not query params)
- **Why**: Hash fragments not sent to server, don't appear in logs
- **Cleanup**: Token removed from URL after extraction

### Security Scan Results
- **CodeQL**: 0 vulnerabilities
- **Status**: ✅ SECURE
- **Last Scan**: December 2025

---

## Testing

### Backend Tests
```bash
cd backend
npm test
```

**Coverage**: 20 comprehensive tests
- Business rule verification
- Fair share calculations (6 tests)
- Balance calculations (4 tests)
- Complex scenarios (3 tests)
- Optimized settlements (2 tests)
- Edge cases (2 tests)

**Status**: ✅ 20/20 passing

### Test-Driven Development Approach
1. **Write tests first** for settlement logic
2. **Implement** simple, correct code
3. **Verify** all tests pass
4. **Refactor** for readability

### Manual Testing Checklist
- [ ] Add expense
- [ ] Edit expense
- [ ] Delete expense
- [ ] Reset all expenses
- [ ] View activity log
- [ ] Tab navigation (Dashboard, Expenses, Settlements, Activity)
- [ ] Google login/logout
- [ ] Data persistence after refresh

---

## Development Workflow

### Local Development
```bash
# Backend (Terminal 1)
cd backend
npm run dev      # With auto-reload

# Frontend (Terminal 2)
cd frontend
npm run dev
```

### Linting
```bash
# Frontend
cd frontend
npm run lint
```

### Building
```bash
# Frontend production build
cd frontend
npm run build
npm run preview  # Preview production build
```

---

## Troubleshooting

### "Failed to load expenses" Error
1. Verify backend is running on port 3000
2. Check `VITE_API_URL` in frontend `.env`
3. Verify `DATABASE_URL` in backend `.env`
4. Check browser console for CORS errors

### Authentication Issues
1. Verify Google OAuth credentials
2. Check redirect URIs in Google Console
3. Ensure `JWT_SECRET` is set in production
4. Clear localStorage and retry login

### Database Connection Errors
1. Verify Neon database is active
2. Check connection string includes `?sslmode=require`
3. Ensure database allows connections from your IP

---

## Contributing

### Code Style
- Self-documenting code (no inline comments)
- Meaningful variable/function names
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)

### Before Committing
1. Run linter
2. Run tests
3. Test manually
4. Update documentation if needed

---

## License

MIT License - See LICENSE file for details

---

## Support

For issues or questions:
1. Check this documentation
2. Verify environment variables
3. Check backend logs
4. Open GitHub issue if problem persists
