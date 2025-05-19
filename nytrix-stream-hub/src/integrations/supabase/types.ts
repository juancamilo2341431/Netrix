export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auditoria: {
        Row: {
          acccion: string | null
          created_at: string
          id: number
          id_persona: number
        }
        Insert: {
          acccion?: string | null
          created_at?: string
          id?: number
          id_persona: number
        }
        Update: {
          acccion?: string | null
          created_at?: string
          id?: number
          id_persona?: number
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id"]
          },
        ]
      }
      cuenta: {
        Row: {
          contrasenia: string | null
          correo: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_cuenta"] | null
          id: number
          id_plataforma: number | null
          last_updated: string | null
          metadata_perfil: string | null
        }
        Insert: {
          contrasenia?: string | null
          correo?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cuenta"] | null
          id?: number
          id_plataforma?: number | null
          last_updated?: string | null
          metadata_perfil?: string | null
        }
        Update: {
          contrasenia?: string | null
          correo?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cuenta"] | null
          id?: number
          id_plataforma?: number | null
          last_updated?: string | null
          metadata_perfil?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cuenta_id_plataforma_fkey"
            columns: ["id_plataforma"]
            isOneToOne: false
            referencedRelation: "plataforma"
            referencedColumns: ["id"]
          },
        ]
      }
      cupon: {
        Row: {
          codigo: string | null
          created_at: string
          descripcion: string | null
          descuento: string | null
          id: number
          last_updated: string | null
          nombre: string | null
          id_plataforma: number | null
          estado: Database["public"]["Enums"]["estado_activo_inactivo"] | null
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          descuento?: string | null
          id?: number
          last_updated?: string | null
          nombre?: string | null
          id_plataforma?: number | null
          estado?: Database["public"]["Enums"]["estado_activo_inactivo"] | null
        }
        Update: {
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          descuento?: string | null
          id?: number
          last_updated?: string | null
          nombre?: string | null
          id_plataforma?: number | null
          estado?: Database["public"]["Enums"]["estado_activo_inactivo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "cupon_id_plataforma_fkey"
            columns: ["id_plataforma"]
            isOneToOne: false
            referencedRelation: "plataforma"
            referencedColumns: ["id"]
          },
        ]
      }
      cupon_persona: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_activo_supendido"] | null
          id: number
          id_cupon: number | null
          id_persona: number | null
          last_updated: string | null
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_activo_supendido"] | null
          id?: number
          id_cupon?: number | null
          id_persona?: number | null
          last_updated?: string | null
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_activo_supendido"] | null
          id?: number
          id_cupon?: number | null
          id_persona?: number | null
          last_updated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cupon_persona_id_cupon_fkey"
            columns: ["id_cupon"]
            isOneToOne: false
            referencedRelation: "cupon"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupon_persona_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id"]
          },
        ]
      }
      pago: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_pago"] | null
          id: number
          id_factura: string | null
          last_updated: string | null
          metodo_pago: string | null
          monto_pago: string | null
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_pago"] | null
          id?: number
          id_factura?: string | null
          last_updated?: string | null
          metodo_pago?: string | null
          monto_pago?: string | null
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_pago"] | null
          id?: number
          id_factura?: string | null
          last_updated?: string | null
          metodo_pago?: string | null
          monto_pago?: string | null
        }
        Relationships: []
      }
      pago_renta: {
        Row: {
          created_at: string
          id: number
          id_pago: number | null
          id_renta: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          id_pago?: number | null
          id_renta?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          id_pago?: number | null
          id_renta?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pago_renta_id_pago_fkey"
            columns: ["id_pago"]
            isOneToOne: false
            referencedRelation: "pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pago_renta_id_renta_fkey"
            columns: ["id_renta"]
            isOneToOne: false
            referencedRelation: "renta"
            referencedColumns: ["id"]
          },
        ]
      }
      persona: {
        Row: {
          correo: string | null
          created_at: string
          estado:
            | Database["public"]["Enums"]["estado_habilitado_bloqueado"]
            | null
          id: number
          id_user: string
          last_updated: string | null
          nombre_completo: string | null
          rol: Database["public"]["Enums"]["persona_rol"] | null
          telefono: string | null
        }
        Insert: {
          correo?: string | null
          created_at?: string
          estado?:
            | Database["public"]["Enums"]["estado_habilitado_bloqueado"]
            | null
          id?: number
          id_user: string
          last_updated?: string | null
          nombre_completo?: string | null
          rol?: Database["public"]["Enums"]["persona_rol"] | null
          telefono?: string | null
        }
        Update: {
          correo?: string | null
          created_at?: string
          estado?:
            | Database["public"]["Enums"]["estado_habilitado_bloqueado"]
            | null
          id?: number
          id_user?: string
          last_updated?: string | null
          nombre_completo?: string | null
          rol?: Database["public"]["Enums"]["persona_rol"] | null
          telefono?: string | null
        }
        Relationships: []
      }
      plataforma: {
        Row: {
          created_at: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_plataforma"] | null
          id: number
          imagen: string | null
          last_updated: string | null
          nombre: string | null
          precio: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_plataforma"] | null
          id?: number
          imagen?: string | null
          last_updated?: string | null
          nombre?: string | null
          precio?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_plataforma"] | null
          id?: number
          imagen?: string | null
          last_updated?: string | null
          nombre?: string | null
          precio?: string | null
        }
        Relationships: []
      }
      renta: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_renta"] | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: number
          id_cuenta: number | null
          id_cupon_persona: number | null
          id_persona: number | null
          last_updated: string | null
          descripcion: string | null
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_renta"] | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: number
          id_cuenta?: number | null
          id_cupon_persona?: number | null
          id_persona?: number | null
          last_updated?: string | null
          descripcion?: string | null
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_renta"] | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: number
          id_cuenta?: number | null
          id_cupon_persona?: number | null
          id_persona?: number | null
          last_updated?: string | null
          descripcion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "renta_id_cuenta_fkey"
            columns: ["id_cuenta"]
            isOneToOne: false
            referencedRelation: "cuenta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renta_id_cupon_persona_fkey"
            columns: ["id_cupon_persona"]
            isOneToOne: false
            referencedRelation: "cupon_persona"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renta_id_persona_fkey"
            columns: ["id_persona"]
            isOneToOne: false
            referencedRelation: "persona"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_password: {
        Args: { encrypted_password: string }
        Returns: string
      }
      encrypt_password: {
        Args: { password: string }
        Returns: string
      }
    }
    Enums: {
      estado_activo_supendido: "activo" | "suspendido"
      estado_activo_inactivo: "activo" | "inactivo"
      estado_cuenta:
        | "disponible"
        | "alquilada"
        | "revision"
        | "tramite"
        | "papelera"
        | "eliminada"
        | "corte"
      estado_habilitado_bloqueado: "habilitado" | "bloqueado"
      estado_pago: "pagado" | "cancelado" | "pendiente"
      estado_plataforma: "mostrar" | "ocultar"
      estado_renta: "rentada" | "garantia" | "vencida" | "proximo"
      persona_rol: "admin" | "cliente" | "asistente"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_activo_supendido: ["activo", "suspendido"],
      estado_activo_inactivo: ["activo", "inactivo"],
      estado_cuenta: [
        "disponible",
        "alquilada",
        "revision",
        "tramite",
        "papelera",
        "eliminada",
        "corte",
      ],
      estado_habilitado_bloqueado: ["habilitado", "bloqueado"],
      estado_pago: ["pagado", "cancelado", "pendiente"],
      estado_plataforma: ["mostrar", "ocultar"],
      estado_renta: ["rentada", "garantia", "vencida", "proximo"],
      persona_rol: ["admin", "cliente", "asistente"],
    },
  },
} as const
