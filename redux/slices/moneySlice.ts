import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MoneyEntry = {
  id: string;
  gachaId: string;
  amount: number;
  date: string;
};

type MoneyState = {
  entries: MoneyEntry[];
};

const initialState: MoneyState = {
  entries: [],
};

const moneySlice = createSlice({
  name: 'money',
  initialState,
  reducers: {
    addMoney: (state, action: PayloadAction<MoneyEntry>) => {
      state.entries.push(action.payload);
    },
    removeMoney: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(e => e.id !== action.payload);
    },
    updateMoney: (state, action: PayloadAction<MoneyEntry>) => {
      const idx = state.entries.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) state.entries[idx] = action.payload;
    },
    clearMoney: (state) => {
      state.entries = [];
    },
  },
});

export const { addMoney, removeMoney, updateMoney, clearMoney } = moneySlice.actions;
export default moneySlice.reducer;