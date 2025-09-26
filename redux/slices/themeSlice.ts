import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * État du thème de l'application (clair, sombre ou nuit).
 */
type ThemeState = {
  mode: 'light' | 'dark' | 'night'; // Mode actuel : 'light' ou 'dark' ou 'night'
};

/**
 * Valeur initiale du thème (mode clair).
 */
const initialState: ThemeState = {
  mode: 'light',
};

/**
 * Slice Redux pour la gestion du thème de l'application.
 * Permet de changer ou de basculer entre le mode clair, sombre et nuit.
 */
const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    /**
     * Définit explicitement le mode du thème.
     * @param state État actuel
     * @param action Payload contenant 'light', 'dark' ou 'night'
     */
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'night'>) => {
      state.mode = action.payload;
    },
    /**
     * Bascule entre le mode clair, sombre et nuit.
     * @param state État actuel
     */
    toggleTheme: (state) => {
      // Bascule cycliquement entre les 3 modes
      state.mode = state.mode === 'light'
        ? 'dark'
        : state.mode === 'dark'
        ? 'night'
        : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;