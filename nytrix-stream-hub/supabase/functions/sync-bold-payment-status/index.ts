// supabase/functions/sync-bold-payment-status/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"; // Considera actualizar std si es necesario
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
// Variables de entorno para la API de Bold
const BOLD_API_URL = Deno.env.get("VITE_BOLD_API_URL");
const BOLD_API_KEY = Deno.env.get("VITE_BOLD_API_KEY");
// Función para crear un cliente Supabase con rol de servicio (admin)
function getSupabaseAdminClient() {
  console.log("SYNC: Intentando obtener SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para getSupabaseAdminClient.");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl) {
    console.error("SYNC ERROR CRITICO: SUPABASE_URL no está configurada.");
    throw new Error("Supabase URL no está configurada.");
  }
  if (!supabaseServiceRoleKey) {
    console.error("SYNC ERROR CRITICO: SUPABASE_SERVICE_ROLE_KEY no está configurada.");
    throw new Error("Supabase Service Role Key no está configurada.");
  }
  console.log("SYNC: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY obtenidas para getSupabaseAdminClient.");
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
serve(async (req)=>{
  console.log("SYNC: Solicitud recibida en sync-bold-payment-status. Método:", req.method);
  if (req.method === "OPTIONS") {
    console.log("SYNC: Manejando solicitud OPTIONS.");
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  let id_intento_pago;
  let id_link_pago_bold;
  let id_cuenta;
  let force_status; // Para recibir el estado forzado
  let requestBodyText = "No se pudo leer el cuerpo";
  try {
    console.log("SYNC: Intentando parsear el cuerpo de la solicitud...");
    try {
      requestBodyText = await req.text();
      console.log("SYNC: Cuerpo de la solicitud (texto):", requestBodyText);
      const body = JSON.parse(requestBodyText);
      console.log("SYNC: Cuerpo de la solicitud (parseado):", body);
      id_intento_pago = body.id_intento_pago;
      id_link_pago_bold = body.id_link_pago_bold;
      id_cuenta = body.id_cuenta;
      force_status = body.force_status; // Obtener el estado forzado del body
    } catch (parseError) {
      console.error("SYNC: Error al parsear el cuerpo de la solicitud:", parseError.message, "Cuerpo recibido:", requestBodyText);
      return new Response(JSON.stringify({
        error: "Cuerpo de la solicitud inválido o no es JSON.",
        details: parseError.message,
        bodyReceived: requestBodyText
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    if (!id_intento_pago || !id_link_pago_bold || !id_cuenta) {
      console.error("SYNC: Faltan parámetros requeridos. Recibido:", {
        id_intento_pago,
        id_link_pago_bold,
        id_cuenta,
        force_status
      });
      return new Response(JSON.stringify({
        error: "Faltan parámetros requeridos: id_intento_pago, id_link_pago_bold, id_cuenta"
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 400
      });
    }
    console.log("SYNC: Parámetros recibidos:", {
      id_intento_pago,
      id_link_pago_bold,
      id_cuenta,
      force_status
    });
    let statusFromBold;
    if (force_status && force_status.toUpperCase() === "EXPIRED") {
      console.log(`SYNC: Estado forzado a EXPIRED para intento ${id_intento_pago} (link ${id_link_pago_bold}). No se consultará a Bold.`);
      statusFromBold = "EXPIRED";
    } else {
      if (!BOLD_API_URL) {
        console.error("SYNC ERROR CRITICO: VITE_BOLD_API_URL no está configurada.");
        return new Response(JSON.stringify({
          error: "Configuración del servidor de pagos incompleta (URL Bold)."
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 500
        });
      }
      if (!BOLD_API_KEY) {
        console.error("SYNC ERROR CRITICO: VITE_BOLD_API_KEY no está configurada.");
        return new Response(JSON.stringify({
          error: "Configuración del servidor de pagos incompleta (Key Bold)."
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 500
        });
      }
      console.log("SYNC: Variables de Bold API URL y KEY verificadas (necesarias para consulta).");
      const boldApiEndpoint = `${BOLD_API_URL}/online/link/v1/${id_link_pago_bold}`;
      console.log(`SYNC: Consultando Bold endpoint: ${boldApiEndpoint} para intento ${id_intento_pago}`);
      const boldResponse = await fetch(boldApiEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `x-api-key ${BOLD_API_KEY}`
        }
      });
      const responseBodyTextFromBold = await boldResponse.text();
      if (!boldResponse.ok) {
        console.error(`SYNC: Error de la API de Bold (${boldResponse.status}) para ${id_link_pago_bold}: ${responseBodyTextFromBold}`);
        return new Response(JSON.stringify({
          error: `Error al consultar el link de pago en Bold: ${boldResponse.status}`,
          details: responseBodyTextFromBold
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: boldResponse.status
        });
      }
      let dataFromBold;
      try {
        dataFromBold = JSON.parse(responseBodyTextFromBold);
      } catch (e) {
        console.error(`SYNC: Error al parsear respuesta JSON de Bold para ${id_link_pago_bold}: ${responseBodyTextFromBold}`, e);
        return new Response(JSON.stringify({
          error: "Respuesta inválida de la API de Bold.",
          details: responseBodyTextFromBold
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 500
        });
      }
      statusFromBold = dataFromBold.status;
      if (!statusFromBold) {
        console.error(`SYNC: No se encontró 'status' en la respuesta de Bold para ${id_link_pago_bold}:`, dataFromBold);
        return new Response(JSON.stringify({
          error: "Respuesta de Bold no contiene campo 'status'."
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 500
        });
      }
      console.log(`SYNC: Estado de Bold para ${id_link_pago_bold} (intento ${id_intento_pago}): ${statusFromBold}`);
    }
    const supabaseAdmin = getSupabaseAdminClient();
    console.log("SYNC: Cliente Supabase Admin creado/confirmado.");
    // Actualizar estado en `intentos_pago`
    const { error: updateIntentoError } = await supabaseAdmin.from("intentos_pago").update({
      estado_intento: statusFromBold.toUpperCase(),
      last_updated: new Date().toISOString() // Es buena práctica actualizar un timestamp
    }).eq("id", id_intento_pago);
    if (updateIntentoError) {
      console.error(`SYNC: Error al actualizar intentos_pago para id ${id_intento_pago} con estado ${statusFromBold}:`, updateIntentoError);
    // Considerar si retornar aquí o continuar para actualizar la cuenta
    } else {
      console.log(`SYNC: Intento de pago ${id_intento_pago} actualizado a estado ${statusFromBold}.`);
    }
    // Si el estado es final y no pagado (o forzado a EXPIRED), actualizar `cuenta`
    const nonPayableFinalStates = [
      "EXPIRED",
      "REJECTED",
      "CANCELLED"
    ];
    if (nonPayableFinalStates.includes(statusFromBold.toUpperCase())) {
      console.log(`SYNC: Estado ${statusFromBold} para intento ${id_intento_pago} (link ${id_link_pago_bold}) requiere actualizar cuenta ${id_cuenta} a disponible.`);
      const { error: updateCuentaError } = await supabaseAdmin.from("cuenta").update({
        estado: "disponible"
      }).eq("id", id_cuenta);
      if (updateCuentaError) {
        console.error(`SYNC: Error al actualizar cuenta ${id_cuenta} a disponible:`, updateCuentaError);
        return new Response(JSON.stringify({
          error: "Error al actualizar el estado de la cuenta.",
          details: updateCuentaError.message,
          intento_pago_actualizado: !updateIntentoError,
          estado_intento: statusFromBold
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 500
        });
      }
      console.log(`SYNC: Cuenta ${id_cuenta} actualizada a 'disponible' debido a estado ${statusFromBold}.`);
    }
    return new Response(JSON.stringify({
      message: `Intento ${id_intento_pago} procesado. Estado final: ${statusFromBold}.`,
      id_intento_pago: id_intento_pago,
      id_link_pago_bold: id_link_pago_bold,
      estado_final: statusFromBold,
      id_cuenta: id_cuenta,
      cuenta_actualizada: nonPayableFinalStates.includes(statusFromBold.toUpperCase())
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (error) {
    console.error(`SYNC: Error general en la Edge Function sync-bold-payment-status para intento ${id_intento_pago || 'desconocido'} (RequestBody: ${requestBodyText}):`, error.message, error.stack);
    return new Response(JSON.stringify({
      error: error.message || "Error interno del servidor.",
      id_intento_pago_procesado: id_intento_pago,
      bodyContent: requestBodyText
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
