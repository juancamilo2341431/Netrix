import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { addDays } from "date-fns";
import { toast } from "sonner";
import { Check, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [processResult, setProcessResult] = useState({
    success: false,
    message: "",
    cuentasRenovadas: 0,
    error: false
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  // Extraer la referencia de Bold de la URL de redirección
  const boldReference = searchParams.get("payment_link");

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const processPayment = async () => {
      try {
        // Revisar si hay renovaciones múltiples pendientes
        const pendingRenovacionesJSON = localStorage.getItem('pendingRenovaciones');
        
        if (pendingRenovacionesJSON) {
          // Procesar renovaciones múltiples
          const pendingData = JSON.parse(pendingRenovacionesJSON);
          if (pendingData.es_multiple && pendingData.renovaciones && pendingData.renovaciones.length > 0) {
            // Verificar que la referencia coincida
            if (boldReference && pendingData.referencia_bold === boldReference) {
              let cuentasRenovadas = 0;
              
              // Crear un registro de pago
              const { data: pagoData, error: pagoError } = await supabase
                .from('pago')
                .insert({
                  estado: 'pagado',
                  id_factura: boldReference,
                  metodo_pago: 'Bold',
                  monto_pago: pendingData.monto_total.toString(),
                  last_updated: new Date().toISOString()
                })
                .select('id')
                .single();

              if (pagoError) throw pagoError;
              
              const idPago = pagoData.id;
              
              // Procesar todas las renovaciones
              for (const renovacion of pendingData.renovaciones) {
                // Crear renovación en la base de datos
                const { data: renovacionData, error: renovacionError } = await supabase
                  .from('renta')
                  .insert({
                    id_cuenta: renovacion.id_cuenta,
                    id_persona: renovacion.id_persona,
                    estado: 'rentada',
                    fecha_inicio: renovacion.fecha_inicio,
                    fecha_fin: renovacion.fecha_fin,
                    id_cupon_persona: renovacion.cupon_persona_id || null
                  })
                  .select('id')
                  .single();
                  
                if (renovacionError) {
                  console.error("Error al crear renovación:", renovacionError);
                  continue;
                }
                
                // Relacionar pago con renta
                await supabase
                  .from('pago_renta')
                  .insert({
                    id_pago: idPago,
                    id_renta: renovacionData.id
                  });
                
                // Actualizar estado de cuenta
                const { error: updateError } = await supabase
                  .from('cuenta')
                  .update({ 
                    estado: 'alquilada', 
                    last_updated: new Date().toISOString()
                  })
                  .eq('id', renovacion.id_cuenta);
                  
                if (updateError) {
                  console.error("Error al actualizar cuenta:", updateError);
                  continue;
                }
                
                cuentasRenovadas++;
              }
              
              // Limpiar localStorage después de procesar
              localStorage.removeItem('pendingRenovaciones');
              
              setProcessResult({
                success: true,
                message: "Renovación completada con éxito",
                cuentasRenovadas,
                error: false
              });
            } else {
              // Referencias no coinciden
              setProcessResult({
                success: false,
                message: "La referencia de pago no coincide con la transacción pendiente",
                cuentasRenovadas: 0,
                error: true
              });
            }
          }
        } else {
          // Revisar si hay una renovación individual pendiente
          const pendingRenovacionJSON = localStorage.getItem('pendingRenovacion');
          
          if (pendingRenovacionJSON) {
            const renovacion = JSON.parse(pendingRenovacionJSON);
            
            // Verificar que la referencia coincida
            if (boldReference && renovacion.referencia_bold === boldReference) {
              // Crear un registro de pago
              const { data: pagoData, error: pagoError } = await supabase
                .from('pago')
                .insert({
                  estado: 'pagado',
                  id_factura: boldReference,
                  metodo_pago: 'Bold',
                  monto_pago: renovacion.monto.toString(),
                  last_updated: new Date().toISOString()
                })
                .select('id')
                .single();

              if (pagoError) throw pagoError;
              
              // Crear renovación en la base de datos
              const { data: renovacionData, error: renovacionError } = await supabase
                .from('renta')
                .insert({
                  id_cuenta: renovacion.id_cuenta,
                  id_persona: renovacion.id_persona,
                  estado: 'rentada',
                  fecha_inicio: renovacion.fecha_inicio,
                  fecha_fin: renovacion.fecha_fin,
                  id_cupon_persona: renovacion.cupon_persona_id || null
                })
                .select('id')
                .single();
                
              if (renovacionError) throw renovacionError;
              
              // Relacionar pago con renta
              await supabase
                .from('pago_renta')
                .insert({
                  id_pago: pagoData.id,
                  id_renta: renovacionData.id
                });
              
              // Actualizar estado de cuenta
              const { error: updateError } = await supabase
                .from('cuenta')
                .update({ 
                  estado: 'alquilada', 
                  last_updated: new Date().toISOString()
                })
                .eq('id', renovacion.id_cuenta);
                
              if (updateError) throw updateError;
              
              // Limpiar localStorage después de procesar
              localStorage.removeItem('pendingRenovacion');
              
              setProcessResult({
                success: true,
                message: "Renovación completada con éxito",
                cuentasRenovadas: 1,
                error: false
              });
            } else {
              // Referencias no coinciden
              setProcessResult({
                success: false,
                message: "La referencia de pago no coincide con la transacción pendiente",
                cuentasRenovadas: 0,
                error: true
              });
            }
          } else {
            // No hay renovaciones pendientes
            setProcessResult({
              success: false,
              message: "No se encontraron renovaciones pendientes",
              cuentasRenovadas: 0,
              error: true
            });
          }
        }
      } catch (error) {
        console.error("Error procesando el pago:", error);
        setProcessResult({
          success: false,
          message: "Error al procesar la renovación",
          cuentasRenovadas: 0,
          error: true
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [boldReference, navigate, user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#1a192d] to-[#121123] p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-xl border border-nytrix-purple/20">
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 border-4 border-nytrix-purple border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-semibold text-white">Procesando pago...</h2>
            <p className="text-muted-foreground text-center">
              Estamos registrando tu pago y activando tus cuentas. Por favor, no cierres esta ventana.
            </p>
          </div>
        ) : processResult.success ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">¡Pago exitoso!</h2>
            <p className="text-center text-muted-foreground">
              {processResult.cuentasRenovadas > 1 
                ? `Tus ${processResult.cuentasRenovadas} cuentas han sido renovadas correctamente.`
                : "Tu cuenta ha sido renovada correctamente."}
            </p>
            
            <div className="pt-4 mt-4 border-t border-nytrix-purple/10 w-full">
              <Button 
                onClick={() => navigate('/client/accounts/active')}
                className="w-full bg-gradient-nytrix hover:opacity-90"
              >
                Ver mis cuentas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-red-500"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Ha ocurrido un problema</h2>
            <p className="text-center text-muted-foreground">
              {processResult.message}
            </p>
            
            <div className="pt-4 mt-4 border-t border-nytrix-purple/10 w-full">
              <Button 
                onClick={() => navigate('/client')}
                className="w-full bg-gradient-nytrix hover:opacity-90"
              >
                Ir al Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 