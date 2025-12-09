import { getDefaultServerForGacha } from '@/lib/gachaUtils';
import { updateMoney } from '@/redux/slices/moneySlice';
import { updateRoll } from '@/redux/slices/rollsSlice';
import type { Dispatch } from '@reduxjs/toolkit';

export async function migrateMissingServers(getState: () => any, dispatch: Dispatch) {
  const state = getState();
  const rolls = state.rolls?.rolls ?? [];
  for (const r of rolls) {
    if (!r.server || String(r.server).trim() === '') {
      const server = getDefaultServerForGacha(String(r.gachaId));
      dispatch(updateRoll({ id: r.id, server }));
    }
  }

  const money = state.money?.entries ?? [];
  for (const m of money) {
    if (!m.server || String(m.server).trim() === '') {
      const server = getDefaultServerForGacha(String(m.gachaId));
      dispatch(updateMoney({ id: m.id, server }));
    }
  }
}