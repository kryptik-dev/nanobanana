import { Button } from '@/components/ui/button';
import { RotateCcw, Image, Sparkles, LogOut, Menu, Settings, Edit3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  resetChat: () => void;
  createNewSession: () => void;
  currentModel?: any;
  setCurrentModel?: (model: any) => void;
  isCreateMode?: boolean;
  setIsCreateMode?: (mode: boolean) => void;
  onMobileMenuToggle?: () => void;
}

const Header = ({ 
  resetChat, 
  createNewSession,
  currentModel,
  setCurrentModel,
  isCreateMode,
  setIsCreateMode,
  onMobileMenuToggle
}: HeaderProps) => {
  const { signOut, user } = useAuth();
  
  return (
          <header className="border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="h-7 w-7 sm:h-8 sm:w-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-black font-bold text-xs sm:text-sm">NB</span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-white hidden sm:block">
                Nano Banana
              </span>
              <Badge variant="outline" className="bg-white/10 text-white/90 border-white/20 text-xs hidden sm:flex">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Image Editor
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-medium",
                  isCreateMode 
                    ? "bg-orange-500/20 text-orange-300 border-orange-500/40" 
                    : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                )}
              >
                {isCreateMode ? "Create" : "Edit"}
              </Badge>
            </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Mode Switching Dropdown - Mobile Only */}
            {setIsCreateMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "lg:hidden h-8 w-8 p-0 text-white hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95 rounded-xl",
                      isCreateMode 
                        ? "bg-orange-500/20 text-orange-300" 
                        : "bg-blue-500/20 text-blue-300"
                    )}
                    title={isCreateMode ? "🎨 Create Mode" : "✏️ Edit Mode"}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-black/90 border-white/20 text-white backdrop-blur-md"
                >
                  <DropdownMenuLabel className="text-white/80">Select Mode</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem 
                    onClick={() => setIsCreateMode(true)}
                    className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <Sparkles className="mr-2 h-4 w-4 text-orange-400" />
                    Create Mode
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsCreateMode(false)}
                    className="text-white hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                  >
                    <Edit3 className="mr-2 h-4 w-4 text-blue-400" />
                    Edit Mode
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuToggle}
              className="lg:hidden h-8 w-8 p-0 text-white hover:bg-white/10 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;