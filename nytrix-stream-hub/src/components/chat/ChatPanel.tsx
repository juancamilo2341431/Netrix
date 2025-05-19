import { X } from 'lucide-react';

type ChatPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-80 h-96 bg-card border border-nytrix-purple/30 rounded-lg shadow-xl flex flex-col z-50 overflow-hidden animate-slide-up-fade-in">
      {/* Encabezado del Panel */}
      <div className="flex items-center justify-between p-3 bg-nytrix-charcoal border-b border-nytrix-purple/20">
        <h3 className="text-md font-semibold text-white">Nytrix Support</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-nytrix-purple/30"
          aria-label="Cerrar chat"
          title="Cerrar chat"
        >
          <X size={20} />
        </button>
      </div>

      {/* Cuerpo del Chat (Placeholder) */}
      <div className="flex-1 p-4 overflow-y-auto">
        <p className="text-muted-foreground text-sm">
          ¡Hola! ¿Cómo podemos ayudarte hoy?
        </p>
        <p className="text-muted-foreground text-xs mt-4">
          (Interfaz de chat en desarrollo)
        </p>
        {/* Aquí irían los mensajes del chat */}
      </div>

      {/* Pie de Panel (Input de mensaje - Placeholder) */}
      <div className="p-3 border-t border-nytrix-purple/20 bg-nytrix-charcoal">
        <input 
          type="text" 
          placeholder="Escribe tu mensaje..." 
          className="w-full p-2 bg-background border border-border rounded-md text-sm focus:ring-1 focus:ring-nytrix-purple focus:border-nytrix-purple outline-none"
        />
      </div>
    </div>
  );
} 