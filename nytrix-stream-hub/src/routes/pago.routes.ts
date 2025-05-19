import { Router } from 'express';
import { PagoController } from '../controllers/pago.controller';

const router = Router();

// Rutas CRUD básicas
router.post('/', PagoController.crearPago);
router.get('/', PagoController.obtenerPagos);
router.get('/estado/:estado', PagoController.obtenerPagosPorEstado);
router.patch('/:id/estado', PagoController.actualizarEstadoPago);

// Rutas de análisis (ontología)
router.get('/analisis', PagoController.obtenerAnalisisPagos);

export default router; 