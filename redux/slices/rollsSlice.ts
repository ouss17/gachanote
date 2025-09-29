import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Représente un tirage (roll) effectué sur un gacha.
 */
export type Roll = {
  id: string;               // Identifiant unique du roll
  gachaId: string;          // Identifiant du gacha concerné
  resourceAmount: number;   // Quantité de ressource utilisée pour ce roll
  resourceType?: string;    // Type de ressource (ex: "cc", "ds", etc.)
  featuredCount: number;    // Nombre de vedettes obtenues
  spookCount: number;       // Nombre de spooks obtenus
  sideUnit: number;         // Nombre de side units obtenus
  date: string;             // Date du roll (format ISO)
  nameFeatured?: string;    // Nom de la vedette obtenue (optionnel)
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
const rollsSlice = createSlice({
  name: 'rolls',
  initialState,
  reducers: {
    /**
     * Ajoute un nouveau roll.
     * @param state État actuel
     * @param action Payload contenant le nouveau Roll
     */
    addRoll: (state, action: PayloadAction<Roll>) => {
      state.rolls.push(action.payload);
    },
    /**
     * Supprime un roll par son id.
     * @param state État actuel
     * @param action Payload contenant l'id à supprimer
     */
    removeRoll: (state, action: PayloadAction<string>) => {
      state.rolls = state.rolls.filter(r => r.id !== action.payload);
    },
    /**
     * Met à jour un roll existant.
     * @param state État actuel
     * @param action Payload contenant le Roll à mettre à jour
     */
    updateRoll: (state, action: PayloadAction<Roll>) => {
      const idx = state.rolls.findIndex(r => r.id === action.payload.id);
      if (idx !== -1) state.rolls[idx] = action.payload;
    },
    /**
     * Réinitialise tous les rolls.
     * @param state État actuel
     */
    clearRolls: (state) => {
      state.rolls = [];
    },
    resetRolls: (state) => {
      state.rolls = [];
    },
  },
});

export const { addRoll, removeRoll, updateRoll, clearRolls, resetRolls } = rollsSlice.actions;
export default rollsSlice.reducer;