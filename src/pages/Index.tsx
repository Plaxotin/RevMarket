import { Hero } from "@/components/Hero";
import { RequestCard } from "@/components/RequestCard";
import { Navbar } from "@/components/Navbar";
import { StickyActions } from "@/components/StickyActions";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Filter, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FILTER_CATEGORIES } from "@/data/categories";
import { checkAuth } from "@/utils/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} дн. назад`;
  if (diffHours > 0) return `${diffHours} ч. назад`;
  if (diffMins > 0) return `${diffMins} мин. назад`;
  return "только что";
};

const Index = () => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("Все");
  const [selectedCity, setSelectedCity] = useState<string>("Россия, все города");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const categories = FILTER_CATEGORIES;

  useEffect(() => {
    loadRequests();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { user } = await checkAuth();
    setCurrentUser(user);
  };

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        profiles (
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить запросы",
        variant: "destructive",
      });
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };
  
  const filteredRequests = requests
    .filter(req => selectedCategory === "Все" || req.category === selectedCategory)
    .filter(req => 
      selectedCity === "Россия, все города" || 
      req.city === selectedCity ||
      !req.city // Показываем запросы без указанного города при выборе "Россия, все города"
    )
    .filter(req => 
      searchQuery === "" || 
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar onCityChange={setSelectedCity} />
      <Hero />
      <StickyActions searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <section id="catalog" className="container px-4 py-16 mx-auto">
        <div className="mb-12 text-center animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Актуальные запросы
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Покупатели ищут эти товары и услуги прямо сейчас. 
            Будьте первым, кто предложит решение!
          </p>
        </div>
        
        {/* Мобильная версия - выпадающий список фильтров */}
        <div className="md:hidden mb-8 animate-fade-in">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>Фильтры: {selectedCategory}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-primary text-primary-foreground" : ""}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Десктопная версия - обычные кнопки фильтров */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8 animate-fade-in max-w-5xl mx-auto">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className="transition-all text-sm"
            >
              {category}
            </Button>
          ))}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 min-h-[50vh] flex flex-col justify-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-accent-purple/20 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Запросов пока нет
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                Создайте первый запрос и начните получать предложения от продавцов!
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent-purple text-white hover:shadow-lg hover:scale-105 transition-all duration-300"
              >
                Создать первый запрос
              </Button>
            </div>
            
            {/* Дополнительное пространство для предотвращения скролла */}
            <div className="h-32"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request, index) => (
              <div 
                key={request.id} 
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <RequestCard 
                  id={request.id}
                  title={request.title}
                  description={request.description}
                  category={request.category}
                  budget={request.budget || "Не указан"}
                  location={request.city || "Не указан"}
                  timeAgo={getTimeAgo(request.created_at)}
                  offersCount={0}
                  userId={request.user_id}
                  currentUserId={currentUser?.id}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
