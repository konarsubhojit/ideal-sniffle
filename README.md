# Expense Manager

A full-stack expense tracking application with React + Material UI frontend and Node.js + Express + Neon PostgreSQL backend.

## Features

- **Clean & Modern UI**: Built with Material UI components for a professional look
- **Expense Tracking**: Add expenses with who paid and amount
- **Live Settlement Dashboard**: Real-time calculation of who owes what
- **Fair Share Calculation**: Sophisticated algorithm for splitting costs
- **Data Persistence**: PostgreSQL database via Neon for reliable storage
- **RESTful API**: Node.js/Express backend for data management

## Tech Stack

### Frontend
- React 19
- Material UI (MUI)
- Vite 7

### Backend
- Node.js with Express
- Neon PostgreSQL (Serverless)
- REST API

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

4. **Configure environment variables**
   
   Backend (.env file in `backend/` directory):
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env` and add your Neon database URL:
   ```
   DATABASE_URL=postgresql://your-neon-host/database?sslmode=require
   PORT=3000
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

5. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   
   The backend will:
   - Start on port 3000 (or your configured PORT)
   - Automatically create the required database table
   - Be ready to accept API requests

6. **Start the frontend (in a new terminal)**
   ```bash
   cd frontend
   npm run dev
   ```
   
   The frontend will start on http://localhost:5173

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Add new expense
- `DELETE /api/expenses/:id` - Delete specific expense
- `DELETE /api/expenses` - Reset all expenses

## Database Schema

```sql
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  paid_by INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Calculation Logic

The app uses a specific algorithm for fair expense splitting:

1. **Total Billable Heads**: 27 people (28 total minus one 5-year-old who is free)
2. **Base Unit Cost**: Total Expense ÷ 27
3. **Other Family** (External): Pays Base Unit Cost × 3 (only for their 3 members)
4. **Main Family** (Internal): 18 paying members split the remaining cost equally, subsidizing 6 non-paying staff/children

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

## License

This project is licensed under the MIT License.
