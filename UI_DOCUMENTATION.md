# Visual Documentation - New UI

## Overview

The expense manager has been redesigned with a clean, simple interface as requested.

## Screenshot

![Expense Manager UI](https://github.com/user-attachments/assets/243deadf-e210-4e79-9020-345c49d4f843)

## Layout Structure

### 1. Header (Top)
- **Title**: "Expense Manager" - Bold, prominent heading
- **Subtitle**: "Track and split expenses fairly" - Clear description
- Clean white background with subtle border

### 2. Main Content Area

#### Dashboard Section (Top of main area)
- **Heading**: "Dashboard - Who Owes Who"
- **Summary Cards**: Two side-by-side cards showing:
  - Total Expense (blue background)
  - Cost Per Head (purple background)
- **Settlement Table**: Clean table showing:
  - Person name with "Ext" badge for external members
  - Number of people in each group
  - Amount paid by each person
  - Fair share amount
  - Balance (color-coded: green for receiving, red for owing)

#### Add Expense Section (Below dashboard)
- **Heading**: "Add Expense"
- **Form Fields** (horizontal layout):
  - Who Paid? - Dropdown selector
  - Amount (₹) - Number input
  - Description - Optional text input
  - Add Expense - Blue action button
- Simple, single-row form for quick entry

#### Expense History Section (Bottom)
- **Heading**: "Expense History"
- **Reset All Button**: Red button in top-right (when expenses exist)
- **Expense List**: 
  - Each expense shown in a card with description, payer, amount, and delete button
  - Empty state message when no expenses

## Key Improvements

1. **Cleaner Layout**: Removed gradient backgrounds, using clean white cards on gray background
2. **Better Hierarchy**: Clear header at top, dashboard first, then action buttons
3. **Simplified Colors**: Using subtle background colors instead of heavy gradients
4. **Better Spacing**: More breathing room between sections
5. **Clearer Labels**: Simplified table headers and form labels
6. **Streamlined Form**: Horizontal layout for faster data entry
7. **Consistent Design**: All sections use similar card-based design

## User Flow

1. User sees the dashboard showing current state (who owes what)
2. User adds expenses using the simple form below
3. Dashboard updates in real-time with calculations
4. User can review expense history at the bottom
5. All data persists in PostgreSQL database
