import { create } from "zustand";
import type { CartItem, Product, ProductGroup, Order } from "@/types";

interface AppState {
  // カート状態
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  
  // 商品状態
  products: ProductGroup[];
  setProducts: (products: ProductGroup[]) => void;
  
  // 注文状態
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  
  // ローディング状態
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // カート初期状態
  cart: [],
  
  addToCart: (product) =>
    set((state) => {
      const existingItem = state.cart.find(
        (item) => item.product.商品ID === product.商品ID
      );
      
      if (existingItem) {
        return {
          cart: state.cart.map((item) =>
            item.product.商品ID === product.商品ID
              ? {
                  ...item,
                  quantity: item.quantity + 1,
                  subtotalExclTax: (item.quantity + 1) * product.税抜価格,
                  subtotalInclTax: (item.quantity + 1) * product.税込価格,
                }
              : item
          ),
        };
      }
      
      return {
        cart: [
          ...state.cart,
          {
            product,
            quantity: 1,
            subtotalExclTax: product.税抜価格,
            subtotalInclTax: product.税込価格,
          },
        ],
      };
    }),
  
  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.商品ID !== productId),
    })),
  
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.商品ID === productId
          ? {
              ...item,
              quantity,
              subtotalExclTax: quantity * item.product.税抜価格,
              subtotalInclTax: quantity * item.product.税込価格,
            }
          : item
      ),
    })),
  
  clearCart: () => set({ cart: [] }),
  
  // 商品初期状態
  products: [],
  setProducts: (products) => set({ products }),
  
  // 注文初期状態
  orders: [],
  setOrders: (orders) => set({ orders }),
  
  // ローディング状態
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
