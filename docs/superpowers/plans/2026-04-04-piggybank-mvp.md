# Piggy Bank MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native Expo app for parents to track kids' allowance — add/remove money, categorize transactions, view insights.

**Architecture:** Expo Router file-based navigation with 3-tab layout (Home, Activity, Settings). State managed via React Context + useReducer, persisted to AsyncStorage as a single JSON blob. All balances computed from transactions.

**Tech Stack:** React Native, Expo SDK (managed), Expo Router, AsyncStorage, react-native-chart-kit, TypeScript

---

## File Structure

```
piggybank/                        # Project root (Expo app scaffolded here)
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
│   └── avatars/                  # Emoji-based avatars (no image files needed)
├── constants/
│   └── theme.ts                  # Colors, spacing, typography
└── types/
    └── index.ts                  # All TypeScript interfaces
```

**Avatar approach:** Instead of bundling 16 image files, we'll use emoji characters (🐻 🐰 🐱 🐶 🦊 🦉 🐧 🐼 🚀 ⭐ 🌈 🦄 🦕 🤖 🦋 🦁) rendered in large text. This eliminates asset management while keeping the playful feel. The `avatarId` maps to an index in this array.

---

### Task 1: Scaffold Expo Project & Git Init

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json` (via create-expo-app)
- Create: `types/index.ts`
- Create: `constants/theme.ts`

- [ ] **Step 1: Initialize git repo and commit existing files**

```bash
cd /workspaces/piggybank
git add .gitignore .devcontainer/ "design doc.md"
git commit -m "chore: initial commit with design doc and devcontainer"
```

- [ ] **Step 2: Scaffold Expo project in current directory**

```bash
cd /workspaces/piggybank
npx create-expo-app@latest . --template blank-typescript --yes
```

Note: The `.` tells create-expo-app to scaffold in the current directory. If it errors because files exist, use `--yes` to force. If it still errors, scaffold into a temp dir and move files.

- [ ] **Step 3: Install all dependencies**

```bash
cd /workspaces/piggybank
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-native-gesture-handler
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-chart-kit react-native-svg
npx expo install expo-crypto
```

- [ ] **Step 4: Configure Expo Router in app.json**

Update `app.json` to set the entry point scheme and plugins for expo-router:

```json
{
  "expo": {
    "name": "Piggy Bank",
    "slug": "piggy-bank",
    "scheme": "piggybank",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#F8F9FA"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.piggybank.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#F8F9FA"
      },
      "package": "com.piggybank.app"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": ["expo-router"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 5: Set main entry point in package.json**

Ensure `package.json` has:
```json
{
  "main": "expo-router/entry"
}
```

- [ ] **Step 6: Create TypeScript types**

Create `types/index.ts`:

```typescript
export type CategoryType = "earning" | "spending";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  emoji?: string;
}

export type TransactionType = "deposit" | "withdrawal";

export interface Transaction {
  id: string;
  kidId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note?: string;
  createdAt: string;
}

export interface Kid {
  id: string;
  name: string;
  age: number;
  avatarId: string;
  createdAt: string;
}

export interface AppState {
  kids: Kid[];
  categories: Category[];
  transactions: Transaction[];
}
```

Note: `Kid` has no `balance` field — balance is always computed from transactions.

- [ ] **Step 7: Create theme constants**

Create `constants/theme.ts`:

```typescript
export const Colors = {
  primary: "#4ECDC4",
  primaryDark: "#3DBDB5",
  deposit: "#2ECC71",
  withdrawal: "#E74C3C",
  background: "#F8F9FA",
  card: "#FFFFFF",
  text: "#2D3436",
  textSecondary: "#636E72",
  textLight: "#B2BEC3",
  border: "#DFE6E9",
  shadow: "#00000010",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  balance: 36,
} as const;

export const Avatars = [
  { id: "bear", emoji: "🐻" },
  { id: "bunny", emoji: "🐰" },
  { id: "cat", emoji: "🐱" },
  { id: "dog", emoji: "🐶" },
  { id: "fox", emoji: "🦊" },
  { id: "owl", emoji: "🦉" },
  { id: "penguin", emoji: "🐧" },
  { id: "panda", emoji: "🐼" },
  { id: "rocket", emoji: "🚀" },
  { id: "star", emoji: "⭐" },
  { id: "rainbow", emoji: "🌈" },
  { id: "unicorn", emoji: "🦄" },
  { id: "dino", emoji: "🦕" },
  { id: "robot", emoji: "🤖" },
  { id: "butterfly", emoji: "🦋" },
  { id: "lion", emoji: "🦁" },
] as const;

export const getAvatarEmoji = (avatarId: string): string => {
  return Avatars.find((a) => a.id === avatarId)?.emoji ?? "🐻";
};
```

- [ ] **Step 8: Verify project runs**

```bash
cd /workspaces/piggybank
npx expo start --no-dev --minify 2>&1 | head -20
```

Expected: Metro bundler starts without crash. Press Ctrl+C after verifying.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Expo project with types and theme constants"
```

---

### Task 2: Utility Functions & Default Data

**Files:**
- Create: `utils/currency.ts`
- Create: `utils/defaults.ts`
- Create: `utils/storage.ts`

- [ ] **Step 1: Create currency formatting utility**

Create `utils/currency.ts`:

```typescript
export const formatCurrency = (amount: number): string => {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
};

export const formatSignedCurrency = (
  amount: number,
  type: "deposit" | "withdrawal"
): string => {
  const prefix = type === "deposit" ? "+" : "-";
  return `${prefix}$${Math.abs(amount).toFixed(2)}`;
};

export const parseCurrencyInput = (text: string): number => {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) return 0;
  if (parts[1] && parts[1].length > 2) {
    return parseFloat(`${parts[0]}.${parts[1].slice(0, 2)}`);
  }
  return parseFloat(cleaned) || 0;
};
```

- [ ] **Step 2: Create default categories**

Create `utils/defaults.ts`:

```typescript
import { Category, AppState } from "../types";

