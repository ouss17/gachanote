import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';

// sélection "brute"
export const selectMoneyEntries = (state: RootState) => state.money.entries;

// factory selector -> crée un selector memoizé par instance de composant
export const makeSelectMoneyEntriesByGacha = () =>
  createSelector(
    [selectMoneyEntries, (_: RootState, gachaId: string) => gachaId],
    (entries, gachaId) => entries.filter(e => e.gachaId === gachaId)
  );