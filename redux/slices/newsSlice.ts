import { NEWS } from '@/data/news';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type NewsState = {
  seenIds: string[]; // track which news the user has marked seen
};

const initialState: NewsState = {
  seenIds: [], // persisted via redux-persist if configured
};

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    markSeen(state, action: PayloadAction<{ id: string }>) {
      if (!state.seenIds.includes(action.payload.id)) state.seenIds.push(action.payload.id);
    },
    markAllSeen(state) {
      state.seenIds = NEWS.map(n => n.id);
    },
    toggleSeen(state, action: PayloadAction<{ id: string }>) {
      const idx = state.seenIds.indexOf(action.payload.id);
      if (idx === -1) state.seenIds.push(action.payload.id);
      else state.seenIds.splice(idx, 1);
    },
    resetSeen(state) {
      state.seenIds = [];
    },
    setSeenIds(state, action: PayloadAction<string[]>) {
      state.seenIds = action.payload;
    },
  },
});

export const { markSeen, markAllSeen, toggleSeen, resetSeen, setSeenIds } = newsSlice.actions;
export default newsSlice.reducer;