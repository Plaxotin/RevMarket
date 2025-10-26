import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { MapPin, Clock, User, MessageSquare, Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequestCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  timeAgo: string;
  offersCount: number;
  userId?: string;
  currentUserId?: string;
  images?: string[];
}

const categoryConfig: Record<string, { 
  bgGradient: string; 
  borderColor: string;
  iconBg: string;
  iconColor: string;
}> = {
  "Электроника": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-purple-400",
    iconColor: "text-white"
  },
  "Дизайн": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-pink-400",
    iconColor: "text-white"
  },
  "Мебель": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-amber-400",
    iconColor: "text-white"
  },
  "Образование": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-blue-400",
    iconColor: "text-white"
  },
  "Авто": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-red-400",
    iconColor: "text-white"
  },
  "Одежда и аксессуары": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-teal-400",
    iconColor: "text-white"
  },
  "Хобби и отдых": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-yellow-400",
    iconColor: "text-white"
  },
  "Животные": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-green-400",
    iconColor: "text-white"
  },
  "Запчасти": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-orange-400",
    iconColor: "text-white"
  },
  "Детские товары": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-cyan-400",
    iconColor: "text-white"
  },
  "Недвижимость": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-indigo-400",
    iconColor: "text-white"
  },
  "Красота и здоровье": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-rose-400",
    iconColor: "text-white"
  },
  "Другое": {
    bgGradient: "from-gray-50 to-slate-100",
    borderColor: "border-gray-200",
    iconBg: "bg-slate-400",
    iconColor: "text-white"
  },
  "default": { 
    bgGradient: "from-gray-50 to-slate-100", 
    borderColor: "border-gray-200",
    iconBg: "bg-gray-400",
    iconColor: "text-white"
  }
};

