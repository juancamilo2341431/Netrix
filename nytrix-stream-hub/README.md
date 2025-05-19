# Sistema de Gestión de Rentas - Actualización de Estados Automática

Este proyecto implementa un sistema de actualización automática de estados para las rentas de cuentas en plataformas streaming.

## Funcionalidad Implementada

### 1. Cambio automático de estado a "próximo"

- Condición: Entre 0 y 7 días antes de la fecha de vencimiento (fecha_fin) de la renta
- Transición: de estado "rentada" → "próximo"
- Restricciones: Solo se ejecuta si el estado actual de la renta es "rentada"

### 2. Cambio automático de estado a "vencida" y actualización de cuenta

- Condición: 1 día después de la fecha de vencimiento de la renta
- Transiciones:
  - Renta: de estado "próximo" → "vencida"
  - Cuenta: de estado "alquilada" → "corte"
- Restricciones:
  - Solo se aplica si la renta está en estado "próximo"
  - Solo se actualiza la cuenta si está en estado "alquilada"
  - No se cambia el estado de cuentas en estado: "papelera", "eliminada" o "disponible"

## Configuración en Supabase

Para configurar esta funcionalidad, debes ejecutar las funciones SQL proporcionadas en el archivo `supabase/functions/actualizar_estados_renta.sql` en tu proyecto de Supabase:

1. Ir al [Panel de Supabase](https://app.supabase.com/)
2. Seleccionar tu proyecto
3. Ir a "SQL Editor"
4. Copiar y pegar el contenido de `supabase/functions/actualizar_estados_renta.sql`
5. Ejecutar la consulta

El archivo contiene:

- Función `actualizar_rentas_proximas_a_vencer`: Actualiza rentas próximas a vencer (entre 0 y 7 días)
- Función `actualizar_rentas_vencidas`: Actualiza rentas vencidas y sus cuentas asociadas
- Función `notify_rental_status_change`: Trigger para auditoría de cambios de estado

## Implementación en Frontend

El sistema utiliza dos hooks personalizados para gestionar la funcionalidad:

1. `useRealtimeStatus`: Hook especializado para la gestión automática de estados
   - Actualiza estados al cargar la página
   - Programa actualizaciones diarias a las 4 AM
   - Expone función `updateRentalStates` para actualizaciones manuales

2. `useRentedAccounts`: Hook para obtener los datos de rentas
   - Integrado con React Query para manejo de caché
   - Suscrito a cambios en tiempo real mediante Supabase Realtime

## Uso en la Interfaz

En la página de Servicios (Rentas), se ha añadido un botón "Actualizar Estados" que permite forzar la verificación de estados según las fechas actuales.

## Consideraciones Técnicas

- El sistema se ejecuta en el frontend, pero utiliza funciones SQL para garantizar consistencia.
- Se utilizan canales de tiempo real de Supabase para mantener los datos sincronizados.
- La auditoría de cambios se registra en la tabla `auditoria`.
- Si una cuenta ya ha sido reasignada a otra renta, el sistema respeta su nuevo estado (no sobrescribe con "corte").

## Variables de Entorno

El sistema utiliza las siguientes variables de entorno:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_SERVICE_ROLE_KEY
```

## Dependencias

- Supabase JS SDK
- React Query para gestión de datos
- date-fns para manipulación de fechas
