import { Button } from './ui/button';
import { User, LogOut, HelpCircle } from 'lucide-react';

interface NavigationProps {
  currentView: 'simulation' | 'results' | 'compare' | 'history' | 'faq';
  onNavigate: (view: 'simulation' | 'results' | 'compare' | 'history' | 'faq') => void;
  user: { name: string; email: string };
  onLogout: () => void;
}

export function Navigation({ currentView, onNavigate, user, onLogout }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-medium text-primary">MiVivienda BBP</h1>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Button
                  variant={currentView === 'simulation' ? 'default' : 'ghost'}
                  onClick={() => onNavigate('simulation')}
                  className="px-3 py-2"
                >
                  Nueva Simulación
                </Button>
                <Button
                  variant={currentView === 'history' ? 'default' : 'ghost'}
                  onClick={() => onNavigate('history')}
                  className="px-3 py-2"
                >
                  Historial
                </Button>
                <Button
                  variant={currentView === 'results' ? 'default' : 'ghost'}
                  onClick={() => onNavigate('results')}
                  className="px-3 py-2"
                  disabled={currentView === 'simulation' || currentView === 'history'}
                >
                  Resultados
                </Button>
                <Button
                  variant={currentView === 'compare' ? 'default' : 'ghost'}
                  onClick={() => onNavigate('compare')}
                  className="px-3 py-2"
                  disabled={currentView === 'simulation' || currentView === 'results' || currentView === 'history'}
                >
                  Comparar
                </Button>
                <Button
                  variant={currentView === 'faq' ? 'default' : 'ghost'}
                  onClick={() => onNavigate('faq')}
                  className="px-3 py-2"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  FAQ
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">{user.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Salir</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}