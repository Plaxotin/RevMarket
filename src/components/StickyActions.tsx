import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search, X } from "lucide-react";
import { useState } from "react";
import { checkAuth } from "@/utils/auth";

interface StickyActionsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const StickyActions = ({ searchQuery, onSearchChange }: StickyActionsProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearchClick = () => {
    // Scroll to catalog first
    const catalogElement = document.getElementById("catalog");
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Open search after a short delay to ensure scroll happens
    setTimeout(() => setIsSearchOpen(true), 100);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
    onSearchChange("");
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
    <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-border/40 shadow-lg">
      <div className="container px-4 py-2 mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="hero" 
            size="lg" 
            className="group shadow-lg"
            onClick={handleCreateRequestClick}
          >
            Хочу купить
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          {!isSearchOpen ? (
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleSearchClick}
              className="bg-background/10 backdrop-blur-sm border-primary/20 hover:bg-background/20 hover:text-accent-purple shadow-lg"
            >
              <Search className="w-5 h-5" />
              Хочу продать
            </Button>
          ) : (
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск по запросам..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-10 h-12 shadow-lg"
                autoFocus
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
