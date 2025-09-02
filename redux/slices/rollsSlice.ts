import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Roll = {
  id: string;
  gachaId: string;
  resourceAmount: number;
  resourceType?: string;
  featuredCount: number;
  spookCount: number;
  sideUnit: number; // ← AJOUT ICI
  date: string; 
  nameFeatured?: string; 
};

type RollsState = {
  rolls: Roll[];
};

const initialState: RollsState = {
  rolls: [],
};

const rollsSlice = createSlice({
  name: 'rolls',
  initialState,
  reducers: {
    addRoll: (state, action: PayloadAction<Roll>) => {
      state.rolls.push(action.payload);
    },
    removeRoll: (state, action: PayloadAction<string>) => {
      state.rolls = state.rolls.filter(r => r.id !== action.payload);
    },
    updateRoll: (state, action: PayloadAction<Roll>) => {
      const idx = state.rolls.findIndex(r => r.id === action.payload.id);
      if (idx !== -1) state.rolls[idx] = action.payload;
    },
    clearRolls: (state) => {
      state.rolls = [];
    },
  },
});

export const { addRoll, removeRoll, updateRoll, clearRolls } = rollsSlice.actions;
export default rollsSlice.reducer;