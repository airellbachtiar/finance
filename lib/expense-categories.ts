// A fixed list keeps entry consistent across the household (no "Groceries"
// vs "groceries" vs "Grocery" fragmenting what's really one category), while
// "Other" plus a free-text field keeps anything unanticipated expressible.
export const EXPENSE_CATEGORIES = [
  'Rent',
  'Utilities',
  'Groceries',
  'Dining Out',
  'Transportation',
  'Household Supplies',
  'Health & Medical',
  'Insurance',
  'Personal Care',
  'Entertainment',
  'Subscriptions',
  'Travel',
  'Education',
  'Gifts & Donations',
  'Other',
] as const
