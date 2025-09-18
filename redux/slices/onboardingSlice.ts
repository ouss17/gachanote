// filepath: c:\Projects\gachanote\redux\slices\onboardingSlice.ts
import { createSlice } from '@reduxjs/toolkit';

/**
 * Slice Redux pour la gestion de l'onboarding (démo).
 * Permet de savoir si l'utilisateur a déjà vu la démo au premier lancement.
 */
const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: { seen: false }, // Indique si la démo a été vue
  reducers: {
    /**
     * Marque la démo comme vue.
     * @param state État actuel
     */
    setOnboardingSeen: (state) => { state.seen = true; },
  },
});

export const { setOnboardingSeen } = onboardingSlice.actions;
export default onboardingSlice.reducer;