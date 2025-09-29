import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Représente une entrée d'argent liée à un gacha.
 */
export type MoneyEntry = {
  id: string;        // Identifiant unique de l'entrée
  gachaId: string;   // Identifiant du gacha concerné
  amount: number;    // Montant dépensé
  date: string;      // Date de la dépense (format ISO)
};

/**
 * État du slice money, contenant toutes les entrées d'argent.
 */
type MoneyState = {
  entries: MoneyEntry[];
};

/**
 * État initial du slice money.
 */
const initialState: MoneyState = {
  entries: [],
};

/**
 * Slice Redux pour la gestion des entrées d'argent (money).
 * Permet d'ajouter, supprimer, modifier ou réinitialiser les entrées.
 */
const moneySlice = createSlice({
  name: 'money',
  initialState,
  reducers: {
    /**
     * Ajoute une nouvelle entrée d'argent.
     * @param state État actuel
     * @param action Payload contenant la nouvelle MoneyEntry
     */
    addMoney: (state, action: PayloadAction<MoneyEntry>) => {
      state.entries.push(action.payload);
    },
    /**
     * Supprime une entrée d'argent par son id.
     * @param state État actuel
     * @param action Payload contenant l'id à supprimer
     */
    removeMoney: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(e => e.id !== action.payload);
    },
    /**
     * Met à jour une entrée d'argent existante.
     * @param state État actuel
     * @param action Payload contenant la MoneyEntry à mettre à jour
     */
    updateMoney: (state, action: PayloadAction<MoneyEntry>) => {
      const idx = state.entries.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) state.entries[idx] = action.payload;
    },
    /**
     * Réinitialise toutes les entrées d'argent.
     * @param state État actuel
     */
    clearMoney: (state) => {
      state.entries = [];
    },
    resetMoney: (state) => {
      state.entries = [];
    },
  },
});

export const { addMoney, removeMoney, updateMoney, clearMoney, resetMoney } = moneySlice.actions;
export default moneySlice.reducer;