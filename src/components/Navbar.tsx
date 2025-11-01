import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { List, MapPin, User, LogOut } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { checkAuth, logout } from "@/utils/auth";
import { HandshakeIcon } from "./HandshakeIcon";

const cities = [
  "Россия, все города",
  "Москва",
  "Санкт-Петербург",
  "Новосибирск",
  "Екатеринбург",
  "Казань",
  "Нижний Новгород",
  "Челябинск",
  "Самара",
  "Омск",
  "Ростов-на-Дону",
  "Уфа",
  "Красноярск",
  "Воронеж",
  "Пермь",
  "Волгоград"
];

// Функция для получения короткого названия города для отображения в баре
const getShortCityName = (city: string) => {
  if (city === "Россия, все города") {
    return "Россия";
  }
  return city;
};

interface NavbarProps {
  onCityChange?: (city: string) => void;
  onSearchOpen?: () => void;
}

export const Navbar = ({ onCityChange, onSearchOpen }: NavbarProps) => {
  const [selectedCity, setSelectedCity] = useState<string>("Россия, все города");
  const [user, setUser] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const { user, isAuthenticated } = await checkAuth();
      setUser(user);
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        console.log('Пользователь вышел из системы');
        setUser(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('Пользователь вошел в систему:', session.user.id);
        setUser(session.user);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Токен обновлен');
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (onCityChange) {
      onCityChange(city);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const success = await logout();
      
      if (success) {
        setUser(null);
        navigate("/");
      } else {
        // Даже если logout не удался, очищаем состояние
        setUser(null);
        navigate("/");
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      setUser(null);
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo - всегда видимый */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[1.32rem] font-bold text-white">РеверсМаркет</span>
          </Link>
          
          {/* Мобильная версия - скрываем селектор города */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <>
                <Button variant="ghost" asChild className="p-2 text-white hover:bg-gray-700">
                  <Link to="/profile">
                    <User className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="default" asChild className="px-3 bg-gray-700 hover:bg-gray-600 text-white">
                  <Link to="/create-request">
                    <span className="text-sm">Создать</span>
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Выйти из аккаунта"
                  className="p-2 text-white hover:bg-gray-700"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button variant="default" asChild className="px-3 bg-white hover:bg-gray-100 text-black">
                <Link to="/auth">
                  <span className="text-sm">Войти</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Десктопная версия - полное меню */}
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => {
                navigate("/");
                // Trigger search open from parent
                if (onSearchOpen) {
                  onSearchOpen();
                }
                setTimeout(() => {
                  const catalogElement = document.getElementById("catalog");
                  if (catalogElement) {
                    catalogElement.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }, 100);
              }}
              className="text-white hover:bg-purple-600/30"
            >
              <List className="w-5 h-5" />
              Поиск по каталогу
            </Button>
            
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-[240px] h-10 bg-gray-800 text-white border-gray-700 hover:bg-purple-600/30">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{getShortCityName(selectedCity)}</span>
              </SelectTrigger>
              <SelectContent className="bg-black/60 backdrop-blur-md border-white/10">
                {cities.map((city) => (
                  <SelectItem key={city} value={city} className="text-white focus:bg-blue-900/30 focus:text-blue-300">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {user ? (
              <>
                <Button variant="ghost" asChild className="text-white hover:bg-gray-700">
                  <Link to="/profile">
                    <User className="w-5 h-5" />
                    Личный кабинет
                  </Link>
                </Button>
                <Button variant="default" asChild className="bg-gray-700 hover:bg-gray-600 text-white">
                  <Link to="/create-request">
                    Создать запрос
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Выйти из аккаунта"
                  className="text-white hover:bg-gray-700"
                >
                  <LogOut className="w-5 h-5" />
                  {isLoggingOut && <span className="ml-2">Выход...</span>}
                </Button>
              </>
            ) : (
              <Button variant="default" asChild className="w-[120px] bg-white hover:bg-gray-100 text-black">
                <Link to="/auth">
                  Войти
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
