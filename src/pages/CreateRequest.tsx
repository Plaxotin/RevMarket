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
import { ImageUpload } from "@/components/ImageUpload";
import { CityCombobox } from "@/components/CityCombobox";
import { translateSupabaseError } from "@/utils/errorMessages";

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
  });
  const [images, setImages] = useState<string[]>([]);

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
          images: images.length > 0 ? images : null,
        },
      ]);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать запрос: " + translateSupabaseError(error.message),
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
    <div className="min-h-screen relative">
      {/* Градиентный фон на весь сайт */}
      <div className="fixed inset-0 z-0 bg-gradient-hero opacity-90" style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 56%), hsl(330 81% 60%))' }} />
      
      {/* Контент поверх градиента */}
      <div className="relative z-10">
      <Navbar />
      <div className="container px-4 py-8 mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Создать запрос</CardTitle>
            <CardDescription>
              Заполните форму ниже, чтобы создать новый запрос
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Заголовок *</Label>
                <Input
                  id="title"
                  placeholder="Краткое описание потребности"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  placeholder="Подробно опишите, что вам нужно..."
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm">Категория *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category" className="h-10">
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
                  <Label htmlFor="budget" className="text-sm">Бюджет</Label>
                  <Input
                    id="budget"
                    placeholder="Например: 50 000 ₽"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm">Город</Label>
                  <CityCombobox
                    value={formData.city}
                    onChange={(value) => setFormData({ ...formData, city: value })}
                    placeholder="Выберите или введите город"
                  />
                </div>
              </div>

              {/* Загрузка изображений */}
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
                className="pt-4"
              />

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
    </div>
  );
};

export default CreateRequest;
