import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables, Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

// Definir la estructura de los datos de garantía que devolverá el hook
export type WarrantyData = Tables<'renta'> & {
  cuenta: (Tables<'cuenta'> & {
    contrasenia: string | null;
    plataforma: Pick<Tables<'plataforma'>, 'id' | 'nombre' | 'descripcion'> | null;
  }) | null;
  persona: Pick<Tables<'persona'>, 'id' | 'correo' | 'nombre_completo'> | null;
};

// El hook personalizado
export function useWarranties(initialSortColumn: keyof WarrantyData = 'created_at', initialSortDirection: 'asc' | 'desc' = 'desc') {
  const [warranties, setWarranties] = useState<WarrantyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof WarrantyData>(initialSortColumn);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);

  // Función para obtener los datos completos de una garantía por ID
  const fetchFullWarrantyData = useCallback(async (id: number): Promise<WarrantyData | null> => {
    const { data, error } = await supabase
      .from('renta')
      .select(`
        *,
        cuenta (*, contrasenia, plataforma (id, nombre, descripcion)), 
        persona (id, correo, nombre_completo)
      `)
      .eq('id', id)
      .maybeSingle(); // Usar maybeSingle para manejar casos donde no se encuentre

    if (error) {
      console.error(`Error fetching full data for warranty ${id}:`, error);
      return null;
    }
    return data as WarrantyData | null;
  }, []);

  // Función principal para cargar las garantías
  const fetchWarranties = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('renta')
        .select(`
          *,
          cuenta (*, contrasenia, plataforma (id, nombre, descripcion)), 
          persona (id, correo, nombre_completo)
        `)
        .eq('estado', 'garantia')
        .order(sortColumn, { ascending: sortDirection === 'asc' });

      if (fetchError) throw fetchError;

      setWarranties(data as WarrantyData[]);
    } catch (err: any) {
      console.error("Error loading warranties:", err);
      setError("Failed to load warranties. Please try again.");
      toast.error("Error loading warranties", { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [sortColumn, sortDirection]);

  // Efecto para la carga inicial y cambios de ordenamiento
  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  // Efecto para configurar Realtime
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    const setupRealtime = () => {
      if (!supabase) return;

      channel = supabase
        .channel('renta_garantia_changes')
        .on<
          Tables<'renta'>
        >(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'renta',
            // No podemos filtrar por estado aquí de forma fiable para UPDATES
          },
          async (payload) => {
            console.log('Warranty Realtime event:', payload);
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const recordId = (newRecord?.id ?? oldRecord?.id);

            if (!recordId) {
                console.warn("Realtime event without ID, refetching all warranties.");
                fetchWarranties();
                return;
            }

            if (eventType === 'INSERT') {
              if (newRecord.estado === 'garantia') {
                const fullData = await fetchFullWarrantyData(recordId);
                if (fullData) {
                  setWarranties((prev) => [...prev, fullData]); // Añadir al final, el ordenamiento se aplica en la carga inicial
                }
              }
            } else if (eventType === 'UPDATE') {
              const fullData = await fetchFullWarrantyData(recordId);
              if (fullData) {
                  // Si entra en garantía
                  if (fullData.estado === 'garantia' && oldRecord?.estado !== 'garantia') {
                     setWarranties((prev) => [...prev, fullData]); 
                  // Si sale de garantía
                  } else if (fullData.estado !== 'garantia' && oldRecord?.estado === 'garantia') {
                     setWarranties((prev) => prev.filter((w) => w.id !== recordId));
                  // Si se mantiene en garantía (actualizar)
                  } else if (fullData.estado === 'garantia' && oldRecord?.estado === 'garantia') {
                     setWarranties((prev) => prev.map((w) => w.id === recordId ? fullData : w));
                  }
              } else {
                  // Si no se pudo obtener fullData pero sabemos que salió de garantía
                  if (oldRecord?.estado === 'garantia') {
                      setWarranties((prev) => prev.filter((w) => w.id !== recordId));
                  }
              }
            } else if (eventType === 'DELETE') {
              // Solo eliminar si estaba en nuestro estado (tenía estado 'garantia')
              if (oldRecord?.estado === 'garantia') {
                setWarranties((prev) => prev.filter((w) => w.id !== recordId));
              }
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('Connected to warranties realtime channel');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Realtime Error:', status, err);
            toast.error('Realtime connection error', { description: err?.message });
          }
        });
    }

    setupRealtime();

    // Limpieza
    return () => {
      if (channel) {
        supabase?.removeChannel(channel).catch(err => console.error("Error removing channel:", err));
        console.log('Disconnected from warranties realtime channel');
      }
    };
  }, [supabase, fetchFullWarrantyData, fetchWarranties]); // Añadir fetchWarranties a las dependencias

  return {
    data: warranties,
    isLoading,
    error,
    refetch: fetchWarranties,
    setSortColumn,
    setSortDirection
  };
} 