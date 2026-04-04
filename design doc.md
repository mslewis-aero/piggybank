# Piggy Bank — Mobile App Design Document

## 1. Overview

Piggy Bank is a mobile app for parents to track allowance and spending for their young children who don't have their own devices. Parents can manage multiple kids, add or remove money with categorized reasons, and view simple insights into earning and spending patterns.

**Target platforms:** Android (primary testing via Expo Go), iOS compatible
**Framework:** React Native with Expo (managed workflow)
**Data storage:** Local only (on-device)
**Auth/security:** None — relies on device-level security

---

## 2. Tech Stack

| Layer            | Technology                                  |
| ---------------- | ------------------------------------------- |
| Framework        | React Native + Expo SDK (latest stable)     |
| Routing          | Expo Router (file-based)                    |
| Local storage    | AsyncStorage for app data (JSON serialized) |
| State management | React Context + useReducer                  |
| Charts           | react-native-chart-kit or victory-native    |
| Icons            | @expo/vector-icons                          |
| UUID generation  | expo-crypto or uuid                         |

### Why these choices

- **Expo managed workflow** enables rapid iteration via Expo Go on a physical Android device with no native build step.
- **AsyncStorage** is sufficient for structured JSON data at this scale (a family's transaction history will never approach storage limits).
- **React Context + useReducer** keeps state management simple without introducing Redux or Zustand for an app of this size.

---

## 3. Data Model

### 3.1 Category

```typescript
type CategoryType = "earning" | "spending";

interface Category {
  id: string; // UUID
  name: string; // e.g. "Clean Room", "Toys"
  type: CategoryType; // "earning" or "spending"
  emoji?: string; // optional emoji icon for quick visual ID
}
```

Categories are **shared across all kids**. The app ships with a small set of sensible defaults the parent can edit:

**Default earning categories:** Chores, Homework, Good Behavior, Helping Out, Other
**Default spending categories:** Toys, Candy/Snacks, Savings Withdrawal, Other

The "Other" category in each type is **permanent and cannot be deleted**. It includes a free-text note field at transaction time.

### 3.2 Kid Profile

```typescript
interface Kid {
  id: string; // UUID
  name: string;
  age: number;
  avatarId: string; // references a pre-made avatar from the bundled set
  balance: number; // current balance in dollars, computed from transactions
  createdAt: string; // ISO date
}
```

### 3.3 Transaction

```typescript
type TransactionType = "deposit" | "withdrawal";

interface Transaction {
  id: string; // UUID
  kidId: string; // FK to Kid
  type: TransactionType;
  amount: number; // always positive; type determines direction
  categoryId: string; // FK to Category
  note?: string; // optional free-text (required when category is "Other")
  createdAt: string; // ISO date
}
```

### 3.4 App State Shape

```typescript
interface AppState {
  kids: Kid[];
  categories: Category[];
  transactions: Transaction[];
}
```

The entire state is serialized to AsyncStorage as a single JSON blob under key `@piggybank_data`. On every state mutation, persist the full state. On app launch, hydrate from storage.

---

## 4. Pre-Made Avatars

Bundle 12–16 simple, colorful cartoon avatar icons. These should be gender-neutral, kid-friendly illustrations. Suggested set:

- Animals: bear, bunny, cat, dog, fox, owl, penguin, panda
- Fun objects: rocket, star, rainbow, unicorn, dinosaur, robot, butterfly, lion

Store as local image assets in `assets/avatars/`. Reference by a string ID that maps to the require() path.

---

## 5. Screen Map & Navigation

The app uses a bottom tab navigator with 3 tabs:

```
[Home]        [Activity]        [Settings]
```

### Full screen list:

| Screen            | Route                  | Tab       | Description                                                               |
| ----------------- | ---------------------- | --------- | ------------------------------------------------------------------------- |
| Home              | `/`                    | Home      | Grid of kid cards showing name, avatar, balance                           |
| Add Kid           | `/add-kid`             | — (modal) | Form: name, age, avatar picker                                            |
| Edit Kid          | `/edit-kid/[id]`       | — (modal) | Same form, pre-filled, with delete option                                 |
| Kid Detail        | `/kid/[id]`            | — (push)  | Selected kid's balance, quick add/remove, recent transactions             |
| Add Money         | `/kid/[id]/deposit`    | — (modal) | Amount input, category picker, optional note                              |
| Remove Money      | `/kid/[id]/withdrawal` | — (modal) | Amount input, category picker, optional note, insufficient funds warning  |
| Kid Insights      | `/kid/[id]/insights`   | — (push)  | Pie/bar charts for earning & spending breakdown                           |
| Activity Log      | `/activity`            | Activity  | Chronological feed of all transactions across all kids, filterable by kid |
| Settings          | `/settings`            | Settings  | Manage categories, app info                                               |
| Manage Categories | `/settings/categories` | — (push)  | Add, edit, delete earning & spending categories                           |

---

## 6. Screen-by-Screen Specifications

### 6.1 Home Screen

**Layout:**

- Top: App title "Piggy Bank" with a small piggy bank icon
- Body: Grid (2 columns) of kid cards
- Each card shows: avatar image, kid name, current balance (large, prominent)
- Tapping a card navigates to Kid Detail
- Bottom-right FAB (floating action button): "+" to add a new kid
- Empty state: friendly illustration + "Add your first piggy bank!" prompt

### 6.2 Add / Edit Kid (Modal)

**Fields:**

- Name (text input, required)
- Age (number picker or stepper, 1–17)
- Avatar (horizontally scrollable grid of avatar options, tap to select, selected one gets a visible highlight ring)

**Buttons:**

- Save (primary)
- Cancel
- Delete (edit mode only, with confirmation dialog: "This will delete [name]'s account and all transaction history. Are you sure?")

### 6.3 Kid Detail Screen

**Layout:**

- Top section: Large avatar, kid name, age
- Balance displayed prominently in the center (large font, dollar format)
- Two side-by-side action buttons: "+ Add Money" (green) and "- Remove Money" (red)
- "View Insights" link/button
- Below: "Recent Activity" section showing last 10 transactions as a list
  - Each row: emoji + category name, amount (+/- with color coding green/red), date, note (if any)
- "See All" link at bottom of recent activity navigates to Activity Log filtered to this kid

### 6.4 Add Money / Remove Money (Modal)

**Layout:**

- Title: "Add Money to [Kid Name]" or "Remove Money from [Kid Name]"
- Amount input: large numeric input with dollar sign, numeric keyboard. Support dollars and cents.
- Category picker: horizontally scrollable chips or a simple list of relevant categories (earning categories for deposits, spending categories for withdrawals). One must be selected.
- Note field: text input, optional. If "Other" category is selected, this field becomes required and gets visual emphasis.
- Save button (disabled until amount > 0 and category selected)

**Withdrawal-specific behavior:**

- If the entered amount exceeds the kid's balance, show a warning: "This will result in a negative balance of -$X.XX"
- Allow it to proceed (don't block — parent may want to track a debt/advance)

### 6.5 Kid Insights Screen

**Layout:**

- Top: Kid name + avatar
- Toggle or tab: "Earnings" | "Spending"
- Pie chart (or horizontal bar chart) showing category breakdown as percentages
  - Use distinct, kid-friendly colors for each category
  - Show category name + percentage + dollar total
- Below chart: ranked list view of same data (for accessibility)
  - "#1 Chores — $45.00 (38%)"
- Time range: show all-time data for MVP (no date filtering)
- If no data yet: friendly empty state "No [earnings/spending] recorded yet!"

### 6.6 Activity Log (Tab)

**Layout:**

- Filter bar at top: horizontal scrollable chips for "All Kids" + one chip per kid (avatar + name). Tapping filters the list.
- Chronological list (newest first) of all transactions
- Each row: kid avatar (small), kid name, category emoji + name, amount (green +/red -), date, note snippet
- Group by date with sticky date headers ("Today", "Yesterday", "March 28, 2026")

### 6.7 Settings Screen

**Layout:**

- Section: "Categories"
  - "Manage Earning Categories" → navigates to category list
  - "Manage Spending Categories" → navigates to category list
- Section: "About"
  - App version
  - "Made with ❤️" or similar

### 6.8 Manage Categories Screen

**Layout:**

- Title: "Earning Categories" or "Spending Categories"
- List of current categories with emoji and name
- "Other" category shown but visually indicated as non-deletable (greyed-out delete, or no delete icon)
- Swipe-to-delete or delete icon on each row (with confirmation)
- "Add Category" button at bottom
  - Inline form or modal: name text input + optional emoji picker
- Reordering is not needed for MVP

---

## 7. Design Principles & Visual Style

### General

- **Simplicity first.** Every screen should be immediately understandable. Minimize cognitive load.
- **Kid-friendly but parent-operated.** Use warm, playful colors and rounded shapes, but keep the UX adult-oriented (no gamification, no child-facing features).
- **Touch targets:** Minimum 44x44pt for all interactive elements.

### Color Palette

- Primary: Warm coral/salmon (#FF6B6B) or friendly blue (#4ECDC4)
- Positive/deposit: Green (#2ECC71)
- Negative/withdrawal: Soft red (#E74C3C)
- Background: Light warm gray (#F8F9FA)
- Cards: White (#FFFFFF) with subtle shadow
- Text: Dark gray (#2D3436)

### Typography

- Use system fonts (San Francisco on iOS, Roboto on Android) via the default React Native font stack
- Balance amounts: Bold, 28–36pt
- Card titles: Semi-bold, 18pt
- Body/secondary: Regular, 14–16pt

### Animations

- Keep animations subtle and fast (200-300ms)
- Card press: gentle scale-down on press
- Modal: slide up from bottom
- Balance change: brief number animation when returning from a transaction

---

## 8. State Management Architecture

```
AppContext (React Context)
  ├── state: AppState
  ├── dispatch: (action) => void
  │
  ├── Actions:
  │   ├── ADD_KID
  │   ├── EDIT_KID
  │   ├── DELETE_KID
  │   ├── ADD_TRANSACTION
  │   ├── ADD_CATEGORY
  │   ├── EDIT_CATEGORY
  │   ├── DELETE_CATEGORY
  │   └── LOAD_STATE (hydrate from storage)
  │
  └── Derived (via selectors/hooks):
      ├── getKidBalance(kidId) → computed from transactions
      ├── getKidTransactions(kidId) → filtered & sorted
      ├── getInsights(kidId, type) → category breakdown
      └── getAllTransactions() → sorted, optionally filtered
```

**Balance is always computed, never stored directly.** The `balance` field on `Kid` is a convenience cache recomputed on every transaction mutation. Source of truth is always `sum(deposits) - sum(withdrawals)` for that kid.

### Persistence Hook

```typescript
// useEffect in AppProvider
// On every state change, persist to AsyncStorage
useEffect(() => {
  AsyncStorage.setItem("@piggybank_data", JSON.stringify(state));
}, [state]);
```

---

## 9. Currency Handling

- All amounts stored as **numbers (floats)** representing dollars
- Display with `toFixed(2)` and prepend "$"
- Input: allow decimal entry, validate to max 2 decimal places
- No multi-currency support needed for MVP

---

## 10. Edge Cases & Validation

| Scenario                                       | Behavior                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| Withdrawal > balance                           | Show warning, allow it (balance goes negative)                                     |
| Amount of $0                                   | Disable save button                                                                |
| Very large amount (>$9,999.99)                 | Allow it, ensure display doesn't overflow                                          |
| Deleting a kid                                 | Confirmation dialog, deletes kid + all their transactions                          |
| Deleting a category with existing transactions | Reassign those transactions to "Other" category, show confirmation explaining this |
| No kids added yet                              | Show empty state with add prompt                                                   |
| No transactions for a kid                      | Show empty state in detail view and insights                                       |
| App killed mid-write                           | AsyncStorage writes are atomic per key, risk is minimal                            |
| Very long note text                            | Cap at 200 characters with character counter                                       |
| Very long kid name                             | Cap at 20 characters                                                               |
| Duplicate kid names                            | Allow (siblings could share names)                                                 |

---

## 11. File & Folder Structure

```
piggy-bank/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root layout (tab navigator)
│   ├── index.tsx                 # Home screen
│   ├── activity.tsx              # Activity log tab
│   ├── settings/
│   │   ├── index.tsx             # Settings screen
│   │   └── categories.tsx        # Manage categories
│   ├── add-kid.tsx               # Add kid modal
│   ├── edit-kid/
│   │   └── [id].tsx              # Edit kid modal
│   └── kid/
│       └── [id]/
│           ├── index.tsx         # Kid detail
│           ├── deposit.tsx       # Add money modal
│           ├── withdrawal.tsx    # Remove money modal
│           └── insights.tsx      # Insights screen
├── components/
│   ├── KidCard.tsx               # Home screen kid card
│   ├── TransactionRow.tsx        # Single transaction list item
│   ├── CategoryPicker.tsx        # Category chip selector
│   ├── AvatarPicker.tsx          # Avatar selection grid
│   ├── AmountInput.tsx           # Dollar amount input
│   ├── EmptyState.tsx            # Reusable empty state
│   └── InsightChart.tsx          # Pie/bar chart component
├── context/
│   ├── AppContext.tsx            # Context provider + reducer
│   └── actions.ts                # Action type definitions
├── hooks/
│   ├── useKid.ts                 # Kid-specific selectors
│   ├── useTransactions.ts        # Transaction queries
│   └── useInsights.ts            # Insight computations
├── utils/
│   ├── storage.ts                # AsyncStorage helpers
│   ├── currency.ts               # Formatting helpers
│   └── defaults.ts               # Default categories
├── assets/
│   └── avatars/                  # 12-16 bundled avatar images
├── constants/
│   └── theme.ts                  # Colors, spacing, typography
├── app.json                      # Expo config
├── package.json
└── tsconfig.json
```

---

## 12. Testing with Expo Go

1. `npx create-expo-app piggy-bank --template blank-typescript`
2. Install dependencies: `npx expo install @react-native-async-storage/async-storage react-native-chart-kit react-native-svg expo-router`
3. Run: `npx expo start`
4. Scan QR code with Expo Go on Android device
5. Hot reload on save for fast iteration

---

## 13. Future Enhancements (Out of Scope for MVP)

These are explicitly **not** part of the initial build but documented for future reference:

- Recurring allowance (auto-deposit on a schedule)
- Savings goals per kid ("saving for a bike — $45/$60")
- Cloud sync across devices (Firebase or Supabase)
- PIN/biometric lock for the app
- Export transaction history as CSV
- Weekly summary notifications
- Themes / dark mode
- Kid-facing "view only" mode for older children
