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
    deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authData.password || !authData.name || !authData.phone) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля для регистрации",
        variant: "destructive",
      });
      return;
    }

    if (!requestData.title || !requestData.description || !requestData.category) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля запроса",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Регистрация пользователя
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: authData.email || `${authData.phone}@temp.local`,
        password: authData.password,
      });

      if (authError) {
        toast({
          title: "Ошибка регистрации",
          description: authError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Создание профиля пользователя
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: authData.user.id,
              name: authData.name,
              phone: authData.phone,
              email: authData.email || null,
            },
          ]);

        if (profileError) {
          console.error("Ошибка создания профиля:", profileError);
        }

        // Создание запроса
        const { error: requestError } = await supabase
          .from("requests")
          .insert([
            {
              user_id: authData.user.id,
              title: requestData.title,
              description: requestData.description,
              category: requestData.category,
              budget: requestData.budget || null,
              city: requestData.city || null,
              deadline: requestData.deadline || null,
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
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Срок</Label>
                    <Input
                      id="deadline"
                      placeholder="Например: до 15 декабря"
                      value={requestData.deadline}
                      onChange={(e) => setRequestData({ ...requestData, deadline: e.target.value })}
                    />
                  </div>
                </div>
              </div>

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
                      placeholder="your@email.com (необязательно)"
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
