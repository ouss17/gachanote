import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * État représentant la nationalité et la devise de l'utilisateur.
 */
type DeviseState = {
  currency: string; // Devise associée, ex: '€', '$', '¥'
};

/**
 * Valeurs initiales de la nationalité (France, Euro).
 */
const initialState: DeviseState = {
  currency: '€',
};

/**
 * Slice Redux pour la gestion de la nationalité et de la devise.
 * Permet de changer le pays et la devise utilisée dans l'app.
 */
const deviseSlice = createSlice({
  name: 'devise',
  initialState,
  reducers: {
    /**
     * Définit la nationalité et la devise.
     * @param state État actuel
     * @param action Payload contenant le code pays et la devise
     */
    setDevise: (state, action: PayloadAction<{ currency: string }>) => {
      state.currency = action.payload.currency;
    },
  },
});

export const { setDevise } = deviseSlice.actions;
export default deviseSlice.reducer;