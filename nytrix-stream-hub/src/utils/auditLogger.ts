
import { supabase } from "@/integrations/supabase/client";

/**
 * Logs user actions to the auditoria table
 * 
 * @param userId - The ID of the person performing the action (can be null for system actions)
 * @param action - Description of the action performed
 * @returns Promise<void>
 */
export const logUserAction = async (userId: number | null, action: string) => {
  try {
    console.log(`Logging action: ${action} by user ID: ${userId || 'Unknown'}`);
    
    // Check if userId is provided, required by the NOT NULL constraint on id_persona column
    if (userId === null) {
      console.warn("Cannot log action to auditoria: User ID is required but was null");
      return; // Exit early instead of attempting to insert with null id_persona
    }
    
    const { error } = await supabase
      .from('auditoria')
      .insert({
        id_persona: userId,
        acccion: action
      });
      
    if (error) {
      console.error("Error al registrar acción en auditoria:", error);
    }
  } catch (err) {
    console.error("Error en el registro de auditoria:", err);
  }
};
