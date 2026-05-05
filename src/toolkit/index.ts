import {
  Action,
  AnyAction,
  combineReducers,
  configureStore,
  ThunkAction,
} from '@reduxjs/toolkit';
import { createWrapper, HYDRATE } from 'next-redux-wrapper';

// Front
import ThemeReducer from "./themeLayouts/reducer";
import layoutUiReducer from "./layoutUi/slice";
import callDashboardReducer from "./callDashboard/slice";
import callLogsListReducer from "./callLogsList/slice";
import callRecordingsListReducer from "./callRecordingsList/slice";
import callAnalysisListReducer from "./callAnalysisList/slice";

// Combine your reducers into a root reducer
const rootReducer = combineReducers({
  Theme: ThemeReducer,
  layoutUi: layoutUiReducer,
  callDashboard: callDashboardReducer,
  callLogsList: callLogsListReducer,
  callRecordingsList: callRecordingsListReducer,
  callAnalysisList: callAnalysisListReducer,
});

/** Explicit root state — do not infer from the HYDRATE wrapper `reducer` (it widens to Record<string, unknown>). */
export type RootState = ReturnType<typeof rootReducer>;

const ensureInitialRootState = (): RootState =>
  rootReducer(undefined, { type: "@@ROOT/INIT_BASELINE" } as AnyAction);

const reducer = (state: RootState | undefined, action: AnyAction): RootState => {
  if (action.type === HYDRATE) {
    const baseline = ensureInitialRootState();
    const prev = state ?? {};
    const incoming = (action.payload ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = {
      ...(baseline as Record<string, unknown>),
      ...(prev as Record<string, unknown>),
    };
    for (const key of Object.keys(incoming)) {
      const v = incoming[key];
      if (v !== undefined) {
        merged[key] = v;
      }
    }
    return merged as RootState;
  }
  return rootReducer(state, action);
};

export const makeStore = () =>
  configureStore({
    reducer,
  });

type Store = ReturnType<typeof makeStore>;

export type AppDispatch = Store['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export const wrapper = createWrapper(makeStore, { debug: false });
