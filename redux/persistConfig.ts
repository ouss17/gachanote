import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Configuration de la persistance Redux.
 * Utilise AsyncStorage pour stocker les slices spécifiés dans la whitelist.
 */
export const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: [
    "rolls",
    "money",
    "wishlist", // ajouté
    "nationality",
    "devise",
    "onboarding",
    "theme",
    'simulations',
    'resourceEvents',
    "settings",
  ],
};
