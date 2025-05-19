-- Función para actualizar rentas próximas a vencer (entre 0 y 7 días antes de fecha_fin)
CREATE OR REPLACE FUNCTION public.actualizar_rentas_proximas_a_vencer(fecha_referencia date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fecha_actual date := CURRENT_DATE;
  fecha_limite date := fecha_actual + INTERVAL '7 days';
BEGIN
  -- Actualizar rentas que están entre 0 y 7 días de vencer y actualmente están en estado "rentada"
  UPDATE public.renta
  SET 
    estado = 'proximo'::public.estado_renta,
    last_updated = now()
  WHERE 
    fecha_fin::date >= fecha_actual
    AND fecha_fin::date <= fecha_limite
    AND estado = 'rentada'::public.estado_renta;
    
  -- No tocamos el estado de la cuenta, permanece en "alquilada"
END;
$$;

-- Función para actualizar rentas vencidas (1 día después de fecha_fin)
CREATE OR REPLACE FUNCTION public.actualizar_rentas_vencidas(fecha_referencia date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cuenta_id integer;
  cuenta_estado text;
BEGIN
  -- Para cada renta que venció hace 1 día y está en estado "proximo"
  FOR cuenta_id IN
    SELECT r.id_cuenta 
    FROM public.renta r
    WHERE 
      r.fecha_fin::date = fecha_referencia
      AND r.estado = 'proximo'::public.estado_renta
  LOOP
    -- Verificar el estado actual de la cuenta asociada
    SELECT c.estado::text INTO cuenta_estado
    FROM public.cuenta c
    WHERE c.id = cuenta_id;
    
    -- Solo actualizamos si la cuenta está en estado "alquilada"
    -- No actualizamos si ya tiene otro estado como "disponible", "papelera" o "eliminada"
    IF cuenta_estado = 'alquilada' THEN
      -- Actualizar el estado de la cuenta a "corte"
      UPDATE public.cuenta
      SET 
        estado = 'corte'::public.estado_cuenta,
        last_updated = now()
      WHERE id = cuenta_id;
    END IF;
  END LOOP;
  
  -- Actualizar las rentas que vencieron hace 1 día
  UPDATE public.renta
  SET 
    estado = 'vencida'::public.estado_renta,
    last_updated = now()
  WHERE 
    fecha_fin::date = fecha_referencia
    AND estado = 'proximo'::public.estado_renta;
END;
$$;

-- Función para restaurar cuentas en estado "tramite" a "disponible" si han expirado (después de 1 minuto)
-- Esta función se ejecuta frecuentemente para asegurar que las cuentas no queden bloqueadas
-- si un usuario no completa el proceso de pago en Bold dentro del tiempo de expiración
CREATE OR REPLACE FUNCTION public.restaurar_cuentas_tramite_expiradas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cuentas_actualizadas integer := 0;
  cuenta_rec record;
  tiempo_limite timestamp := (now() - INTERVAL '1 minute');
BEGIN
  -- Registrar inicio de la función con timestamp para depuración
  RAISE NOTICE 'Iniciando restaurar_cuentas_tramite_expiradas a %', now();
  RAISE NOTICE 'Buscando cuentas en tramite con last_updated anterior a %', tiempo_limite;
  
  -- Primero identificar las cuentas candidatas para actualizar
  FOR cuenta_rec IN 
    SELECT id, estado::text, last_updated
    FROM public.cuenta
    WHERE 
      estado = 'tramite'::public.estado_cuenta
      AND last_updated < tiempo_limite
  LOOP
    -- Registrar cada cuenta encontrada
    RAISE NOTICE 'Cuenta #% en estado %, última actualización: %, segundos desde actualización: %', 
      cuenta_rec.id, 
      cuenta_rec.estado, 
      cuenta_rec.last_updated,
      EXTRACT(EPOCH FROM (now() - cuenta_rec.last_updated));
    
    -- Actualizar la cuenta a 'disponible'
    UPDATE public.cuenta
    SET 
      estado = 'disponible'::public.estado_cuenta,
      last_updated = now()
    WHERE id = cuenta_rec.id
    -- Solo actualizar si sigue en estado 'tramite'
    AND estado = 'tramite'::public.estado_cuenta;
    
    -- Si se modificó la fila, incrementar el contador
    IF FOUND THEN
      cuentas_actualizadas := cuentas_actualizadas + 1;
      RAISE NOTICE 'Cuenta #% restaurada a disponible', cuenta_rec.id;
      
      -- Opcionalmente registrar la acción en auditoria
      INSERT INTO public.auditoria (acccion, id_persona)
      VALUES ('Cuenta #' || cuenta_rec.id || ' restaurada automáticamente de trámite a disponible', NULL);
    ELSE
      RAISE NOTICE 'Cuenta #% no actualizada (posiblemente ya cambió de estado)', cuenta_rec.id;
    END IF;
  END LOOP;
  
  -- Registrar resultado final
  IF cuentas_actualizadas > 0 THEN
    RAISE NOTICE 'Total de cuentas en trámite restauradas a disponible: %', cuentas_actualizadas;
  ELSE
    RAISE NOTICE 'No se encontraron cuentas en trámite expiradas para restaurar';
  END IF;
  
  -- Devolver el número de cuentas actualizadas para facilitar pruebas
  RETURN cuentas_actualizadas;
END;
$$;

-- Trigger para crear notificaciones cuando una renta cambie a estado "proximo"
CREATE OR REPLACE FUNCTION public.notify_rental_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si el estado cambió a "proximo"
  IF NEW.estado = 'proximo'::public.estado_renta AND 
     (OLD.estado IS NULL OR OLD.estado <> 'proximo'::public.estado_renta) THEN
    
    -- Aquí podrías insertar en una tabla de notificaciones o usar pg_notify
    -- Por ejemplo:
    -- INSERT INTO public.notificaciones (tipo, mensaje, id_referencia)
    -- VALUES ('renta_proxima', 'Una renta está próxima a vencer', NEW.id);
    
    -- O simplemente registrar en logs de auditoría
    INSERT INTO public.auditoria (acccion, id_persona)
    SELECT 
      'Renta #' || NEW.id || ' cambió a estado próximo a vencer',
      NEW.id_persona
    WHERE NEW.id_persona IS NOT NULL;
    
  END IF;
  
  -- Si el estado cambió a "vencida"
  IF NEW.estado = 'vencida'::public.estado_renta AND 
     (OLD.estado IS NULL OR OLD.estado <> 'vencida'::public.estado_renta) THEN
    
    -- Registrar en logs de auditoría
    INSERT INTO public.auditoria (acccion, id_persona)
    SELECT 
      'Renta #' || NEW.id || ' cambió a estado vencida',
      NEW.id_persona
    WHERE NEW.id_persona IS NOT NULL;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear o reemplazar el trigger
DROP TRIGGER IF EXISTS trigger_renta_status_change ON public.renta;
CREATE TRIGGER trigger_renta_status_change
AFTER UPDATE ON public.renta
FOR EACH ROW
EXECUTE FUNCTION public.notify_rental_status_change();

-- NOTA: Este script debe ejecutarse en la base de datos Supabase
-- para crear las funciones y triggers necesarios para la automatización. 