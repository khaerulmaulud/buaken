"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { MenuItem, Merchant } from "@/types";

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  merchantId: string; // Ensure all items are from same merchant or handle multi-merchant logic
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity: number, notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  merchant: Merchant | null;
  setMerchant: (merchant: Merchant) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [merchant, setMerchant] = useState<Merchant | null>(null);

  // Load from local storage on mount (client only)
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    const savedMerchant = localStorage.getItem("cart_merchant");
    if (savedCart) setItems(JSON.parse(savedCart));
    if (savedMerchant) setMerchant(JSON.parse(savedMerchant));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
    if (merchant)
      localStorage.setItem("cart_merchant", JSON.stringify(merchant));
    else localStorage.removeItem("cart_merchant");
  }, [items, merchant]);

  const addItem = (menuItem: MenuItem, quantity: number, notes?: string) => {
    // Check if adding from different merchant
    if (merchant && merchant.id !== menuItem.merchantId) {
      // Ideally show a confirmation dialog to clear cart. For now, we'll just alert or block.
      // Let's simple implementation: if empty or same merchant, allow.
      // If different, we really should prompt user. For MVP, let's just clear.
      if (
        !confirm(
          "Start a new basket? Adding items from a different restaurant will clear your current basket.",
        )
      ) {
        return;
      }
      setItems([]);
      setMerchant(null); // Will be set shortly
      // We need the merchant details passed in too effectively, or we fetch it.
      // For this context simplicity, we assume the caller handles setMerchant if it's a new one.
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [
        ...prev,
        { menuItem, quantity, notes, merchantId: menuItem.merchantId },
      ];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.menuItem.id !== itemId));
    if (items.length <= 1) {
      setMerchant(null);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menuItem.id === itemId ? { ...i, quantity } : i)),
    );
  };

  const clearCart = () => {
    setItems([]);
    setMerchant(null);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce(
    (acc, item) => acc + item.menuItem.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        merchant,
        setMerchant,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
