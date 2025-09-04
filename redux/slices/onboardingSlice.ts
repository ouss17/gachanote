// filepath: c:\Projects\gachanote\redux\slices\onboardingSlice.ts
import { createSlice } from '@reduxjs/toolkit';
const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: { seen: false },
  reducers: {
    setOnboardingSeen: (state) => { state.seen = true; },
  },
});
export const { setOnboardingSeen } = onboardingSlice.actions;
export default onboardingSlice.reducer;