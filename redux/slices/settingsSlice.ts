import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SettingsState = {
  fontSize: 'small' | 'normal' | 'large';
  sounds: boolean;
  vibrations: boolean;
  invertSwipe: boolean;
};

const initialState: SettingsState = {
  fontSize: 'normal',
  sounds: true,
  vibrations: true,
  invertSwipe: false,
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
  },
});

export const { setFontSize, setSounds, setVibrations, setInvertSwipe } = settingsSlice.actions;
export default settingsSlice.reducer;