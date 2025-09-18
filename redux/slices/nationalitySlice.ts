import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * État représentant la nationalité et la devise de l'utilisateur.
 */
type NationalityState = {
  country: string;  // Code pays, ex: 'fr', 'us', 'jp'
  currency: string; // Devise associée, ex: '€', '$', '¥'
};

/**
 * Valeurs initiales de la nationalité (France, Euro).
 */
const initialState: NationalityState = {
  country: 'fr',
  currency: '€',
};

/**
 * Slice Redux pour la gestion de la nationalité et de la devise.
 * Permet de changer le pays et la devise utilisée dans l'app.
 */
const nationalitySlice = createSlice({
  name: 'nationality',
  initialState,
  reducers: {
    /**
     * Définit la nationalité et la devise.
     * @param state État actuel
     * @param action Payload contenant le code pays et la devise
     */
    setNationality: (state, action: PayloadAction<{ country: string; currency: string }>) => {
      state.country = action.payload.country;
      state.currency = action.payload.currency;
    },
  },
});

export const { setNationality } = nationalitySlice.actions;
export default nationalitySlice.reducer;