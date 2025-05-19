// Descripción: Define los manejadores de ruta (controllers) para las operaciones CRUD.
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { executeSparqlSelect, executeSparqlUpdate } from '../services/fusekiService';
import { formatSparqlBindings } from '../utils/sparqlFormatter';
import { buildInsertTriples } from '../utils/tripleBuilder';
import { ONTOLOGY_PREFIX_URL } from '../config/fuseki';
import { ResourceData } from '../types/sparql';

/**
 * Creates a new resource in the ontology.
 * Expects className and classUri to be passed via route configuration.
 */
export const createResource = (className: string, classUri: string) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data: ResourceData = req.body;
            if (!data || Object.keys(data).length === 0) {
                res.status(400).json({ message: 'Request body is empty' });
                return;
            }

            const resourceId = uuidv4();
            // Use a consistent URI structure (e.g., prefix#className-uuid)
            const resourceUri = `${ONTOLOGY_PREFIX_URL}${className.toLowerCase()}-${resourceId}`;

            const insertTriples = buildInsertTriples(resourceUri, classUri, data);
            const query = `INSERT DATA { ${insertTriples} }`;

            await executeSparqlUpdate(query);
            res.status(201).json({ message: `${className} created successfully`, uri: resourceUri, id: resourceId });

        } catch (error) {
             console.error(`Error creating ${className}:`, error);
             // Pass error to the central error handler middleware (if implemented)
             // or send a generic server error response.
             const statusCode = (error as any).statusCode || 500;
             res.status(statusCode).json({ message: `Server error creating ${className}: ${(error as Error).message}` });
             // next(error); // Use if you have a central error handler
        }
    };

/**
 * Retrieves all resources of a specific class.
 * Expects className and classUri to be passed via route configuration.
 */
export const getAllResources = (className: string, classUri: string) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const query = `
                SELECT ?uri ?prop ?value
                WHERE {
                    ?uri rdf:type ${classUri} .
                    ?uri ?prop ?value .
                }
                ORDER BY ?uri ?prop
            `;
            const bindings = await executeSparqlSelect(query);
            const results = formatSparqlBindings(bindings, 'uri');
            res.status(200).json(results);

        } catch (error) {
            console.error(`Error fetching ${className}s:`, error);
            const statusCode = (error as any).statusCode || 500;
            res.status(statusCode).json({ message: `Server error fetching ${className}s: ${(error as Error).message}` });
            // next(error);
        }
    };

/**
 * Retrieves a single resource by its ID.
 * Expects className and classUri to be passed via route configuration.
 */
export const getResourceById = (className: string, classUri: string) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            if (!id) {
                 res.status(400).json({ message: 'Resource ID is required' });
                 return;
            }
            const resourceUri = `${ONTOLOGY_PREFIX_URL}${className.toLowerCase()}-${id}`;

            // Verify the resource exists and is of the correct type before fetching properties
            const checkQuery = `ASK { <${resourceUri}> rdf:type ${classUri} }`;
            // Need an executeSparqlAsk function in fusekiService or adapt executeSparqlSelect
            // For simplicity, we'll proceed and let the SELECT handle not found

            const query = `
                SELECT ?prop ?value
                WHERE {
                    <${resourceUri}> rdf:type ${classUri} . # Ensure type match
                    <${resourceUri}> ?prop ?value .
                }
            `;
            const bindings = await executeSparqlSelect(query);

            if (bindings.length === 0) {
                res.status(404).json({ message: `${className} with ID ${id} not found or not of type ${classUri}` });
                return;
            }

            // Format the single resource. Need to add the URI binding manually for the formatter.
            const formattedResult = formatSparqlBindings([{ uri: { type: 'uri', value: resourceUri } }, ...bindings], 'uri');
            res.status(200).json(formattedResult[0] || {}); // Return the single object

        } catch (error) {
            console.error(`Error fetching ${className} ${req.params.id}:`, error);
            const statusCode = (error as any).statusCode || 500;
            res.status(statusCode).json({ message: `Server error fetching ${className}: ${(error as Error).message}` });
            // next(error);
        }
    };

/**
 * Updates specific properties of a resource.
 * Expects className and classUri to be passed via route configuration.
 */
export const updateResource = (className: string, classUri: string) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
             if (!id) {
                 res.status(400).json({ message: 'Resource ID is required for update' });
                 return;
            }
            const data: ResourceData = req.body;
            const resourceUri = `${ONTOLOGY_PREFIX_URL}${className.toLowerCase()}-${id}`;

            if (!data || Object.keys(data).length === 0) {
                res.status(400).json({ message: 'Request body is empty for update' });
                return;
            }

            const propertiesToUpdate = Object.keys(data).filter(key => key !== 'uri');
            if (propertiesToUpdate.length === 0) {
                res.status(400).json({ message: 'No properties provided for update (excluding uri)' });
                return;
            }

            // Build DELETE patterns for old values
            const deletePatterns = propertiesToUpdate
                .map(key => `<${resourceUri}> :${key} ?oldValue_${key} .`)
                .join('\n');

            // Build INSERT patterns for new values (excluding rdf:type)
            const insertTriplesRaw = buildInsertTriples(resourceUri, classUri, data);
            const insertPatterns = insertTriplesRaw.replace(`<${resourceUri}> rdf:type ${classUri} .\n`, '');

             // Check if resource exists and is of correct type before updating
             const checkQuery = `ASK { <${resourceUri}> rdf:type ${classUri} }`;
             // Add executeSparqlAsk or similar check here if desired

            // Construct the combined DELETE/INSERT query
            const query = `
                DELETE {
                    ${deletePatterns}
                }
                INSERT {
                    ${insertPatterns}
                }
                WHERE {
                    <${resourceUri}> rdf:type ${classUri} .
                    ${propertiesToUpdate.map(key => `OPTIONAL { <${resourceUri}> :${key} ?oldValue_${key} . }`).join('\n')}
                };
            `;

            await executeSparqlUpdate(query);
            res.status(200).json({ message: `${className} updated successfully`, uri: resourceUri });

        } catch (error) {
            console.error(`Error updating ${className} ${req.params.id}:`, error);
            const statusCode = (error as any).statusCode || 500;
            res.status(statusCode).json({ message: `Server error updating ${className}: ${(error as Error).message}` });
            // next(error);
        }
    };

/**
 * Deletes a resource by its ID.
 * Expects className and classUri to be passed via route configuration.
 */
export const deleteResource = (className: string, classUri: string) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
             if (!id) {
                 res.status(400).json({ message: 'Resource ID is required for deletion' });
                 return;
            }
            const resourceUri = `<${ONTOLOGY_PREFIX_URL}${className.toLowerCase()}-${id}>`; // Enclose in <>

             // Check if resource exists before deleting
             // Add ASK query check here if desired

            // Query to delete all outgoing triples from the resource
            // WARNING: Does not delete incoming triples (where the resource is the object)
            const query = `
                DELETE WHERE {
                    ${resourceUri} ?p ?o .
                }
                # Optional: Add DELETE WHERE { ?s ?p ${resourceUri} } if needed and feasible
            `;

            await executeSparqlUpdate(query);
            res.status(200).json({ message: `${className} with ID ${id} deleted successfully (outgoing properties only)` });

        } catch (error) {
            console.error(`Error deleting ${className} ${req.params.id}:`, error);
            const statusCode = (error as any).statusCode || 500;
            res.status(statusCode).json({ message: `Server error deleting ${className}: ${(error as Error).message}` });
            // next(error);
        }
    };