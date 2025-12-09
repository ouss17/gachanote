import { getDefaultServerForGacha } from '@/lib/gachaUtils';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Représente un tirage (roll) effectué sur un gacha.
 */
export type Roll = {
  id: string;
  gachaId: string;
  server: string; // <-- required
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
    // accept input possibly missing server, normalize and insert full Roll
    addRoll(state, action: PayloadAction<Partial<Roll> & { id: string; gachaId: string; featuredCount: number; date: string }>) {
      const payload = action.payload as Partial<Roll>;
      const server = payload.server ?? getDefaultServerForGacha(String(payload.gachaId));
      const newRoll: Roll = {
        id: String(payload.id),
        gachaId: String(payload.gachaId),
        server,
        resourceAmount: Number(payload.resourceAmount ?? 0),
        ticketAmount: payload.ticketAmount === undefined ? undefined : Number(payload.ticketAmount),
        freePulls: payload.freePulls === undefined ? undefined : Number(payload.freePulls),
        featuredItemsCount: payload.featuredItemsCount === undefined ? undefined : Number(payload.featuredItemsCount),
        srItemsCount: payload.srItemsCount === undefined ? undefined : Number(payload.srItemsCount),
        thumbUri: payload.thumbUri,
        imageUri: payload.imageUri,
        featuredCount: Number(payload.featuredCount ?? 0),
        spookCount: payload.spookCount === undefined ? undefined : Number(payload.spookCount),
        sideUnit: payload.sideUnit === undefined ? undefined : Number(payload.sideUnit),
        date: String(payload.date),
        resourceType: payload.resourceType,
        nameFeatured: payload.nameFeatured,
        notes: payload.notes,
      };
      state.rolls.push(newRoll);
    },
    updateRoll(state, action: PayloadAction<Partial<Roll> & { id: string }>) {
      const payload = action.payload as Partial<Roll> & { id: string };
      const idx = state.rolls.findIndex(r => r.id === payload.id);
      if (idx === -1) return;
      const existing = state.rolls[idx];
      const server = payload.server ?? existing.server ?? getDefaultServerForGacha(existing.gachaId);
      state.rolls[idx] = {
        ...existing,
        ...payload,
        server,
        resourceAmount: payload.resourceAmount !== undefined ? Number(payload.resourceAmount) : existing.resourceAmount,
        ticketAmount: payload.ticketAmount !== undefined ? Number(payload.ticketAmount) : existing.ticketAmount,
        freePulls: payload.freePulls !== undefined ? Number(payload.freePulls) : existing.freePulls,
        featuredItemsCount: payload.featuredItemsCount !== undefined ? Number(payload.featuredItemsCount) : existing.featuredItemsCount,
        srItemsCount: payload.srItemsCount !== undefined ? Number(payload.srItemsCount) : existing.srItemsCount,
        featuredCount: payload.featuredCount !== undefined ? Number(payload.featuredCount) : existing.featuredCount,
        spookCount: payload.spookCount !== undefined ? Number(payload.spookCount) : existing.spookCount,
        sideUnit: payload.sideUnit !== undefined ? Number(payload.sideUnit) : existing.sideUnit,
      };
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