export const DEFAULT_EARNING_CATEGORIES: Category[] = [
  { id: "earn-chores", name: "Chores", type: "earning", emoji: "🧹" },
  { id: "earn-homework", name: "Homework", type: "earning", emoji: "📚" },
  { id: "earn-behavior", name: "Good Behavior", type: "earning", emoji: "⭐" },
  { id: "earn-helping", name: "Helping Out", type: "earning", emoji: "🤝" },
  { id: "earn-other", name: "Other", type: "earning", emoji: "💰" },
];

export const DEFAULT_SPENDING_CATEGORIES: Category[] = [
  { id: "spend-toys", name: "Toys", type: "spending", emoji: "🧸" },
  { id: "spend-candy", name: "Candy/Snacks", type: "spending", emoji: "🍬" },
  {
    id: "spend-savings",
    name: "Savings Withdrawal",
    type: "spending",
    emoji: "🏦",
  },
  { id: "spend-other", name: "Other", type: "spending", emoji: "🛒" },
];

export const UNDELETABLE_CATEGORY_IDS = ["earn-other", "spend-other"];

export const DEFAULT_STATE: AppState = {
  kids: [],
  categories: [...DEFAULT_EARNING_CATEGORIES, ...DEFAULT_SPENDING_CATEGORIES],
  transactions: [],
};
```

- [ ] **Step 3: Create storage utility**

Create `utils/storage.ts`:

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "../types";
import { DEFAULT_STATE } from "./defaults";

const STORAGE_KEY = "@piggybank_data";

export const loadState = async (): Promise<AppState> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json) as AppState;
    }
  } catch (error) {
    console.error("Failed to load state:", error);
  }
  return DEFAULT_STATE;
};

export const saveState = async (state: AppState): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state:", error);
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add utils/
git commit -m "feat: add currency, defaults, and storage utilities"
```

---

### Task 3: State Management (Context + Reducer)

**Files:**
- Create: `context/actions.ts`
- Create: `context/AppContext.tsx`

- [ ] **Step 1: Create action types**

Create `context/actions.ts`:

```typescript
import { Kid, Transaction, Category, AppState } from "../types";

export type AppAction =
  | { type: "LOAD_STATE"; payload: AppState }
  | { type: "ADD_KID"; payload: Omit<Kid, "createdAt"> }
  | { type: "EDIT_KID"; payload: { id: string; name: string; age: number; avatarId: string } }
  | { type: "DELETE_KID"; payload: { id: string } }
  | { type: "ADD_TRANSACTION"; payload: Omit<Transaction, "id" | "createdAt"> }
  | { type: "ADD_CATEGORY"; payload: Omit<Category, "id"> }
  | { type: "EDIT_CATEGORY"; payload: Category }
  | { type: "DELETE_CATEGORY"; payload: { id: string } };
```

- [ ] **Step 2: Create AppContext with reducer**

Create `context/AppContext.tsx`:

```typescript
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
} from "react";
import * as Crypto from "expo-crypto";
import { AppState } from "../types";
import { AppAction } from "./actions";
import { DEFAULT_STATE, UNDELETABLE_CATEGORY_IDS } from "../utils/defaults";
import { loadState, saveState } from "../utils/storage";

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_STATE":
      return action.payload;

    case "ADD_KID":
      return {
        ...state,
        kids: [
          ...state.kids,
          {
            ...action.payload,
            createdAt: new Date().toISOString(),
          },
        ],
      };

    case "EDIT_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, name: action.payload.name, age: action.payload.age, avatarId: action.payload.avatarId }
            : k
        ),
      };

    case "DELETE_KID":
      return {
        ...state,
        kids: state.kids.filter((k) => k.id !== action.payload.id),
        transactions: state.transactions.filter(
          (t) => t.kidId !== action.payload.id
        ),
      };

    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [
          ...state.transactions,
          {
            ...action.payload,
            id: Crypto.randomUUID(),
            createdAt: new Date().toISOString(),
          },
        ],
      };

    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [
          ...state.categories,
          {
            ...action.payload,
            id: Crypto.randomUUID(),
          },
        ],
      };

    case "EDIT_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case "DELETE_CATEGORY": {
      if (UNDELETABLE_CATEGORY_IDS.includes(action.payload.id)) {
        return state;
      }
      const cat = state.categories.find((c) => c.id === action.payload.id);
      if (!cat) return state;
      const otherCatId =
        cat.type === "earning" ? "earn-other" : "spend-other";
      return {
        ...state,
        categories: state.categories.filter(
          (c) => c.id !== action.payload.id
        ),
        transactions: state.transactions.map((t) =>
          t.categoryId === action.payload.id
            ? { ...t, categoryId: otherCatId }
            : t
        ),
      };
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  isLoaded: boolean;
}

const AppContext = createContext<AppContextValue>({
  state: DEFAULT_STATE,
  dispatch: () => {},
  isLoaded: false,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from storage on mount
  useEffect(() => {
    loadState().then((saved) => {
      dispatch({ type: "LOAD_STATE", payload: saved });
      setIsLoaded(true);
    });
  }, []);

  // Persist on every state change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveState(state);
    }
  }, [state, isLoaded]);

  return (
    <AppContext.Provider value={{ state, dispatch, isLoaded }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
```

- [ ] **Step 3: Commit**

```bash
git add context/
git commit -m "feat: add state management with Context + useReducer"
```

---

### Task 4: Custom Hooks (Selectors)

**Files:**
- Create: `hooks/useKid.ts`
- Create: `hooks/useTransactions.ts`
- Create: `hooks/useInsights.ts`

- [ ] **Step 1: Create useKid hook**

Create `hooks/useKid.ts`:

```typescript
import { useMemo } from "react";
import { useAppContext } from "../context/AppContext";

export function useKid(kidId: string) {
  const { state } = useAppContext();

  const kid = useMemo(
    () => state.kids.find((k) => k.id === kidId),
    [state.kids, kidId]
  );

  const balance = useMemo(() => {
    return state.transactions
      .filter((t) => t.kidId === kidId)
      .reduce((sum, t) => {
        return t.type === "deposit" ? sum + t.amount : sum - t.amount;
      }, 0);
  }, [state.transactions, kidId]);

  return { kid, balance };
}

export function useKidBalance(kidId: string): number {
  const { state } = useAppContext();
  return useMemo(() => {
    return state.transactions
      .filter((t) => t.kidId === kidId)
      .reduce((sum, t) => {
        return t.type === "deposit" ? sum + t.amount : sum - t.amount;
      }, 0);
  }, [state.transactions, kidId]);
}
```

