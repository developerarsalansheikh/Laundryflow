import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStateStorage } from './mmkvStorage';
import { STORAGE_KEYS } from '../constants/app';

/**
 * LaundryFlow Single-Laundry Cart Store
 * 
 * CRITICAL RULE:
 * - A customer cart can contain services from ONLY ONE laundry store.
 * - Browsing multiple laundries is permitted without locking the cart.
 * - Cart is tied to a laundry only when a service from that laundry is added.
 * - If attempting to add a service from a different laundry while cart has items,
 *   a conflict is returned so a confirmation dialog can be presented.
 * - NEVER silently delete or mix items.
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      laundryId: null,
      laundryName: '',
      laundryAddress: '',
      items: [], // [{ id, name, price, quantity, unit, category, estimatedHours }]
      instructions: '',

      /**
       * Check if adding an item from targetLaundryId conflicts with existing cart
       */
      checkConflict: (targetLaundryId) => {
        const state = get();
        return Boolean(
          state.laundryId &&
          targetLaundryId &&
          state.laundryId !== targetLaundryId &&
          state.items.length > 0
        );
      },

      /**
       * Attempt to add a service item or clothing type item to cart.
       * If conflict detected, returns { conflict: true, currentLaundry } without mutating.
       */
      addItem: ({ laundryId, laundryName, laundryAddress, service, clothingItem = null }) => {
        const state = get();

        // 1. Conflict Check: Cart contains items from another laundry
        if (
          state.laundryId &&
          laundryId &&
          state.laundryId !== laundryId &&
          state.items.length > 0
        ) {
          return {
            conflict: true,
            currentLaundry: {
              id: state.laundryId,
              name: state.laundryName || 'Another Laundry',
              address: state.laundryAddress,
            },
          };
        }

        const currentItems = [...state.items];
        const baseServiceId = service._id || service.id;

        const itemId = clothingItem
          ? `${baseServiceId}_${(clothingItem.name || clothingItem.clothingType).toLowerCase().replace(/\s+/g, '_')}`
          : baseServiceId;

        const itemName = clothingItem
          ? `${service.name} (${clothingItem.name || clothingItem.clothingType})`
          : service.name;

        const price = clothingItem
          ? Number(clothingItem.price || 0)
          : Number(service.price || service.basePrice || 0);

        const clothingType = clothingItem ? (clothingItem.clothingType || clothingItem.name) : undefined;

        const existingIndex = currentItems.findIndex((item) => item.id === itemId);

        if (existingIndex > -1) {
          currentItems[existingIndex].quantity += 1;
        } else {
          currentItems.push({
            id: itemId,
            serviceId: baseServiceId,
            name: itemName,
            clothingType,
            category: service.category || 'Wash',
            price,
            unit: clothingItem ? 'per_piece' : (service.unit || service.priceUnit || 'per_piece'),
            estimatedHours: service.estimatedHours || 24,
            quantity: 1,
          });
        }

        const isSameLaundry = state.laundryId === laundryId;
        set({
          laundryId,
          laundryName: laundryName || (isSameLaundry ? state.laundryName : ''),
          laundryAddress: laundryAddress || (isSameLaundry ? state.laundryAddress : ''),
          items: currentItems,
        });

        return { conflict: false, success: true };
      },

      /**
       * User confirmed: Clear previous cart and add service/clothing item from new laundry
       */
      clearAndAddItem: ({ laundryId, laundryName, laundryAddress, service, clothingItem = null }) => {
        const baseServiceId = service._id || service.id;

        const itemId = clothingItem
          ? `${baseServiceId}_${(clothingItem.name || clothingItem.clothingType).toLowerCase().replace(/\s+/g, '_')}`
          : baseServiceId;

        const itemName = clothingItem
          ? `${service.name} (${clothingItem.name || clothingItem.clothingType})`
          : service.name;

        const price = clothingItem
          ? Number(clothingItem.price || 0)
          : Number(service.price || service.basePrice || 0);

        const clothingType = clothingItem ? (clothingItem.clothingType || clothingItem.name) : undefined;

        const newItems = [
          {
            id: itemId,
            serviceId: baseServiceId,
            name: itemName,
            clothingType,
            category: service.category || 'Wash',
            price,
            unit: clothingItem ? 'per_piece' : (service.unit || service.priceUnit || 'per_piece'),
            estimatedHours: service.estimatedHours || 24,
            quantity: 1,
          },
        ];

        set({
          laundryId,
          laundryName: laundryName || '',
          laundryAddress: laundryAddress || '',
          items: newItems,
          instructions: '',
        });

        return { conflict: false, success: true };
      },

      /**
       * Increment quantity of an item
       */
      incrementItem: (serviceId) => {
        const currentItems = get().items.map((item) => {
          if (item.id === serviceId) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });
        set({ items: currentItems });
      },

      /**
       * Decrement quantity of an item (removes when reaching 0)
       */
      decrementItem: (serviceId) => {
        const currentItems = get().items
          .map((item) => {
            if (item.id === serviceId) {
              return { ...item, quantity: item.quantity - 1 };
            }
            return item;
          })
          .filter((item) => item.quantity > 0);

        set({
          items: currentItems,
          ...(currentItems.length === 0 ? { laundryId: null, laundryName: '', laundryAddress: '' } : {}),
        });
      },

      /**
       * Remove item completely
       */
      removeItem: (serviceId) => {
        const currentItems = get().items.filter((item) => item.id !== serviceId);
        set({
          items: currentItems,
          ...(currentItems.length === 0 ? { laundryId: null, laundryName: '', laundryAddress: '' } : {}),
        });
      },

      /**
       * Set special instructions
       */
      setInstructions: (instructions) => {
        set({ instructions });
      },

      /**
       * Clear entire cart and reset store association
       */
      clearCart: () => {
        set({
          laundryId: null,
          laundryName: '',
          laundryAddress: '',
          items: [],
          instructions: '',
        });
      },

      /**
       * Reset cart alias for clearCart
       */
      resetCart: () => {
        set({
          laundryId: null,
          laundryName: '',
          laundryAddress: '',
          items: [],
          instructions: '',
        });
      },

      /**
       * Get quantity for a given service
       */
      getItemQuantity: (serviceId) => {
        const item = get().items.find((i) => i.id === serviceId);
        return item ? item.quantity : 0;
      },

      /**
       * Verify that all items currently in cart belong strictly to one laundry
       */
      isSingleLaundryValid: () => {
        const { items, laundryId } = get();
        if (items.length === 0) return true;
        return Boolean(laundryId);
      },

      /**
       * Calculate cart totals and pricing breakdown according to KM & ₹100 rule
       */
      getCartSummary: (deliveryFeeOverride) => {
        const items = get().items;
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        let deliveryFee = 0;
        if (deliveryFeeOverride !== undefined && deliveryFeeOverride !== null) {
          deliveryFee = Math.max(0, Number(deliveryFeeOverride) || 0);
        } else if (subtotal > 0) {
          // Standard KM & ₹100 rule:
          // Subtotal >= ₹100: FREE (₹0 within 3 KM)
          // Subtotal < ₹100: ₹30 minimum order fee
          deliveryFee = subtotal >= 100 ? 0 : 30;
        }

        const tax = Math.round(subtotal * 0.05); // 5% standard GST
        const grandTotal = subtotal + deliveryFee + tax;

        return {
          totalItems,
          subtotal,
          deliveryFee,
          tax,
          grandTotal,
        };
      },
    }),
    {
      name: STORAGE_KEYS.CART,
      storage: createJSONStorage(() => mmkvStateStorage),
    }
  )
);

export default useCartStore;
