# Backend Code Organization

## Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # Database connection and initialization
│   │   └── passport.js   # Passport.js Google OAuth configuration
│   ├── db/
│   │   └── schema.js     # Drizzle ORM schema definitions
│   ├── middleware/
│   │   ├── auth.js       # Authentication middleware
│   │   └── logger.js     # Request logging middleware
│   ├── routes/
│   │   ├── auth.js       # Authentication routes
│   │   ├── expenses.js   # Expense CRUD routes
│   │   ├── settlement.js # Settlement calculation routes
│   │   └── activity.js   # Activity log routes
│   ├── services/
│   │   └── settlement.js # Settlement calculation business logic
│   ├── utils/
│   │   └── logger.js     # Logging utility
│   └── app.js            # Express app configuration
├── tests/
│   └── settlement-new-logic.test.js  # TDD tests for settlement logic
├── index.js              # Entry point
├── drizzle.config.js     # Drizzle ORM configuration
└── package.json
```

## Key Components

### Entry Point (`index.js`)
- Initializes the server
- Loads environment variables
- Creates database tables on startup
- Handles production vs development modes

### App Configuration (`src/app.js`)
- Configures Express middleware
- Sets up CORS
- Configures sessions and passport
- Mounts all routes
- Error handling

### Database (`src/config/database.js` & `src/db/schema.js`)
- Uses Drizzle ORM for type-safe database access
- Schema definitions for users, expenses, and activity_log tables
- Database initialization and table creation

### Routes
- **auth.js**: Google OAuth login/logout, user session
- **expenses.js**: Full CRUD operations for expenses
- **settlement.js**: Calculate settlements and optimized transactions
- **activity.js**: Retrieve activity logs

### Services (`src/services/settlement.js`)
- Business logic for settlement calculations
- Each group pays for ALL members in their group
- Fair share = (total expense / 21 total people) × group size

### Tests
- Comprehensive TDD tests for settlement logic
- 20 tests covering all edge cases and business rules
- Tests verify the correct implementation

## Settlement Calculation Logic

### Business Rules
- 9 groups total: 1 External (Other Family), 8 Internal (Main Family)
- 21 total people across all groups
- Each group head pays for ALL members in their group

### Formula
```
costPerPerson = totalExpense / 21
fairShare = costPerPerson × groupSize
balance = totalPaid - fairShare
```

### Examples

**Example 1: Total expense 2100, Other Family pays all**
- Cost per person = 2100 / 21 = 100
- Other Family (3 people): Fair share = 100 × 3 = 300
- Other Family paid 2100, owes 300, balance = +1800 (creditor)
- All others owe their share (debtors)

**Example 2: Multiple payers**
- Total expense = 2100
- Group 1 (3 people) pays 600: Fair share = 300, balance = +300
- Group 2 (3 people) pays 900: Fair share = 300, balance = +600
- Group 4 (2 people) pays 600: Fair share = 200, balance = +400
- Groups 3, 5-9 pay 0: Each owes their fair share

## Testing

Run tests with:
```bash
npm test
```

All settlement calculation logic is tested with:
- Business rule verification
- Fair share calculations
- Balance calculations
- Edge cases (zero expenses, single payer, etc.)
- Optimized settlement transactions

## Environment Variables

See `.env.example` for required configuration.

## Database Schema

### Users
- Google OAuth authenticated users
- Tracks login history

### Expenses
- Tracks who paid, amount, description
- Audit trail: created_by, updated_by, timestamps

### Activity Log
- Complete audit trail of all actions
- Stores user, action type, entity, and details
