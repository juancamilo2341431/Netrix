// Descripción: Servicio para encapsular la comunicación con el endpoint SPARQL de Fuseki.

import axios, { AxiosError } from 'axios';
import { FUSEKI_SPARQL_ENDPOINT, FUSEKI_UPDATE_ENDPOINT, SPARQL_PREFIXES } from '../config/fuseki'; // Ajusta rutas
import { SparqlBinding, SparqlSelectResponse } from '../types/sparql'; // Ajusta rutas

/**
 * Executes a SPARQL SELECT query against the configured Fuseki endpoint.
 * @param query - The SPARQL SELECT query string (without prefixes).
 * @returns A Promise resolving with an array of SparqlBinding results.
 * @throws An error if the query fails.
 */
export async function executeSparqlSelect(query: string): Promise<SparqlBinding[]> {
    const fullQuery = SPARQL_PREFIXES + query;
    console.log("Executing SPARQL Query:\n", fullQuery); // Log the query
    try {
        const response = await axios.get<SparqlSelectResponse>(FUSEKI_SPARQL_ENDPOINT, {
            params: { query: fullQuery },
            headers: { 'Accept': 'application/sparql-results+json' }
        });
        console.log("SPARQL Query successful.");
        return response.data.results.bindings;
    } catch (error) {
        handleSparqlError(error, fullQuery); // Throw standardized error
        return []; // Should not be reached due to throw, but satisfies TS
    }
}

/**
 * Executes a SPARQL UPDATE (INSERT/DELETE) query against the configured Fuseki endpoint.
 * @param updateQuery - The SPARQL UPDATE query string (without prefixes).
 * @returns A Promise resolving when the update is successful.
 * @throws An error if the update fails.
 */
export async function executeSparqlUpdate(updateQuery: string): Promise<void> {
    const fullUpdateQuery = SPARQL_PREFIXES + updateQuery;
    console.log("Executing SPARQL Update:\n", fullUpdateQuery); // Log the update
    try {
        await axios.post(FUSEKI_UPDATE_ENDPOINT, `update=${encodeURIComponent(fullUpdateQuery)}`, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log("SPARQL Update successful.");
    } catch (error) {
        handleSparqlError(error, fullUpdateQuery); // Throw standardized error
    }
}

/**
 * Handles errors from Axios requests to Fuseki and throws a more informative error.
 * @param error - The error object caught (expected to be AxiosError or similar).
 * @param query - The query that caused the error.
 */
function handleSparqlError(error: unknown, query: string): never {
    let errorMessage = 'Unknown SPARQL error';
    let statusCode = 500;

    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        statusCode = axiosError.response?.status || 500;
        const responseData = axiosError.response?.data;
        // Try to get a meaningful message from Fuseki's response
        errorMessage = typeof responseData === 'string'
            ? responseData.substring(0, 500) // Limit length
            : JSON.stringify(responseData);
        console.error(`SPARQL Error (Status ${statusCode}):`, errorMessage);
        console.error("Failed Query/Update:", query);
    } else if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Non-Axios SPARQL Error:", errorMessage);
        console.error("Failed Query/Update:", query);
    } else {
         console.error("Unknown SPARQL Error Type:", error);
         console.error("Failed Query/Update:", query);
    }

    // Include status code in the error thrown back to the controller
    const customError = new Error(`SPARQL operation failed (Status: ${statusCode}): ${errorMessage}`);
    (customError as any).statusCode = statusCode; // Attach status code for controller use
    throw customError;
}