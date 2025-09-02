import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type NationalityState = {
  country: string; // ex: 'fr', 'us', 'jp'
  currency: string; // <-- accepte n'importe quelle chaîne
};

const initialState: NationalityState = {
  country: 'fr',
  currency: '€',
};

const nationalitySlice = createSlice({
  name: 'nationality',
  initialState,
  reducers: {
    setNationality: (state, action: PayloadAction<{ country: string; currency: string }>) => {
      state.country = action.payload.country;
      state.currency = action.payload.currency;
    },
  },
});

export const { setNationality } = nationalitySlice.actions;
export default nationalitySlice.reducer;