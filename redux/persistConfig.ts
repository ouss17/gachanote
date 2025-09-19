import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuration de la persistance Redux.
 * Utilise AsyncStorage pour stocker les slices spécifiés dans la whitelist.
 */
export const persistConfig = {
  key: 'root', // Clé racine pour le stockage
  storage: AsyncStorage, // Backend de stockage (AsyncStorage pour React Native)
  whitelist: ['rolls', 'money', 'nationality', 'onboarding', 'theme', 'simulations'], // Slices Redux à persister
};