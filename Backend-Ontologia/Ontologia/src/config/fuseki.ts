//Descripción: Configuración centralizada para la conexión a Fuseki.

export const FUSEKI_URL = process.env.FUSEKI_URL || 'http://localhost:3030';
export const DATASET_NAME = process.env.FUSEKI_DATASET || 'Streamly';
export const ONTOLOGY_PREFIX_URL = process.env.ONTOLOGY_PREFIX_URL || 'http://example.org/ontology/rentas#';
export const ONTOLOGY_PREFIX_NAME = 'rentas';

export const FUSEKI_SPARQL_ENDPOINT = `${FUSEKI_URL}/${DATASET_NAME}/sparql`;
export const FUSEKI_UPDATE_ENDPOINT = `${FUSEKI_URL}/${DATASET_NAME}/update`;

// Prefijos SPARQL comunes para usar en las consultas
export const SPARQL_PREFIXES = `
    PREFIX : <${ONTOLOGY_PREFIX_URL}>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX ${ONTOLOGY_PREFIX_NAME}: <${ONTOLOGY_PREFIX_URL}>
`;

// Clases de la ontología (usa los nombres exactos de tu ontología)
// Se usa un objeto para facilitar el acceso y evitar errores tipográficos
export const ONTOLOGY_CLASSES = {
    Plataforma: ':Plataforma',
    Persona: ':Persona',
    Cuenta: ':Cuenta',
    Cupon: ':Cupon',
    CuponPersona: ':CuponPersona',
    Renta: ':Renta',
    Factura: ':Factura',
    Pago: ':Pago',
} as const; // 'as const' para tipos más específicos

export type OntologyClassName = keyof typeof ONTOLOGY_CLASSES;