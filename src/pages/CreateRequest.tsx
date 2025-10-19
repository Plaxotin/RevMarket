import { useState, useEffect } from "react";
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
import { checkAuth } from "@/utils/auth";

const categories = CATEGORIES;

const CreateRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    city: "",
    deadline: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { user, isAuthenticated } = await checkAuth();
      
      if (!isAuthenticated) {
        navigate("/auth");
        return;
      }
      
      setUser(user);

      // Fetch user profile and auto-fill fields
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, email, city")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          city: profile.city || prev.city,
        }));
      }
    };

    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Ошибка",
        description: "Необходимо авторизоваться",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("requests")
      .insert([
        {
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          budget: formData.budget || null,
          city: formData.city || null,
          deadline: formData.deadline || null,
        },
      ]);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать запрос: " + error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно!",
        description: "Запрос успешно создан",
      });
      navigate("/");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCityChange={() => {}} />
      <div className="container px-4 py-12 mx-auto max-w-3xl">
        <Card className="shadow-card animate-slide-up">
          <CardHeader>
            <CardTitle className="text-3xl">Создать запрос</CardTitle>
            <CardDescription className="text-base">
              Опишите, что вам нужно, и продавцы предложат свои варианты
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Название запроса *</Label>
                <Input
                  id="title"
                  placeholder="Например: Ищу iPhone 15 Pro"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание *</Label>
                <Textarea
                  id="description"
                  placeholder="Подробно опишите, что вам нужно..."
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Категория *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
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
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">Город</Label>
                  <Input
                    id="city"
                    placeholder="Россия, все города"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Срок</Label>
                  <Input
                    id="deadline"
                    placeholder="Например: до 15 декабря"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                  {loading ? "Публикация..." : "Опубликовать запрос"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/")}
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

export default CreateRequest;
