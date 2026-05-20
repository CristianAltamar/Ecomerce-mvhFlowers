'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Store del carrito con persistencia en localStorage.
 * Estructura preparada para la integración completa de checkout en Entrega 2.
 */

export interface CartItem {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  variantName?: string;
  imageUrl?: string;
  unitPriceCents: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  // === Mutations ===
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clear: () => void;
  // === UI ===
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

function itemKey(productId: string, variantId?: string) {
  return `${productId}::${variantId ?? '_'}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      addItem: (input) =>
        set((state) => {
          const key = itemKey(input.productId, input.variantId);
          const existing = state.items.find((i) => itemKey(i.productId, i.variantId) === key);
          const qty = input.quantity ?? 1;

          if (existing) {
            return {
              items: state.items.map((i) =>
                itemKey(i.productId, i.variantId) === key
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...input, quantity: qty }],
            isOpen: true,
          };
        }),

      removeItem: (productId, variantId) =>
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i.productId, i.variantId) !== itemKey(productId, variantId),
          ),
        })),

      updateQuantity: (productId, quantity, variantId) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => itemKey(i.productId, i.variantId) !== itemKey(productId, variantId),
                )
              : state.items.map((i) =>
                  itemKey(i.productId, i.variantId) === itemKey(productId, variantId)
                    ? { ...i, quantity }
                    : i,
                ),
        })),

      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: 'mvh-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

// === Selectores derivados ===

export function selectCartCount(state: CartState): number {
  return state.items.reduce((acc, i) => acc + i.quantity, 0);
}

export function selectCartSubtotalCents(state: CartState): number {
  return state.items.reduce((acc, i) => acc + i.unitPriceCents * i.quantity, 0);
}
