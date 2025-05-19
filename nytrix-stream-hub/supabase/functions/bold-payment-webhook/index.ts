// supabase/functions/bold-pos-sale-webhook/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// --- INICIO Configuración de Seguridad del Webhook (MUY IMPORTANTE) ---
// Deberías obtener un secreto del panel de Bold para verificar las firmas de los webhooks.
// const BOLD_POS_WEBHOOK_SIGNING_SECRET = Deno.env.get("BOLD_POS_WEBHOOK_SIGNING_SECRET");
async function verifyBoldPosSignature(req, rawBody) {
  // Aquí implementarías la lógica real de verificación de firma de Bold POS.
  // Esto es ESENCIAL para asegurar que la solicitud proviene de Bold y no es maliciosa.
  // Consulta la documentación de Bold para los detalles exactos (header de firma, algoritmo).
  //
  // EJEMPLO CONCEPTUAL (NO USAR EN PRODUCCIÓN SIN LA LÓGICA REAL):
  // const signatureHeader = req.headers.get("X-Bold-Signature-POS"); // O el header que Bold use
  // if (!BOLD_POS_WEBHOOK_SIGNING_SECRET || !signatureHeader) {
  //   console.error("POS Webhook: Falta secreto o firma para verificación.");
  //   return false;
  // }
  //
  // // Lógica para calcular la firma esperada usando rawBody y BOLD_POS_WEBHOOK_SIGNING_SECRET
  // // y compararla con signatureHeader.
  // const calculatedSignature = await calculateExpectedSignature(rawBody, BOLD_POS_WEBHOOK_SIGNING_SECRET);
  // if (calculatedSignature !== signatureHeader) {
  //    console.warn("POS Webhook: Discrepancia en la firma.");
  //    return false;
  // }
  // return true;
  console.warn("POS WEBHOOK: ¡LA VERIFICACIÓN DE FIRMA NO ESTÁ IMPLEMENTADA! Esto es inseguro.");
  return true; // ¡REEMPLAZAR CON VERIFICACIÓN REAL ANTES DE PRODUCCIÓN!
}
// --- FIN Configuración de Seguridad ---
// Función para procesar el payload de forma asíncrona
async function processWebhookPayload(payload, supabaseAdmin) {
  console.log("POS Webhook: Iniciando procesamiento asíncrono del payload:", JSON.stringify(payload, null, 2));
  const eventType = payload.type; // Ej: "SALE_REJECTED", "SALE_APPROVED" (ajusta según lo que envíe Bold)
  const paymentIdBold = payload.data?.payment_id; // ID de la transacción/pago en Bold
  const merchantId = payload.data?.merchant_id;
  const amountDetails = payload.data?.amount;
  const metadata = payload.data?.metadata; // Podría contener tu 'id_factura' o 'id_renta' si lo envías al POS
  const reference = metadata?.reference; // Ej: "ORD-SHOP03-1719242727607215713"
  if (!eventType || !paymentIdBold) {
    console.error("POS Webhook Proc: Payload no contiene 'type' o 'data.payment_id'.", payload);
    return; // No se puede procesar
  }
  console.log(`POS Webhook Proc: Evento: ${eventType}, Payment ID Bold: ${paymentIdBold}, Referencia: ${reference}`);
  try {
    // Aquí viene tu lógica de negocio.
    // El objetivo es encontrar el registro de 'pago' o 'renta' asociado y actualizarlo.
    // Ejemplo: Si 'reference' en metadata contiene el ID de tu factura/orden interna
    let pagoIdInterno = null;
    if (reference) {
    // Intenta extraer tu ID interno de la referencia si es posible.
    // Esto depende de cómo generes 'reference'.
    // Ejemplo: si 'reference' es "ORD-123", podrías extraer "123".
    // Por ahora, asumiremos que `paymentIdBold` es lo que usas como `id_factura` en tu tabla `pago`.
    }
    // Actualizar la tabla 'pago'
    // Necesitas determinar qué campo en tu tabla 'pago' se corresponde con 'paymentIdBold'.
    // Podría ser 'id_factura' o podrías necesitar un nuevo campo 'id_pago_bold_pos'.
    // Para este ejemplo, asumiré que usas 'id_factura' para el 'paymentIdBold' del POS.
    let estadoPagoDb = null;
    if (eventType.toUpperCase().includes("APPROVED") || eventType.toUpperCase().includes("SUCCESS")) {
      estadoPagoDb = "pagado";
    } else if (eventType.toUpperCase().includes("REJECTED") || eventType.toUpperCase().includes("FAILED")) {
      estadoPagoDb = "cancelado"; // o 'rechazado' si tienes ese estado
    } else if (eventType.toUpperCase().includes("PENDING")) {
      estadoPagoDb = "pendiente";
    }
    // Añade más mapeos de 'eventType' a 'estadoPagoDb' según necesites.
    if (!estadoPagoDb) {
      console.warn(`POS Webhook Proc: Tipo de evento '${eventType}' no mapeado a un estado de pago conocido. Payload no procesado.`);
      return;
    }
    const updateData = {
      estado: estadoPagoDb,
      last_updated: new Date().toISOString(),
      metodo_pago: payload.data?.payment_method
    };
    // Actualizar o insertar en la tabla 'pago'.
    // Si ya tienes un registro para este id_factura (paymentIdBold), lo actualizas.
    // Si no, podrías crearlo, aunque usualmente el registro de pago se crea antes.
    const { data: pagoActualizado, error: updatePagoError } = await supabaseAdmin.from("pago").update(updateData).eq("id_factura", paymentIdBold) // Asumiendo que id_factura es el payment_id de Bold POS
    .select("id, id_renta") // Selecciona el id del pago y el id_renta si está en la tabla pago
    .single(); // Esperamos un solo registro o ninguno
    if (updatePagoError && updatePagoError.code !== 'PGRST116') {
      console.error(`POS Webhook Proc: Error al actualizar tabla 'pago' para id_factura ${paymentIdBold}:`, updatePagoError);
      // Podrías reintentar o registrar para revisión manual
      return;
    }
    if (!pagoActualizado && updatePagoError && updatePagoError.code === 'PGRST116') {
      console.warn(`POS Webhook Proc: No se encontró registro en 'pago' para id_factura ${paymentIdBold} para actualizar. Creando nuevo registro (o verificar flujo).`);
      // Aquí podrías decidir crear un nuevo registro de pago si tiene sentido en tu flujo.
      // Por ahora, lo omitimos y asumimos que el pago debe existir.
      // const { data: nuevoPago, error: insertPagoError } = await supabaseAdmin
      //   .from("pago")
      //   .insert({
      //       id_factura: paymentIdBold,
      //       ...updateData
      //   })
      //   .select("id, id_renta")
      //   .single();
      // if(insertPagoError) { /* ... manejo de error ... */ return; }
      // if(nuevoPago) { /* ... continuar con nuevoPago ...*/ }
      return; // Salir si no se encontró y no se crea.
    }
    console.log(`POS Webhook Proc: Tabla 'pago' actualizada para id_factura ${paymentIdBold}. Estado: ${estadoPagoDb}.`);
    // Lógica adicional si el pago afecta a una 'renta' o 'cuenta'
    if (pagoActualizado && estadoPagoDb === "pagado") {
      // Si el pago está vinculado a una renta (necesitarías un campo 'id_renta' en tu tabla 'pago'
      // o alguna forma de relacionarlos, quizás a través de 'id_factura' o la 'reference').
      // Ejemplo: Si la tabla 'pago' tiene una columna 'id_renta' (FK a tabla 'renta')
      // if (pagoActualizado.id_renta) {
      //   const { error: updateRentaError } = await supabaseAdmin
      //     .from("renta")
      //     .update({ estado: "rentada", /* o lo que corresponda */ last_updated: new Date().toISOString() })
      //     .eq("id", pagoActualizado.id_renta);
      //   if (updateRentaError) {
      //     console.error(`POS Webhook Proc: Error al actualizar 'renta' ID ${pagoActualizado.id_renta}:`, updateRentaError);
      //   } else {
      //     console.log(`POS Webhook Proc: 'renta' ID ${pagoActualizado.id_renta} actualizada por pago exitoso.`);
      //   }
      // }
      console.log(`POS Webhook Proc: Lógica adicional para pago ${paymentIdBold} APROBADO (ej. activar servicios) iría aquí.`);
    } else if (pagoActualizado && estadoPagoDb === "cancelado") {
      // Lógica si un pago es rechazado/cancelado
      // if (pagoActualizado.id_renta) { /* ... actualizar renta a 'vencida' o 'cancelada' ... */ }
      console.log(`POS Webhook Proc: Lógica adicional para pago ${paymentIdBold} RECHAZADO/CANCELADO iría aquí.`);
    }
  // ... más lógica según tus necesidades ...
  } catch (e) {
    console.error("POS Webhook Proc: Error durante el procesamiento asíncrono:", e.message, e.stack);
  }
}
serve(async (req)=>{
  console.log("POS Webhook: Solicitud POST recibida.");
  if (req.method !== "POST") {
    return new Response("Método no permitido. Solo POST.", {
      status: 405
    });
  }
  // 1. Leer el cuerpo para verificación de firma (y luego para parsear)
  let rawBody;
  try {
    rawBody = await req.text();
  } catch (e) {
    console.error("POS Webhook: Error crítico al leer el cuerpo de la solicitud:", e.message);
    // Responder 200 igual para evitar reintentos innecesarios si el cuerpo está corrupto.
    // O un 400 si prefieres que Bold sepa que el request fue malo.
    return new Response(JSON.stringify({
      error: "Error leyendo el cuerpo"
    }), {
      status: 200
    });
  }
  // 2. (MUY IMPORTANTE) Verificar la firma del Webhook
  // const isValidSignature = await verifyBoldPosSignature(req, rawBody);
  // if (!isValidSignature) {
  //   console.warn("POS Webhook: Verificación de firma fallida. Solicitud ignorada.");
  //   return new Response(JSON.stringify({ error: "Firma inválida" }), { status: 401 }); // O 200 para no dar pistas
  // }
  // console.log("POS Webhook: Verificación de firma exitosa (o saltada).");
  // 3. Responder 200 OK INMEDIATAMENTE
  // Esto es crucial para cumplir con el requisito de Bold de respuesta rápida.
  const responsePromise = new Response(JSON.stringify({
    received: true,
    message: "Evento recibido, procesamiento en segundo plano."
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
  // 4. Procesar el payload de forma asíncrona (no esperar a que termine para responder)
  // En Deno Deploy (Supabase Edge Functions), el `await` en el handler principal bloquea la respuesta.
  // Para "fire and forget" o procesamiento en segundo plano, envolvemos la lógica de procesamiento
  // en una promesa que no se `await` directamente en el flujo de respuesta.
  (async ()=>{
    try {
      const payload = JSON.parse(rawBody);
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error("POS Webhook: Variables de Supabase no configuradas para procesamiento asíncrono.");
        return; // No se puede procesar
      }
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
      await processWebhookPayload(payload, supabaseAdmin);
    } catch (e) {
      console.error("POS Webhook: Error al parsear JSON para procesamiento asíncrono o al crear cliente Supabase:", e.message);
    // Este error ocurre después de haber respondido 200. Solo se loguea.
    }
  })().catch((e)=>{
    // Asegurarse de capturar cualquier error no manejado en la promesa asíncrona
    console.error("POS Webhook: Error no capturado en la ejecución asíncrona:", e.message, e.stack);
  });
  return responsePromise; // Devolver la respuesta 200 que se creó antes.
});