- [ ] **Step 2: Create useTransactions hook**

Create `hooks/useTransactions.ts`:

```typescript
import { useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { Transaction } from "../types";

export function useKidTransactions(kidId: string, limit?: number): Transaction[] {
  const { state } = useAppContext();
  return useMemo(() => {
    const sorted = state.transactions
      .filter((t) => t.kidId === kidId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    return limit ? sorted.slice(0, limit) : sorted;
  }, [state.transactions, kidId, limit]);
}

export function useAllTransactions(kidFilter?: string): Transaction[] {
  const { state } = useAppContext();
  return useMemo(() => {
    const filtered = kidFilter
      ? state.transactions.filter((t) => t.kidId === kidFilter)
      : state.transactions;
    return filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [state.transactions, kidFilter]);
}
```

- [ ] **Step 3: Create useInsights hook**

Create `hooks/useInsights.ts`:

```typescript
import { useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { CategoryType } from "../types";

export interface InsightItem {
  categoryId: string;
  categoryName: string;
  emoji: string;
  total: number;
  percentage: number;
}

export function useInsights(
  kidId: string,
  type: CategoryType
): InsightItem[] {
  const { state } = useAppContext();

  return useMemo(() => {
    const transactionType = type === "earning" ? "deposit" : "withdrawal";
    const relevantTransactions = state.transactions.filter(
      (t) => t.kidId === kidId && t.type === transactionType
    );

    const totalAmount = relevantTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    if (totalAmount === 0) return [];

    const byCategory = new Map<string, number>();
    for (const t of relevantTransactions) {
      byCategory.set(
        t.categoryId,
        (byCategory.get(t.categoryId) ?? 0) + t.amount
      );
    }

    const items: InsightItem[] = [];
    for (const [categoryId, total] of byCategory) {
      const cat = state.categories.find((c) => c.id === categoryId);
      items.push({
        categoryId,
        categoryName: cat?.name ?? "Unknown",
        emoji: cat?.emoji ?? "❓",
        total,
        percentage: Math.round((total / totalAmount) * 100),
      });
    }

    return items.sort((a, b) => b.total - a.total);
  }, [state.transactions, state.categories, kidId, type]);
}
```

- [ ] **Step 4: Commit**

```bash
git add hooks/
git commit -m "feat: add custom hooks for kid, transactions, and insights"
```

---

### Task 5: Shared UI Components

**Files:**
- Create: `components/EmptyState.tsx`
- Create: `components/AvatarPicker.tsx`
- Create: `components/AmountInput.tsx`
- Create: `components/CategoryPicker.tsx`
- Create: `components/TransactionRow.tsx`
- Create: `components/KidCard.tsx`

- [ ] **Step 1: Create EmptyState component**

Create `components/EmptyState.tsx`:

```typescript
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing } from "../constants/theme";

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ emoji, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
```

- [ ] **Step 2: Create AvatarPicker component**

Create `components/AvatarPicker.tsx`:

```typescript
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Avatars, Colors, Spacing } from "../constants/theme";

interface AvatarPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  return (
    <View style={styles.grid}>
      {Avatars.map((avatar) => (
        <TouchableOpacity
          key={avatar.id}
          style={[
            styles.item,
            selectedId === avatar.id && styles.selected,
          ]}
          onPress={() => onSelect(avatar.id)}
        >
          <Text style={styles.emoji}>{avatar.emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  item: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selected: {
    borderColor: Colors.primary,
    backgroundColor: "#E8FAF8",
  },
  emoji: {
    fontSize: 28,
  },
});
```

- [ ] **Step 3: Create AmountInput component**

Create `components/AmountInput.tsx`:

```typescript
import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Colors, FontSize, Spacing } from "../constants/theme";

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function AmountInput({ value, onChangeText }: AmountInputProps) {
  const handleChange = (text: string) => {
    // Allow only numbers and one decimal point, max 2 decimal places
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChangeText(cleaned);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dollar}>$</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={Colors.textLight}
        maxLength={8}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  dollar: {
    fontSize: FontSize.balance,
    fontWeight: "bold",
    color: Colors.text,
    marginRight: Spacing.xs,
  },
  input: {
    fontSize: FontSize.balance,
    fontWeight: "bold",
    color: Colors.text,
    minWidth: 120,
    textAlign: "center",
  },
});
```

- [ ] **Step 4: Create CategoryPicker component**

Create `components/CategoryPicker.tsx`:

```typescript
import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Category } from "../types";
import { Colors, FontSize, Spacing } from "../constants/theme";

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
}: CategoryPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[
            styles.chip,
            selectedId === cat.id && styles.chipSelected,
          ]}
          onPress={() => onSelect(cat.id)}
        >
          <Text style={styles.chipEmoji}>{cat.emoji}</Text>
          <Text
            style={[
              styles.chipText,
              selectedId === cat.id && styles.chipTextSelected,
            ]}
          >
            {cat.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  chipText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
```

- [ ] **Step 5: Create TransactionRow component**

Create `components/TransactionRow.tsx`:

