// Descripción: Función para generar y configurar las rutas CRUD para una clase específica.

import { Router } from 'express';
import {
    createResource,
    getAllResources,
    getResourceById,
    updateResource,
    deleteResource
} from '../controllers/crudController'; // Ajusta ruta
import { OntologyClassName, ONTOLOGY_CLASSES } from '../config/fuseki'; // Ajusta ruta

/**
 * Creates and configures an Express Router with CRUD endpoints for a specific ontology class.
 * @param className - The name of the ontology class (e.g., 'Plataforma').
 * @returns An Express Router instance.
 */
export function createCrudRouter(className: OntologyClassName): Router {
    const router = Router();
    const basePath = `/${className.toLowerCase()}`; // e.g., /plataforma
    const classUri = ONTOLOGY_CLASSES[className]; // Get prefixed URI (e.g., :Plataforma)

    if (!classUri) {
        throw new Error(`Ontology class URI not found for class name: ${className}. Check config/fuseki.ts`);
    }

    // Define routes and link them to controller functions, passing className and classUri
    router.post(basePath, createResource(className, classUri));
    router.get(basePath, getAllResources(className, classUri));
    router.get(`${basePath}/:id`, getResourceById(className, classUri));
    router.put(`${basePath}/:id`, updateResource(className, classUri));
    router.delete(`${basePath}/:id`, deleteResource(className, classUri));

    return router;
}