import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface GenerateLinkPayload {
  totalAmount: number;
  description: string;
  expirationSeconds: number;
  cuentasInfo: { id_cuenta: number | string }[];
  id_persona: number | string; // Permitir string o number para id_persona
}

interface EdgeFunctionResponse {
  paymentLinkUrl?: string;
  orderReference?: string; // La referencia de orden de Bold
  error?: string;
  details?: any;
}

export const generateBoldPaymentLink = async (
  totalAmount: number,
  description: string,
  cuentasInfo: { id_cuenta: number | string }[],
  id_persona: number | string
): Promise<{ paymentLinkUrl: string; orderReference: string } | null> => {
  
  // Log para depurar el argumento cuentasInfo recibido
  // console.log("[boldClient.ts] generateBoldPaymentLink llamado con cuentasInfo:", JSON.stringify(cuentasInfo, null, 2));

  const payload: GenerateLinkPayload = {
    totalAmount: Math.round(totalAmount), // Bold espera un entero para COP
    description: description,
    expirationSeconds: 60, // 1 minuto de expiración para pruebas
    cuentasInfo: cuentasInfo,
    id_persona: id_persona
  };

  // Log para depurar el payload completo que se enviará
  // console.log("[boldClient.ts] Payload para Edge Function generate-bold-payment-link:", JSON.stringify(payload, null, 2));

  try {
    // console.log("[boldClient.ts] Enviando payload a Edge Function:", JSON.stringify(payload, null, 2));
    const { data, error } = await supabase.functions.invoke("generate-bold-payment-link", {
      body: payload,
    });

    if (error) {
      // console.error("[boldClient.ts] Error al invocar la Edge Function 'generate-bold-payment-link':", error);
      toast.error(`Error al contactar el servidor de pagos: ${error.message}`);
      return null;
    }

    // Asegurarse de que 'data' es tratado como EdgeFunctionResponse
    const responseData = data as EdgeFunctionResponse;

    if (responseData?.error) {
      // console.error("[boldClient.ts] Error devuelto por la Edge Function:", responseData.details || responseData.error);
      toast.error(
        `Error del servidor de pagos: ${responseData.error}`,
        {
          description: responseData.details ? `Detalles: ${JSON.stringify(responseData.details)}` : undefined
        }
      );
      return null;
    }
    // console.log("[boldClient.ts] Respuesta de Edge Function generate-bold-payment-link:", JSON.stringify(responseData, null, 2));

    if (responseData?.paymentLinkUrl && responseData?.orderReference) {
      return {
        paymentLinkUrl: responseData.paymentLinkUrl,
        orderReference: responseData.orderReference
      };
    } else {
      // console.error("[boldClient.ts] Respuesta inválida desde la Edge Function (faltan paymentLinkUrl u orderReference):", responseData);
      toast.error("Respuesta inesperada del servidor de pagos. No se pudo obtener el link.");
      return null;
    }

  } catch (err: any) {
    // console.error("[boldClient.ts] Error inesperado al invocar la Edge Function:", err);
    toast.error(
      `Error de comunicación con el servidor de pagos: ${err.message || "Error desconocido"}`
    );
    return null;
  }
};
   