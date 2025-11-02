import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ResourceEvent = {
  id: string;
  date: string; // ISO string
  resource: string; // ex "gems", "tickets", "or"
  amount: number; // positive gain, negative spend
  source?: 'roll' | 'manual' | 'simulation' | 'import';
  sourceId?: string | null;
  note?: string | null;
};

type State = {
  events: ResourceEvent[];
};

const initialState: State = { events: [] };

const slice = createSlice({
  name: 'resourceEvents',
  initialState,
  reducers: {
    addEvent(state, action: PayloadAction<ResourceEvent>) {
      state.events.push(action.payload);
    },
    bulkAddEvents(state, action: PayloadAction<ResourceEvent[]>) {
      state.events.push(...action.payload);
    },
    removeEvent(state, action: PayloadAction<{ id: string }>) {
      state.events = state.events.filter(e => e.id !== action.payload.id);
    },
    clearEvents(state) {
      state.events = [];
    },
  },
});

export const { addEvent, bulkAddEvents, removeEvent, clearEvents } = slice.actions;
export default slice.reducer;