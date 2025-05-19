import { Database } from "@/integrations/supabase/types";

// Representa una plataforma, tomando el tipo Row de la tabla 'plataforma'
export type Platform = Database["public"]["Tables"]["plataforma"]["Row"];

// Representa un cupón, tomando el tipo Row de la tabla 'cupon'
export type Coupon = Database["public"]["Tables"]["cupon"]["Row"];

// Tipos para la duración del alquiler, como los definidos en RentModal.tsx
// Podríamos mover RENTAL_DURATIONS aquí también si se usa en más sitios.
export type RentalDurationKey = "1m" | "2m" | "3m" | "6m" | "12m";
export type RentalOptionType = RentalDurationKey | "custom";


// Información detallada del alquiler calculada para un ítem del carrito
export interface RentInfo {
  basePrice: number;          // Precio mensual original de la plataforma (antes de cualquier cálculo)
  subtotalBeforeDiscount: number; // (Precio base * meses) o (precio custom days), ANTES de descuento, para UNA unidad
  discountApplied: number;    // Descuento del cupón en valor absoluto para UNA unidad
  pricePerAccountAfterDiscount: number; // Precio por cuenta DESPUÉS de descuento ((subtotalBeforeDiscount - discountApplied) / 1)
  totalPriceForItem: number;  // (pricePerAccountAfterDiscount * quantity)
  durationLabel: string;      // Etiqueta de la duración (ej: "1 Mes", "15 Días")
  days: number;               // Número total de días para esta opción de alquiler
}

// Representa un ítem individual en el carrito de compras
export interface CartItem {
  id: string; // ID único para el ítem del carrito (ej: platform.id + '-' + timestamp)
  platform: Platform;
  id_cuenta: number; // ID de la cuenta específica de la tabla 'cuenta' que se está rentando
  quantity: number;
  duration: RentalOptionType;
  customDays?: number;
  selectedCouponId?: number | "none"; // ID del cupón aplicado a este ítem, o "none"
  rentInfo: RentInfo; // La información calculada para este ítem específico
}

// Estado global del carrito
export interface CartState {
  items: CartItem[];
  // Aquí podríamos añadir más adelante un cupón global para todo el carrito, si se desea
  // globalCouponId?: number;
}

// Funciones disponibles en el contexto del carrito
export interface CartContextType extends CartState {
  addToCart: (itemDetails: Omit<CartItem, "id">) => void;
  removeFromCart: (itemId: string) => void;
  updateItemQuantity: (itemId: string, newQuantity: number) => void; // Considerar la lógica de recalcular precios y validar stock
  clearCart: (options?: { notify?: boolean }) => void;
  getCartTotalAmount: () => number; // Suma de totalPriceForItem de todos los ítems
  getTotalItemsCount: () => number; // Suma de quantity de todos los ítems (o solo el número de líneas de ítems)
  findItemInCart: (platformId: number, duration: RentalOptionType, customDays?: number) => CartItem | undefined;
}

// Props para el proveedor del contexto del carrito
export interface CartProviderProps {
  children: React.ReactNode;
} 