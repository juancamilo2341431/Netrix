// Descripción: Función para construir tripletas RDF para consultas INSERT.

import { ResourceData } from '../types/sparql'; // Ajusta la ruta si no usas alias
import { ONTOLOGY_PREFIX_URL } from '../config/fuseki'; // Ajusta la ruta si no usas alias

/**
 * Builds RDF triple patterns (as strings) for a SPARQL INSERT DATA clause based on a data object.
 * Handles basic data types (string, number, boolean, Date) and relationships (URIs).
 * @param resourceUri - The full URI of the resource being created/updated.
 * @param resourceClassUri - The prefixed URI of the resource's class (e.g., ':Plataforma').
 * @param data - Object containing the properties to insert. Keys should be the short names of ontology properties.
 * @returns A string containing the RDF triple patterns for the INSERT clause.
 */
export function buildInsertTriples(resourceUri: string, resourceClassUri: string, data: ResourceData): string {
    // Start with the rdf:type triple
    let triples = `<${resourceUri}> rdf:type ${resourceClassUri} .\n`;

    for (const key in data) {
        // Skip the 'uri' key if present in data, and skip null/undefined values
        if (key === 'uri' || data[key] === null || data[key] === undefined) {
            continue;
        }

        // Construct the full property URI using the ontology prefix
        const propertyUri = `:${key}`; // Use prefixed name directly (e.g., :nombrePlataforma)
        const value = data[key];

        // Ensure values are handled as an array to support multi-valued properties easily
        const values = Array.isArray(value) ? value : [value];

        values.forEach(val => {
            // Check if the value is intended as a relationship (Object Property)
            // It could be a full URI string or an object like { uri: "..." }
            let isRelationship = false;
            let relatedUri: string | null = null;

            if (typeof val === 'string' && (val.startsWith(ONTOLOGY_PREFIX_URL) || val.startsWith('http://') || val.startsWith('https://'))) {
                isRelationship = true;
                relatedUri = `<${val}>`;
            } else if (typeof val === 'object' && val !== null && typeof val.uri === 'string') {
                 // Handle cases where relationships are passed as objects { uri: "..." }
                 isRelationship = true;
                 relatedUri = `<${val.uri}>`;
            }

            if (isRelationship && relatedUri) {
                // Add triple for the object property (relationship)
                triples += `<${resourceUri}> ${propertyUri} ${relatedUri} .\n`;
            } else {
                // Treat as a literal value (Data Property)
                let literalValue = '';
                // Format the literal based on its JavaScript type, adding explicit XSD datatypes
                if (typeof val === 'number') {
                    literalValue = Number.isInteger(val)
                        ? `"${val}"^^xsd:integer`
                        : `"${val}"^^xsd:decimal`;
                } else if (typeof val === 'boolean') {
                    literalValue = `"${val}"^^xsd:boolean`;
                } else if (val instanceof Date) {
                    literalValue = `"${val.toISOString()}"^^xsd:dateTime`;
                } else {
                    // Default to string, escape special characters (quotes, backslashes, newlines)
                    const escapedString = String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
                    literalValue = `"${escapedString}"^^xsd:string`;
                }
                // Add triple for the data property
                triples += `<${resourceUri}> ${propertyUri} ${literalValue} .\n`;
            }
        });
    }
    return triples;
}
