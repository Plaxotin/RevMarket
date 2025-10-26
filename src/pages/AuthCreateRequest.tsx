import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navbar } from "@/components/Navbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/data/categories";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

const categories = CATEGORIES;

const AuthCreateRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authData, setAuthData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });
  const [requestData, setRequestData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    city: "",
  });
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started with data:', {
      authData,
      requestData,
      images: images.length
    });
    
    if (!authData.password || !authData.name || !authData.phone) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля для регистрации",
        variant: "destructive",
      });
      return;
    }

    // Отладочная информация
    console.log('Request data validation:', {
      title: requestData.title,
      description: requestData.description,
      category: requestData.category,
      titleEmpty: !requestData.title,
      descriptionEmpty: !requestData.description,
      categoryEmpty: !requestData.category
    });

    // Проверка на пустые строки и только пробелы
    const isTitleEmpty = !requestData.title || requestData.title.trim() === '';
    const isDescriptionEmpty = !requestData.description || requestData.description.trim() === '';
    const isCategoryEmpty = !requestData.category || requestData.category.trim() === '';

    if (isTitleEmpty || isDescriptionEmpty || isCategoryEmpty) {
      let missingFields = [];
      if (isTitleEmpty) missingFields.push("Название");
      if (isDescriptionEmpty) missingFields.push("Описание");
      if (isCategoryEmpty) missingFields.push("Категория");
      
      toast({
        title: "Ошибка",
        description: `Пожалуйста, заполните: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Валидация email только если он указан
    if (authData.email && authData.email.trim() !== '' && !authData.email.includes('@')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите корректный email адрес или оставьте поле пустым",
        variant: "destructive",
      });
      return;
    }

    // Валидация пароля
    if (authData.password.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен содержать минимум 6 символов",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Регистрация пользователя
      const email = (authData.email && authData.email.trim() !== '' && authData.email.includes('@'))
        ? authData.email 
        : `tempuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@tempuser.local`;
        
      console.log('Attempting signup with:', { email, passwordLength: authData.password.length });
      
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: authData.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Обработка специфических ошибок
        let errorMessage = authError.message;
        if (authError.message.includes('already registered')) {
          errorMessage = "Пользователь с таким email уже зарегистрирован";
        } else if (authError.message.includes('Invalid email') || authError.message.includes('invalid')) {
          errorMessage = "Некорректный email адрес. Попробуйте указать другой email или оставьте поле пустым";
        } else if (authError.message.includes('Password')) {
          errorMessage = "Пароль не соответствует требованиям";
        } else if (authError.message.includes('400')) {
          errorMessage = "Ошибка валидации данных. Проверьте правильность заполнения полей";
        }
        
        toast({
          title: "Ошибка регистрации",
          description: errorMessage,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        // Принудительный вход в систему
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: authData.password,
        });

        if (signInError) {
          console.error("Ошибка входа в систему:", signInError);
          
          // Если email не подтвержден, попробуем войти без подтверждения
          if (signInError.message.includes('Email not confirmed')) {
            console.log('Email not confirmed, trying alternative approach...');
            
            // Попробуем использовать signUp с подтверждением
            const { data: resendData, error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: email,
            });
            
            if (resendError) {
              console.error("Ошибка повторной отправки:", resendError);
            }
            
            toast({
              title: "Требуется подтверждение email",
              description: "Проверьте почту и подтвердите регистрацию, затем попробуйте войти в систему",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          
          toast({
            title: "Ошибка входа",
            description: "Не удалось войти в систему после регистрации",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Создание профиля пользователя
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: signUpData.user.id,
              name: authData.name,
              phone: authData.phone,
              email: authData.email || null,
            },
          ]);

        if (profileError) {
          console.error("Ошибка создания профиля:", profileError);
        }

        // Проверяем, что пользователь авторизован
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        console.log('Current user after signup:', currentUser);
        
        if (!currentUser) {
          toast({
            title: "Ошибка авторизации",
            description: "Пользователь не авторизован",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Создание запроса
        const { error: requestError } = await supabase
          .from("requests")
          .insert([
            {
              user_id: currentUser.id,
              title: requestData.title,
              description: requestData.description,
              category: requestData.category,
              budget: requestData.budget || null,
              city: requestData.city || null,
              images: images.length > 0 ? images : null,
            },
          ]);

        if (requestError) {
          toast({
            title: "Ошибка создания запроса",
            description: requestError.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Успешно!",
            description: "Вы зарегистрированы и запрос создан",
          });
          navigate("/");
        }
      }
    } catch (error) {
      console.error("Ошибка:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при регистрации",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCityChange={() => {}} />
      <div className="container px-4 py-12 mx-auto max-w-4xl">
        <Card className="shadow-card animate-slide-up">
          <CardHeader>
            <CardTitle className="text-3xl">Создание запроса и регистрация</CardTitle>
            <CardDescription className="text-base">
              Создайте свой первый запрос
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Данные запроса */}
              <div className="space-y-6">
                <div className="border-b pb-4">
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    placeholder="Например: Ищу iPhone 15 Pro"
                    value={requestData.title}
                    onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание *</Label>
                  <Textarea
                    id="description"
                    placeholder="Подробно опишите, что вам нужно..."
                    className="min-h-[120px]"
                    value={requestData.description}
                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория *</Label>
                    <Select
                      value={requestData.category}
                      onValueChange={(value) => setRequestData({ ...requestData, category: value })}
                    >
                      <SelectTrigger id="category" className={!requestData.category ? "border-red-500" : ""}>
                        <SelectValue placeholder="Выберите категорию (обязательно)" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!requestData.category && (
                      <p className="text-sm text-red-500">⚠️ Пожалуйста, выберите категорию</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Бюджет</Label>
                    <Input
                      id="budget"
                      placeholder="Например: 50 000 - 70 000 ₽"
                      value={requestData.budget}
                      onChange={(e) => setRequestData({ ...requestData, budget: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">Город</Label>
                    <Input
                      id="city"
                      placeholder="Россия, все города"
                      value={requestData.city}
                      onChange={(e) => setRequestData({ ...requestData, city: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Загрузка изображений */}
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
                className="pt-4"
              />

              {/* Данные для регистрации */}
              <div className="space-y-6">
                <div className="border-b pb-4">
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Имя *</Label>
                    <Input
                      id="name"
                      placeholder="Ваше имя"
                      value={authData.name}
                      onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      placeholder="+7 (999) 123-45-67"
                      value={authData.phone}
                      onChange={(e) => setAuthData({ ...authData, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com (необязательно - можно оставить пустым)"
                      value={authData.email}
                      onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Пароль *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Минимум 6 символов"
                      value={authData.password}
                      onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Регистрация...
                    </>
                  ) : (
                    "Зарегистрироваться и опубликовать запрос"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/")}
                  disabled={loading}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthCreateRequest;
