
export interface Platform {
  id: number;
  nombre: string;
  precio: string | null;
  descripcion: string | null;
  imagen: string | null;
  estado: 'mostrar' | 'ocultar';
  created_at: string;
  last_updated: string | null;
}
