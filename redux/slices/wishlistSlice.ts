import { getDefaultServerForGacha } from '@/lib/gachaUtils';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Représente un item de wishlist pour un gacha.
 */
export type WishlistItem = {
  id: string;
  gachaId: string;
  server: string; // <-- required
  characterName: string;
  imageUri?: string;
  releaseDate?: string; // ISO string
  notes?: string;
  priority?: number; // 1..5 or similar
  addedAt: string; // ISO string
};

type WishlistState = {
  items: WishlistItem[];
};

const initialState: WishlistState = {
  items: [],
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addWishlist: (
      state,
      action: PayloadAction<Partial<WishlistItem> & { id: string; gachaId: string; characterName: string; addedAt: string }>
    ) => {
      const p = action.payload as Partial<WishlistItem>;
      const server = p.server ?? getDefaultServerForGacha(String(p.gachaId));
      const item: WishlistItem = {
        id: String(p.id),
        gachaId: String(p.gachaId),
        server,
        characterName: String(p.characterName),
        imageUri: p.imageUri,
        releaseDate: p.releaseDate ? String(p.releaseDate) : undefined,
        notes: p.notes,
        priority: p.priority === undefined ? undefined : Number(p.priority),
        addedAt: String(p.addedAt),
      };
      state.items.push(item);
    },
    removeWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    updateWishlist: (state, action: PayloadAction<Partial<WishlistItem> & { id: string }>) => {
      const p = action.payload as Partial<WishlistItem> & { id: string };
      const idx = state.items.findIndex(i => i.id === p.id);
      if (idx === -1) return;
      const existing = state.items[idx];
      const server = p.server ?? existing.server ?? getDefaultServerForGacha(existing.gachaId);
      state.items[idx] = {
        ...existing,
        ...p,
        server,
        priority: p.priority !== undefined ? Number(p.priority) : existing.priority,
      } as WishlistItem;
    },
    clearWishlist: (state) => { state.items = []; },
    resetWishlist: (state) => { state.items = []; },
  },
});

export const { addWishlist, removeWishlist, updateWishlist, clearWishlist, resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;