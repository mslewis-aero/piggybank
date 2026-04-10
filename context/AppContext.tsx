import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import * as Crypto from "expo-crypto";
import { AppState } from "../types";
import { AppAction } from "./actions";
import { DEFAULT_STATE, UNDELETABLE_CATEGORY_IDS } from "../utils/defaults";
import { loadState, saveState } from "../utils/storage";
import { performSync, SyncStatus } from "../utils/sync";

function appReducer(state: AppState, action: AppAction): AppState {
  const now = new Date().toISOString();

  switch (action.type) {
    case "LOAD_STATE":
    case "SYNC_STATE":
      return action.payload;

    case "ADD_KID":
      return {
        ...state,
        kids: [
          ...state.kids,
          {
            ...action.payload,
            createdAt: now,
            updatedAt: now,
          },
        ],
      };

    case "EDIT_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, name: action.payload.name, age: action.payload.age, avatarId: action.payload.avatarId, updatedAt: now }
            : k
        ),
      };

    case "DELETE_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, deletedAt: now, updatedAt: now }
            : k
        ),
      };

    case "RESTORE_KID":
      return {
        ...state,
        kids: state.kids.map((k) =>
          k.id === action.payload.id
            ? { ...k, deletedAt: undefined, updatedAt: now }
            : k
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
            createdAt: now,
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
            updatedAt: now,
          },
        ],
      };

    case "EDIT_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? { ...action.payload, updatedAt: now } : c
        ),
      };

    case "DELETE_CATEGORY": {
      if (UNDELETABLE_CATEGORY_IDS.includes(action.payload.id)) {
        return state;
      }
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id
            ? { ...c, deletedAt: now, updatedAt: now }
            : c
        ),
      };
    }

    case "RESTORE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id
            ? { ...c, deletedAt: undefined, updatedAt: now }
            : c
        ),
      };

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  isLoaded: boolean;
  syncStatus: SyncStatus;
  triggerSync: () => void;
}

const AppContext = createContext<AppContextValue>({
  state: DEFAULT_STATE,
  dispatch: () => {},
  isLoaded: false,
  triggerSync: () => {},
  syncStatus: "idle",
});

const SYNC_DEBOUNCE_MS = 500;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const doSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus("syncing");

    try {
      const { mergedState, status } = await performSync(stateRef.current);
      setSyncStatus(status);
      if (mergedState) {
        dispatch({ type: "SYNC_STATE", payload: mergedState });
      }
    } catch {
      setSyncStatus("offline");
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  const debouncedSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(doSync, SYNC_DEBOUNCE_MS);
  }, [doSync]);

  // Load state and initial sync
  useEffect(() => {
    loadState().then((saved) => {
      dispatch({ type: "LOAD_STATE", payload: saved });
      setIsLoaded(true);
    });
  }, []);

  // Sync on first load
  useEffect(() => {
    if (isLoaded) {
      doSync();
    }
  }, [isLoaded, doSync]);

  // Save and sync on state changes
  const prevStateRef = useRef(state);
  useEffect(() => {
    if (!isLoaded) return;
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;

    saveState(state);
    debouncedSync();
  }, [state, isLoaded, debouncedSync]);

  return (
    <AppContext.Provider value={{ state, dispatch, isLoaded, syncStatus, triggerSync: doSync }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
