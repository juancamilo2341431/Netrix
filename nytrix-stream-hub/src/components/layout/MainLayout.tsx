import { ReactNode, useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '@/contexts/AuthContext';
import FloatingChatButton from '@/components/chat/FloatingChatButton';
import ChatPanel from '@/components/chat/ChatPanel';

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  const { user } = useAuth();
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  const toggleChatPanel = () => {
    setIsChatPanelOpen(!isChatPanelOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {!user && <Footer />}
      
      <FloatingChatButton onClick={toggleChatPanel} />
      <ChatPanel isOpen={isChatPanelOpen} onClose={toggleChatPanel} />
    </div>
  );
}
