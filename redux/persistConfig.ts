import AsyncStorage from '@react-native-async-storage/async-storage';

export const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['rolls', 'money', 'nationality', 'onboarding', 'theme'], // <-- Ajoute ici
};