```typescript
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Transaction, Category } from "../types";
import { Colors, FontSize, Spacing } from "../constants/theme";
import { formatSignedCurrency } from "../utils/currency";

interface TransactionRowProps {
  transaction: Transaction;
  category: Category | undefined;
  showKidName?: string;
}

export function TransactionRow({
  transaction,
  category,
  showKidName,
}: TransactionRowProps) {
  const isDeposit = transaction.type === "deposit";
  const date = new Date(transaction.createdAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.emoji}>{category?.emoji ?? "❓"}</Text>
        <View style={styles.details}>
          <Text style={styles.categoryName}>
            {category?.name ?? "Unknown"}
          </Text>
          {showKidName && (
            <Text style={styles.kidName}>{showKidName}</Text>
          )}
          {transaction.note ? (
            <Text style={styles.note} numberOfLines={1}>
              {transaction.note}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            { color: isDeposit ? Colors.deposit : Colors.withdrawal },
          ]}
        >
          {formatSignedCurrency(transaction.amount, transaction.type)}
        </Text>
        <Text style={styles.date}>{dateStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  details: {
    flex: 1,
  },
  categoryName: {
    fontSize: FontSize.md,
    fontWeight: "500",
    color: Colors.text,
  },
  kidName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  note: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    marginLeft: Spacing.sm,
  },
  amount: {
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
```

- [ ] **Step 6: Create KidCard component**

Create `components/KidCard.tsx`:

```typescript
import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Kid } from "../types";
import { Colors, FontSize, Spacing, getAvatarEmoji } from "../constants/theme";
import { formatCurrency } from "../utils/currency";
import { useKidBalance } from "../hooks/useKid";

interface KidCardProps {
  kid: Kid;
  onPress: () => void;
}

export function KidCard({ kid, onPress }: KidCardProps) {
  const balance = useKidBalance(kid.id);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.avatar}>{getAvatarEmoji(kid.avatarId)}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {kid.name}
      </Text>
      <Text
        style={[
          styles.balance,
          { color: balance < 0 ? Colors.withdrawal : Colors.text },
        ]}
      >
        {formatCurrency(balance)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: "center",
    flex: 1,
    margin: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  balance: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
  },
});
```

- [ ] **Step 7: Commit**

```bash
git add components/
git commit -m "feat: add shared UI components"
```

---

### Task 6: Root Layout & Tab Navigation

**Files:**
- Create: `app/_layout.tsx`

- [ ] **Step 1: Create root layout with tabs**

Create `app/_layout.tsx`:

```typescript
import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider } from "../context/AppContext";
import { Colors } from "../constants/theme";

export default function RootLayout() {
  return (
    <AppProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarStyle: {
            backgroundColor: Colors.card,
            borderTopColor: Colors.border,
          },
          headerStyle: {
            backgroundColor: Colors.card,
          },
          headerTintColor: Colors.text,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="activity"
          options={{
            title: "Activity",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
        {/* Hide non-tab routes from the tab bar */}
        <Tabs.Screen name="add-kid" options={{ href: null }} />
        <Tabs.Screen name="edit-kid" options={{ href: null }} />
        <Tabs.Screen name="kid" options={{ href: null }} />
      </Tabs>
    </AppProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add root layout with tab navigation"
```

---

### Task 7: Home Screen

**Files:**
- Create: `app/index.tsx`

- [ ] **Step 1: Create Home screen**

Create `app/index.tsx`:

```typescript
import React from "react";
import { View, FlatList, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAppContext } from "../context/AppContext";
import { KidCard } from "../components/KidCard";
import { EmptyState } from "../components/EmptyState";
import { Colors, Spacing, FontSize } from "../constants/theme";

export default function HomeScreen() {
  const { state, isLoaded } = useAppContext();
  const router = useRouter();

  if (!isLoaded) return null;

  if (state.kids.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          emoji="🐷"
          title="Add your first piggy bank!"
          subtitle="Tap the + button to get started"
        />
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/add-kid")}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={state.kids}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <KidCard
            kid={item}
            onPress={() => router.push(`/kid/${item.id}`)}
          />
        )}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-kid")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  grid: {
    padding: Spacing.sm,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: FontSize.xl,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/index.tsx
git commit -m "feat: add Home screen with kid grid and empty state"
```

---

### Task 8: Add Kid & Edit Kid Screens

**Files:**
- Create: `app/add-kid.tsx`
- Create: `app/edit-kid/[id].tsx`

- [ ] **Step 1: Create Add Kid screen**

Create `app/add-kid.tsx`:

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import { useAppContext } from "../context/AppContext";
import { AvatarPicker } from "../components/AvatarPicker";
import { Colors, FontSize, Spacing, Avatars } from "../constants/theme";

