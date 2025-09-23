import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { persistConfig } from './persistConfig';
import deviseReducer from './slices/deviseSlice';
import moneyReducer from './slices/moneySlice';
import nationalityReducer from './slices/nationalitySlice';
import onboardingReducer from './slices/onboardingSlice';
import rollsReducer from './slices/rollsSlice';
import settingsReducer from './slices/settingsSlice';
import simulationsReducer from './slices/simulationsSlice';
import themeReducer from './slices/themeSlice';

/**
 * Combine tous les reducers de l'application.
 */
const rootReducer = combineReducers({
  rolls: rollsReducer,
  theme: themeReducer,
  money: moneyReducer,
  devise: deviseReducer,
  onboarding: onboardingReducer,
  simulations: simulationsReducer,
  settings: settingsReducer,
  nationality: nationalityReducer,
});

/**
 * Applique la persistance Redux sur le rootReducer.
 */
const persistedReducer = persistReducer(persistConfig, rootReducer);

/**
 * Configure le store Redux avec la persistance et désactive le serializableCheck.
 */
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

/**
 * Persiste le store Redux (sauvegarde/restaure l'état).
 */
export const persistor = persistStore(store);

/**
 * Types utilitaires pour l'application.
 * - RootState : type de l'état global Redux
 * - AppDispatch : type du dispatch Redux
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;