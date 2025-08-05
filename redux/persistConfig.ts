import AsyncStorage from '@react-native-async-storage/async-storage';

export const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['rolls'], // seuls les rolls sont persistés
};