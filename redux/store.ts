import { combineReducers, configureStore, createListenerMiddleware, nanoid } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { persistConfig } from './persistConfig';
import deviseReducer from './slices/deviseSlice';
import moneyReducer from './slices/moneySlice';
import nationalityReducer from './slices/nationalitySlice';
import onboardingReducer from './slices/onboardingSlice';
import resourceEventsReducer, { addEvent as addResourceEvent } from './slices/resourceEventsSlice';
import rollsReducer, { addRoll } from './slices/rollsSlice';
import settingsReducer from './slices/settingsSlice';
import simulationsReducer from './slices/simulationsSlice';
import themeReducer from './slices/themeSlice';
import wishlistReducer from './slices/wishlistSlice';

/**
 * Combine tous les reducers de l'application.
 */
const rootReducer = combineReducers({
  rolls: rollsReducer,
  money: moneyReducer,
  wishlist: wishlistReducer,
  resourceEvents: resourceEventsReducer,
  theme: themeReducer,
  devise: deviseReducer,
  onboarding: onboardingReducer,
  simulations: simulationsReducer,
  settings: settingsReducer,
  nationality: nationalityReducer,
});

// listener middleware : crée un ResourceEvent automatiquement quand un Roll est ajouté
const listener = createListenerMiddleware();
listener.startListening({
  actionCreator: addRoll,
  effect: async (action, listenerApi) => {
    try {
      const roll = action.payload;
      // création d'un event : par défaut on mappe resourceAmount -> resource (ticket si resourceType absent)
      const resourceKey = roll.resourceType ? String(roll.resourceType) : 'ticket';
      const event = {
        id: nanoid(),
        date: (roll.date && typeof roll.date === 'string') ? roll.date : new Date().toISOString(),
        resource: resourceKey,
        amount: Number(roll.resourceAmount) || 0,
        source: 'roll' as const,
        sourceId: roll.id ?? null,
        note: roll.nameFeatured ? `Roll: ${roll.nameFeatured}` : 'Roll',
      };
      listenerApi.dispatch(addResourceEvent(event));
    } catch (e) {
      // ne pas casser l'app si le listener échoue
      // console.warn('resourceEvents listener error', e);
    }
  },
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
    }).concat(listener.middleware),
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
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;