import type { Dispatch, SetStateAction } from "react";
import {
  reduceLoadPersistedCallStates,
  reduceSaveCallStates,
} from "./ctiStompHelpers";
import { CTI_CALL_STATES } from "./ctiStompHookConstants";
import type { CtiCallEvent } from "./ctiStompHookTypes";

export function loadPersistedCallStateMap(
  setCallStateMap: Dispatch<SetStateAction<Record<string, CtiCallEvent>>>,
): void {
  try {
    const storedTimestamp = localStorage.getItem(CTI_CALL_STATES.TIMESTAMP_KEY);
    if (!storedTimestamp) {
      return;
    }

    const timestamp = new Date(storedTimestamp);
    const now = new Date();
    const hoursDiff =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > CTI_CALL_STATES.EXPIRY_HOURS) {
      localStorage.removeItem(CTI_CALL_STATES.STORAGE_KEY);
      localStorage.removeItem(CTI_CALL_STATES.TIMESTAMP_KEY);
      return;
    }

    const storedCallStates = localStorage.getItem(CTI_CALL_STATES.STORAGE_KEY);
    if (storedCallStates) {
      const parsedCallStates = JSON.parse(storedCallStates) as Record<
        string,
        unknown
      >;
      const activeCallStates = reduceLoadPersistedCallStates(
        parsedCallStates,
      ) as Record<string, CtiCallEvent>;

      if (Object.keys(activeCallStates).length > 0) {
        setCallStateMap(activeCallStates);
      }
    }
  } catch (error) {
    console.warn(
      "[useCtiStomp] loadPersistedCallStates failed, clearing storage",
      error,
    );
    localStorage.removeItem(CTI_CALL_STATES.STORAGE_KEY);
    localStorage.removeItem(CTI_CALL_STATES.TIMESTAMP_KEY);
  }
}

export function saveCallStateMapToLocalStorage(
  callStates: Record<string, CtiCallEvent>,
): void {
  try {
    const callsToPersist = reduceSaveCallStates(
      callStates as unknown as Record<string, unknown>,
    ) as Record<string, CtiCallEvent>;

    if (Object.keys(callsToPersist).length === 0) {
      localStorage.removeItem(CTI_CALL_STATES.STORAGE_KEY);
      localStorage.removeItem(CTI_CALL_STATES.TIMESTAMP_KEY);
    } else {
      localStorage.setItem(
        CTI_CALL_STATES.STORAGE_KEY,
        JSON.stringify(callsToPersist),
      );
      localStorage.setItem(
        CTI_CALL_STATES.TIMESTAMP_KEY,
        new Date().toISOString(),
      );
    }
  } catch (error) {
    console.warn("[useCtiStomp] saveCallStatesToStorage failed", error);
  }
}

export function clearExpiredStoredCallStates(): void {
  try {
    const storedTimestamp = localStorage.getItem(CTI_CALL_STATES.TIMESTAMP_KEY);
    if (!storedTimestamp) return;

    const timestamp = new Date(storedTimestamp);
    const now = new Date();
    const hoursDiff =
      (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > CTI_CALL_STATES.EXPIRY_HOURS) {
      localStorage.removeItem(CTI_CALL_STATES.STORAGE_KEY);
      localStorage.removeItem(CTI_CALL_STATES.TIMESTAMP_KEY);
    }
  } catch (error) {
    console.warn("[useCtiStomp] clearExpiredCallStates failed", error);
  }
}

export function readActiveCallIdsFromLocalStorage(): string[] {
  try {
    const storedCallStates = localStorage.getItem(CTI_CALL_STATES.STORAGE_KEY);
    if (!storedCallStates) return [];

    const parsedCallStates = JSON.parse(storedCallStates);
    return Object.entries(parsedCallStates)
      .filter(([_, callEvent]: [string, any]) => {
        const event = callEvent as CtiCallEvent;
        return event.currentState && event.currentState !== "DISCONNECTED";
      })
      .map(([callId]) => callId);
  } catch (error) {
    console.warn("[useCtiStomp] getActiveCallIdsFromLocalStorage failed", error);
    return [];
  }
}