export default function AddKidScreen() {
  const { dispatch } = useAppContext();
  const router = useRouter();

  const [name, setName] = useState("");
  const [age, setAge] = useState("5");
  const [avatarId, setAvatarId] = useState(Avatars[0].id);

  const ageNum = parseInt(age, 10);
  const isValid = name.trim().length > 0 && ageNum >= 1 && ageNum <= 17;

  const handleSave = () => {
    if (!isValid) return;
    dispatch({
      type: "ADD_KID",
      payload: {
        id: Crypto.randomUUID(),
        name: name.trim(),
        age: ageNum,
        avatarId,
      },
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add a Piggy Bank</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(t) => setName(t.slice(0, 20))}
        placeholder="Kid's name"
        placeholderTextColor={Colors.textLight}
        autoFocus
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={(t) => {
          const cleaned = t.replace(/[^0-9]/g, "").slice(0, 2);
          setAge(cleaned);
        }}
        keyboardType="number-pad"
        placeholder="5"
        placeholderTextColor={Colors.textLight}
      />

      <Text style={styles.label}>Choose an Avatar</Text>
      <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: FontSize.md,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
```

- [ ] **Step 2: Create Edit Kid screen**

Create `app/edit-kid/[id].tsx`:

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppContext } from "../../context/AppContext";
import { AvatarPicker } from "../../components/AvatarPicker";
import { Colors, FontSize, Spacing } from "../../constants/theme";

export default function EditKidScreen() {
  const { state, dispatch } = useAppContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const kid = state.kids.find((k) => k.id === id);

  const [name, setName] = useState(kid?.name ?? "");
  const [age, setAge] = useState(String(kid?.age ?? 5));
  const [avatarId, setAvatarId] = useState(kid?.avatarId ?? "bear");

  if (!kid) {
    return (
      <View style={styles.container}>
        <Text>Kid not found</Text>
      </View>
    );
  }

  const ageNum = parseInt(age, 10);
  const isValid = name.trim().length > 0 && ageNum >= 1 && ageNum <= 17;

  const handleSave = () => {
    if (!isValid) return;
    dispatch({
      type: "EDIT_KID",
      payload: { id: kid.id, name: name.trim(), age: ageNum, avatarId },
    });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Piggy Bank",
      `This will delete ${kid.name}'s account and all transaction history. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            dispatch({ type: "DELETE_KID", payload: { id: kid.id } });
            router.dismissAll();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Edit Piggy Bank</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(t) => setName(t.slice(0, 20))}
        placeholder="Kid's name"
        placeholderTextColor={Colors.textLight}
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={(t) => {
          const cleaned = t.replace(/[^0-9]/g, "").slice(0, 2);
          setAge(cleaned);
        }}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>Choose an Avatar</Text>
      <AvatarPicker selectedId={avatarId} onSelect={setAvatarId} />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete Piggy Bank</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: FontSize.md,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  deleteButton: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.withdrawal,
  },
  deleteText: {
    fontSize: FontSize.md,
    color: Colors.withdrawal,
    fontWeight: "600",
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add app/add-kid.tsx app/edit-kid/
git commit -m "feat: add Add Kid and Edit Kid screens"
```

---

### Task 9: Kid Detail Screen

**Files:**
- Create: `app/kid/[id]/index.tsx`

- [ ] **Step 1: Create Kid Detail screen**

Create `app/kid/[id]/index.tsx`:

```typescript
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useKid } from "../../../hooks/useKid";
import { useKidTransactions } from "../../../hooks/useTransactions";
import { useAppContext } from "../../../context/AppContext";
import { TransactionRow } from "../../../components/TransactionRow";
import { EmptyState } from "../../../components/EmptyState";
import { Colors, FontSize, Spacing, getAvatarEmoji } from "../../../constants/theme";
import { formatCurrency } from "../../../utils/currency";

export default function KidDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kid, balance } = useKid(id!);
  const recentTransactions = useKidTransactions(id!, 10);
  const { state } = useAppContext();

  if (!kid) {
    return (
      <View style={styles.container}>
        <Text>Kid not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {/* Profile header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.push(`/edit-kid/${kid.id}`)}
              >
                <Text style={styles.avatar}>{getAvatarEmoji(kid.avatarId)}</Text>
              </TouchableOpacity>
              <Text style={styles.name}>{kid.name}</Text>
              <Text style={styles.age}>Age {kid.age}</Text>
              <Text
                style={[
                  styles.balance,
                  { color: balance < 0 ? Colors.withdrawal : Colors.text },
                ]}
              >
                {formatCurrency(balance)}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.depositButton]}
                onPress={() => router.push(`/kid/${kid.id}/deposit`)}
              >
                <Text style={styles.actionButtonText}>+ Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.withdrawalButton]}
                onPress={() => router.push(`/kid/${kid.id}/withdrawal`)}
              >
                <Text style={styles.actionButtonText}>- Remove Money</Text>
              </TouchableOpacity>
            </View>

            {/* Insights link */}
            <TouchableOpacity
              style={styles.insightsLink}
              onPress={() => router.push(`/kid/${kid.id}/insights`)}
            >
              <Text style={styles.insightsText}>📊 View Insights</Text>
            </TouchableOpacity>

            {/* Section header */}
            {recentTransactions.length > 0 && (
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            category={state.categories.find(
              (c) => c.id === item.categoryId
            )}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="📝"
            title="No transactions yet"
            subtitle="Add or remove money to get started"
          />
        }
        ListFooterComponent={
          recentTransactions.length >= 10 ? (
            <TouchableOpacity
              style={styles.seeAll}
              onPress={() => router.push(`/activity?kid=${kid.id}`)}
            >
              <Text style={styles.seeAllText}>See All Activity →</Text>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    fontSize: 64,
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
  },
  age: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  balance: {
    fontSize: FontSize.balance,
    fontWeight: "bold",
    marginTop: Spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
  },
  depositButton: {
    backgroundColor: Colors.deposit,
  },
  withdrawalButton: {
    backgroundColor: Colors.withdrawal,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: FontSize.md,
    fontWeight: "700",
  },
  insightsLink: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  insightsText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "600",
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  seeAll: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontWeight: "600",
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/kid/
git commit -m "feat: add Kid Detail screen"
```

---

### Task 10: Deposit & Withdrawal Screens

**Files:**
- Create: `app/kid/[id]/deposit.tsx`
- Create: `app/kid/[id]/withdrawal.tsx`

- [ ] **Step 1: Create Deposit screen**

Create `app/kid/[id]/deposit.tsx`:

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppContext } from "../../../context/AppContext";
import { useKid } from "../../../hooks/useKid";
import { AmountInput } from "../../../components/AmountInput";
import { CategoryPicker } from "../../../components/CategoryPicker";
import { Colors, FontSize, Spacing } from "../../../constants/theme";

export default function DepositScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useAppContext();
  const { kid } = useKid(id!);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const earningCategories = state.categories.filter(
    (c) => c.type === "earning"
  );
  const selectedCategory = state.categories.find((c) => c.id === categoryId);
  const isOther = selectedCategory?.name === "Other";
  const parsedAmount = parseFloat(amount) || 0;
  const isValid =
    parsedAmount > 0 && categoryId !== null && (!isOther || note.trim().length > 0);

  const handleSave = () => {
    if (!isValid) return;
    dispatch({
      type: "ADD_TRANSACTION",
      payload: {
        kidId: id!,
        type: "deposit",
        amount: parsedAmount,
        categoryId: categoryId!,
        note: note.trim() || undefined,
      },
    });
    router.back();
  };

  if (!kid) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Add Money to {kid.name}</Text>

      <AmountInput value={amount} onChangeText={setAmount} />

      <Text style={styles.label}>Category</Text>
      <CategoryPicker
        categories={earningCategories}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <Text style={styles.label}>
        Note {isOther ? "(required)" : "(optional)"}
      </Text>
      <TextInput
        style={[styles.noteInput, isOther && styles.noteRequired]}
        value={note}
        onChangeText={(t) => setNote(t.slice(0, 200))}
        placeholder={isOther ? "What was this for?" : "Add a note..."}
        placeholderTextColor={Colors.textLight}
        multiline
        maxLength={200}
      />
      <Text style={styles.charCount}>{note.length}/200</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.saveText}>Add Money</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  noteInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: "top",
  },
  noteRequired: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.deposit,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: FontSize.md,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
```

- [ ] **Step 2: Create Withdrawal screen**

Create `app/kid/[id]/withdrawal.tsx`:

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppContext } from "../../../context/AppContext";
import { useKid } from "../../../hooks/useKid";
import { AmountInput } from "../../../components/AmountInput";
import { CategoryPicker } from "../../../components/CategoryPicker";
import { Colors, FontSize, Spacing } from "../../../constants/theme";
import { formatCurrency } from "../../../utils/currency";

export default function WithdrawalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useAppContext();
  const { kid, balance } = useKid(id!);

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const spendingCategories = state.categories.filter(
    (c) => c.type === "spending"
  );
  const selectedCategory = state.categories.find((c) => c.id === categoryId);
  const isOther = selectedCategory?.name === "Other";
  const parsedAmount = parseFloat(amount) || 0;
  const isValid =
    parsedAmount > 0 && categoryId !== null && (!isOther || note.trim().length > 0);
  const wouldGoNegative = parsedAmount > balance;
  const resultingBalance = balance - parsedAmount;

  const handleSave = () => {
    if (!isValid) return;
    dispatch({
      type: "ADD_TRANSACTION",
      payload: {
        kidId: id!,
        type: "withdrawal",
        amount: parsedAmount,
        categoryId: categoryId!,
        note: note.trim() || undefined,
      },
    });
    router.back();
  };

  if (!kid) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Remove Money from {kid.name}</Text>

      <AmountInput value={amount} onChangeText={setAmount} />

      {wouldGoNegative && parsedAmount > 0 && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ This will result in a negative balance of{" "}
            {formatCurrency(resultingBalance)}
          </Text>
        </View>
      )}

      <Text style={styles.label}>Category</Text>
      <CategoryPicker
        categories={spendingCategories}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <Text style={styles.label}>
        Note {isOther ? "(required)" : "(optional)"}
      </Text>
      <TextInput
        style={[styles.noteInput, isOther && styles.noteRequired]}
        value={note}
        onChangeText={(t) => setNote(t.slice(0, 200))}
        placeholder={isOther ? "What was this for?" : "Add a note..."}
        placeholderTextColor={Colors.textLight}
        multiline
        maxLength={200}
      />
      <Text style={styles.charCount}>{note.length}/200</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isValid}
        >
          <Text style={styles.saveText}>Remove Money</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  warning: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  warningText: {
    fontSize: FontSize.sm,
    color: "#856404",
    textAlign: "center",
  },
  label: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  noteInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
    textAlignVertical: "top",
  },
  noteRequired: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  buttons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: Colors.withdrawal,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontSize: FontSize.md,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add app/kid/
