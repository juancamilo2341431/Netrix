
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserProfile } from "@/types/profile";

export type ProfileFormData = {
  name: string;
  email: string;
  phone: string;
};

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const { toast } = useToast();
  
  // Initial form values
  const [initialFormValues, setInitialFormValues] = useState<ProfileFormData>({
    name: "",
    email: "",
    phone: "",
  });

  // Format the creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('persona')
          .select('nombre_completo, telefono, correo, rol, created_at')
          .eq('id_user', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile data:", error);
        } else {
          setProfile(data);
          
          // Set initial form values
          setInitialFormValues({
            name: data.nombre_completo || "",
            email: data.correo || user.email || "",
            phone: data.telefono || "",
          });
          setPhoneValue(data.telefono || "");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchProfile();
    }
  }, [user]);
  
  // Handle updating profile
  const handleSaveProfile = async (formData: ProfileFormData) => {
    if (!user) return;
    
    try {
      setUpdating(true);
      
      // Update the profile in the database
      const { error } = await supabase
        .from('persona')
        .update({
          nombre_completo: formData.name,
          correo: formData.email,
          telefono: formData.phone,
        })
        .eq('id_user', user.id);
      
      if (error) {
        toast({
          title: "Error",
          description: "No se pudo actualizar el perfil: " + error.message,
          variant: "destructive"
        });
        console.error("Error updating profile:", error);
        return;
      }
      
      // If the email was changed, update it in auth
      if (formData.email !== user.email) {
        const { error: updateEmailError } = await supabase.auth.updateUser({
          email: formData.email,
        });
        
        if (updateEmailError) {
          toast({
            title: "Error",
            description: "No se pudo actualizar el correo electrónico: " + updateEmailError.message,
            variant: "destructive"
          });
          console.error("Error updating email:", updateEmailError);
          return;
        }
        
        // Show the email confirmation modal
        setShowEmailModal(true);
      }
      
      // Update the local state
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          nombre_completo: formData.name,
          correo: formData.email,
          telefono: formData.phone,
        };
      });
      
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente",
      });
      
      setEditMode(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar el perfil",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  return {
    user,
    profile,
    loading: loading || authLoading,
    editMode,
    setEditMode,
    updating,
    showEmailModal,
    setShowEmailModal,
    initialFormValues,
    setInitialFormValues,
    phoneValue,
    setPhoneValue,
    formatDate,
    handleSaveProfile
  };
}
