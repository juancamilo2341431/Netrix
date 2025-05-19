import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-nytrix-charcoal border-t border-nytrix-purple/10 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4 col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-gradient-nytrix">Nytrix</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Tu portal para rentar acceso a las mejores plataformas de streaming al mejor precio.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 text-nytrix-purple">Plataformas</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/platforms/netflix" className="text-muted-foreground hover:text-nytrix-purple transition-colors">Netflix</Link></li>
              <li><Link to="/platforms/disney" className="text-muted-foreground hover:text-nytrix-purple transition-colors">Disney+</Link></li>
              <li><Link to="/platforms/hbo" className="text-muted-foreground hover:text-nytrix-purple transition-colors">HBO Max</Link></li>
              <li><Link to="/platforms/prime" className="text-muted-foreground hover:text-nytrix-purple transition-colors">Prime Video</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 text-nytrix-purple">Soporte</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/faq" className="text-muted-foreground hover:text-nytrix-purple transition-colors">Preguntas Frecuentes</Link></li>
              <li><Link to="/contact" className="text-muted-foreground hover:text-nytrix-purple transition-colors">Contacto</Link></li>
              <li><Link to="/help" className="text-muted-foreground hover:text-nytrix-purple transition-colors">Ayuda</Link></li>
            </ul>
          </div>
          
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-sm font-semibold mb-4 text-nytrix-purple">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="text-muted-foreground hover:text-nytrix-purple transition-colors">Términos de Servicio</Link></li>
              <li><Link to="/privacy" className="text-muted-foreground hover:text-nytrix-purple transition-colors">Política de Privacidad</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-nytrix-purple/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Nytrix. Todos los derechos reservados.
          </p>
          <div className="mt-4 md:mt-0">
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-nytrix-purple">
                <span className="sr-only">Facebook</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-nytrix-purple">
                <span className="sr-only">Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-nytrix-purple">
                <span className="sr-only">Twitter</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
