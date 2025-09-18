import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * État du thème de l'application (clair ou sombre).
 */
type ThemeState = {
  mode: 'light' | 'dark'; // Mode actuel : 'light' ou 'dark'
};

/**
 * Valeur initiale du thème (mode clair).
 */
const initialState: ThemeState = {
  mode: 'light',
};

/**
 * Slice Redux pour la gestion du thème de l'application.
 * Permet de changer ou de basculer entre le mode clair et sombre.
 */
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    /**
     * Définit explicitement le mode du thème.
     * @param state État actuel
     * @param action Payload contenant 'light' ou 'dark'
     */
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload;
    },
    /**
     * Bascule entre le mode clair et le mode sombre.
     * @param state État actuel
     */
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;