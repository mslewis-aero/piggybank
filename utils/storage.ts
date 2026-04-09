import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { AppState } from "../types";
import { DEFAULT_STATE } from "./defaults";

const STORAGE_KEY = "@piggybank_data";

function migrateState(state: AppState): AppState {
  const now = new Date().toISOString();
  return {
    ...state,
    deviceId: state.deviceId || Crypto.randomUUID(),
    kids: state.kids.map((k) => ({
      ...k,
      updatedAt: k.updatedAt || now,
    })),
    categories: state.categories.map((c) => ({
      ...c,
      updatedAt: c.updatedAt || now,
    })),
  };
}

export const loadState = async (): Promise<AppState> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const parsed = JSON.parse(json) as AppState;
      return migrateState(parsed);
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
