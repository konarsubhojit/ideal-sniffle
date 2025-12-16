# Expense Manager

A full-stack expense tracking application with React + Material UI frontend and Node.js + Express + Neon PostgreSQL backend.

> **📚 Full Documentation**: See [PROJECT.md](./PROJECT.md) for complete architecture, setup, deployment, and API documentation.

## Quick Start

### Prerequisites
- Node.js v18+
- [Neon PostgreSQL](https://neon.tech) account (free)
- [Google Cloud Platform](https://console.cloud.google.com) account (for OAuth)

### 1. Clone & Install
```bash
git clone https://github.com/konarsubhojit/ideal-sniffle.git
cd ideal-sniffle

# Install frontend
cd frontend && npm install

# Install backend
cd ../backend && npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
DATABASE_URL=your_neon_connection_string
PORT=3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
JWT_SECRET=your_random_secret_32plus_chars
SESSION_SECRET=your_random_secret_32plus_chars
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3000
```

### 3. Run
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open `http://localhost:5173`

## Features

- ✅ **Google Authentication** - JWT-based secure login
- ✅ **Role-Based Access Control** - Admin, Contributor, Reader roles with proper authorization
- ✅ **Expense Management** - Full CRUD operations with soft-delete
- ✅ **Configurable Groups** - Database-driven groups instead of hardcoded values
- ✅ **Activity Log** - Complete audit trail
- ✅ **Settlement Calculations** - Fair share with optimized payment plans
- ✅ **User Tracking** - Track who added/edited/deleted expenses
- ✅ **Data Persistence** - PostgreSQL via Neon
- ✅ **Enhanced UX** - Toast notifications, better dialogs, role badges

## Tech Stack

**Frontend**: React 19, Material-UI, Vite, TanStack Query  
**Backend**: Node.js, Express, Neon PostgreSQL, Drizzle ORM, Passport.js  
**Auth**: Google OAuth 2.0 + JWT

## Project Structure

```
.
├── frontend/           # React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── utils/       # Utilities
│   └── package.json
├── backend/            # Node.js API
│   ├── src/
│   │   ├── config/      # Database & OAuth config
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth, logging & authorization
│   │   └── utils/       # Utilities & migrations
│   ├── scripts/        # Management scripts (role management)
│   ├── tests/          # Test files (20 tests)
│   └── package.json
├── RBAC_GUIDE.md       # Role-based access control documentation
├── DEPLOYMENT_CHECKLIST.md  # Deployment guide
├── PROJECT.md          # Complete documentation
└── README.md           # This file
```

## Documentation

- **[PROJECT.md](./PROJECT.md)** - Complete project documentation including:
  - Architecture & system design
  - Authentication flow
  - Database schema
  - Settlement calculation logic
  - API endpoints reference
  - Deployment guide
  - Security best practices
  - Testing guide
  - Troubleshooting

## API Endpoints

See [PROJECT.md - API Endpoints](./PROJECT.md#api-endpoints) for complete API documentation.

### Quick Reference
- **Auth**: `/api/auth/*` - Google OAuth login/logout
- **Expenses**: `/api/expenses` - CRUD operations (requires role)
- **Groups**: `/api/groups` - Group management (requires role)
- **Settlements**: `/api/settlement/*` - Calculations (requires role)
- **Activity**: `/api/activity` - Audit log (requires role)
- **Health**: `/api/health` - Health check

## Role Management

This app uses role-based access control. See [RBAC_GUIDE.md](./RBAC_GUIDE.md) for details.

### Quick Role Assignment

After first deployment, assign yourself as admin:

```bash
# Using the management script
cd backend
node scripts/manage-roles.js list
node scripts/manage-roles.js assign your-email@example.com admin

# Or via SQL in Neon console
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Roles
- **Admin** - Full access
- **Contributor** - Can create/edit/delete expenses and groups
- **Reader** - Read-only access
- **No role** - 403 Forbidden

## Deployment

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for step-by-step deployment guide.

Also see [PROJECT.md - Deployment](./PROJECT.md#deployment) for Vercel deployment details.

### Quick Deploy
1. Deploy backend to Vercel (set root: `backend`)
2. Deploy frontend to Vercel (set root: `frontend`)
3. Configure environment variables
4. Update Google OAuth redirect URIs
5. **IMPORTANT**: Assign admin role to at least one user (see Role Management above)

## Testing

```bash
cd backend
npm test  # Run 20 settlement calculation tests
```

**Status**: ✅ 20/20 tests passing

## License

MIT License

---

**For complete documentation, see [PROJECT.md](./PROJECT.md)**
