import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type SimulationCharacter = {
  name: string;
  rate: number;
  isFeatured?: boolean;
};

export type SimulationRoll = {
  id: string;
  results: { name: string; count: number }[];
  resourceUsed: number;
  date: string;
};

export type SimulationBanner = {
  id: string;
  name: string;
  characters: SimulationCharacter[];
  rolls: SimulationRoll[];
  totalResourceUsed: number;
  gachaId: string;
  pityThreshold?: number | null; // nombre de tirages sans featured avant garantie (null = disabled)
};

type SimulationsState = {
  banners: SimulationBanner[];
};

const initialState: SimulationsState = {
  banners: [],
};

const simulationsSlice = createSlice({
  name: 'simulations',
  initialState,
  reducers: {
    addBanner(state, action: PayloadAction<SimulationBanner>) {
      state.banners.push(action.payload);
    },
    removeBanner(state, action: PayloadAction<string>) {
      state.banners = state.banners.filter(b => b.id !== action.payload);
    },
    addSimulationRoll(state, action: PayloadAction<{ bannerId: string; roll: SimulationRoll }>) {
      const banner = state.banners.find(b => b.id === action.payload.bannerId);
      if (banner) {
        banner.rolls.push(action.payload.roll);
        banner.totalResourceUsed = (banner.totalResourceUsed || 0) + action.payload.roll.resourceUsed;
      }
    },
    clearBannerRolls(state, action: PayloadAction<string>) {
      const banner = state.banners.find(b => b.id === action.payload);
      if (banner) {
        banner.rolls = [];
        banner.totalResourceUsed = 0;
      }
    },
    /**
     * Met à jour des propriétés d'une bannière (ex: pityThreshold).
     */
    updateBanner(state, action: PayloadAction<{ id: string; changes: Partial<SimulationBanner> }>) {
      const banner = state.banners.find(b => b.id === action.payload.id);
      if (banner) {
        Object.assign(banner, action.payload.changes);
      }
    },
    resetSimulations(state) {
      state.banners = [];
    },
  },
});

export const {
  addBanner,
  removeBanner,
  addSimulationRoll,
  clearBannerRolls,
  updateBanner,
  resetSimulations,
} = simulationsSlice.actions;

export default simulationsSlice.reducer;