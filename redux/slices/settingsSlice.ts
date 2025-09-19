import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type SettingsState = {
  fontSize: 'small' | 'normal' | 'large';
  sounds: boolean;
  vibrations: boolean;
};

const initialState: SettingsState = {
  fontSize: 'normal',
  sounds: true,
  vibrations: true,
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
  },
});

export const { setFontSize, setSounds, setVibrations } = settingsSlice.actions;
export default settingsSlice.reducer;