import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, X, FilePlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { checkAuth } from "@/utils/auth";

interface StickyActionsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchOpen?: () => void;
  triggerSearchOpen?: number;
}

export const StickyActions = ({ searchQuery, onSearchChange, onSearchOpen, triggerSearchOpen }: StickyActionsProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Watch for trigger to open search from Navbar
  useEffect(() => {
    if (triggerSearchOpen && triggerSearchOpen > 0 && !isSearchOpen) {
      setIsSearchOpen(true);
    }
  }, [triggerSearchOpen, isSearchOpen]);

  const handleSearchClick = () => {
    // Scroll to catalog first
    const catalogElement = document.getElementById("catalog");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Open search after a short delay to ensure scroll happens
    setTimeout(() => {
      setIsSearchOpen(true);
      // Notify parent component that search is opened
      if (onSearchOpen) {
        onSearchOpen();
      }
      // Focus on the search input after it becomes visible
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }, 100);
  };

  useEffect(() => {
    // Also focus when search is opened from Navbar
    if (isSearchOpen && searchInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    // Don't clear the search query, keep it for potential future search
  };

  const handleCreateRequestClick = async () => {
    const { isAuthenticated } = await checkAuth();
    
    if (isAuthenticated) {
      // Если пользователь авторизован, переходим на страницу создания запроса
      window.location.href = "/create-request";
    } else {
      // Если не авторизован, переходим на страницу регистрации с созданием запроса
      window.location.href = "/auth-create-request";
    }
  };

  return (
    <div className="sticky top-16 z-40 bg-background/20 backdrop-blur-md border-b border-border/40 shadow-lg">
      <div className="container px-4 py-2 mx-auto">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-[1rem] justify-center items-center">
          <Button 
            variant="hero" 
            size="lg" 
            className="group shadow-lg w-full sm:w-[240px]"
            onClick={handleCreateRequestClick}
          >
            <FilePlus className="w-[22px] h-[22px]" />
            Ищу товар
          </Button>
          
          {!isSearchOpen ? (
            <Button 
              variant="hero-sell" 
              size="lg"
              onClick={handleSearchClick}
              className="group shadow-lg w-full sm:w-[240px]"
            >
              <Search className="w-5 h-5" />
              Ищу покупателя
            </Button>
          ) : (
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск по запросам..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-10 h-12 shadow-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseSearch}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
