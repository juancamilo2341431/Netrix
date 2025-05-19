import axios from 'axios';

const ONTOLOGY_API_BASE = 'http://localhost:3002/api';
const FUSEKI_QUERY_ENDPOINT = 'http://localhost:3030/Streamly/sparql';

interface PagoOntology {
    id: string;
    idFactura: string;
    montoPago: number;
    metodoPago: string;
    fechaPago: Date;
    estadoPago: 'pagado' | 'pendiente' | 'cancelado';
}

export const PagoOntologyService = {
    // Almacenar un nuevo pago en la ontología usando el endpoint REST
    async crearPago(pago: PagoOntology): Promise<void> {
        try {
            await axios.post(`${ONTOLOGY_API_BASE}/pago`, {
                id: pago.id,
                idFactura: pago.idFactura,
                montoPago: pago.montoPago,
                metodoPago: pago.metodoPago,
                fechaPago: pago.fechaPago,
                estadoPago: pago.estadoPago
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error al almacenar pago en ontología:', error);
            throw error;
        }
    },

    // Obtener todos los pagos
    async obtenerPagos(): Promise<PagoOntology[]> {
        const query = `
            SELECT ?id ?idFactura ?montoPago ?metodoPago ?fechaPago ?estadoPago
            WHERE {
                ?pago rdf:type rentas:Pago ;
                    rentas:idFactura ?idFactura ;
                    rentas:montoPago ?montoPago ;
                    rentas:metodoPago ?metodoPago ;
                    rentas:fechaPago ?fechaPago ;
                    rentas:estadoPago ?estadoPago .
                BIND(REPLACE(STR(?pago), "http://example.org/ontology/rentas#pago_", "") AS ?id)
            }
        `;

        try {
            const response = await axios.get(FUSEKI_QUERY_ENDPOINT, {
                params: {
                    query: query,
                    format: 'json'
                }
            });

            return response.data.results.bindings.map((binding: any) => ({
                id: binding.id.value,
                idFactura: binding.idFactura.value,
                montoPago: parseFloat(binding.montoPago.value),
                metodoPago: binding.metodoPago.value,
                fechaPago: new Date(binding.fechaPago.value),
                estadoPago: binding.estadoPago.value.split('#')[1]
            }));
        } catch (error) {
            console.error('Error al obtener pagos de la ontología:', error);
            throw error;
        }
    },

    // Obtener pagos por estado
    async obtenerPagosPorEstado(estado: 'pagado' | 'pendiente' | 'cancelado'): Promise<PagoOntology[]> {
        const query = `
            SELECT ?id ?idFactura ?montoPago ?metodoPago ?fechaPago ?estadoPago
            WHERE {
                ?pago rdf:type rentas:Pago ;
                    rentas:idFactura ?idFactura ;
                    rentas:montoPago ?montoPago ;
                    rentas:metodoPago ?metodoPago ;
                    rentas:fechaPago ?fechaPago ;
                    rentas:estadoPago rentas:${estado} .
                BIND(REPLACE(STR(?pago), "http://example.org/ontology/rentas#pago_", "") AS ?id)
            }
        `;

        try {
            const response = await axios.get(FUSEKI_QUERY_ENDPOINT, {
                params: {
                    query: query,
                    format: 'json'
                }
            });

            return response.data.results.bindings.map((binding: any) => ({
                id: binding.id.value,
                idFactura: binding.idFactura.value,
                montoPago: parseFloat(binding.montoPago.value),
                metodoPago: binding.metodoPago.value,
                fechaPago: new Date(binding.fechaPago.value),
                estadoPago: estado
            }));
        } catch (error) {
            console.error('Error al obtener pagos por estado de la ontología:', error);
            throw error;
        }
    },

    // Actualizar estado de un pago
    async actualizarEstadoPago(id: string, nuevoEstado: 'pagado' | 'pendiente' | 'cancelado'): Promise<void> {
        const query = `
            DELETE {
                rentas:pago_${id} rentas:estadoPago ?estado .
            }
            INSERT {
                rentas:pago_${id} rentas:estadoPago rentas:${nuevoEstado} .
            }
            WHERE {
                rentas:pago_${id} rentas:estadoPago ?estado .
            }
        `;

        try {
            await axios.post(FUSEKI_QUERY_ENDPOINT, query, {
                headers: {
                    'Content-Type': 'application/sparql-update'
                }
            });
        } catch (error) {
            console.error('Error al actualizar estado de pago en ontología:', error);
            throw error;
        }
    }
}; 