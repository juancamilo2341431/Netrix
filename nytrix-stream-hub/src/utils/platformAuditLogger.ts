import { supabase } from "@/integrations/supabase/client";
import { logUserAction } from "./auditLogger";

/**
 * Registrar acciones de plataformas en la tabla de auditoría
 * Este módulo proporciona funciones específicas para registrar acciones relacionadas con plataformas
 */

/**
 * Registra la creación de una nueva plataforma
 * @param userId ID del usuario que realiza la acción
 * @param platformId ID de la plataforma
 * @param platformName Nombre de la plataforma
 * @param price Precio de la plataforma
 */
export const logPlatformCreation = async (
  userId: number | null,
  platformId: number,
  platformName: string,
  price: string
) => {
  const action = `Creó nueva plataforma: ${platformName} (ID: ${platformId}) con precio: ${price}`;
  await logUserAction(userId, action);
};

/**
 * Registra la actualización de una plataforma
 * @param userId ID del usuario que realiza la acción
 * @param platformId ID de la plataforma
 * @param platformName Nombre de la plataforma
 * @param changes Objeto con los cambios realizados
 */
export const logPlatformUpdate = async (
  userId: number | null,
  platformId: number,
  platformName: string,
  changes: Record<string, any>
) => {
  // Filtramos solo los cambios que tienen valor
  const relevantChanges = Object.entries(changes)
    .filter(([key, value]) => value !== undefined)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  
  const changesStr = JSON.stringify(relevantChanges);
  const action = `Editó la plataforma ${platformName} (ID: ${platformId}): ${changesStr}`;
  await logUserAction(userId, action);
};

/**
 * Registra el cambio de visibilidad de una plataforma
 * @param userId ID del usuario que realiza la acción
 * @param platformId ID de la plataforma
 * @param platformName Nombre de la plataforma
 * @param oldStatus Estado anterior
 * @param newStatus Nuevo estado
 */
export const logPlatformVisibilityChange = async (
  userId: number | null,
  platformId: number,
  platformName: string,
  oldStatus: string,
  newStatus: string
) => {
  const action = `Cambió el estado de la plataforma ${platformName} (ID: ${platformId}) de '${oldStatus}' a '${newStatus}'`;
  await logUserAction(userId, action);
};

/**
 * Registra la eliminación de una plataforma
 * @param userId ID del usuario que realiza la acción
 * @param platformId ID de la plataforma
 * @param platformName Nombre de la plataforma
 */
export const logPlatformDeletion = async (
  userId: number | null,
  platformId: number,
  platformName: string
) => {
  const action = `Eliminó la plataforma ${platformName} (ID: ${platformId})`;
  await logUserAction(userId, action);
}; 