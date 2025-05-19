import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts"; // Asegúrate que este path sea correcto

const BOLD_API_ENDPOINT = "https://integrations.api.bold.co/online/link/v1";

serve(async (req: Request) => {
  // Manejo de solicitudes OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parsear el cuerpo de la solicitud
    const { totalAmount, description, expirationSeconds } = await req.json();

    // Validar los datos de entrada
    if (
      !totalAmount ||
      typeof totalAmount !== "number" ||
      !description ||
      typeof description !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Solicitud inválida: Faltan totalAmount (número) o description (string).",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Asegurar que expirationSeconds sea un número válido o usar un valor predeterminado
    const expiration = typeof expirationSeconds === 'number' && expirationSeconds > 0 
                      ? expirationSeconds 
                      : 300; // Default a 5 minutos si no se especifica

    // Obtener la API Key de Bold desde las variables de entorno
    const boldApiKey = Deno.env.get("VITE_BOLD_API_KEY");
    if (!boldApiKey) {
      console.error(
        "Error Crítico: El secreto VITE_BOLD_API_KEY no está configurado en Supabase para la Edge Function.",
      );
      return new Response(
        JSON.stringify({
          error:
            "Error de configuración del servidor de pagos. Contacte al administrador.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    // Payload para la API de Bold
    // Considera generar una referencia única aquí para reference_id si la necesitas y Bold la soporta en este endpoint.
    // const yourOwnReference = `NYTRIX-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const payload = {
      amount_type: "CLOSE", // O el tipo que necesites, ej: "FIXED"
      amount: {
        currency: "COP",
        total_amount: Math.round(totalAmount), // Bold espera enteros para COP
      },
      description: description,
      image_url: "https://dmind.site/lovable-uploads/foodfastdemo.png", // URL de imagen opcional
      expiration_time: expiration, // Tiempo de expiración en segundos
      return_url: "https://nytrix-stream-hub.vercel.app/payment/success", // URL de redirección después del pago exitoso
      // Puedes añadir más campos según la documentación de Bold, como 'reference_id', 'customer_data', etc.
    };

    // Llamada a la API de Bold
    const boldResponse = await fetch(BOLD_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `x-api-key ${boldApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    // Parsear la respuesta de Bold
    // Es importante intentar parsear como JSON incluso si !boldResponse.ok, ya que Bold puede devolver detalles del error en el cuerpo.
    let responseData: any;
    try {
        responseData = await boldResponse.json();
    } catch (parseError) {
        // Si el parseo falla y la respuesta no fue OK, es un error del servidor de Bold o de red sin cuerpo JSON válido.
        console.error("Error al parsear respuesta de Bold:", parseError, await boldResponse.text());
        if (!boldResponse.ok) {
            return new Response(JSON.stringify({ error: `Error del proveedor de pagos: ${boldResponse.status} ${boldResponse.statusText}` }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: boldResponse.status,
            });
        }
        // Si el parseo falla pero la respuesta fue OK (raro), es un problema de formato inesperado.
        return new Response(JSON.stringify({ error: "Respuesta inesperada del proveedor de pagos." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }


    // Determinar si Bold devolvió un error en el payload
    let boldReturnedErrorPayload: any = null;
    if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      // Formato de error: { "errors": [ { "code": ..., "message": ... } ] } (basado en la imagen de éxito que tiene "errors": [])
      boldReturnedErrorPayload = responseData.errors;
    } else if (responseData.error) {
      // Formato de error: { "error": { "code": ..., "message": ... } } o { "error": [ ... ] } (del código original)
      boldReturnedErrorPayload = responseData.error;
    }

    // Comprobar si la solicitud a Bold no fue exitosa (HTTP error) o si Bold devolvió un error en el payload
    if (!boldResponse.ok || boldReturnedErrorPayload) {
      console.error(
        "Error desde la API de Bold:",
        JSON.stringify(boldReturnedErrorPayload || responseData),
      );
      
      let errorMessage = "Error al generar link de pago con Bold.";
      let errorDetails = boldReturnedErrorPayload || responseData;

      if (boldReturnedErrorPayload) {
        if (Array.isArray(boldReturnedErrorPayload)) {
          errorMessage = boldReturnedErrorPayload
            .map((e: any) => {
              if (e && typeof e === 'object' && e.message) return `${e.code || "ERR"}: ${e.message}`;
              if (e && typeof e === 'object' && e.description) return `${e.code || "ERR"}: ${e.description}`; // Otro posible campo de mensaje
              return e.toString();
            })
            .join("; ");
        } else if (typeof boldReturnedErrorPayload === "object") {
          if ((boldReturnedErrorPayload as any).message) {
            errorMessage = `${(boldReturnedErrorPayload as any).code || "ERR"}: ${(boldReturnedErrorPayload as any).message}`;
          } else if ((boldReturnedErrorPayload as any).description) { // Otro posible campo de mensaje
             errorMessage = `${(boldReturnedErrorPayload as any).code || "ERR"}: ${(boldReturnedErrorPayload as any).description}`;
          } else {
            errorMessage = "Error no estructurado recibido de Bold.";
          }
        } else {
          errorMessage = boldReturnedErrorPayload.toString();
        }
      } else if (!boldResponse.ok) {
        // Error HTTP sin payload de error específico de Bold, usar statusText.
         errorMessage = `Error del proveedor: ${boldResponse.status} ${boldResponse.statusText}`;
      }
      
      let responseStatus = boldResponse.status;
      // Si Bold devolvió HTTP 200 OK pero el payload contenía un error (ej. validación),
      // nuestra función debería devolver un status de error al cliente (ej. 400 o 500).
      if (boldResponse.ok && boldReturnedErrorPayload) {
        responseStatus = 400; // O 500 si se considera un error interno de Bold que no cambió el HTTP status.
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: errorDetails,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: responseStatus,
        },
      );
    }

    // Procesar respuesta exitosa de Bold (basada en la estructura de la imagen)
    if (responseData.payload && responseData.payload.url && responseData.payload.payment_link) {
      return new Response(
        JSON.stringify({
          paymentLinkUrl: responseData.payload.url,
          orderReference: responseData.payload.payment_link, // Usamos payment_link como referencia
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Éxito
        },
      );
    } else {
      // Si la respuesta de Bold es 200 OK, sin errores en payload, pero no tiene la estructura esperada.
      console.error(
        "Respuesta de Bold no contiene 'payload.url' y 'payload.payment_link' esperados:",
        responseData,
      );
      return new Response(
        JSON.stringify({
          error: "Respuesta inválida del proveedor de pagos (formato inesperado).",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500, // Error interno del servidor porque no entendemos la respuesta
        },
      );
    }
  } catch (error) {
    // Capturar cualquier error inesperado durante el proceso
    console.error(
      "Error inesperado en la Edge Function generate-bold-payment-link:",
      error,
      error.stack,
    );
    return new Response(
      JSON.stringify({
        error:
          error.message ||
          "Error interno del servidor al procesar el pago.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
