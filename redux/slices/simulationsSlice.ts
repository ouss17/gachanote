import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Représente un personnage sur une bannière de simulation.
 */
export type SimulationCharacter = {
  name: string;
  rate: number; // Taux de drop en pourcentage (ex: 0.7)
  isFeatured?: boolean; // true si c'est le personnage vedette
};

/**
 * Représente un résultat de tirage simulé.
 */
export type SimulationRoll = {
  id: string;
  results: { name: string; count: number }[]; // Résultat du tirage (perso obtenu et nombre)
  resourceUsed: number;
  date: string;
};

/**
 * Représente une bannière de simulation.
 */
export type SimulationBanner = {
  id: string;
  name: string; // Nom de la bannière ou du perso vedette
  characters: SimulationCharacter[]; // Liste des persos (vedette + featurés)
  rolls: SimulationRoll[]; // Historique des tirages simulés
  totalResourceUsed: number;
  gachaId: string; // Identifiant du gacha associé
};

/**
 * État du slice simulations.
 */
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
    /**
     * Ajoute une nouvelle bannière de simulation.
     */
    addBanner: (state, action: PayloadAction<SimulationBanner>) => {
      state.banners.push(action.payload);
    },
    /**
     * Supprime une bannière de simulation par son id.
     */
    removeBanner: (state, action: PayloadAction<string>) => {
      state.banners = state.banners.filter(b => b.id !== action.payload);
    },
    /**
     * Ajoute un tirage simulé à une bannière.
     */
    addSimulationRoll: (
      state,
      action: PayloadAction<{ bannerId: string; roll: SimulationRoll }>
    ) => {
      const banner = state.banners.find(b => b.id === action.payload.bannerId);
      if (banner) {
        banner.rolls.push(action.payload.roll);
        banner.totalResourceUsed += action.payload.roll.resourceUsed;
      }
    },
    /**
     * Réinitialise l'historique des tirages d'une bannière.
     */
    clearBannerRolls: (state, action: PayloadAction<string>) => {
      const banner = state.banners.find(b => b.id === action.payload);
      if (banner) {
        banner.rolls = [];
        banner.totalResourceUsed = 0;
      }
    },
    /**
     * Réinitialise toutes les simulations.
     */
    resetSimulations: (state) => {
      state.banners = [];
    },
  },
});

export const {
  addBanner,
  removeBanner,
  addSimulationRoll,
  clearBannerRolls,
  resetSimulations,
} = simulationsSlice.actions;
export default simulationsSlice.reducer;