git commit -m "feat: add Deposit and Withdrawal screens"
```

---

### Task 11: Kid Insights Screen

**Files:**
- Create: `components/InsightChart.tsx`
- Create: `app/kid/[id]/insights.tsx`

- [ ] **Step 1: Create InsightChart component**

Create `components/InsightChart.tsx`:

```typescript
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";
import { InsightItem } from "../hooks/useInsights";
import { Colors, FontSize, Spacing } from "../constants/theme";
import { formatCurrency } from "../utils/currency";

const CHART_COLORS = [
  "#4ECDC4",
  "#FF6B6B",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
];

interface InsightChartProps {
  items: InsightItem[];
}

export function InsightChart({ items }: InsightChartProps) {
  const screenWidth = Dimensions.get("window").width;

  const chartData = items.map((item, index) => ({
    name: item.categoryName,
    amount: item.total,
    color: CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: Colors.text,
    legendFontSize: 13,
  }));

  return (
    <View>
      <PieChart
        data={chartData}
        width={screenWidth - Spacing.lg * 2}
        height={200}
        chartConfig={{
          color: () => Colors.text,
        }}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute={false}
      />

      {/* Ranked list */}
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={item.categoryId} style={styles.listItem}>
            <View style={styles.listLeft}>
              <View
                style={[
                  styles.colorDot,
                  {
                    backgroundColor:
                      CHART_COLORS[index % CHART_COLORS.length],
                  },
                ]}
              />
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.categoryName}>{item.categoryName}</Text>
            </View>
            <View style={styles.listRight}>
              <Text style={styles.total}>{formatCurrency(item.total)}</Text>
              <Text style={styles.percentage}>({item.percentage}%)</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: Spacing.md,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  rank: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
    marginRight: Spacing.sm,
    width: 24,
  },
  emoji: {
    fontSize: 18,
    marginRight: Spacing.xs,
  },
  categoryName: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  listRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  total: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  percentage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
```

- [ ] **Step 2: Create Insights screen**

Create `app/kid/[id]/insights.tsx`:

```typescript
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useKid } from "../../../hooks/useKid";
import { useInsights } from "../../../hooks/useInsights";
import { InsightChart } from "../../../components/InsightChart";
import { EmptyState } from "../../../components/EmptyState";
import { Colors, FontSize, Spacing, getAvatarEmoji } from "../../../constants/theme";
import { CategoryType } from "../../../types";

