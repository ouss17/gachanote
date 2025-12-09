import { getDefaultServerForGacha } from '@/lib/gachaUtils';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Représente une entrée d'argent liée à un gacha.
 */
export type MoneyEntry = {
  id: string;        // Identifiant unique de l'entrée
  gachaId: string;   // Identifiant du gacha concerné
  server: string;    // <-- required
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
    addMoney: (state, action: PayloadAction<Partial<MoneyEntry> & { id: string; gachaId: string; amount: number; date: string }>) => {
      const p = action.payload as Partial<MoneyEntry>;
      const server = p.server ?? getDefaultServerForGacha(String(p.gachaId));
      const entry: MoneyEntry = {
        id: String(p.id),
        gachaId: String(p.gachaId),
        server,
        amount: Number(p.amount ?? 0),
        date: String(p.date),
      };
      state.entries.push(entry);
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
    updateMoney: (state, action: PayloadAction<Partial<MoneyEntry> & { id: string }>) => {
      const p = action.payload as Partial<MoneyEntry> & { id: string };
      const idx = state.entries.findIndex(e => e.id === p.id);
      if (idx === -1) return;
      const existing = state.entries[idx];
      const server = p.server ?? existing.server ?? getDefaultServerForGacha(existing.gachaId);
      state.entries[idx] = {
        ...existing,
        ...p,
        server,
        amount: p.amount !== undefined ? Number(p.amount) : existing.amount,
      } as MoneyEntry;
    },
    /**
     * Réinitialise toutes les entrées d'argent.
     * @param state État actuel
     */
    clearMoney: (state) => { state.entries = []; },
    resetMoney: (state) => { state.entries = []; },
  },
});

export const { addMoney, removeMoney, updateMoney, clearMoney, resetMoney } = moneySlice.actions;
export default moneySlice.reducer;