//Descripción: Define interfaces y tipos para los datos SPARQL.

// Representa un valor individual en un binding SPARQL
export interface SparqlValue {
    type: 'uri' | 'literal' | 'bnode'; // Tipo de valor (URI, Literal, Blank Node)
    value: string; // El valor como string
    datatype?: string; // URI del tipo de dato (e.g., xsd:string, xsd:integer), solo para literales
    'xml:lang'?: string; // Etiqueta de idioma (e.g., "en", "es"), solo para literales string
}

// Representa una fila (binding) en los resultados SPARQL
// Las claves son los nombres de las variables en la consulta SELECT (e.g., "?uri", "?prop")
export interface SparqlBinding {
    [key: string]: SparqlValue;
}

// Estructura de la respuesta JSON de una consulta SPARQL SELECT
export interface SparqlSelectResponse {
    head: {
        vars: string[]; // Nombres de las variables en la consulta
    };
    results: {
        bindings: SparqlBinding[]; // Array de filas de resultados
    };
}

// Representa un recurso formateado con sus propiedades
// Usado como salida de la API
export interface FormattedResource {
    uri: string; // URI del recurso
    [propertyName: string]: SparqlValue | SparqlValue[] | string; // Propiedades (pueden ser multivaluadas)
}

// Tipo para los datos recibidos en el cuerpo de una petición POST/PUT
// Las claves son los nombres cortos de las propiedades de la ontología
export interface ResourceData {
    [key: string]: any; // Permite cualquier tipo de valor (string, number, boolean, array, object con uri)
}