export default function InsightsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { kid } = useKid(id!);
  const [tab, setTab] = useState<CategoryType>("earning");
  const items = useInsights(id!, tab);

  if (!kid) return null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.avatar}>{getAvatarEmoji(kid.avatarId)}</Text>
        <Text style={styles.name}>{kid.name}'s Insights</Text>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "earning" && styles.tabActive]}
          onPress={() => setTab("earning")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "earning" && styles.tabTextActive,
            ]}
          >
            Earnings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "spending" && styles.tabActive]}
          onPress={() => setTab("spending")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "spending" && styles.tabTextActive,
            ]}
          >
            Spending
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {items.length > 0 ? (
        <InsightChart items={items} />
      ) : (
        <EmptyState
          emoji={tab === "earning" ? "💰" : "🛍️"}
          title={`No ${tab === "earning" ? "earnings" : "spending"} recorded yet!`}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  avatar: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  name: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  tabTextActive: {
    color: Colors.text,
    fontWeight: "700",
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add components/InsightChart.tsx app/kid/
git commit -m "feat: add Insights screen with pie chart and ranked list"
```

---

### Task 12: Activity Log Screen

**Files:**
- Create: `app/activity.tsx`

- [ ] **Step 1: Create Activity screen**

Create `app/activity.tsx`:

```typescript
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAppContext } from "../context/AppContext";
import { useAllTransactions } from "../hooks/useTransactions";
import { TransactionRow } from "../components/TransactionRow";
import { EmptyState } from "../components/EmptyState";
import { Colors, FontSize, Spacing, getAvatarEmoji } from "../constants/theme";

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const txDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (txDate.getTime() === today.getTime()) return "Today";
  if (txDate.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ActivityScreen() {
  const { state } = useAppContext();
  const params = useLocalSearchParams<{ kid?: string }>();
  const [kidFilter, setKidFilter] = useState<string | undefined>(
    params.kid ?? undefined
  );
  const transactions = useAllTransactions(kidFilter);

  // Group by date
  const sections = useMemo(() => {
    const groups: { title: string; data: typeof transactions }[] = [];
    let currentDate = "";
    for (const t of transactions) {
      const dateKey = t.createdAt.split("T")[0];
      if (dateKey !== currentDate) {
        currentDate = dateKey;
        groups.push({ title: formatDateHeader(t.createdAt), data: [] });
      }
      groups[groups.length - 1].data.push(t);
    }
    return groups;
  }, [transactions]);

  return (
    <View style={styles.container}>
      {/* Kid filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            !kidFilter && styles.filterChipActive,
          ]}
          onPress={() => setKidFilter(undefined)}
        >
          <Text
            style={[
              styles.filterText,
              !kidFilter && styles.filterTextActive,
            ]}
          >
            All Kids
          </Text>
        </TouchableOpacity>
        {state.kids.map((kid) => (
          <TouchableOpacity
            key={kid.id}
            style={[
              styles.filterChip,
              kidFilter === kid.id && styles.filterChipActive,
            ]}
            onPress={() =>
              setKidFilter(kidFilter === kid.id ? undefined : kid.id)
            }
          >
            <Text style={styles.filterEmoji}>
              {getAvatarEmoji(kid.avatarId)}
            </Text>
            <Text
              style={[
                styles.filterText,
                kidFilter === kid.id && styles.filterTextActive,
              ]}
            >
              {kid.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="No activity yet"
          subtitle="Transactions will appear here"
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.title}
          renderItem={({ item: section }) => (
            <View>
              <Text style={styles.dateHeader}>{section.title}</Text>
              {section.data.map((t) => {
                const kid = state.kids.find((k) => k.id === t.kidId);
                return (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={state.categories.find(
                      (c) => c.id === t.categoryId
                    )}
                    showKidName={!kidFilter ? kid?.name : undefined}
                  />
                );
              })}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  filterText: {
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  dateHeader: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/activity.tsx
git commit -m "feat: add Activity Log screen with kid filtering and date groups"
```

---

### Task 13: Settings & Manage Categories Screens

**Files:**
- Create: `app/settings/index.tsx`
- Create: `app/settings/categories.tsx`

- [ ] **Step 1: Create Settings screen**

Create `app/settings/index.tsx`:

```typescript
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, FontSize, Spacing } from "../../constants/theme";

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Categories</Text>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings/categories?type=earning")}
      >
        <Ionicons name="trending-up" size={22} color={Colors.deposit} />
        <Text style={styles.rowText}>Manage Earning Categories</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push("/settings/categories?type=spending")}
      >
        <Ionicons name="trending-down" size={22} color={Colors.withdrawal} />
        <Text style={styles.rowText}>Manage Spending Categories</Text>
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
        About
      </Text>

      <View style={styles.row}>
        <Text style={styles.rowText}>Version</Text>
        <Text style={styles.rowValue}>1.0.0</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for families</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  rowText: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  rowValue: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});
```

- [ ] **Step 2: Create Manage Categories screen**

Create `app/settings/categories.tsx`:

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../../context/AppContext";
import { UNDELETABLE_CATEGORY_IDS } from "../../utils/defaults";
import { Colors, FontSize, Spacing } from "../../constants/theme";
import { CategoryType } from "../../types";

export default function ManageCategoriesScreen() {
  const { state, dispatch } = useAppContext();
  const params = useLocalSearchParams<{ type: CategoryType }>();
  const type = params.type ?? "earning";

  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [showForm, setShowForm] = useState(false);

  const categories = state.categories.filter((c) => c.type === type);
  const title = type === "earning" ? "Earning Categories" : "Spending Categories";

  const handleAdd = () => {
    if (!newName.trim()) return;
    dispatch({
      type: "ADD_CATEGORY",
      payload: {
        name: newName.trim(),
        type,
        emoji: newEmoji || (type === "earning" ? "💰" : "🛒"),
      },
    });
    setNewName("");
    setNewEmoji("");
    setShowForm(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (UNDELETABLE_CATEGORY_IDS.includes(id)) return;

    const transactionCount = state.transactions.filter(
      (t) => t.categoryId === id
    ).length;

    const message =
      transactionCount > 0
        ? `This will delete "${name}" and reassign ${transactionCount} transaction(s) to "Other". Continue?`
        : `Delete "${name}"?`;

    Alert.alert("Delete Category", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => dispatch({ type: "DELETE_CATEGORY", payload: { id } }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isUndeletable = UNDELETABLE_CATEGORY_IDS.includes(item.id);
          return (
            <View style={styles.row}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.name}>{item.name}</Text>
              {isUndeletable ? (
                <Text style={styles.locked}>Required</Text>
              ) : (
                <TouchableOpacity
                  onPress={() => handleDelete(item.id, item.name)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={Colors.withdrawal}
                  />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <View>
            {showForm ? (
              <View style={styles.form}>
                <View style={styles.formRow}>
                  <TextInput
                    style={styles.emojiInput}
                    value={newEmoji}
                    onChangeText={(t) => setNewEmoji(t.slice(0, 2))}
                    placeholder="😀"
                    placeholderTextColor={Colors.textLight}
                    textAlign="center"
                  />
                  <TextInput
                    style={styles.nameInput}
                    value={newName}
                    onChangeText={(t) => setNewName(t.slice(0, 30))}
                    placeholder="Category name"
                    placeholderTextColor={Colors.textLight}
                    autoFocus
                  />
                </View>
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowForm(false);
                      setNewName("");
                      setNewEmoji("");
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      !newName.trim() && styles.addBtnDisabled,
                    ]}
                    onPress={handleAdd}
                    disabled={!newName.trim()}
                  >
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addCategory}
                onPress={() => setShowForm(true)}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={Colors.primary}
                />
                <Text style={styles.addCategoryText}>Add Category</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  emoji: {
    fontSize: 22,
    marginRight: Spacing.sm,
  },
  name: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
  },
  locked: {
    fontSize: FontSize.xs,
    color: Colors.textLight,
    fontStyle: "italic",
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  formRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  emojiInput: {
    width: 50,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: 22,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nameInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
    alignItems: "center",
  },
  cancelText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: FontSize.md,
    fontWeight: "600",
  },
  addCategory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addCategoryText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: "600",
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add app/settings/
git commit -m "feat: add Settings and Manage Categories screens"
```

---

### Task 14: Wire Up Navigation & Polish

**Files:**
- Modify: `app/_layout.tsx` (adjust for proper modal presentation)

- [ ] **Step 1: Update root layout for modal routes**

The Expo Router tab layout needs to properly handle the nested routes. Update `app/_layout.tsx` to ensure all routes are accounted for and modals present correctly. The `_layout.tsx` created in Task 6 already hides non-tab routes — verify it works by running the app.

```bash
cd /workspaces/piggybank
npx expo export --platform web 2>&1 | tail -20
```

Expected: No TypeScript errors, export succeeds. If there are route errors, they'll show up here.

- [ ] **Step 2: Fix any route or import issues found**

If the export revealed errors, fix them. Common issues:
- Missing route files that the layout references
- Incorrect relative import paths in nested routes
- Missing `_layout.tsx` files for nested directories (e.g., `app/kid/[id]/_layout.tsx` may be needed)

If `app/kid/[id]/_layout.tsx` is needed, create it:

```typescript
import { Stack } from "expo-router";

export default function KidLayout() {
  return <Stack screenOptions={{ headerShown: true }} />;
}
```

Similarly for `app/edit-kid/_layout.tsx` and `app/settings/_layout.tsx` if needed.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "fix: wire up navigation and add missing layout files"
```

---

### Task 15: Expo Go Setup & Testing

**Files:** None (runtime verification)

- [ ] **Step 1: Install @expo/ngrok for tunnel mode**

Since we're in a container, we need tunnel mode for Expo Go on a physical device:

```bash
cd /workspaces/piggybank
npm install --save-dev @expo/ngrok
```

- [ ] **Step 2: Start Expo with tunnel**

```bash
cd /workspaces/piggybank
npx expo start --tunnel
```

This will:
1. Start Metro bundler
2. Create an ngrok tunnel
3. Display a QR code in the terminal

- [ ] **Step 3: Connect from phone**

On your Android phone:
1. Install "Expo Go" from the Play Store (if not already installed)
2. Open the camera app and scan the QR code from the terminal
3. OR open Expo Go and tap "Enter URL manually" and paste the `exp://` URL shown in terminal

The app should load on your phone with hot reload enabled.

- [ ] **Step 4: Manual smoke test**

Walk through these flows:
1. **Empty state**: Home screen shows "Add your first piggy bank!" with + button
2. **Add a kid**: Tap +, enter name "Alex", age 7, pick an avatar, save → card appears on home
3. **Kid detail**: Tap Alex's card → see balance $0.00, action buttons
4. **Deposit**: Tap "+ Add Money" → enter $5.00, pick "Chores", save → balance shows $5.00
5. **Withdrawal**: Tap "- Remove Money" → enter $2.50, pick "Toys", save → balance shows $2.50
6. **Activity**: Switch to Activity tab → see both transactions with dates
7. **Insights**: Back to Alex → "View Insights" → Earnings tab shows Chores at 100%
8. **Settings**: Settings tab → Manage Earning Categories → add a new category → verify it appears
9. **Second kid**: Add another kid, verify both appear on home grid

- [ ] **Step 5: Commit any fixes from testing**

```bash
git add -A
git commit -m "chore: finalize MVP and add tunnel dev dependency"
```

---

## Summary

| Task | What it builds | Files |
|------|---------------|-------|
| 1 | Project scaffold, types, theme | Expo scaffold + `types/`, `constants/` |
| 2 | Utilities | `utils/currency.ts`, `defaults.ts`, `storage.ts` |
| 3 | State management | `context/actions.ts`, `AppContext.tsx` |
| 4 | Custom hooks | `hooks/useKid.ts`, `useTransactions.ts`, `useInsights.ts` |
| 5 | Shared components | 6 reusable components |
| 6 | Tab navigation | `app/_layout.tsx` |
| 7 | Home screen | `app/index.tsx` |
| 8 | Add/Edit kid | `app/add-kid.tsx`, `app/edit-kid/[id].tsx` |
| 9 | Kid detail | `app/kid/[id]/index.tsx` |
| 10 | Deposit/Withdrawal | `app/kid/[id]/deposit.tsx`, `withdrawal.tsx` |
| 11 | Insights | `components/InsightChart.tsx`, `app/kid/[id]/insights.tsx` |
| 12 | Activity log | `app/activity.tsx` |
| 13 | Settings & categories | `app/settings/index.tsx`, `categories.tsx` |
| 14 | Navigation polish | Layout fixes |
| 15 | Expo Go setup & testing | Runtime verification |
