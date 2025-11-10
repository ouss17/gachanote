import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Représente un tirage (roll) effectué sur un gacha.
 */
export type Roll = {
  id: string;
  gachaId: string;
  resourceAmount: number;
  ticketAmount?: number;
  freePulls?: number;
  featuredItemsCount?: number; 
  srItemsCount?: number; 
  // image URIs stockées localement (optionnel) :
  // - thumbUri : miniature optimisée pour affichage en liste
  // - imageUri : image complète (toujours conserver légère / compressée)
  thumbUri?: string;
  imageUri?: string;
  featuredCount: number;
  spookCount?: number;
  sideUnit?: number;
  date: string;
  resourceType?: string;
  nameFeatured?: string;
  notes?: string; 
};

/**
 * État du slice rolls, contenant tous les rolls enregistrés.
 */
type RollsState = {
  rolls: Roll[];
};

/**
 * État initial du slice rolls.
 */
const initialState: RollsState = {
  rolls: [],
};

/**
 * Slice Redux pour la gestion des rolls (tirages).
 * Permet d'ajouter, supprimer, modifier ou réinitialiser les rolls.
 */
export const rollsSlice = createSlice({
  name: 'rolls',
  initialState,
  reducers: {
    addRoll(state, action: PayloadAction<Roll>) {
      state.rolls.push(action.payload);
    },
    updateRoll(state, action: PayloadAction<Roll>) {
      const idx = state.rolls.findIndex(r => r.id === action.payload.id);
      if (idx !== -1) state.rolls[idx] = action.payload;
    },
    removeRoll(state, action: PayloadAction<string>) {
      state.rolls = state.rolls.filter(r => r.id !== action.payload);
    },
    resetRolls(state) {
      state.rolls = [];
    }
  },
});

export const { addRoll, removeRoll, updateRoll, resetRolls } = rollsSlice.actions;
export default rollsSlice.reducer;