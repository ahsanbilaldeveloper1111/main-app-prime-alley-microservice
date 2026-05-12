import {
  Action,
  combineReducers,
  configureStore,
  ThunkAction,
} from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";

import ThemeReducer from "./themeLayouts/reducer";
import layoutUiReducer from "./layoutUi/slice";
import callDashboardReducer from "./callDashboard/slice";
import callLogsListReducer from "./callLogsList/slice";
import callRecordingsListReducer from "./callRecordingsList/slice";
import callAnalysisListReducer from "./callAnalysisList/slice";

const rootReducer = combineReducers({
  Theme: ThemeReducer,
  layoutUi: layoutUiReducer,
  callDashboard: callDashboardReducer,
  callLogsList: callLogsListReducer,
  callRecordingsList: callRecordingsListReducer,
  callAnalysisList: callAnalysisListReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/**
 * In SPA mode there's no SSR HYDRATE step, so the store uses the combined
 * root reducer directly. Passing the reducer map (rather than a wrapping
 * function) lets `configureStore` correctly infer the typed `dispatch` so
 * `useAppDispatch` keeps the typed thunk overloads. The legacy `wrapper`
 * export is preserved below for any caller still using
 * `wrapper.useWrappedStore(rest)`.
 */
export const makeStore = () =>
  configureStore({
    reducer: rootReducer,
  });

type Store = ReturnType<typeof makeStore>;

export type AppDispatch = Store["dispatch"];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Wrapper-shaped object so legacy `wrapper.useWrappedStore(rest)` callers
// (mainly `_app.tsx` style code) keep working. The real `next-redux-wrapper`
// is shimmed in src/shims/next-redux-wrapper.tsx.
export const wrapper = createWrapper(makeStore, { debug: false });
