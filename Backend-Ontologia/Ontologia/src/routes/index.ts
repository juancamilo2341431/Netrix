//Descripción: Archivo principal para agregar todas las rutas de la API.

import { Router } from 'express';
import { createCrudRouter } from './crudRoutes';
import { ONTOLOGY_CLASSES } from '../config/fuseki'; // Ajusta ruta

const mainRouter = Router();

// Mensaje de bienvenida en la raíz de la API
mainRouter.get('/', (req, res) => {
    res.send('API REST (TypeScript) para Ontología de Rentas - Conectado a Fuseki');
});

// Generar y montar rutas CRUD para cada clase definida en la configuración
console.log("Registering CRUD routes...");
for (const className in ONTOLOGY_CLASSES) {
    if (Object.prototype.hasOwnProperty.call(ONTOLOGY_CLASSES, className)) {
        const typedClassName = className as keyof typeof ONTOLOGY_CLASSES;
        console.log(`- Registering routes for ${typedClassName} at /api/${typedClassName.toLowerCase()}`);
        const crudRouter = createCrudRouter(typedClassName);
        mainRouter.use('/api', crudRouter); // Monta el router específico en /api
    }
}
console.log("CRUD routes registered.");

export default mainRouter;