// src/contexts/CartContext/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, CartState, CartContextType, CartProviderProps, RentalOptionType } from './types';
import { toast } from 'sonner'; // Asumiendo que usas sonner para notificaciones

const CART_STORAGE_KEY = 'nytrixCart';

// Contexto del carrito con un valor inicial undefined para chequear si el provider lo envolvió
const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook personalizado para usar el contexto del carrito
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};

// Proveedor del contexto del carrito
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Cargar el carrito desde localStorage al iniciar
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      return storedCart ? JSON.parse(storedCart) : [];
    } catch (error) {
      console.error("Error al cargar el carrito desde localStorage:", error);
      return [];
    }
  });

  // Guardar el carrito en localStorage cada vez que los ítems cambien
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Error al guardar el carrito en localStorage:", error);
    }
  }, [items]);

  const findItemInCart = useCallback((platformId: number, duration: RentalOptionType, customDays?: number): CartItem | undefined => {
    return items.find(cartItem => 
      cartItem.platform.id === platformId && 
      cartItem.duration === duration && 
      (duration === 'custom' ? cartItem.customDays === customDays : true)
    );
  }, [items]);

  const addToCart = useCallback((itemDetails: Omit<CartItem, 'id'>) => {
    setItems(prevItems => {
      // IMPORTANTE: Cada cuenta debe tratarse como un ítem independiente
      // porque cada una tiene un id_cuenta único que debe pasar a estado 'trámite'
      // en el proceso de pago
      
      // Verificamos si este item.id_cuenta específico ya existe en el carrito
      const itemConMismaCuenta = prevItems.find(cartItem => 
        cartItem.id_cuenta === itemDetails.id_cuenta && itemDetails.id_cuenta !== undefined && itemDetails.id_cuenta !== null
      );
      
      if (itemConMismaCuenta) {
        // Si intentan añadir la misma cuenta exacta (mismo id_cuenta), mostramos un mensaje
        // pero no la añadimos de nuevo
        toast.warning(
          `Esta cuenta de ${itemDetails.platform.nombre} ya está en tu carrito.`
        );
        return prevItems; // No modificamos el carrito
      } else {
        // Siempre añadimos la cuenta como un ítem independiente con ID único
        toast.success(
          `${itemDetails.platform.nombre} (${itemDetails.rentInfo.durationLabel}) añadido al carrito.`
        );
        // Generamos un ID único basado en plataforma, id_cuenta y timestamp
        const newItemId = `${itemDetails.platform.id}-${itemDetails.id_cuenta}-${Date.now()}`;
        return [...prevItems, { ...itemDetails, id: newItemId }];
      }
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setItems(prevItems => {
      const itemToRemove = prevItems.find(item => item.id === itemId);
      if (itemToRemove) {
        toast.info(`${itemToRemove.platform.nombre} (${itemToRemove.rentInfo.durationLabel}) eliminado del carrito.`);
      }
      return prevItems.filter(item => item.id !== itemId);
    });
  }, []);

  const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
    setItems(prevItems => {
      const itemToUpdate = prevItems.find(item => item.id === itemId);
      if (newQuantity <= 0) {
        if (itemToUpdate) {
          toast.info(
            `${itemToUpdate.platform.nombre} (${itemToUpdate.rentInfo.durationLabel}) eliminado del carrito.`
          );
        }
        return prevItems.filter(item => item.id !== itemId);
      }
      if (itemToUpdate) {
        toast.info(
          `Cantidad de ${itemToUpdate.platform.nombre} (${itemToUpdate.rentInfo.durationLabel}) actualizada.`
        );
      }
      return prevItems.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, rentInfo: { ...item.rentInfo, totalPriceForItem: (item.rentInfo.pricePerAccountAfterDiscount * newQuantity) } }
          : item
      );
    });
  }, []);

  const clearCart = useCallback((options?: { notify?: boolean }) => {
    const { notify = true } = options || {}; // Por defecto, notificar
    setItems([]);
    if (notify) {
      toast.info("Carrito vaciado.");
    }
  }, []);

  const getCartTotalAmount = useCallback((): number => {
    return items.reduce((total, item) => total + item.rentInfo.totalPriceForItem, 0);
  }, [items]);

  const getTotalItemsCount = useCallback((): number => {
    // Esto cuenta el número de líneas de ítems. Si quieres la suma de todas las quantities:
    // return items.reduce((count, item) => count + item.quantity, 0);
    return items.length; 
  }, [items]);

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateItemQuantity,
    clearCart,
    getCartTotalAmount,
    getTotalItemsCount,
    findItemInCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}; 