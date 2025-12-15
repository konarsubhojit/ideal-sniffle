# Family Picnic Expense Manager

A React + Vite + Tailwind CSS application for managing and splitting expenses for family picnics with fair share calculations.

## Features

- **Expense Tracking**: Add expenses with details (who paid, amount, description)
- **Live Settlement Dashboard**: Real-time calculation of who owes what
- **Fair Share Calculation**: Sophisticated algorithm for splitting costs between "Other Family" and "Main Family" groups
- **Color-Coded Balances**: Green for amounts to receive, Red for amounts to pay
- **Expense Log**: View all expenses with ability to delete individual items
- **Reset Functionality**: Clear all data and start fresh

## Calculation Logic

The app uses a specific algorithm for fair expense splitting:

1. **Total Billable Heads**: 27 people (28 total minus one 5-year-old who is free)
2. **Base Unit Cost**: Total Expense ÷ 27
3. **Other Family** (External): Pays Base Unit Cost × 3 (only for their 3 members)
4. **Main Family** (Internal): 18 paying members split the remaining cost equally, subsidizing 6 non-paying staff/children

### Groups

- Other Family (3 people) - External
- Subhojit (3 people) - Internal
- Ravi Ranjan Verma (3 people) - Internal
- Abhijit Koner (2 people) - Internal
- Apurba Samanta (2 people) - Internal
- Gopal Samanta (2 people) - Internal
- Anupam Chakraborty (2 people) - Internal
- Arindra Sahana (2 people) - Internal
- Nupur Mondol (2 people) - Internal

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Tech Stack

- React 19
- Vite 7
- Tailwind CSS 4
- ESLint
