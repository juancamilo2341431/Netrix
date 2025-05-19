import { supabase } from "@/integrations/supabase/client";
import { logUserAction } from "./auditLogger";

/**
 * Registrar acciones de cuentas en la tabla de auditoría
 * Este módulo proporciona funciones específicas para registrar acciones relacionadas con cuentas
 */

/**
 * Registra la creación de una nueva cuenta
 * @param userId ID del usuario que realiza la acción
 * @param accountId ID de la cuenta
 * @param platform Plataforma de la cuenta
 * @param email Correo de la cuenta
 */
export const logAccountCreation = async (userId: number, accountId: number, platform: string, email: string) => {
  const action = `Creó nueva cuenta de ${platform} (ID: ${accountId}): ${email}`;
  await logUserAction(userId, action);
};

/**
 * Registra la actualización de una cuenta
 * @param userId ID del usuario que realiza la acción
 * @param accountId ID de la cuenta
 * @param platform Plataforma de la cuenta
 * @param email Correo de la cuenta
 * @param field Campo actualizado
 */
export const logAccountUpdate = async (userId: number, accountId: number, platform: string, email: string, field: string) => {
  const action = `Actualizó ${field} de cuenta ${platform} (ID: ${accountId}): ${email}`;
  await logUserAction(userId, action);
};

/**
 * Registra cuando una cuenta se mueve a la papelera
 * @param userId ID del usuario que realiza la acción
 * @param accountId ID de la cuenta
 * @param platform Plataforma de la cuenta
 * @param email Correo de la cuenta
 */
export const logAccountToTrash = async (userId: number, accountId: number, platform: string, email: string) => {
  const action = `Movió a papelera cuenta de ${platform} (ID: ${accountId}): ${email}`;
  await logUserAction(userId, action);
};

/**
 * Registra la restauración de una cuenta desde la papelera
 * @param userId ID del usuario que realiza la acción
 * @param accountId ID de la cuenta
 * @param platform Plataforma de la cuenta
 * @param email Correo de la cuenta
 */
export const logAccountRestore = async (userId: number, accountId: number, platform: string, email: string) => {
  const action = `Restauró cuenta de ${platform} (ID: ${accountId}): ${email}`;
  await logUserAction(userId, action);
};

/**
 * Registra la eliminación permanente de una cuenta
 * @param userId ID del usuario que realiza la acción
 * @param accountId ID de la cuenta
 * @param platform Plataforma de la cuenta
 * @param email Correo de la cuenta
 */
export const logAccountDelete = async (userId: number, accountId: number, platform: string, email: string) => {
  const action = `Eliminó permanentemente cuenta de ${platform} (ID: ${accountId}): ${email}`;
  await logUserAction(userId, action);
};

/**
 * Registra la eliminación de múltiples cuentas
 * @param userId ID del usuario que realiza la acción
 * @param count Cantidad de cuentas eliminadas
 * @param accountIds Lista de IDs de cuentas eliminadas
 */
export const logMultipleAccountsDelete = async (userId: number, count: number, accountIds: number[]) => {
  const action = `Eliminó permanentemente ${count} cuentas [IDs: ${accountIds.join(', ')}]`;
  await logUserAction(userId, action);
};

/**
 * Registra la restauración de múltiples cuentas
 * @param userId ID del usuario que realiza la acción
 * @param count Cantidad de cuentas restauradas
 * @param accountIds Lista de IDs de cuentas restauradas
 */
export const logMultipleAccountsRestore = async (userId: number, count: number, accountIds: number[]) => {
  const action = `Restauró ${count} cuentas desde la papelera [IDs: ${accountIds.join(', ')}]`;
  await logUserAction(userId, action);
}; 