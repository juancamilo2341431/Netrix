import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CalendarIcon, CreditCard, CheckCircle, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { Tables, Enums } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext/CartContext";
import { CartItem, RentalOptionType as CartRentalOptionType, RentInfo as CartRentInfo } from "@/contexts/CartContext/types";
import { formatCurrencyCOP } from "@/utils/numberFormatting";
import { Separator } from "@/components/ui/separator";

// Tipos de duración para la renta
const RENTAL_DURATIONS = [
  { value: "1m", label: "1 mes", days: 30 },
  { value: "2m", label: "2 meses", days: 60 },
  { value: "3m", label: "3 meses", days: 90 },
  { value: "6m", label: "6 meses", days: 180 },
  { value: "12m", label: "12 meses", days: 360 },
];

const CUSTOM_DAYS_OPTION = { value: "custom", label: "Días personalizados", days: 10 };

// Interfaces para los datos
interface RentModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformId: number | null;
}

interface Platform {
  id: number;
  nombre: string | null;
  precio: string | null;
  imagen: string | null;
}

interface CouponType {
  id: number;
  codigo: string;
  descuento: string;
  nombre: string;
  cuponPersonaId?: number;
}

export function RentModal({ isOpen, onClose, platformId }: RentModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [duration, setDuration] = useState<string>("1m");
  const [customDays, setCustomDays] = useState<number>(10);
  const [availableAccounts, setAvailableAccounts] = useState<number>(0);
  const [availableAccountIds, setAvailableAccountIds] = useState<number[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [userCoupons, setUserCoupons] = useState<CouponType[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>("none");
  const [step, setStep] = useState<number>(1);
  const [rentInfo, setRentInfo] = useState({
    basePrice: 0,
    discount: 0,
    subtotal: 0,
    total: 0,
    quantity: 1,
    couponId: 0,
    cuponPersonaId: 0,
    startDate: new Date(),
    endDate: new Date(),
    accountId: 0
  });
  const initialRentInfoState = {
    basePrice: 0,
    discount: 0,
    subtotal: 0,
    total: 0,
    quantity: 1,
    couponId: 0,
    cuponPersonaId: 0,
    startDate: new Date(),
    endDate: new Date(),
    accountId: 0
  };
  
  // Cargar datos iniciales de la plataforma y cupones del usuario
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setDuration("1m");
      setCustomDays(10);
      setSelectedCoupon("none");
      setQuantity(1);
      setRentInfo(initialRentInfoState); 
      setPlatform(null);
      setUserCoupons([]);
      setAvailableAccounts(0);
      setAvailableAccountIds([]);
      return;
    }

    if (!platformId) return;
    
    setLoading(true);
    setStep(1);
    setDuration("1m");
    setCustomDays(10);
    setSelectedCoupon("none");
    setQuantity(1);
    setRentInfo(initialRentInfoState); 
    setPlatform(null); 
    setUserCoupons([]); 
    setAvailableAccounts(0);
    setAvailableAccountIds([]);

    const fetchPlatformData = async () => {
      try {
        const { data: platformData, error: platformError } = await supabase
          .from('plataforma')
          .select('*')
          .eq('id', platformId)
          .single();
          
        if (platformError) throw platformError;
        setPlatform(platformData as Platform);
        
        const { data: accountsData, error: accountsError } = await supabase
          .from('cuenta')
          .select('id')
          .eq('id_plataforma', platformId)
          .eq('estado', 'disponible');
          
        if (accountsError) throw accountsError;

        const fetchedAvailableAccountIds = accountsData ? accountsData.map(acc => acc.id) : [];
        setAvailableAccountIds(fetchedAvailableAccountIds);
        setAvailableAccounts(fetchedAvailableAccountIds.length);
        setQuantity(fetchedAvailableAccountIds.length > 0 ? 1 : 0);
        
        if (user) {
          const { data: personaData, error: personaError } = await supabase
            .from('persona')
            .select('id')
            .eq('id_user', user.id)
            .single();
            
          if (personaError) throw personaError;
          if (personaData) { 
            const { data: cuponsData, error: cuponsError } = await supabase
              .from('cupon_persona')
              .select(`
                id,
                cupon (
                  id,
                  codigo,
                  descuento,
                  nombre,
                  id_plataforma
                )
              `)
              .eq('id_persona', personaData.id)
              .eq('estado', 'activo');
              
            if (cuponsError) throw cuponsError;
            
            const validCoupons = cuponsData
              .filter(cp => cp.cupon && (cp.cupon.id_plataforma === platformId || cp.cupon.id_plataforma === null))
              .map(cp => ({
                id: cp.cupon!.id, 
                codigo: cp.cupon!.codigo,
                descuento: cp.cupon!.descuento,
                nombre: cp.cupon!.nombre,
                cuponPersonaId: cp.id
              }));
              
            setUserCoupons(validCoupons as any);
          }
        }
        
      } catch (error) {
        console.error("Error fetching platform data:", error);
        toast.error("No se pudo cargar la información de la plataforma");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlatformData();
  }, [platformId, isOpen, user]);

  useEffect(() => {
    if (!loading && platform && platform.precio) {
      updateRentInfo(platform.precio, duration, selectedCoupon, quantity);
    }
  }, [platform, duration, customDays, selectedCoupon, quantity, loading]);
  
  const getDaysForDuration = (durationOrDays: string | number): number => {
    if (typeof durationOrDays === 'number') {
      return durationOrDays;
    }
    if (durationOrDays === "custom") {
      return customDays; 
    }
    const selectedDuration = RENTAL_DURATIONS.find(d => d.value === durationOrDays);
    return selectedDuration ? selectedDuration.days : 30;
  };
  
  const getPriceForCustomDays = (basePrice: number, days: number): number => {
    const pricePerDay = basePrice / 30;
    return pricePerDay * days;
  };
  
  const getMonthsForDuration = (durationValue: string): number => {
    if (durationValue === "custom") {
      return 0;
    }
    const months = parseInt(durationValue.replace('m', ''));
    return isNaN(months) ? 1 : months;
  };

  const updateRentInfo = (basePriceStr: string, currentDuration: string, currentCouponCode: string, currentQuantity: number) => {
    const basePrice = parseFloat(basePriceStr);
    let subtotal = 0;
    let days = 0;

    if (currentDuration === "custom") {
      days = Math.max(10, customDays);
      subtotal = getPriceForCustomDays(basePrice, days);
    } else {
      const months = getMonthsForDuration(currentDuration);
      days = getDaysForDuration(currentDuration);
      subtotal = basePrice * months;
    }
    
    const finalQuantity = availableAccounts > 0 ? Math.max(1, currentQuantity) : 0;
    subtotal = subtotal * finalQuantity;

    let discount = 0;
    let couponId = 0;
    let cuponPersonaId = 0;
    const selectedCouponData = userCoupons.find(c => c.id.toString() === currentCouponCode);

    if (selectedCouponData && currentDuration !== "custom") {
      discount = parseFloat(selectedCouponData.descuento || "0");
      couponId = selectedCouponData.id;
      cuponPersonaId = selectedCouponData.cuponPersonaId || 0;
    }

    const total = Math.max(0, subtotal - discount);
    const startDate = new Date();
    const endDate = addDays(startDate, days);

    setRentInfo({
      basePrice,
      subtotal,
      discount,
      total,
      quantity: finalQuantity,
      couponId,
      cuponPersonaId,
      startDate,
      endDate,
      accountId: 0
    });
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    if (value === "custom") {
      setSelectedCoupon("none");
    } else {
      setCustomDays(10);
    }
  };
  
  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = Math.max(10, parseInt(e.target.value) || 10);
    setCustomDays(days);
  };
  
  const handleCouponChange = (value: string) => {
    if (duration === "custom") return;
    setSelectedCoupon(value);
  };
  
  const handleQuantityChange = (increment: number) => {
    setQuantity(prevQuantity => {
      const newQuantity = prevQuantity + increment;
      const minQuantity = availableAccounts > 0 ? 1 : 0;
      return Math.max(minQuantity, Math.min(newQuantity, availableAccounts));
    });
  };
  
  const handleNextStep = async () => {
    if (step === 1) {
      if (quantity <= 0 && availableAccounts > 0) {
         toast.error("Selecciona al menos 1 cuenta.");
         return;
      }
      if (availableAccountIds.length < quantity) {
        toast.error("No hay suficientes cuentas individuales disponibles en stock.");
        return;
      }
      if (rentInfo.quantity !== quantity && quantity > 0) {
        console.warn("Sincronizando rentInfo.quantity con el estado quantity antes de añadir al carrito.");
        setRentInfo(prev => ({...prev, quantity: quantity}));
      }
      setStep(2);
    } else if (step === 2) {
      handleAddToCart(quantity, availableAccountIds);
    }
  };
  
  const handleAddToCart = (selectedQuantity: number, accountIds: number[]) => {
    if (!platform || !rentInfo || (rentInfo.total <= 0 && selectedQuantity > 0)) {
      toast.error("Información de renta inválida o total es cero.");
      return;
    }

    if (accountIds.length < selectedQuantity) {
      toast.error("No hay suficientes IDs de cuenta para la cantidad seleccionada.");
      return;
    }

    const pricePerAccountAfterDiscount = rentInfo.quantity > 0 ? rentInfo.total / rentInfo.quantity : 0;
    if (pricePerAccountAfterDiscount <= 0 && selectedQuantity > 0) {
        toast.error("El precio calculado por cuenta es cero o negativo.");
        return;
    }

    const baseCartRentInfo: Omit<CartRentInfo, 'totalPriceForItem'> = {
      basePrice: rentInfo.basePrice,
      subtotalBeforeDiscount: rentInfo.quantity > 0 ? rentInfo.subtotal / rentInfo.quantity : 0,
      discountApplied: rentInfo.quantity > 0 ? rentInfo.discount / rentInfo.quantity : 0,
      pricePerAccountAfterDiscount: pricePerAccountAfterDiscount,
      durationLabel: getDurationLabel(),
      days: getDaysForDuration(duration === "custom" ? customDays : duration),
    };

    for (let i = 0; i < selectedQuantity; i++) {
      const accountIdForThisItem = accountIds[i];

      const cartRentInfoForItem: CartRentInfo = {
        ...baseCartRentInfo,
        totalPriceForItem: pricePerAccountAfterDiscount,
      };
      
      const itemToAdd: Omit<CartItem, 'id'> = {
        platform: platform as any,
        id_cuenta: accountIdForThisItem,
        quantity: 1,
        duration: duration as CartRentalOptionType,
        customDays: duration === "custom" ? customDays : undefined,
        selectedCouponId: rentInfo.couponId !== 0 ? rentInfo.couponId : "none",
        rentInfo: cartRentInfoForItem,
      };
      addToCart(itemToAdd);
    }

    toast.success(`${selectedQuantity} ${selectedQuantity === 1 ? 'cuenta' : 'cuentas'} de ${platform.nombre} añadidas al carrito.`);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const getDurationLabel = (): string => {
    if (duration === 'custom') {
      return `${customDays} día${customDays > 1 ? 's' : ''}`;
    }
    const selected = RENTAL_DURATIONS.find(d => d.value === duration);
    return selected ? selected.label : "";
  };

  // Render Step 1: Selección de opciones
  const renderStep1 = () => (
    <>
      <DialogHeader className="mb-3 sm:mb-4">
        <DialogTitle className="text-base sm:text-lg">Rentar {platform?.nombre}</DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">
          Selecciona la duración de tu renta y aplica un cupón si lo tienes.
        </DialogDescription>
      </DialogHeader>
      
      <div className="overflow-y-auto max-h-[65vh] pr-3 sm:pr-4 space-y-3 sm:space-y-4 md:space-y-6 py-3 sm:py-4 custom-sidebar-scroll">
        <div>
          <Label className="text-sm sm:text-base font-medium mb-1 sm:mb-2 block">Periodo de renta</Label>
          <RadioGroup value={duration} onValueChange={handleDurationChange} className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {RENTAL_DURATIONS.map((d) => (
              <Label 
                key={d.value} 
                htmlFor={`duration-${d.value}`} 
                className={`flex items-center space-x-2 border rounded-md p-2 sm:p-3 cursor-pointer transition-colors 
                            ${duration === d.value ? 'border-nytrix-purple bg-nytrix-purple/10' : 'border-border hover:bg-muted/50'}`}
              >
                <RadioGroupItem value={d.value} id={`duration-${d.value}`} />
                <span className="text-xs sm:text-sm">{d.label}</span>
              </Label>
            ))}
            <Label 
              htmlFor={`duration-${CUSTOM_DAYS_OPTION.value}`} 
              className={`flex items-center space-x-2 border rounded-md p-2 sm:p-3 cursor-pointer transition-colors col-span-1 sm:col-span-2 
                          ${duration === CUSTOM_DAYS_OPTION.value ? 'border-nytrix-purple bg-nytrix-purple/10' : 'border-border hover:bg-muted/50'}`}
            >
              <RadioGroupItem value={CUSTOM_DAYS_OPTION.value} id={`duration-${CUSTOM_DAYS_OPTION.value}`} />
              <span className="flex-1 text-xs sm:text-sm">{CUSTOM_DAYS_OPTION.label}</span>
              {duration === CUSTOM_DAYS_OPTION.value && (
                <Input 
                  type="number" 
                  value={customDays} 
                  onChange={handleCustomDaysChange} 
                  min={10} 
                  className="w-16 h-8 sm:w-20 sm:h-9 bg-background text-center text-xs sm:text-sm"
                  onClick={(e) => e.stopPropagation()} 
                />
              )}
            </Label>
          </RadioGroup>
        </div>

        <div>
          <Label htmlFor="quantity" className="text-sm sm:text-base font-medium mb-1 sm:mb-2 block">
            Cantidad de Cuentas (Máx: {availableAccounts})
          </Label>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              onClick={() => handleQuantityChange(-1)} 
              disabled={quantity <= (availableAccounts > 0 ? 1 : 0) || availableAccounts <= 0}
            >
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Input 
              id="quantity" 
              type="number" 
              readOnly 
              value={quantity}
              className="w-12 h-8 sm:w-16 sm:h-9 text-center bg-muted border-border flex-shrink-0 text-xs sm:text-sm"
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
              onClick={() => handleQuantityChange(1)} 
              disabled={quantity >= availableAccounts || availableAccounts <= 0}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
          {availableAccounts === 0 && (
            <p className="text-xs sm:text-sm text-destructive mt-1 sm:mt-2">No hay cuentas disponibles.</p>
          )}
        </div>

        {user && duration !== 'custom' && (
          <div>
            <Label htmlFor="coupon" className="text-sm sm:text-base font-medium mb-1 sm:mb-2 block">Cupón de Descuento</Label>
            <Select value={selectedCoupon} onValueChange={handleCouponChange} disabled={duration === 'custom'}>
              <SelectTrigger id="coupon" className="text-xs sm:text-sm">
                <SelectValue placeholder="Selecciona un cupón" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs sm:text-sm">Sin cupón</SelectItem>
                {userCoupons.length > 0 ? (
                  userCoupons.map(coupon => (
                    <SelectItem key={coupon.id} value={coupon.id.toString()} className="text-xs sm:text-sm">
                      {coupon.nombre} ({coupon.codigo}) - ${formatCurrencyCOP(parseFloat(coupon.descuento || "0"))}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-xs sm:text-sm text-muted-foreground">No tienes cupones disponibles para esta plataforma.</div>
                )}
              </SelectContent>
            </Select>
            {duration === 'custom' && (
              <p className="text-xs text-muted-foreground mt-1">Los cupones no aplican para días personalizados.</p>
            )}
          </div>
        )}
        
        <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
          <h4 className="text-sm sm:text-base font-medium mb-2 sm:mb-3">Resumen de precios</h4>
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-foreground/80">Precio base:</span>
              <span>${formatCurrencyCOP(rentInfo.basePrice)}/mes por cuenta</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/80">Cantidad:</span>
              <span>{rentInfo.quantity} cuenta(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/80">Duración:</span>
              <span>{getDurationLabel()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/80">Subtotal ({rentInfo.quantity} cuenta(s)):</span>
              <span>${formatCurrencyCOP(rentInfo.subtotal)}</span>
            </div>
            {rentInfo.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="text-foreground/80">Descuento:</span>
                <span>-${formatCurrencyCOP(rentInfo.discount)}</span>
              </div>
            )}
            <Separator className="my-1 sm:my-2" />
            <div className="flex justify-between font-semibold text-sm sm:text-base">
              <span>Total a pagar:</span>
              <span>${formatCurrencyCOP(rentInfo.total)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={handleClose} className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">Cancelar</Button>
        <Button 
          onClick={handleNextStep} 
          disabled={loading || (quantity <= 0 && availableAccounts > 0) || availableAccounts <= 0}
          className="bg-gradient-nytrix hover:opacity-90 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
        >
          Continuar
        </Button>
      </DialogFooter>
    </>
  );

  // Renderizar el paso 2: Confirmación
  const renderStep2 = () => (
    <>
      <DialogHeader className="mb-3 sm:mb-4">
        <DialogTitle className="text-base sm:text-lg">Revisar y Añadir al Carrito</DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">
          Revisa los detalles de tu selección antes de añadirla al carrito.
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-3 sm:py-4 space-y-3 sm:space-y-4">
        <div className="bg-muted/50 p-3 sm:p-4 rounded-md space-y-2 sm:space-y-3">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {platform?.imagen && (
              <img 
                src={platform.imagen} 
                alt={platform.nombre || ""} 
                className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-md"
              />
            )}
            <div>
              <h3 className="font-semibold text-sm sm:text-base">{platform?.nombre}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Suscripción Premium
              </p>
            </div>
          </div>
          
          <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3 space-y-1 sm:space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cantidad:</span>
              <span>{rentInfo.quantity} cuenta(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duración:</span>
              <span>{getDurationLabel()}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Válido hasta:</span>
              <span>{format(rentInfo.endDate, "dd 'de' MMMM yyyy", { locale: es })}</span>
            </div>
            {rentInfo.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="text-muted-foreground">Descuento Aplicado:</span>
                <span>-${formatCurrencyCOP(rentInfo.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-1.5 sm:pt-2 mt-1.5 sm:mt-2 text-sm sm:text-base">
              <span>Total a pagar:</span>
              <span>${formatCurrencyCOP(rentInfo.total)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 p-2 sm:p-3 rounded-md text-yellow-800 text-xs sm:text-sm">
          <p className="font-medium">Recuerda que:</p>
          <ul className="list-disc pl-4 sm:pl-5 mt-1 space-y-0.5 sm:space-y-1">
            <li>Las credenciales se añadirán a tu dashboard una vez procesado el pago.</li>
            <li>Podrás encontrar tus cuentas activas en tu perfil de usuario.</li>
            <li>No compartir las credenciales con terceros.</li>
          </ul>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={() => setStep(1)} disabled={loading} className="text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
          Atrás
        </Button>
        <Button 
          onClick={handleNextStep}
          disabled={loading}
          className="bg-gradient-nytrix hover:opacity-90 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Añadir al Carrito
        </Button>
      </DialogFooter>
    </>
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-nytrix-purple" />
          </div>
        )}
        {step === 1 ? renderStep1() : renderStep2()}
      </DialogContent>
    </Dialog>
  );
} 