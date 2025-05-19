import React from "react";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext/CartContext";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyCOP } from "@/utils/numberFormatting";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const CartStatusIcon = () => {
  const { items, getTotalItemsCount, getCartTotalAmount, clearCart, removeFromCart } = useCart();
  const { user } = useAuth();
  const totalItems = getTotalItemsCount();
  const totalAmount = getCartTotalAmount();
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    if (items.length > 0) {
      navigate("/checkout");
    } else {
      // Opcional: mostrar un toast si el carrito está vacío, aunque el botón debería estar deshabilitado
      // toast.info("Tu carrito está vacío."); 
    }
  };

  // Si no hay un usuario autenticado, no mostrar el carrito
  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs px-0.5 sm:px-1"
            >
              {totalItems}
            </Badge>
          )}
          <span className="sr-only">Abrir carrito</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 sm:w-80 p-3 sm:p-4">
        <div className="grid gap-2 sm:gap-3 md:gap-4">
          <div className="space-y-1 sm:space-y-2">
            <h4 className="text-sm sm:text-base font-medium leading-tight sm:leading-none">Resumen del Carrito</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tienes {totalItems} {totalItems === 1 ? "ítem" : "ítems"} en tu carrito.
            </p>
          </div>
          <Separator />
          
          {items.length > 0 ? (
            <div className="grid gap-1 sm:gap-2 max-h-60 overflow-y-auto pr-1 sm:pr-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-1 sm:gap-2">
                  <div className="truncate">
                    <span className="text-xs sm:text-sm font-medium">{item.platform.nombre}</span>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} x {item.rentInfo.durationLabel}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-medium">
                    ${formatCurrencyCOP(item.rentInfo.totalPriceForItem)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={() => removeFromCart(item.id)}>
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                    <span className="sr-only">Eliminar ítem</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted-foreground">Tu carrito está vacío.</p>
          )}

          {items.length > 0 && <Separator />}
          
          <div className="grid gap-1 sm:gap-2">
            <div className="flex items-center justify-between font-medium text-sm sm:text-base">
              <span>Total General:</span>
              <span>${formatCurrencyCOP(totalAmount)}</span>
            </div>
            <Button 
              onClick={handleProceedToCheckout}
              className="w-full bg-gradient-nytrix hover:opacity-90 text-xs sm:text-sm px-3 py-1.5 h-auto sm:h-auto"
              disabled={items.length === 0}
            >
              Proceder al Pago
            </Button>
            {items.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => clearCart()} className="w-full text-xs sm:text-sm">
                <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Vaciar Carrito
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 