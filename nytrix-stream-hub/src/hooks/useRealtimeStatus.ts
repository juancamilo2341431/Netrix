import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para gestionar automáticamente el cambio de estados de rentas
 * según las reglas de negocio establecidas:
 * 
 * 1. Cambio a "próximo" para rentas entre 0 y 7 días antes de vencer
 * 2. Cambio a "vencida" y cambio de cuenta a "corte" un día después de vencer
 * 3. Restaurar cuentas en "trámite" a "disponible" después de 1 minuto
 */
export const useRealtimeStatus = () => {
  useEffect(() => {
    console.log("⏰ Iniciando useRealtimeStatus hook");
    
    // Ejecutar la actualización de estados al montar el componente
    updateRentalStates();
    
    // Restaurar cuentas en trámite expiradas inmediatamente
    checkExpiredPendingAccounts();
    console.log("✅ Primera verificación de cuentas en trámite ejecutada");
    
    // Programar actualización diaria a la misma hora
    const now = new Date();
    const nextUpdate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Mañana a las 4AM
      4, 0, 0
    );
    
    // Calcular milisegundos hasta la próxima actualización
    let timeUntilNextUpdate = nextUpdate.getTime() - now.getTime();
    if (timeUntilNextUpdate < 0) {
      // Si ya pasó la hora de hoy, programar para mañana
      timeUntilNextUpdate += 24 * 60 * 60 * 1000;
    }
    
    // Programar verificación de cuentas en trámite con más frecuencia (cada 15 segundos)
    console.log("🔄 Configurando intervalo de verificación cada 15 segundos");
    let checkCounter = 0;
    const pendingCheckIntervalId = setInterval(() => {
      checkCounter++;
      console.log(`🔍 Ejecutando verificación #${checkCounter} de cuentas en trámite`);
      checkExpiredPendingAccounts();
    }, 15 * 1000); // Verificar cada 15 segundos para pruebas
    
    // Programar la primera actualización diaria
    const timeoutId = setTimeout(() => {
      updateRentalStates();
      
      // Después de la primera ejecución, programar actualizaciones diarias
      const intervalId = setInterval(() => {
        updateRentalStates();
      }, 24 * 60 * 60 * 1000); // 24 horas en milisegundos
      
      // Guardar el ID del intervalo para limpiarlo después
      return () => {
        clearInterval(intervalId);
        clearInterval(pendingCheckIntervalId);
      };
    }, timeUntilNextUpdate);
    
    // Función de limpieza
    return () => {
      console.log("🛑 Limpiando useRealtimeStatus hook");
      clearTimeout(timeoutId);
      clearInterval(pendingCheckIntervalId);
    };
  }, []);
  
  // Función para verificar y restaurar cuentas en trámite expiradas
  const checkExpiredPendingAccounts = async () => {
    try {
      // Primero consultar cuántas cuentas están en "trámite" actualmente
      const { data: tramiteAccounts, error: countError } = await supabase
        .from('cuenta')
        .select('id, last_updated')
        .eq('estado', 'tramite');
      
      if (countError) {
        console.error("Error al consultar cuentas en trámite:", countError);
        return;
      }
      
      const now = new Date();
      const expiredAccounts = tramiteAccounts?.filter(acc => {
        const lastUpdated = new Date(acc.last_updated);
        const diffMs = now.getTime() - lastUpdated.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        return diffSec >= 60; // 60 segundos = 1 minuto
      }) || [];
      
      console.log(`📊 Cuentas en trámite: ${tramiteAccounts?.length || 0}, expiradas: ${expiredAccounts.length}`);
      
      if (expiredAccounts.length > 0) {
        console.log("⚠️ Cuentas expiradas encontradas:", expiredAccounts);
        
        // Si hay cuentas expiradas, actualizar manualmente cada una como respaldo adicional
        for (const account of expiredAccounts) {
          console.log(`🔨 Actualizando manualmente cuenta #${account.id} de trámite a disponible`);
          
          const { error: manualUpdateError } = await supabase
            .from('cuenta')
            .update({ 
              estado: 'disponible', 
              last_updated: new Date().toISOString() 
            })
            .eq('id', account.id)
            .eq('estado', 'tramite'); // Solo actualizar si sigue en trámite
            
          if (manualUpdateError) {
            console.error(`❌ Error al actualizar manualmente cuenta #${account.id}:`, manualUpdateError);
          } else {
            console.log(`✅ Cuenta #${account.id} actualizada manualmente a disponible`);
          }
        }
        
        // Ejecutar también la función RPC para registro y comparar resultados
        const { data: result, error } = await supabase
          .rpc('restaurar_cuentas_tramite_expiradas');
          
        if (error) {
          console.error("❌ Error restaurando cuentas en trámite:", error);
        } else {
          console.log(`✅ Función restaurar_cuentas_tramite_expiradas ejecutada correctamente. Resultado: ${result}`);
          
          // Verificar si realmente se actualizaron las cuentas
          setTimeout(async () => {
            const { data: afterAccounts, error: afterError } = await supabase
              .from('cuenta')
              .select('id, estado')
              .in('id', expiredAccounts.map(acc => acc.id));
              
            if (afterError) {
              console.error("Error al verificar estado posterior:", afterError);
            } else {
              const stillInTramite = afterAccounts?.filter(acc => acc.estado === 'tramite') || [];
              console.log(`🔄 Estado después de restauración: ${stillInTramite.length} cuentas siguen en trámite de ${expiredAccounts.length} que debían restaurarse`);
            }
          }, 1000); // Verificar después de 1 segundo
        }
      }
    } catch (err) {
      console.error("❌ Error al verificar cuentas en trámite:", err);
    }
  };
  
  // Función para actualizar estados de rentas según condiciones de fechas
  const updateRentalStates = async () => {
    try {
      const fechaActual = new Date();
      
      // 1. Actualizar rentas que están entre 0 y 7 días de vencer
      // Ya no necesitamos calcular una fecha específica para las rentas próximas
      // porque la función SQL ahora utiliza la fecha actual (CURRENT_DATE)
      // y calcula el rango internamente
      const { error: proximo_error } = await supabase
        .rpc('actualizar_rentas_proximas_a_vencer', { 
          fecha_referencia: fechaActual.toISOString().split('T')[0] 
        });
      
      if (proximo_error) {
        console.error("Error actualizando rentas próximas:", proximo_error);
      }
      
      // 2. Actualizar rentas vencidas (1 día después de fecha_fin)
      const unDiaAntes = new Date(fechaActual);
      unDiaAntes.setDate(unDiaAntes.getDate() - 1);
      
      const fechaUnDiaAntes = unDiaAntes.toISOString().split('T')[0];
      
      // Llamar a la función SQL para actualizar rentas vencidas y sus cuentas
      const { error: vencida_error } = await supabase
        .rpc('actualizar_rentas_vencidas', { 
          fecha_referencia: fechaUnDiaAntes 
        });
        
      if (vencida_error) {
        console.error("Error actualizando rentas vencidas:", vencida_error);
      }
      
      // También verificamos las cuentas en trámite expiradas en la verificación diaria
      await checkExpiredPendingAccounts();
      
      console.log(`Actualización de estados completada: ${new Date().toLocaleString()}`);
    } catch (err) {
      console.error("Error en actualización automática de estados:", err);
    }
  };
  
  // Exponer las funciones para uso manual si es necesario
  return {
    updateRentalStates,
    checkExpiredPendingAccounts
  };
}; 