import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { 
  TableRow, 
  TableCell, 
  TableHead, 
  Table, 
  TableHeader, 
  TableBody 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertTriangle, Ticket, Copy, BarChart, Users, DollarSign, Loader2, UserPlus, Ban, CheckCircle, X, CheckCheck, MoreHorizontal, Edit, ToggleLeft, ToggleRight, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import {
  logCouponCreation,
  logCouponUpdate,
  logCouponStatusChange,
  logAddUsersToCoupon,
  logSuspendUsersFromCoupon,
  logCouponAutoActivation,
  logCouponAutoDeactivation
} from "@/utils/couponAuditLogger";
import { useCoupons, Cupon, Plataforma, Usuario, CuponPersona } from "@/hooks/useCoupons";

export default function Coupons() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Cupon | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [isUpdatingUsers, setIsUpdatingUsers] = useState(false);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [usersToAdd, setUsersToAdd] = useState<number[]>([]);
  const [isAddingUsers, setIsAddingUsers] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    nombre: string;
    descripcion: string;
    codigo: string;
    descuento: string;
  }>({
    nombre: "",
    descripcion: "",
    codigo: "",
    descuento: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para el modal de nuevo cupón
  const [newCouponModalOpen, setNewCouponModalOpen] = useState(false);
  const [newCouponFormData, setNewCouponFormData] = useState<{
    nombre: string;
    descripcion: string;
    codigo: string;
    descuento: string;
    id_plataforma: string;
  }>({
    nombre: "",
    descripcion: "",
    codigo: "",
    descuento: "",
    id_plataforma: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  
  // Estado para el ID del usuario autenticado
  const [userId, setUserId] = useState<number | null>(null);
  const { user } = useAuth();
  
  // Usar el hook de cupones con Realtime
  const { data, isLoading, error, refetch } = useCoupons();
  
  // Extraer datos del resultado del hook
  const cupones = data?.cupones || [];
  const plataformas = data?.plataformas || [];
  const usuarios = data?.usuarios || [];
  const cuponPersonas = data?.cuponPersonas || [];
  
  // Estados para ordenamiento
  const [sortColumn, setSortColumn] = useState<string>("last_updated");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Variable para tracking del estado de la suscripción
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(false);
  
  // Obtener el ID del usuario autenticado
  useEffect(() => {
    const fetchUserId = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("persona")
          .select("id")
          .eq("id_user", user.id)
          .single();
          
        if (data && !error) {
          setUserId(data.id);
        }
      }
    };
    
    fetchUserId();
  }, [user]);
  
  // Función para cargar datos de cupones (mantenida para compatibilidad)
  // En la práctica, esta función ahora solo llama a refetch
  const loadCupones = async () => {
    try {
      await refetch();
    } catch (err) {
      toast.error("Error al cargar los cupones");
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadCupones();
  }, []);

  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    // Intentar detectar si Realtime está funcionando
    const checkRealtimeStatus = () => {
      // Si después de 2 segundos no recibimos datos, intentar una carga manual
      const timer = setTimeout(() => {
        if (cupones.length === 0 && !isLoading) {
          // Si no hay datos, intentar una carga manual
          loadCupones();
        }
      }, 2000);

      return () => clearTimeout(timer);
    };

    checkRealtimeStatus();
  }, []);

  // Obtener usuarios con estado para un cupón específico
  const getCouponUsersWithStatus = async (couponId: number): Promise<Usuario[]> => {
    try {
      // Obtener relaciones cupon_persona para este cupón
      const { data: relationData, error: relationError } = await supabase
        .from('cupon_persona')
        .select('id_persona, estado')
        .eq('id_cupon', couponId);

      if (relationError) throw relationError;

      // Mapear usuarios con sus estados
      const usersWithStatus = usuarios
        .filter(user => relationData?.some(rel => rel.id_persona === user.id))
        .map(user => {
          const relation = relationData?.find(rel => rel.id_persona === user.id);
          return {
            ...user,
            estado_cupon: relation?.estado || "activo"
          };
        });

      return usersWithStatus;
    } catch (err) {
      console.error("Error al obtener usuarios del cupón:", err);
      return [];
    }
  };

  // Abrir modal con usuarios de un cupón
  const openUserModal = async (coupon: Cupon) => {
    setSelectedCoupon(coupon);
    setSelectedUserIds([]);
    setUserModalOpen(true);
  };

  // Actualizar el cupón seleccionado actualmente en el modal
  const refreshSelectedCoupon = () => {
    if (selectedCoupon) {
      // Buscar el cupón actualizado en el array de cupones
      const updatedCoupon = cupones.find(c => c.id === selectedCoupon.id);
      if (updatedCoupon) {
        setSelectedCoupon(updatedCoupon);
      }
    }
  };

  // Manejar selección de todos los usuarios
  const handleSelectAllUsers = (userList: Usuario[]) => {
    if (selectedUserIds.length === userList.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(userList.map(user => user.id));
    }
  };

  // Manejar toggle de selección de un usuario
  const handleUserCheckToggle = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Cambiar estado de usuarios seleccionados
  const updateSelectedUsersStatus = async (newStatus: "activo" | "suspendido") => {
    if (!selectedCoupon || selectedUserIds.length === 0) return;
    
    setIsUpdatingUsers(true);
    
    try {
      // Actualizar cada relación cupon_persona
      for (const userId of selectedUserIds) {
        const { data: existingRelation, error: findError } = await supabase
          .from('cupon_persona')
          .select('id')
          .eq('id_cupon', selectedCoupon.id)
          .eq('id_persona', userId)
          .single();
          
        if (findError && findError.code !== 'PGRST116') { // No encontrado
          continue;
        }

        if (existingRelation) {
          // Actualizar relación existente
          const { error: updateError } = await supabase
            .from('cupon_persona')
            .update({ 
              estado: newStatus,
              last_updated: new Date().toISOString()
            })
            .eq('id', existingRelation.id);
            
          if (updateError) {
            toast.error("Error al actualizar estado de usuario");
          }
        } else if (newStatus === "activo") {
          // Crear nueva relación si queremos activar un usuario que no existe
          const { error: insertError } = await supabase
            .from('cupon_persona')
            .insert({
              id_cupon: selectedCoupon.id,
              id_persona: userId,
              estado: "activo" as const,
              created_at: new Date().toISOString(),
              last_updated: new Date().toISOString()
            });
            
          if (insertError) {
            toast.error("Error al crear relación de usuario");
          }
        }
      }
      
      // Registrar en auditoría
      if (userId && newStatus === "suspendido") {
        await logSuspendUsersFromCoupon(
          userId,
          selectedCoupon.id,
          selectedCoupon.nombre,
          selectedUserIds,
          selectedUserIds.length
        );
      }
      
      // Si estamos suspendiendo usuarios, verificar si quedan usuarios activos
      if (newStatus === "suspendido") {
        // Obtener todas las relaciones activas para este cupón
        const { data: activeRelations, error: activeError } = await supabase
          .from('cupon_persona')
          .select('id')
          .eq('id_cupon', selectedCoupon.id)
          .eq('estado', 'activo');
          
        if (!activeError) {
          // Si no quedan usuarios activos, desactivar el cupón
          if (!activeRelations || activeRelations.length === 0) {
            const { error: updateError } = await supabase
              .from('cupon')
              .update({ 
                estado: "inactivo",
                last_updated: new Date().toISOString()
              })
              .eq('id', selectedCoupon.id);
              
            if (!updateError) {
              // Registrar en auditoría la desactivación automática
              if (userId) {
                await logCouponAutoDeactivation(
                  userId,
                  selectedCoupon.id,
                  selectedCoupon.nombre,
                  "No quedan usuarios activos"
                );
              }
              
              toast.success("Cupón desactivado automáticamente por falta de usuarios activos");
            }
          }
        }
      }
      
      toast.success(`${selectedUserIds.length} usuario(s) ${newStatus === "activo" ? "activados" : "suspendidos"} correctamente`);
      
      // Actualizar datos utilizando el Realtime hook
      // No es necesario refetch manual gracias a Realtime, pero se mantiene por seguridad
      refetch();
      
      // Actualizar el cupón seleccionado en el modal con los datos más recientes
      refreshSelectedCoupon();
      
      // Limpiar selección
      setSelectedUserIds([]);
      
    } catch (err) {
      toast.error("Error al actualizar usuarios");
    } finally {
      setIsUpdatingUsers(false);
    }
  };

  // Mostrar formulario para añadir nuevo usuario
  const handleAddNewUser = () => {
    setAddUserModalOpen(true);
    setUserSearchTerm("");
    setUsersToAdd([]);
  };

  // Filtrar usuarios para añadir al cupón (excluyendo los que ya están activos)
  const getAvailableUsers = () => {
    if (!selectedCoupon) return [];
    
    // Obtener IDs de usuarios activos con este cupón
    const activeUserIds = selectedCoupon.usuariosActivos || [];
    
    // Obtener IDs de todos los usuarios con este cupón (activos + suspendidos)
    const allUserIds = selectedCoupon.usuarios || [];
    
    // Obtener IDs de usuarios suspendidos
    const suspendedUserIds = allUserIds.filter(id => !activeUserIds.includes(id));
    
    // Filtrar por término de búsqueda
    return usuarios
      .filter(user => {
        // Incluir usuarios que no tienen el cupón O están suspendidos
        const isNotActive = !activeUserIds.includes(user.id);
        const isSuspended = suspendedUserIds.includes(user.id);
        
        return isNotActive || isSuspended;
      })
      .filter(user => 
        userSearchTerm === "" || 
        (user.nombre_completo && user.nombre_completo.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
        (user.correo && user.correo.toLowerCase().includes(userSearchTerm.toLowerCase()))
      )
      .map(user => {
        // Marcar usuarios suspendidos
        const isSuspended = suspendedUserIds.includes(user.id);
        return {
          ...user,
          estado_cupon: isSuspended ? "suspendido" : null
        };
      });
  };

  // Función para añadir usuarios seleccionados al cupón
  const addUsersToCoupon = async () => {
    if (!selectedCoupon || usersToAdd.length === 0) return;
    
    setIsAddingUsers(true);
    
    try {
      // Verificar primero cuáles usuarios ya están en el cupón (suspendidos)
      const existingRelations = cuponPersonas.filter(cp => 
        cp.id_cupon === selectedCoupon.id && 
        usersToAdd.includes(cp.id_persona as number)
      );
      
      const existingUserIds = existingRelations.map(r => r.id_persona);
      
      // Actualizar relaciones existentes (cambiar de suspendido a activo)
      for (const relation of existingRelations) {
        if (relation.id) {
          const { error: updateError } = await supabase
            .from('cupon_persona')
            .update({ 
              estado: "activo" as const,
              last_updated: new Date().toISOString()
            })
            .eq('id', relation.id);
            
          if (updateError) {
            toast.error("Error al actualizar relación de usuario");
          }
        }
      }
      
      // Filtrar usuarios que no tienen relación existente
      const newUserIds = usersToAdd.filter(id => !existingUserIds.includes(id));
      
      // Crear nuevas relaciones solo para usuarios que no existen
      if (newUserIds.length > 0) {
        const cuponPersonasToAdd = newUserIds.map(userId => ({
          id_cupon: selectedCoupon.id,
          id_persona: userId,
          estado: "activo" as const, // Tipo literal para satisfacer el tipado de Supabase
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }));
        
        // Insertar nuevas relaciones en la base de datos
        const { error } = await supabase
          .from('cupon_persona')
          .insert(cuponPersonasToAdd);
          
        if (error) throw error;
      }
      
      // Registrar en auditoría
      if (userId) {
        await logAddUsersToCoupon(
          userId,
          selectedCoupon.id,
          selectedCoupon.nombre,
          usersToAdd,
          usersToAdd.length
        );
      }
      
      // Si hay usuarios activos, asegurarse de que el cupón esté activo
      if (newUserIds.length > 0 || existingRelations.length > 0) {
        // Verificar estado actual del cupón
        if (selectedCoupon.estado !== "activo") {
          // Activar el cupón
          const { error: couponError } = await supabase
            .from('cupon')
            .update({ estado: "activo" })
            .eq('id', selectedCoupon.id);
            
          if (couponError) throw couponError;
          
          // Registrar en auditoría
          if (userId) {
            await logCouponAutoActivation(
              userId,
              selectedCoupon.id,
              selectedCoupon.nombre,
              "Se añadieron usuarios al cupón"
            );
          }
          
          toast.success("Cupón activado automáticamente");
        }
      }
      
      toast.success(`${usersToAdd.length} usuario(s) añadido(s) al cupón correctamente`);
      
      // Actualizar datos utilizando Realtime
      // No es necesario refetch manual gracias a Realtime, pero se mantiene por seguridad
      refetch();
      
      // Actualizar el cupón seleccionado en el modal con los datos más recientes
      refreshSelectedCoupon();
      
      // Cerrar los modales
      setAddUserModalOpen(false);
      setUserModalOpen(false);  // Cerrar también el modal principal de gestión de usuarios
      setUsersToAdd([]);
      
    } catch (err) {
      toast.error("Error al añadir usuarios al cupón");
    } finally {
      setIsAddingUsers(false);
    }
  };
  
  // Manejar selección de usuario para añadir
  const handleAddUserToggle = (userId: number) => {
    setUsersToAdd(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  
  // Manejar selección de todos los usuarios para añadir
  const handleSelectAllToAdd = (userList: Usuario[]) => {
    if (usersToAdd.length === userList.length) {
      setUsersToAdd([]);
    } else {
      setUsersToAdd(userList.map(user => user.id));
    }
  };

  // Función para ordenar cupones
  const sortCoupons = (coupons: Cupon[], column: string, direction: "asc" | "desc") => {
    return [...coupons].sort((a, b) => {
      // Determinar los valores a comparar
      let valueA, valueB;
      
      // Manejo especial dependiendo de la columna
      switch (column) {
        case "nombre":
          valueA = a.nombre || "";
          valueB = b.nombre || "";
          break;
        case "plataforma":
          valueA = a.plataforma || "";
          valueB = b.plataforma || "";
          break;
        case "codigo":
          valueA = a.codigo || "";
          valueB = b.codigo || "";
          break;
        case "descripcion":
          valueA = a.descripcion || "";
          valueB = b.descripcion || "";
          break;
        case "descuento":
          valueA = parseInt(a.descuento || "0") || 0;
          valueB = parseInt(b.descuento || "0") || 0;
          break;
        case "usuarios":
          valueA = a.usuariosActivos?.length || 0;
          valueB = b.usuariosActivos?.length || 0;
          break;
        case "estado":
          valueA = a.estado || "";
          valueB = b.estado || "";
          break;
        case "created_at":
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        case "last_updated":
          // Manejar valores nulos (sin actualización)
          if (!a.last_updated) return direction === "asc" ? -1 : 1;
          if (!b.last_updated) return direction === "asc" ? 1 : -1;
          
          valueA = new Date(a.last_updated).getTime();
          valueB = new Date(b.last_updated).getTime();
          break;
        default:
          return 0;
      }
      
      // Comparar valores según dirección
      if (valueA < valueB) {
        return direction === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Función para manejar click en encabezado de columna
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Si ya está ordenando por esta columna, cambiar dirección
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Si es una nueva columna, establecerla y resetear dirección
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Componente para mostrar indicador de ordenamiento
  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-1 h-4 w-4" /> : 
      <ArrowDown className="ml-1 h-4 w-4" />;
  };

  // Filtro de cupones basado en el término de búsqueda y plataforma
  const filteredCoupons = useMemo(() => {
    // Primero filtramos por búsqueda y plataforma
    const filtered = cupones.filter(coupon => {
      const matchesSearch = 
        (coupon.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (coupon.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (coupon.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (coupon.plataforma?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (coupon.descuento?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      const matchesPlatform = 
        filterPlatform === "all" || 
        (filterPlatform === "null" && coupon.id_plataforma === null) ||
        (coupon.id_plataforma !== null && coupon.id_plataforma.toString() === filterPlatform);
      
      return matchesSearch && matchesPlatform;
    });
    
    // Luego ordenamos el resultado filtrado
    return sortCoupons(filtered, sortColumn, sortDirection);
  }, [cupones, searchTerm, filterPlatform, sortColumn, sortDirection]);

  // Función para copiar el código al portapapeles
  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Código ${code} copiado al portapapeles`);
  };

  // Función para obtener el color de estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-500 text-white";
      case "suspendido":
        return "bg-amber-500 text-white";
      case "inactivo":
        return "bg-gray-400 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "d MMM yyyy, HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  // Función para formatear valor monetario
  const formatCurrency = (value: string | null) => {
    if (!value) return "0";
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'code'
    }).format(parseInt(value)).replace('COP', '').trim();
  };

  // Obtener solo usuarios activos de un cupón
  const getActiveCouponUsers = (coupon: Cupon) => {
    // Si tenemos la lista de usuarios activos, la usamos directamente
    if (coupon.usuariosActivos) {
      return usuarios.filter(user => coupon.usuariosActivos?.includes(user.id));
    }
    
    // En caso contrario, filtramos manualmente por las relaciones activas
    const activeUserIds = cuponPersonas
      .filter(cp => cp.id_cupon === coupon.id && cp.estado !== "suspendido")
      .map(cp => cp.id_persona)
      .filter(id => id !== null) as number[];
      
    return usuarios.filter(user => activeUserIds.includes(user.id));
  };

  // Obtener iniciales para avatar
  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Calcular estadísticas
  const stats = {
    total: cupones.length,
    activos: cupones.filter(c => c.estado === "activo").length,
    descuentoPromedio: cupones.length ? 
      cupones.reduce((acc, curr) => acc + (parseInt(curr.descuento || "0") || 0), 0) / cupones.length : 
      0,
    // Solo contar usuarios activos para las estadísticas
    totalUsuarios: cupones.reduce((acc, curr) => acc + (curr.usuariosActivos?.length || 0), 0)
  };

  // Efecto para actualizar el cupón seleccionado cuando cambian los datos
  useEffect(() => {
    refreshSelectedCoupon();
  }, [cupones]);

  // Función para desactivar un cupón
  const toggleCouponStatus = async (couponId: number, currentStatus: string | null) => {
    try {
      // Solo permitimos desactivar, no activar manualmente
      if (currentStatus !== "activo") {
        return;
      }
      
      // Encontrar el cupón para obtener su nombre
      const coupon = cupones.find(c => c.id === couponId);
      
      // Primero obtener todas las relaciones de este cupón con usuarios
      const { data: relations, error: relationsError } = await supabase
        .from('cupon_persona')
        .select('id')
        .eq('id_cupon', couponId);
        
      if (relationsError) throw relationsError;
      
      // Actualizar todas las relaciones a "suspendido"
      if (relations && relations.length > 0) {
        const { error: updateError } = await supabase
          .from('cupon_persona')
          .update({ 
            estado: "suspendido",
            last_updated: new Date().toISOString()
          })
          .eq('id_cupon', couponId);
          
        if (updateError) throw updateError;
        
        // Registrar en auditoría
        if (userId && coupon) {
          const userIds = cuponPersonas
            .filter(cp => cp.id_cupon === couponId)
            .map(cp => cp.id_persona)
            .filter(Boolean) as number[];
            
          await logSuspendUsersFromCoupon(
            userId,
            couponId,
            coupon.nombre,
            userIds,
            relations.length
          );
        }
        
        toast.success(`${relations.length} usuario(s) suspendidos correctamente`);
      }
      
      // Actualizar el estado del cupón a inactivo
      const { error } = await supabase
        .from('cupon')
        .update({ 
          estado: "inactivo",
          last_updated: new Date().toISOString()
        })
        .eq('id', couponId);
        
      if (error) throw error;
      
      // Registrar en auditoría
      if (userId && coupon) {
        await logCouponStatusChange(
          userId,
          couponId,
          coupon.nombre,
          currentStatus,
          "inactivo"
        );
      }
      
      toast.success("Cupón desactivado correctamente");
      
      // Con Realtime, se actualizará automáticamente, pero mantenemos el refetch por seguridad
      refetch();
      
    } catch (err) {
      toast.error("Error al desactivar el cupón");
    }
  };

  // Actualizar cupón en la base de datos
  const updateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCoupon) return;
    
    setIsEditing(true);
    
    try {
      // Encontrar el cupón para obtener información existente
      const coupon = cupones.find(c => c.id === selectedCoupon.id);
      
      // Determinar qué campos se están actualizando
      const updatedFields: string[] = [];
      
      if (editFormData.nombre !== coupon?.nombre) updatedFields.push('nombre');
      if (editFormData.descripcion !== coupon?.descripcion) updatedFields.push('descripcion');
      if (editFormData.codigo !== coupon?.codigo) updatedFields.push('codigo');
      if (editFormData.descuento !== coupon?.descuento) updatedFields.push('descuento');
      
      const { error } = await supabase
        .from('cupon')
        .update({
          nombre: editFormData.nombre || null,
          descripcion: editFormData.descripcion || null,
          codigo: editFormData.codigo || null,
          descuento: editFormData.descuento || null,
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedCoupon.id);
        
      if (error) throw error;
      
      // Registrar en auditoría
      if (userId) {
        await logCouponUpdate(
          userId,
          selectedCoupon.id,
          editFormData.nombre,
          updatedFields
        );
      }
      
      toast.success("Cupón actualizado correctamente");
      
      // Con Realtime, se actualizará automáticamente, pero mantenemos el refetch por seguridad
      refetch();
      
      // Cerrar modal
      setEditModalOpen(false);
      
    } catch (err) {
      toast.error("Error al actualizar el cupón");
    } finally {
      setIsEditing(false);
    }
  };

  // Crear nuevo cupón en la base de datos
  const createNewCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreating(true);
    
    try {
      // Validaciones básicas
      if (!newCouponFormData.nombre.trim()) {
        toast.error("El nombre del cupón es obligatorio");
        setIsCreating(false);
        return;
      }
      
      const newCoupon = {
        nombre: newCouponFormData.nombre.trim(),
        descripcion: newCouponFormData.descripcion.trim() || null,
        codigo: newCouponFormData.codigo.trim() || null,
        descuento: newCouponFormData.descuento.trim() || null,
        id_plataforma: newCouponFormData.id_plataforma ? parseInt(newCouponFormData.id_plataforma) : null,
        estado: "inactivo" as const, // Por defecto inactivo hasta que se añadan usuarios
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('cupon')
        .insert(newCoupon)
        .select()
        .single();
        
      if (error) throw error;
      
      // Registrar en auditoría
      if (userId && data) {
        let platformName = null;
        
        if (data.id_plataforma) {
          const platform = plataformas.find(p => p.id === data.id_plataforma);
          platformName = platform?.nombre || null;
        }
        
        await logCouponCreation(
          userId, 
          data.id, 
          data.nombre, 
          data.codigo,
          platformName
        );
      }
      
      toast.success("Cupón creado correctamente");
      
      // Con Realtime, se actualizará automáticamente, pero mantenemos el refetch por seguridad
      refetch();
      
      // Cerrar modal
      setNewCouponModalOpen(false);
      
    } catch (err) {
      toast.error("Error al crear el cupón");
    } finally {
      setIsCreating(false);
    }
  };

  // Abrir el modal de edición de cupón
  const openEditModal = (coupon: Cupon) => {
    setSelectedCoupon(coupon);
    setEditFormData({
      nombre: coupon.nombre || "",
      descripcion: coupon.descripcion || "",
      codigo: coupon.codigo || "",
      descuento: coupon.descuento || ""
    });
    setEditModalOpen(true);
  };

  // Manejar cambios en el formulario de edición
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Abrir modal para crear nuevo cupón
  const openNewCouponModal = () => {
    setNewCouponFormData({
      nombre: "",
      descripcion: "",
      codigo: "",
      descuento: "",
      id_plataforma: ""
    });
    setNewCouponModalOpen(true);
  };

  // Manejar cambios en el formulario de nuevo cupón
  const handleNewCouponFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCouponFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambio de plataforma
  const handlePlatformChange = (platformId: string) => {
    setNewCouponFormData(prev => ({
      ...prev,
      id_plataforma: platformId === "null" ? "" : platformId
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Cupones</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? "Ocultar estadísticas" : "Mostrar estadísticas"}
          </Button>
        </div>

        {/* Estadísticas de cupones */}
        {showStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Total de cupones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Cupones activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.activos}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total ? ((stats.activos / stats.total) * 100).toFixed(0) : 0}% del total
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Descuento promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                  {formatCurrency(stats.descuentoPromedio.toString())}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Total de usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalUsuarios}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cupones..."
              className="pl-8 border-nytrix-purple/20 bg-background w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-[180px] border-nytrix-purple/20 bg-background">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent className="bg-card border-nytrix-purple/20">
              <SelectItem value="all">Todas las plataformas</SelectItem>
              <SelectItem value="null">Sin plataforma específica</SelectItem>
              {plataformas.map((platform) => (
                <SelectItem key={platform.id} value={platform.id.toString()}>
                  {platform.nombre || "Sin nombre"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            className="bg-gradient-nytrix hover:opacity-90"
            onClick={openNewCouponModal}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cupón
          </Button>
        </div>
        
        <div className="border border-nytrix-purple/20 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-card">
                <TableHead onClick={() => handleSort("nombre")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Nombre
                    <SortIndicator column="nombre" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("plataforma")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Plataforma
                    <SortIndicator column="plataforma" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("codigo")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Código
                    <SortIndicator column="codigo" />
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:text-nytrix-purple" onClick={() => handleSort("descripcion")}>
                  <div className="flex items-center">
                    Descripción
                    <SortIndicator column="descripcion" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("descuento")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Descuento
                    <SortIndicator column="descuento" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("usuarios")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Usuarios
                    <SortIndicator column="usuarios" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("estado")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Estado
                    <SortIndicator column="estado" />
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:text-nytrix-purple" onClick={() => handleSort("created_at")}>
                  <div className="flex items-center">
                    Creado
                    <SortIndicator column="created_at" />
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:text-nytrix-purple" onClick={() => handleSort("last_updated")}>
                  <div className="flex items-center">
                    Actualizado
                    <SortIndicator column="last_updated" />
                  </div>
                </TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 mb-2 animate-spin text-nytrix-purple" />
                      <p className="text-muted-foreground">Cargando cupones...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-8 w-8 mb-2 text-destructive" />
                      <p className="text-destructive">Error al cargar los cupones</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => refetch()}
                      >
                        Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCoupons.length > 0 ? (
                filteredCoupons.map((coupon) => {
                  // Solo mostrar usuarios activos en la interfaz
                  const activeUsers = getActiveCouponUsers(coupon);
                  const displayUsers = activeUsers.slice(0, 3);
                  const remainingUsers = activeUsers.length - displayUsers.length;
                  
                  return (
                    <TableRow key={coupon.id} className="group">
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Ticket className="h-4 w-4 mr-2 text-nytrix-purple" />
                          {coupon.nombre || "Sin nombre"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {coupon.id_plataforma ? (
                            <>
                              <BarChart className="h-4 w-4 mr-1 text-nytrix-purple" />
                              {coupon.plataforma || "Desconocida"}
                            </>
                          ) : (
                            <span className="text-muted-foreground">Todas</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                            {coupon.codigo || "---"}
                          </code>
                          {coupon.codigo && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6" 
                              onClick={() => copyCouponCode(coupon.codigo || "")}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[250px] truncate">
                        {coupon.descripcion || "Sin descripción"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          {formatCurrency(coupon.descuento)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeUsers.length > 0 ? (
                          <div 
                            className="flex items-center cursor-pointer hover:opacity-80"
                            onClick={() => openUserModal(coupon)}
                          >
                            <div className="flex -space-x-2">
                              {displayUsers.map((user) => (
                                <Avatar key={user.id} className="h-7 w-7 border-2 border-background">
                                  <AvatarFallback className="bg-nytrix-purple text-white text-xs">
                                    {getInitials(user.nombre_completo)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            {remainingUsers > 0 && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                +{remainingUsers} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="flex items-center text-muted-foreground cursor-pointer hover:text-nytrix-purple"
                            onClick={() => openUserModal(coupon)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            <span className="text-xs">Sin usuarios</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(coupon.estado || "inactivo")}>
                          {coupon.estado === "activo" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(coupon.created_at)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {coupon.last_updated ? formatDate(coupon.last_updated) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => openUserModal(coupon)}
                              className="cursor-pointer"
                            >
                              <Users className="mr-2 h-4 w-4" />
                              <span>Gestionar usuarios</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => openEditModal(coupon)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Editar cupón</span>
                            </DropdownMenuItem>
                            
                            {coupon.estado === "activo" && (
                              <DropdownMenuItem 
                                onClick={() => toggleCouponStatus(coupon.id, coupon.estado)}
                                className="cursor-pointer"
                              >
                                <ToggleLeft className="mr-2 h-4 w-4" />
                                <span>Desactivar</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No se encontraron cupones que coincidan con tu búsqueda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de usuarios del cupón */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-[650px] bg-[#1a192d] border-0 text-white p-0">
          <div className="p-6 pb-4">
            <div className="flex justify-between items-center mb-4">
              <DialogTitle className="text-white">
                Usuarios con el cupón {selectedCoupon?.nombre}
              </DialogTitle>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <Checkbox 
                id="selectAll" 
                checked={selectedUserIds.length > 0 && selectedCoupon?.usuarios 
                  ? selectedUserIds.length === getActiveCouponUsers(selectedCoupon).length
                  : false
                }
                onCheckedChange={() => {
                  if (selectedCoupon) {
                    handleSelectAllUsers(getActiveCouponUsers(selectedCoupon));
                  }
                }}
                className="border-white/50 data-[state=checked]:bg-nytrix-purple data-[state=checked]:border-nytrix-purple"
              />
              <Label htmlFor="selectAll" className="text-white">Seleccionar todos</Label>
              
              <div className="ml-auto flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-orange-500/40 bg-transparent text-orange-500 hover:bg-orange-900/20 hover:text-orange-400"
                  disabled={selectedUserIds.length === 0 || isUpdatingUsers}
                  onClick={() => updateSelectedUsersStatus("suspendido")}
                >
                  Suspender
                </Button>
              </div>
            </div>
            
            {selectedCoupon && (
              <ScrollArea className="max-h-64 pr-4 -mr-4 pb-4">
                {isUpdatingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-nytrix-purple" />
                    <span className="ml-2 text-white">Actualizando usuarios...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getActiveCouponUsers(selectedCoupon).map(user => (
                      <div 
                        key={user.id} 
                        className="flex items-center gap-3 p-3 rounded-md bg-[#252440]"
                      >
                        <Checkbox 
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={() => handleUserCheckToggle(user.id)}
                          className="border-white/50 data-[state=checked]:bg-nytrix-purple data-[state=checked]:border-nytrix-purple"
                        />
                        
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[#8878ff] text-white">
                            {getInitials(user.nombre_completo)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex flex-col">
                            <span className="font-medium">{user.nombre_completo || "Usuario sin nombre"}</span>
                            <span className="text-xs text-gray-400">{user.correo || "Sin correo"}</span>
                          </div>
                        </div>
                        
                        {user.estado_cupon === "suspendido" && (
                          <Badge className="bg-orange-500 text-white border-0 px-3 py-1">
                            Suspendido
                          </Badge>
                        )}
                      </div>
                    ))}
                    
                    {getActiveCouponUsers(selectedCoupon).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No hay usuarios activos asignados a este cupón</p>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
          
          <div className="flex justify-start items-center px-6 py-4 bg-[#252440]">
            <Button 
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={handleAddNewUser}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Añadir usuario
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para añadir usuarios */}
      <Dialog open={addUserModalOpen} onOpenChange={setAddUserModalOpen}>
        <DialogContent className="sm:max-w-[650px] bg-[#1a192d] border-0 text-white p-0">
          <div className="p-6 pb-4">
            <div className="flex justify-between items-center mb-4">
              <DialogTitle className="text-white">
                Añadir usuarios al cupón {selectedCoupon?.nombre}
              </DialogTitle>
            </div>
            
            {/* Buscador de usuarios */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar usuarios por nombre o correo..."
                  className="pl-8 border-white/20 bg-[#252440] text-white w-full"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {/* Lista de usuarios disponibles */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox 
                  id="selectAllToAdd" 
                  checked={usersToAdd.length > 0 ? 
                    usersToAdd.length === getAvailableUsers().length : false
                  }
                  onCheckedChange={() => handleSelectAllToAdd(getAvailableUsers())}
                  className="border-white/50 data-[state=checked]:bg-nytrix-purple data-[state=checked]:border-nytrix-purple"
                />
                <Label htmlFor="selectAllToAdd" className="text-white">Seleccionar todos</Label>
                
                <span className="ml-auto text-sm text-gray-400">
                  {usersToAdd.length} usuario(s) seleccionado(s)
                </span>
              </div>
              
              <ScrollArea className="max-h-64 pr-4 -mr-4 pb-4">
                {isAddingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-nytrix-purple" />
                    <span className="ml-2 text-white">Añadiendo usuarios...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getAvailableUsers().length > 0 ? (
                      getAvailableUsers().map(user => (
                        <div 
                          key={user.id} 
                          className="flex items-center gap-3 p-3 rounded-md bg-[#252440]"
                        >
                          <Checkbox 
                            checked={usersToAdd.includes(user.id)}
                            onCheckedChange={() => handleAddUserToggle(user.id)}
                            className="border-white/50 data-[state=checked]:bg-nytrix-purple data-[state=checked]:border-nytrix-purple"
                          />
                          
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[#8878ff] text-white">
                              {getInitials(user.nombre_completo)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex flex-col">
                              <span className="font-medium">{user.nombre_completo || "Usuario sin nombre"}</span>
                              <span className="text-xs text-gray-400">{user.correo || "Sin correo"}</span>
                            </div>
                          </div>
                          
                          {user.estado_cupon === "suspendido" && (
                            <Badge className="bg-orange-500 text-white border-0 px-3 py-1">
                              Suspendido
                            </Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No se encontraron usuarios disponibles</p>
                        {userSearchTerm && (
                          <p className="text-sm mt-2">Intenta con otro término de búsqueda</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          
          <div className="flex justify-end items-center px-6 py-4 bg-[#252440]">
            <Button 
              variant="secondary"
              className="bg-[#8878ff] hover:bg-[#7b6be0] text-white border-0"
              disabled={usersToAdd.length === 0 || isAddingUsers}
              onClick={addUsersToCoupon}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Añadir seleccionados
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para editar cupón */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a192d] border-0 text-white p-0">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <DialogTitle className="text-white text-xl">
                Editar cupón
              </DialogTitle>
            </div>
            
            <form onSubmit={updateCoupon}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-white">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Nombre del cupón"
                    value={editFormData.nombre}
                    onChange={handleEditFormChange}
                    className="border-white/20 bg-[#252440] text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="codigo" className="text-white">Código</Label>
                  <Input
                    id="codigo"
                    name="codigo"
                    placeholder="Código del cupón"
                    value={editFormData.codigo}
                    onChange={handleEditFormChange}
                    className="border-white/20 bg-[#252440] text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descuento" className="text-white">Descuento</Label>
                  <Input
                    id="descuento"
                    name="descuento"
                    placeholder="Valor del descuento"
                    value={editFormData.descuento}
                    onChange={handleEditFormChange}
                    className="border-white/20 bg-[#252440] text-white"
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-white">Descripción</Label>
                  <Input
                    id="descripcion"
                    name="descripcion"
                    placeholder="Descripción del cupón"
                    value={editFormData.descripcion}
                    onChange={handleEditFormChange}
                    className="border-white/20 bg-[#252440] text-white"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button 
                  type="submit"
                  className="bg-[#8878ff] hover:bg-[#7b6be0] text-white border-0"
                  disabled={isEditing}
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar cambios"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para nuevo cupón */}
      <Dialog open={newCouponModalOpen} onOpenChange={setNewCouponModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#1a192d] border-0 text-white p-0">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <DialogTitle className="text-white text-xl">
                Crear nuevo cupón
              </DialogTitle>
            </div>
            
            <form onSubmit={createNewCoupon}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-white">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    placeholder="Nombre del cupón"
                    value={newCouponFormData.nombre}
                    onChange={handleNewCouponFormChange}
                    className="border-white/20 bg-[#252440] text-white"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="id_plataforma" className="text-white">Plataforma</Label>
                  <Select value={newCouponFormData.id_plataforma} onValueChange={handlePlatformChange}>
                    <SelectTrigger className="border-white/20 bg-[#252440] text-white">
                      <SelectValue placeholder="Selecciona una plataforma" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#252440] border-white/20 text-white">
                      <SelectItem value="null">Todas las plataformas</SelectItem>
                      {plataformas.map((platform) => (
                        <SelectItem key={platform.id} value={platform.id.toString()}>
                          {platform.nombre || "Sin nombre"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="codigo" className="text-white">Código</Label>
                  <Input
                    id="codigo"
                    name="codigo"
                    placeholder="Código del cupón"
                    value={newCouponFormData.codigo}
                    onChange={handleNewCouponFormChange}
                    className="border-white/20 bg-[#252440] text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descuento" className="text-white">Descuento</Label>
                  <Input
                    id="descuento"
                    name="descuento"
                    placeholder="Valor del descuento"
                    value={newCouponFormData.descuento}
                    onChange={handleNewCouponFormChange}
                    className="border-white/20 bg-[#252440] text-white"
                    type="number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-white">Descripción</Label>
                  <Input
                    id="descripcion"
                    name="descripcion"
                    placeholder="Descripción del cupón"
                    value={newCouponFormData.descripcion}
                    onChange={handleNewCouponFormChange}
                    className="border-white/20 bg-[#252440] text-white"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-2">
                <Button 
                  type="button"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10"
                  onClick={() => setNewCouponModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-[#8878ff] hover:bg-[#7b6be0] text-white border-0"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear cupón"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 