const getIconForCategory = (category: string, iconColor: string) => {
  const icons: Record<string, JSX.Element> = {
    "Электроника": (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
      </svg>
    ),
    "Одежда и аксессуары": (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
    ),
    "Автомобили": (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
      </svg>
    ),
    "Недвижимость": (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
      </svg>
    ),
    "Хобби и отдых": (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
    ),
    "Запчасти": (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
    ),
    "Животные": (
      <svg className={`w-6 h-6 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
      </svg>
    ),
    "Детские товары": (
      <svg className={`w-6 h-6 ${iconColor}`} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
        {/* Левое ухо */}
        <path d="M8 5 c-1.5 -2, -2.5 -2, -2 0 c 0.5 2, 1.5 1.5, 2 0" />
        {/* Правое ухо */}
        <path d="M16 5 c 1.5 -2, 2.5 -2, 2 0 c -0.5 2, -1.5 1.5, -2 0" />
        {/* Внутреннее левое ухо */}
        <path d="M8.5 6 c -0.5 -0.8, -0.8 -1.2, -0.8 -0.5 c 0 0.7, 0.3 0.5, 0.8 0.5" fill="currentColor" />
        {/* Внутреннее правое ухо */}
        <path d="M15.5 6 c 0.5 -0.8, 0.8 -1.2, 0.8 -0.5 c 0 0.7, -0.3 0.5, -0.8 0.5" fill="currentColor" />
        {/* Голова */}
        <circle cx="12" cy="8" r="5" />
        {/* Тело */}
        <ellipse cx="12" cy="15" rx="5" ry="6.5" />
        {/* Левая рука */}
        <ellipse cx="6.5" cy="14" rx="2" ry="4" />
        {/* Правая рука */}
        <ellipse cx="17.5" cy="14" rx="2" ry="4" />
        {/* Левая нога */}
        <ellipse cx="9" cy="20" rx="2" ry="3.5" />
        {/* Правая нога */}
        <ellipse cx="15" cy="20" rx="2" ry="3.5" />
        {/* Левый глаз */}
        <circle cx="10" cy="7" r="0.8" fill="white" />
        {/* Правый глаз */}
        <circle cx="14" cy="7" r="0.8" fill="white" />
        {/* Нос */}
        <path d="M11.5 8.5 L12 9.5 L12.5 8.5 Z" fill="white" />
      </svg>
    ),
  };
  
  return icons[category] || icons["Хобби и отдых"];
};

export const RequestCard = ({
  id,
  title,
  description,
  category,
  budget,
  location,
  timeAgo,
  offersCount,
  userId,
  currentUserId,
  images,
}: RequestCardProps) => {
  const config = useMemo(() => categoryConfig[category] || categoryConfig.default, [category]);
  const isOwner = userId && currentUserId && userId === currentUserId;
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Проверяем, добавлена ли карточка в избранное
  useEffect(() => {
    const checkFavorite = async () => {
      if (currentUserId && !isOwner) {
        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('request_id', id)
          .single();
        setIsFavorite(!!data);
      }
    };
    checkFavorite();
  }, [currentUserId, id, isOwner]);

  const toggleFavorite = async () => {
    if (!currentUserId || isOwner) return;
    
    setIsLoading(true);
    try {
      if (isFavorite) {
        // Удаляем из избранного
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUserId)
          .eq('request_id', id);
        
        if (!error) {
          setIsFavorite(false);
          toast({
            title: "Удалено из избранного",
          });
        }
      } else {
        // Добавляем в избранное
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: currentUserId,
            request_id: id
          });
        
        if (!error) {
          setIsFavorite(true);
          toast({
            title: "Добавлено в избранное",
          });
        }
      }
    } catch (error) {
      console.error('Ошибка при изменении избранного:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card 
      className={`bg-gradient-to-br ${config.bgGradient} ${config.borderColor} border rounded-2xl hover:shadow-lg transition-all duration-300 animate-fade-in flex flex-col h-full relative`}
    >
      {/* Кнопка избранного в правом верхнем углу */}
      {currentUserId && !isOwner && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFavorite}
          disabled={isLoading}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-white/80"
          title={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
        >
          <Heart 
            className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} 
          />
        </Button>
      )}
      
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          {images && images.length > 0 ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden mr-4 flex-shrink-0 relative">
              <img 
                src={images[0]} 
                alt={title}
                className="w-full h-full object-cover"
              />
              {isOwner && (
                <div 
                  className="absolute -top-1 -right-1 w-6 h-6 bg-primary flex items-center justify-center text-white text-xs font-bold rotate-12 shadow-md"
                  title="Ваш запрос"
                >
                  <User className="w-3 h-3" />
                </div>
              )}
            </div>
          ) : (
            <div className={`w-12 h-12 ${config.iconBg} rounded-xl flex items-center justify-center mr-4 flex-shrink-0 relative`}>
              {getIconForCategory(category, config.iconColor)}
              {isOwner && (
                <div 
                  className="absolute -top-1 -right-1 w-6 h-6 bg-primary flex items-center justify-center text-white text-xs font-bold rotate-12 shadow-md"
                  title="Ваш запрос"
                >
                  <User className="w-3 h-3" />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link to={`/request/${id}`}>
              <h3 className="font-bold text-gray-900 truncate mb-1 hover:text-primary transition-colors">{title}</h3>
            </Link>
            <p className="text-sm text-gray-600 truncate">{budget ? `${formatPrice(budget)} ₽` : "Бюджет не указан"}</p>
          </div>
        </div>
        
        <Link to={`/request/${id}`} className="block mb-4">
          <p 
            className="text-gray-700 text-sm line-clamp-2 hover:text-primary transition-colors cursor-pointer min-h-[2.5rem]"
            title={description}
          >
            {description || "\u00A0"}
          </p>
        </Link>

        {(location || timeAgo) && (
          <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap mb-3">
            {location && location !== "Не указан" && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </div>
            )}
            {timeAgo && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            )}
          </div>
        )}

        {/* Кнопка "Предложить" в отдельном ряду */}
        {!isOwner && (
          <div className="mt-auto pt-3">
            <Button 
              asChild 
              variant="outline" 
              className="w-full"
            >
              <Link to={`/request/${id}${currentUserId ? '?focus=true' : ''}`}>
                Предложить
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
