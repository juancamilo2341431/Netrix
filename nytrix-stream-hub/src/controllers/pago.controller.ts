import { Request, Response } from 'express';
import { supabase } from '../integrations/supabase/client';
import { PagoOntologyService } from '../integrations/ontology/pago';

export const PagoController = {
    // Crear un nuevo pago
    async crearPago(req: Request, res: Response) {
        try {
            // 1. Crear pago en Supabase
            const { data: pagoSupabase, error } = await supabase
                .from('pago')
                .insert([req.body])
                .select()
                .single();

            if (error) throw error;

            // 2. Almacenar en ontología
            await PagoOntologyService.crearPago({
                id: pagoSupabase.id.toString(),
                idFactura: pagoSupabase.id_factura || '',
                montoPago: parseFloat(pagoSupabase.monto_pago || '0'),
                metodoPago: pagoSupabase.metodo_pago || '',
                fechaPago: new Date(pagoSupabase.created_at),
                estadoPago: pagoSupabase.estado as 'pagado' | 'pendiente' | 'cancelado'
            });

            res.status(201).json(pagoSupabase);
        } catch (error) {
            console.error('Error al crear pago:', error);
            res.status(500).json({ error: 'Error al crear pago' });
        }
    },

    // Obtener todos los pagos
    async obtenerPagos(req: Request, res: Response) {
        try {
            const { data: pagos, error } = await supabase
                .from('pago')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json(pagos);
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            res.status(500).json({ error: 'Error al obtener pagos' });
        }
    },

    // Obtener pagos por estado
    async obtenerPagosPorEstado(req: Request, res: Response) {
        try {
            const { estado } = req.params;

            const { data: pagos, error } = await supabase
                .from('pago')
                .select('*')
                .eq('estado', estado as 'pagado' | 'pendiente' | 'cancelado')
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json(pagos);
        } catch (error) {
            console.error('Error al obtener pagos por estado:', error);
            res.status(500).json({ error: 'Error al obtener pagos por estado' });
        }
    },

    // Actualizar estado de un pago
    async actualizarEstadoPago(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            // 1. Actualizar en Supabase
            const { data: pago, error } = await supabase
                .from('pago')
                .update({ estado })
                .eq('id', parseInt(id))
                .select()
                .single();

            if (error) throw error;

            // 2. Actualizar en ontología
            await PagoOntologyService.actualizarEstadoPago(
                id,
                estado as 'pagado' | 'pendiente' | 'cancelado'
            );

            res.json(pago);
        } catch (error) {
            console.error('Error al actualizar estado de pago:', error);
            res.status(500).json({ error: 'Error al actualizar estado de pago' });
        }
    },

    // Obtener análisis de pagos desde la ontología
    async obtenerAnalisisPagos(req: Request, res: Response) {
        try {
            const pagos = await PagoOntologyService.obtenerPagos();
            res.json(pagos);
        } catch (error) {
            console.error('Error al obtener análisis de pagos:', error);
            res.status(500).json({ error: 'Error al obtener análisis de pagos' });
        }
    }
}; 