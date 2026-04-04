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
