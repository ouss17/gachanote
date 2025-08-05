import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { persistConfig } from './persistConfig';
import rollsReducer from './slices/rollsSlice';
import themeReducer from './slices/themeSlice'; // <-- Ajoute cette ligne

const rootReducer = combineReducers({
  rolls: rollsReducer,
  theme: themeReducer, // <-- Ajoute cette ligne
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;