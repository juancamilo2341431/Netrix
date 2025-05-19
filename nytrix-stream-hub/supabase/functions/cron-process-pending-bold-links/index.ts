// supabase/functions/cron-process-pending-bold-links/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"; // Considera actualizar std
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
const PENDING_THRESHOLD_MINUTES = 1; // Cuánto tiempo debe pasar un intento en PENDIENTE/ACTIVE antes de ser verificado.
const PENDING_THRESHOLD_MS = PENDING_THRESHOLD_MINUTES * 60 * 1000;
const PROCESSING_LIMIT = 20; // Limitar la cantidad de intentos procesados por ejecución del cron
// Ya no necesitamos CONFIGURED_LINK_DURATION_SECONDS aquí, 
// porque la fecha de expiración está en `duracion_segundos_configurada` (que es una fecha ISO)
// Margen de gracia DESPUÉS de la fecha de expiración configurada antes de forzarlo a EXPIRED.
// Si la fecha de expiración es T, y el grace period es 20s, 
// forzaremos a EXPIRED si current_time > T + grace_period.
// O, como está en tu código: currentTimeWithGrace (Date.now() - GRACE) > configuredExpirationTime.
// Esto significa que si el tiempo actual menos la gracia sigue siendo mayor que el tiempo de expiración, se considera expirado.
// Si la fecha de expiración fue HACE MÁS de PRESUMPTIVE_EXPIRATION_GRACE_SECONDS, se fuerza.
const PRESUMPTIVE_EXPIRATION_GRACE_SECONDS = 20; // Ajusta según necesidad
serve(async (req)=>{
  console.log("RAW REQUEST RECEIVED by cron-process-pending-bold-links at:", new Date().toISOString());
  const headersObject = {};
  req.headers.forEach((value, key)=>{
    headersObject[key] = value;
  });
  console.log("RAW REQUEST HEADERS:", JSON.stringify(headersObject, null, 2));
  const expectedCronSecret = Deno.env.get("CRON_JOB_SECRET");
  if (!expectedCronSecret) {
    console.error("CRON: CRON_JOB_SECRET no está configurado.");
    return new Response(JSON.stringify({
      error: "Error de configuración interna del servidor."
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
  const authorizationHeader = req.headers.get("Authorization");
  if (authorizationHeader !== `Bearer ${expectedCronSecret}`) {
    console.warn("CRON: Intento de llamada no autorizada. Header:", authorizationHeader);
    return new Response(JSON.stringify({
      error: "No autorizado."
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 401
    });
  }
  console.log(`CRON: Iniciando cron-process-pending-bold-links a las ${new Date().toISOString()}`);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("CRON: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas.");
      return new Response(JSON.stringify({
        error: "Error de config. Supabase keys."
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    const supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    // Obtener todos los intentos que están en PENDIENTE_BOLD o ACTIVE
    const { data: intentos, error: fetchError } = await supabaseAdminClient.from("intentos_pago").select("id, id_link_pago_bold, created_at, estado_intento, id_cuenta, duracion_segundos_configurada") // `duracion_segundos_configurada` es la fecha de expiración ISO
    .in("estado_intento", [
      "PENDIENTE_BOLD",
      "ACTIVE"
    ]).order("created_at", {
      ascending: true
    }).limit(PROCESSING_LIMIT);
    if (fetchError) {
      console.error("CRON: Error al obtener intentos pendientes:", fetchError);
      return new Response(JSON.stringify({
        error: "Error al consultar intentos.",
        details: fetchError.message
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      });
    }
    if (!intentos || intentos.length === 0) {
      console.log("CRON: No hay intentos PENDIENTE_BOLD o ACTIVE que procesar.");
      return new Response(JSON.stringify({
        message: "No hay intentos pendientes o activos."
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    console.log(`CRON: Se encontraron ${intentos.length} intentos PENDIENTE_BOLD o ACTIVE para procesar.`);
    let successCount = 0;
    let errorCount = 0;
    let systemForcedExpirationCount = 0;
    for (const intento of intentos){
      console.log(`CRON: Procesando Intento ID: ${intento.id}, Link: ${intento.id_link_pago_bold}, Cuenta: ${intento.id_cuenta}, Estado Actual DB: ${intento.estado_intento}, Creado: ${intento.created_at}, Fecha Exp. Configurada (DB): ${intento.duracion_segundos_configurada}`);
      if (typeof intento.id_cuenta === 'undefined' || intento.id_cuenta === null) {
        console.error(`CRON: Intento ID ${intento.id} no tiene id_cuenta. Saltando.`);
        errorCount++;
        continue;
      }
      let forceStatusPayload = null; // Será "EXPIRED" o null
      // --- Lógica de Expiración Presuntiva ---
      // `duracion_segundos_configurada` es la fecha de expiración del link guardada como ISO string.
      if (intento.duracion_segundos_configurada) {
        const configuredExpirationTime = new Date(intento.duracion_segundos_configurada).getTime();
        // El link se considera presuntivamente expirado si el tiempo actual
        // ha superado la fecha de expiración MÁS un periodo de gracia.
        // O, como lo tienes: si (tiempo_actual - gracia) > tiempo_expiracion_configurado
        // Esto significa: si el tiempo_expiracion_configurado ya pasó hace más de X segundos (grace_period)
        const currentTime = Date.now();
        if (currentTime > configuredExpirationTime + PRESUMPTIVE_EXPIRATION_GRACE_SECONDS * 1000) {
          console.log(`CRON: Intento ID ${intento.id} (Link: ${intento.id_link_pago_bold}) cumple condición para EXPIRACIÓN PRESUNTIVA. 
                        Configured Expiry: ${new Date(configuredExpirationTime).toISOString()}, 
                        Grace Period: ${PRESUMPTIVE_EXPIRATION_GRACE_SECONDS}s,
                        Current Time: ${new Date(currentTime).toISOString()}. 
                        El link ha expirado hace más que el periodo de gracia.`);
          forceStatusPayload = "EXPIRED";
          systemForcedExpirationCount++;
        } else {
        // Log para cuando no aplica la expiración presuntiva
        // console.log(`CRON: Intento ID ${intento.id} NO cumple expiración presuntiva. 
        //              Configured Expiry: ${new Date(configuredExpirationTime).toISOString()},
        //              Current Time: ${new Date(currentTime).toISOString()}`);
        }
      } else {
        console.warn(`CRON: Intento ID ${intento.id} no tiene 'duracion_segundos_configurada'. No se puede aplicar expiración presuntiva.`);
      }
      // --- Fin Lógica de Expiración Presuntiva ---
      // Si no se forzó la expiración, Y el intento es "antiguo" según PENDING_THRESHOLD_MS, 
      // también lo procesamos (sin forzar estado, sync-bold-payment-status consultará a Bold).
      const isOldPending = !forceStatusPayload && Date.now() - new Date(intento.created_at).getTime() > PENDING_THRESHOLD_MS;
      let shouldProcess = false;
      if (forceStatusPayload) {
        console.log(`CRON: Intento ID ${intento.id} se procesará con force_status: ${forceStatusPayload}`);
        shouldProcess = true;
      } else if (isOldPending) {
        console.log(`CRON: Intento ID ${intento.id} se procesará por antigüedad (PENDING_THRESHOLD_MS superado).`);
        shouldProcess = true;
      }
      if (shouldProcess) {
        const syncPayload = {
          id_intento_pago: intento.id,
          id_link_pago_bold: intento.id_link_pago_bold,
          id_cuenta: intento.id_cuenta
        };
        if (forceStatusPayload) {
          syncPayload.force_status = forceStatusPayload;
        }
        console.log(`CRON: Payload para sync-bold-payment-status (Intento ID ${intento.id}):`, JSON.stringify(syncPayload, null, 2));
        try {
          const { data: syncResult, error: invokeError } = await supabaseAdminClient.functions.invoke("sync-bold-payment-status", {
            body: syncPayload
          });
          if (invokeError) {
            console.error(`CRON: Error al invocar 'sync-bold-payment-status' para Link ${intento.id_link_pago_bold} (Intento ID ${intento.id}):`, invokeError.message);
            if (invokeError.message && invokeError.message.includes("Function not found")) {
              console.error("CRON: VERIFICA QUE 'sync-bold-payment-status' ESTÉ DESPLEGADA Y EL NOMBRE SEA CORRECTO.");
            }
            errorCount++;
          } else {
            console.log(`CRON: Resultado de 'sync-bold-payment-status' para Link ${intento.id_link_pago_bold} (Intento ID ${intento.id}):`, syncResult);
            if (syncResult && (syncResult.status === 200 || syncResult.message || syncResult.estado_final)) {
              successCount++;
            } else if (syncResult && syncResult.error) {
              console.warn(`CRON: 'sync-bold-payment-status' devolvió un error para Intento ID ${intento.id}:`, syncResult.error);
              errorCount++;
            } else {
              console.warn(`CRON: Respuesta inesperada de 'sync-bold-payment-status' para Intento ID ${intento.id}:`, syncResult);
              errorCount++;
            }
          }
        } catch (e) {
          console.error(`CRON: Excepción al invocar 'sync-bold-payment-status' para Link ${intento.id_link_pago_bold} (Intento ID ${intento.id}):`, e.message);
          errorCount++;
        }
      } else {
        console.log(`CRON: Intento ID ${intento.id} (Link: ${intento.id_link_pago_bold}) no cumple criterios para procesamiento en este ciclo (ni expiración presuntiva ni antigüedad).`);
      }
    }
    const summaryMessage = `CRON: Procesamiento completado. Total Intentos Revisados: ${intentos.length}, Invocaciones a Sync (Éxitos): ${successCount}, Invocaciones a Sync (Errores): ${errorCount}, Forzados a Expirar (vía Sync): ${systemForcedExpirationCount}.`;
    console.log(summaryMessage);
    return new Response(JSON.stringify({
      message: summaryMessage,
      total_intentos_revisados: intentos.length,
      invocaciones_sync_exitosas: successCount,
      invocaciones_sync_errores: errorCount,
      forzados_a_expirar_via_sync: systemForcedExpirationCount
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error("CRON: Error general en cron-process-pending-bold-links:", error);
    return new Response(JSON.stringify({
      error: "Error interno en tarea cron.",
      details: error.message
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
