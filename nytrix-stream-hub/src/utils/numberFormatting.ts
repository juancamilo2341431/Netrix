/**
 * Formatea un número como moneda COP (Peso Colombiano) con separador de miles.
 * @param amount El número a formatear.
 * @param minimumFractionDigits El número mínimo de decimales (por defecto 0 para COP).
 * @returns El número formateado como string (ej: "10.000").
 */
export const formatCurrencyCOP = (amount: number, minimumFractionDigits: number = 0): string => {
  // Usamos 'es-CO' para el formato colombiano que usa el punto como separador de miles.
  // Si Intl no estuviera disponible o se quisiera un fallback simple, se podría usar regex:
  // return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'decimal', // 'currency' añadiría "COP", usamos 'decimal' para solo el número.
      currency: 'COP', // Necesario para style: 'currency', pero no se muestra con 'decimal'
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: minimumFractionDigits, // Para asegurar que no haya más decimales de los deseados
    }).format(Math.round(amount * (10**minimumFractionDigits)) / (10**minimumFractionDigits)); // Redondear correctamente antes de formatear
  } catch (error) {
    // Fallback muy básico si Intl.NumberFormat falla (ej. en entornos muy viejos)
    console.error("Error formateando moneda con Intl.NumberFormat:", error);
    const numStr = amount.toFixed(minimumFractionDigits);
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(','); // Intl usa coma para decimales, pero el ejemplo era 10.000
                          // Si es-CO está bien, debería ser "10.000" sin decimales por defecto.
                          // El fallback debería ser a '.' para miles y ',' para decimales si fuera necesario.
                          // Para 10.000 (sin decimales), el fallback es más simple.
    // Fallback simple para enteros:
     return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
}; 