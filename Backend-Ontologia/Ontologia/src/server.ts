//Descripción: Punto de entrada principal de la aplicación. Configura Express y arranca el servidor.

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import mainRouter from './routes/index'; // Ajusta ruta
import { FUSEKI_URL, FUSEKI_SPARQL_ENDPOINT, FUSEKI_UPDATE_ENDPOINT, ONTOLOGY_PREFIX_URL } from './config/fuseki'; // Ajusta ruta

// Crear instancia de la aplicación Express
const app: Express = express();
const port = process.env.PORT || 3001;

// --- Middlewares Esenciales ---
app.use(cors()); // Habilitar CORS para permitir peticiones de otros orígenes
app.use(express.json()); // Parsear cuerpos de petición JSON
app.use(express.urlencoded({ extended: true })); // Parsear cuerpos de petición URL-encoded

// --- Rutas Principales ---
app.use('/', mainRouter); // Montar el enrutador principal

// --- Middleware de Manejo de Errores (Ejemplo Básico) ---
// Colócalo después de todas tus rutas
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Unhandled Error:", err.stack); // Loguear el error completo

    // Extraer código de estado si está disponible (como lo adjuntamos en los servicios)
    const statusCode = (err as any).statusCode || 500;

    res.status(statusCode).json({
        message: err.message || 'Internal Server Error',
        // Opcional: no exponer stack trace en producción
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

// --- Middleware para Rutas No Encontradas (404) ---
// Colócalo al final, después de todas las rutas y el manejador de errores principal
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: `Cannot ${req.method} ${req.path}` });
});


// --- Iniciar el Servidor ---
app.listen(port, () => {
    console.log(`\n🚀 API Server listening at http://localhost:${port}`);
    console.log(`   Fuseki Base URL: ${FUSEKI_URL}`);
    console.log(`   Fuseki SPARQL Endpoint: ${FUSEKI_SPARQL_ENDPOINT}`);
    console.log(`   Fuseki Update Endpoint: ${FUSEKI_UPDATE_ENDPOINT}`);
    console.log(`   Ontology Prefix: ${ONTOLOGY_PREFIX_URL}`);

    // Prueba de conexión opcional a Fuseki al iniciar
    axios.get(FUSEKI_URL)
        .then(() => console.log("✅ Successfully connected to Fuseki server base URL."))
        .catch(err => console.error("❌ Failed to connect to Fuseki server base URL. Is Fuseki running?", (err as Error).message));

     console.log("\nAvailable API endpoints are registered under /api/");
});