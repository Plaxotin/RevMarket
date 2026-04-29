import { Hero } from "@/components/Hero";
import { RequestCard } from "@/components/RequestCard";
import { Navbar } from "@/components/Navbar";
import { StickyActions } from "@/components/StickyActions";
import { Footer } from "@/components/Footer";
import { ScrollButtons } from "@/components/ScrollButtons";
import { CreateRequestDialog } from "@/components/CreateRequestDialog";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Filter, ChevronDown, Sparkles } from "lucide-react";
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
  const [offerCounts, setOfferCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchOpenTrigger, setSearchOpenTrigger] = useState(0);
  const [createRequestDialogOpen, setCreateRequestDialogOpen] = useState(false);
  
  const categories = FILTER_CATEGORIES;
  
  const handleOpenSearch = () => {
    setSearchOpenTrigger(prev => prev + 1);
  };

  const handleOpenCreateRequest = () => {
    setCreateRequestDialogOpen(true);
  };

  useEffect(() => {
    loadRequests();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { user } = await checkAuth();
    setCurrentUser(user);
  };

  const loadRequests = async (retryCount = 0) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error.message, error.code);

        // Retry once on connection/timeout errors (e.g. paused project waking up)
        if (retryCount < 2 && (error.message.includes("fetch") || error.code === "PGRST301")) {
          console.log(`Retrying loadRequests (attempt ${retryCount + 1})...`);
          setTimeout(() => loadRequests(retryCount + 1), 2000);
          return;
        }

        toast({
          title: "Ошибка загрузки",
          description:
            error.message.includes("fetch") || error.message.includes("network")
              ? "Сервер временно недоступен. Возможно, база данных в режиме сна — попробуйте через минуту."
              : `Не удалось загрузить запросы: ${error.message}`,
          variant: "destructive",
        });
      } else {
        setRequests(data || []);
        const requestIds = (data || []).map((request: any) => request.id);
        if (requestIds.length > 0) {
          const { data: offersData } = await supabase
            .from("offers_visible")
            .select("request_id")
            .in("request_id", requestIds);

          const counts = (offersData || []).reduce<Record<string, number>>((acc, offer) => {
            acc[offer.request_id] = (acc[offer.request_id] || 0) + 1;
            return acc;
          }, {});
          setOfferCounts(counts);
        } else {
          setOfferCounts({});
        }
      }
    } catch (e) {
      console.error("Network error loading requests:", e);

      if (retryCount < 2) {
        console.log(`Retrying loadRequests after catch (attempt ${retryCount + 1})...`);
        setTimeout(() => loadRequests(retryCount + 1), 2000);
        return;
      }

      toast({
        title: "Ошибка соединения",
        description: "Не удалось подключиться к серверу. Проверьте интернет-соединение или попробуйте позже.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const cityMatchesFilter = (reqCity: string | null | undefined, filterCity: string) => {
    if (filterCity === "Россия, все города") return true;
    const a = (reqCity ?? "").trim().toLowerCase();
    const b = filterCity.trim().toLowerCase();
    if (!a) return true;
    return a === b || a.includes(b) || b.includes(a);
  };

  const scoreSemanticMatch = (req: any, query: string) => {
    if (!query.trim()) return 0;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const title = (req.title ?? "").toLowerCase();
    const desc = (req.description ?? "").toLowerCase();
    const category = (req.category ?? "").toLowerCase();
    const city = (req.city ?? "").toLowerCase();

    return terms.reduce((score, term) => {
      if (title.includes(term)) return score + 4;
      if (category.includes(term)) return score + 3;
      if (city.includes(term)) return score + 2;
      if (desc.includes(term)) return score + 1;
      return score;
    }, 0);
  };

  const filteredRequests = requests
    .filter(req => selectedCategory === "Все" || req.category === selectedCategory)
    .filter(req => cityMatchesFilter(req.city, selectedCity))
    .filter(req => {
      if (searchQuery === "") return true;
      const q = searchQuery.toLowerCase();
      const title = (req.title ?? "").toLowerCase();
      const desc = (req.description ?? "").toLowerCase();
      const category = (req.category ?? "").toLowerCase();
      const city = (req.city ?? "").toLowerCase();
      return title.includes(q) || desc.includes(q) || category.includes(q) || city.includes(q) || scoreSemanticMatch(req, q) > 0;
    })
    .sort((a, b) => scoreSemanticMatch(b, searchQuery) - scoreSemanticMatch(a, searchQuery));
  
  return (
    <div className="min-h-screen relative">
      {/* Градиентный фон на весь сайт */}
      <div className="fixed inset-0 z-0 bg-gradient-hero opacity-90" style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 56%), hsl(330 81% 60%))' }} />
      
      {/* Контент поверх градиента */}
      <div className="relative z-10">
        <Navbar 
          onCityChange={setSelectedCity} 
          onSearchOpen={handleOpenSearch}
        />
        <Hero />
        <StickyActions 
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery} 
          triggerSearchOpen={searchOpenTrigger}
          onCreateRequest={handleOpenCreateRequest}
        />
        
        <CreateRequestDialog 
          open={createRequestDialogOpen}
          onOpenChange={setCreateRequestDialogOpen}
          onSuccess={loadRequests}
          initialCity={selectedCity}
        />
        
        <section id="catalog" className="w-full scroll-mt-20 md:scroll-mt-24 relative z-20">
        <div className="bg-black/60 backdrop-blur-md rounded-[40px] mt-8 pt-12 pb-4 mx-3 mb-4">
          <div className="container px-4 mx-auto">
            <div className="mb-12 text-center animate-fade-in select-none">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                Актуальные запросы
              </h2>
              {searchQuery && (
                <div className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/85">
                  <Sparkles className="h-4 w-4" />
                  AI-ранжирование показывает сначала заявки, где совпали смысл, категория, город или бюджет.
                </div>
              )}
            </div>
            
            {/* Мобильная версия - выпадающий список фильтров */}
            <div className="md:hidden mb-8 animate-fade-in">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between bg-gray-600/20 hover:bg-gray-600/20 text-white text-base">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <span>Фильтры: {selectedCategory}</span>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full bg-black/50 backdrop-blur-md max-h-[70vh] overflow-y-auto">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? "bg-gray-500/50 text-white" : "text-white"}
                    >
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Десктопная версия - обычные кнопки фильтров */}
            <div className="hidden md:grid grid-cols-5 gap-2 mb-8 animate-fade-in max-w-5xl mx-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-sm py-1 px-2 rounded-md outline-none focus:outline-none truncate ${selectedCategory === category ? "bg-gray-500/50 border-0 text-white hover:bg-gray-500/50" : "bg-transparent border border-gray-600 text-white hover:bg-gray-600/20"}`}
                >
                  {category}
                </button>
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
                  <h3 className="text-2xl font-bold text-white mb-4">
                    Запросов пока нет
                  </h3>
                  <p className="text-lg text-white/90 max-w-md mx-auto">
                    Создайте первый запрос и начните получать предложения от продавцов!
                  </p>
                </div>
                
                {/* Дополнительное пространство для предотвращения скролла */}
                <div className="h-32"></div>
              </div>
            ) : (
              <div 
                className="grid gap-6"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'
                }}
              >
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
                      offersCount={offerCounts[request.id] || 0}
                      userId={request.user_id}
                      currentUserId={currentUser?.id}
                      images={request.images}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
        
        <Footer />
        <ScrollButtons />
      </div>
    </div>
  );
};

export default Index;
