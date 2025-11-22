import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SettingsState = {
  fontSize: 'small' | 'normal' | 'large';
  sounds: boolean;
  vibrations: boolean;
  invertSwipe: boolean;
  lastFeedbackAt: number | null;
  showOnlyFavorites: boolean;
};

const initialState: SettingsState = {
  fontSize: 'normal',
  sounds: true,
  vibrations: true,
  invertSwipe: false,
  lastFeedbackAt: null,
  showOnlyFavorites: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setFontSize: (state, action: PayloadAction<'small' | 'normal' | 'large'>) => {
      state.fontSize = action.payload;
    },
    setSounds: (state, action: PayloadAction<boolean>) => {
      state.sounds = action.payload;
    },
    setVibrations: (state, action: PayloadAction<boolean>) => {
      state.vibrations = action.payload;
    },
    setInvertSwipe: (state, action: PayloadAction<boolean>) => {
      state.invertSwipe = action.payload;
    },
    setShowOnlyFavorites: (state, action: PayloadAction<boolean>) => {
      state.showOnlyFavorites = action.payload;
    },
    setLastFeedbackAt: (state, action: PayloadAction<number | null>) => {
      state.lastFeedbackAt = action.payload;
    },
  },
});

export const { setFontSize, setSounds, setVibrations, setInvertSwipe, setLastFeedbackAt, setShowOnlyFavorites } = settingsSlice.actions;
export default settingsSlice.reducer;