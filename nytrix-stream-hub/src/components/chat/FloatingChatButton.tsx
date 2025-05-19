import { MessageSquare } from 'lucide-react';

type FloatingChatButtonProps = {
  onClick: () => void;
};

export default function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-nytrix-purple text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 focus:outline-none focus:ring-2 focus:ring-nytrix-light-purple focus:ring-opacity-50 transition-transform duration-200 ease-in-out animate-blinking-opacity z-50"
      aria-label="Abrir chat"
      title="Abrir chat"
    >
      <MessageSquare size={28} />
    </button>
  );
} 