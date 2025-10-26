import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { List, MapPin, User, LogOut } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { checkAuth, logout } from "@/utils/auth";
import logo from "../../Adobe Express - file.png";

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
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo - всегда видимый */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold">РеверсМаркет</span>
          </Link>
          
          {/* Мобильная версия - скрываем селектор города */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <>
                <Button variant="ghost" asChild className="p-2">
                  <Link to="/profile">
                    <User className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="default" asChild className="px-3">
                  <Link to="/create-request">
                    <span className="text-sm">Создать</span>
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Выйти из аккаунта"
                  className="p-2"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button variant="default" asChild className="px-3">
                <Link to="/auth">
                  <span className="text-sm">Войти</span>
                </Link>
              </Button>
            )}
          </div>

          {/* Десктопная версия - полное меню */}
          <div className="hidden md:flex items-center gap-4">
            <Select value={selectedCity} onValueChange={handleCityChange}>
              <SelectTrigger className="w-[180px]">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="truncate">{getShortCityName(selectedCity)}</span>
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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
            >
              <List className="w-5 h-5" />
              Поиск по каталогу
            </Button>
            
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/profile">
                    <User className="w-5 h-5" />
                    Личный кабинет
                  </Link>
                </Button>
                <Button variant="default" asChild>
                  <Link to="/create-request">
                    Создать запрос
                  </Link>
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="Выйти из аккаунта"
                >
                  <LogOut className="w-5 h-5" />
                  {isLoggingOut && <span className="ml-2">Выход...</span>}
                </Button>
              </>
            ) : (
              <Button variant="default" asChild>
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
