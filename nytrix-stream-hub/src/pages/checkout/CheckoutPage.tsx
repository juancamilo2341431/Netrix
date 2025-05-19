// src/pages/checkout/CheckoutPage.tsx
// Este archivo contendrá la lógica y la interfaz de usuario para la página de checkout.

import React from 'react';
import { useCart } from '@/contexts/CartContext/CartContext';
import { Button } from '@/components/ui/button';
import { generateBoldPaymentLink } from '@/integrations/bold/boldClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyCOP } from '@/utils/numberFormatting';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const CheckoutPage: React.FC = () => {
  const { items, clearCart, getCartTotalAmount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePayment = async () => {
    setIsLoading(true);
    if (items.length === 0) {
      toast.error("Tu carrito está vacío.");
      setIsLoading(false);
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión para realizar el pago.");
      setIsLoading(false);
      navigate('/login');
      return;
    }

    let personaId: number | string | null = null;
    try {
      const { data: personaData, error: personaError } = await supabase
        .from('persona')
        .select('id')
        .eq('id_user', user.id)
        .single();

      if (personaError) {
        throw new Error(`Error al obtener datos de persona: ${personaError.message}`);
      }
      if (!personaData) {
        throw new Error("No se encontró el perfil del usuario.");
      }
      personaId = personaData.id;
    } catch (error: any) {
      toast.error(error.message || "No se pudo verificar la información del usuario.");
      setIsLoading(false);
      return;
    }

    const firstCartItem = items[0];
    if (!firstCartItem || typeof firstCartItem.id_cuenta === 'undefined') {
        toast.error("Error: No se pudo obtener la información de la cuenta del carrito.");
        setIsLoading(false);
        return;
    }

    // Construir el array cuentasInfo a partir de todos los items del carrito
    // Cada item en el carrito ahora debería representar una cuenta individual con su id_cuenta
    const cuentasInfoParaBold = items.map(item => {
      if (typeof item.id_cuenta === 'undefined') {
        throw new Error("Un artículo en el carrito no tiene ID de cuenta.");
      }
      return { id_cuenta: item.id_cuenta };
    });

    if (cuentasInfoParaBold.length === 0) {
      toast.error("Error: No hay cuentas válidas en el carrito para procesar.");
      setIsLoading(false);
      return;
    }

    const totalAmount = getCartTotalAmount();
    const description = `Pedido Nytrix Stream Hub - ${items.length} ítem(s)`;

    try {
      const paymentLinkData = await generateBoldPaymentLink(
        totalAmount, 
        description,
        cuentasInfoParaBold,
        personaId
      );

      if (paymentLinkData && paymentLinkData.paymentLinkUrl) {
        toast.info("Redirigiendo a la pasarela de pagos...");
        
        // Actualizar el estado de las cuentas en el carrito a 'tramite'
        for (const item of items) {
          if (item.id_cuenta) {
            const { error: updateError } = await supabase
              .from('cuenta')
              .update({ estado: 'tramite' }) 
              .eq('id', item.id_cuenta)
              .eq('estado', 'disponible');

            if (updateError) {
              // Opcional: notificar al usuario o manejar el error de forma más específica
            }
          }
        }

        window.location.href = paymentLinkData.paymentLinkUrl;
        clearCart(); // Limpiar el carrito después de redirigir
      } else {
        toast.error("Error al procesar el pago. Intenta nuevamente.");
      }
    } catch (error: any) {
      const errorMessage = error.details?.error || error.message || "No se pudo generar el enlace de pago. Por favor, intenta más tarde.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Checkout</h1>
        <p className="text-nytrix-light-purple">Tu carrito está vacío. Añade algunos productos antes de proceder al pago.</p>
        <Button onClick={() => navigate('/platforms')} className="mt-4 bg-gradient-nytrix hover:opacity-90">
          Volver a las plataformas
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
      <div className="bg-[#1c1b33] p-8 rounded-xl shadow-2xl w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">Resumen de tu Pedido</h1>
        
        <div className="space-y-4 mb-8 max-h-72 overflow-y-auto pr-2">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center py-3 border-b border-nytrix-dark-gray last:border-b-0">
              <div>
                <p className="font-semibold text-white">{item.platform.nombre}</p>
                <p className="text-sm text-nytrix-light-purple">
                  {item.quantity} x {item.rentInfo.durationLabel}
                </p>
              </div>
              <p className="font-semibold text-white">{formatCurrencyCOP(item.rentInfo.totalPriceForItem)}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-6 border-t-2 border-nytrix-purple">
          <div className="flex justify-between items-center font-bold text-xl text-white">
            <span>Total a Pagar:</span>
            <span>{formatCurrencyCOP(getCartTotalAmount())}</span>
          </div>
        </div>

        <Button 
          onClick={handlePayment} 
          disabled={isLoading || items.length === 0}
          className="w-full mt-10 bg-gradient-nytrix hover:opacity-80 text-lg py-3 rounded-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          {isLoading ? (
            <>
              {/* <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Reemplazar con tu componente Loader si lo tienes */}
              Procesando...
            </>
          ) : 'Pagar con Bold'}
        </Button>
        <Button 
            variant="outline"
            onClick={() => navigate('/platforms')} 
            className="w-full mt-4 border-nytrix-light-purple text-nytrix-light-purple hover:bg-nytrix-light-purple hover:text-nytrix-dark-purple"
          >
            Seguir Comprando
        </Button>
      </div>
    </div>
  );
};

export default CheckoutPage; 