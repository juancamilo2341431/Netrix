import { supabase } from "@/integrations/supabase/client";

// Función para registrar la creación de un cupón
export const logCouponCreation = async (
  userId: number,
  couponId: number,
  couponName: string | null,
  couponCode: string | null,
  platform?: string | null
) => {
  try {
    const platformInfo = platform ? ` para la plataforma ${platform}` : '';
    const descriptionText = `Creó cupón "${couponName || 'Sin nombre'}" (ID: ${couponId}) con código "${couponCode || 'Sin código'}"${platformInfo}`;
    
    await supabase.from('auditoria').insert({
      id_persona: userId,
      acccion: descriptionText,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al registrar acción de creación de cupón:', error);
  }
};

// Función para registrar la actualización de un cupón
export const logCouponUpdate = async (
  userId: number,
  couponId: number,
  couponName: string | null,
  fieldsUpdated: string[]
) => {
  try {
    const fieldsDescription = fieldsUpdated.length > 0 
      ? `Campos actualizados: ${fieldsUpdated.join(', ')}`
      : 'No se especificaron campos';
      
    const descriptionText = `Actualizó cupón "${couponName || 'Sin nombre'}" (ID: ${couponId}). ${fieldsDescription}`;
    
    await supabase.from('auditoria').insert({
      id_persona: userId,
      acccion: descriptionText,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al registrar acción de actualización de cupón:', error);
  }
};

// Función para registrar cambio de estado de un cupón
export const logCouponStatusChange = async (
  userId: number,
  couponId: number,
  couponName: string | null,
  oldStatus: string | null,
  newStatus: string
) => {
  try {
    const descriptionText = `Cambió el estado del cupón "${couponName || 'Sin nombre'}" (ID: ${couponId}) de "${oldStatus || 'Sin estado'}" a "${newStatus}"`;
    
    await supabase.from('auditoria').insert({
      id_persona: userId,
      acccion: descriptionText,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al registrar cambio de estado de cupón:', error);
  }
};

// Función para registrar la adición de usuarios a un cupón
export const logAddUsersToCoupon = async (
  userId: number,
  couponId: number,
  couponName: string | null,
  addedUserIds: number[],
  addedUserCount: number
) => {
  try {
    const userIdsText = addedUserIds.length > 0 
      ? `IDs: ${addedUserIds.join(', ')}`
      : '';
      
    const descriptionText = `Añadió ${addedUserCount} usuario(s) al cupón "${couponName || 'Sin nombre'}" (ID: ${couponId}). ${userIdsText}`;
    
    await supabase.from('auditoria').insert({
      id_persona: userId,
      acccion: descriptionText,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al registrar adición de usuarios a cupón:', error);
  }
};

// Función para registrar la suspensión de usuarios de un cupón
export const logSuspendUsersFromCoupon = async (
  userId: number,
  couponId: number,
  couponName: string | null,
  suspendedUserIds: number[],
  suspendedUserCount: number
) => {
  try {
    const userIdsText = suspendedUserIds.length > 0 
      ? `IDs: ${suspendedUserIds.join(', ')}`
      : '';
      
    const descriptionText = `Suspendió ${suspendedUserCount} usuario(s) del cupón "${couponName || 'Sin nombre'}" (ID: ${couponId}). ${userIdsText}`;
    
    await supabase.from('auditoria').insert({
      id_persona: userId,
      acccion: descriptionText,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al registrar suspensión de usuarios de cupón:', error);
  }
};

// Función para registrar activación automática de un cupón
export const logCouponAutoActivation = async (
  userId: number,
  couponId: number,
  couponName: string | null,
  reason: string
) => {
  try {
    const descriptionText = `Cupón "${couponName || 'Sin nombre'}" (ID: ${couponId}) activado automáticamente. Razón: ${reason}`;
    
    await supabase.from('auditoria').insert({
      id_persona: userId,
      acccion: descriptionText,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al registrar activación automática de cupón:', error);
  }
};

// Función para registrar desactivación automática de un cupón
export const logCouponAutoDeactivation = async (
  userId: number,
  couponId: number,
  couponName: string | null,
  reason: string
) => {
  try {
    const descriptionText = `Cupón "${couponName || 'Sin nombre'}" (ID: ${couponId}) desactivado automáticamente. Razón: ${reason}`;
    
    await supabase.from('auditoria').insert({
      id_persona: userId,
      acccion: descriptionText,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al registrar desactivación automática de cupón:', error);
  }
}; 