import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Tipo para los datos de persona
type Persona = Tables<'persona'>;

// Función para obtener todas las personas desde Supabase
const fetchPersonas = async (): Promise<Persona[]> => {
  const { data, error } = await supabase
    .from('persona')
    .select('*') // Selecciona todas las columnas
    .order('nombre_completo', { ascending: true }); // Ordena por nombre

  if (error) {
    console.error("Supabase fetch error (personas):", error);
    throw new Error(error.message || "Error al obtener las personas");
  }

  return data || [];
};

// Hook personalizado usePersonas
export const usePersonas = () => {
  const queryKey = ['personas']; // Clave única para la query

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<Persona[], Error>({
    queryKey: queryKey,
    queryFn: fetchPersonas,
    // staleTime: 5 * 60 * 1000, // Ejemplo: 5 minutos de caché
  });

  // Podrías añadir suscripción realtime si necesitas que la lista de usuarios se actualice automáticamente
  // useEffect(() => { ... supabase.channel ... .on(...) ... }, [queryClient, queryKey]);

  return {
    personas: data ?? [], // Devuelve array vacío si data es undefined
    isLoadingPersonas: isLoading,
    errorPersonas: error,
    refetchPersonas: refetch,
  };
}; 