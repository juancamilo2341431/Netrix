// Descripción: Función para transformar resultados SPARQL crudos en JSON estructurado.

import { SparqlBinding, SparqlValue, FormattedResource } from '../types/sparql'; // Ajusta la ruta si no usas alias
import { ONTOLOGY_PREFIX_URL } from '../config/fuseki';

/**
 * Formats raw SPARQL SELECT bindings (?uri ?prop ?value) into an array of structured JSON objects.
 * Each object represents a resource, grouping its properties. Handles multi-valued properties.
 * @param bindings - Array of bindings from the SPARQL SELECT response.
 * @param uriVariable - The name of the variable holding the resource URI (default: 'uri').
 * @returns An array of FormattedResource objects.
 */
export function formatSparqlBindings(bindings: SparqlBinding[], uriVariable: string = 'uri'): FormattedResource[] {
    const results: { [uri: string]: FormattedResource } = {};

    bindings.forEach(binding => {
        const resourceUri = binding[uriVariable]?.value;
        const propertyUri = binding.prop?.value;
        const valueNode = binding.value; // El nodo completo del valor (type, value, datatype)

        // Skip if essential parts are missing
        if (!resourceUri || !propertyUri || !valueNode) {
            console.warn('Skipping incomplete binding:', binding);
            return;
        }

        // Use the short property name (local name) as the key in the JSON object
        const propertyName = propertyUri.replace(ONTOLOGY_PREFIX_URL, '');

        // Initialize the resource object if it's the first time seeing this URI
        if (!results[resourceUri]) {
            results[resourceUri] = { uri: resourceUri };
        }

        const currentResource = results[resourceUri];

        // Prepare the value object to store (keeping type and datatype info)
        const formattedValue: SparqlValue = {
            type: valueNode.type,
            value: valueNode.value,
            ...(valueNode.datatype && { datatype: valueNode.datatype }), // Add datatype if present
            ...(valueNode['xml:lang'] && { 'xml:lang': valueNode['xml:lang'] }), // Add language tag if present
        };

        // Handle multi-valued properties: if property already exists, ensure it's an array and push
        if (currentResource.hasOwnProperty(propertyName)) {
            const existingValue = currentResource[propertyName];
            if (Array.isArray(existingValue)) {
                // Already an array, push the new value object
                existingValue.push(formattedValue);
            } else {
                // Convert single value to array and add the new one
                currentResource[propertyName] = [existingValue as SparqlValue, formattedValue];
            }
        } else {
            // First value for this property, assign directly
            currentResource[propertyName] = formattedValue;
        }
    });

    // Convert the map of resources { uri: resource } into an array [ resource ]
    return Object.values(results);
}