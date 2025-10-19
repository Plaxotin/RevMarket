import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";

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

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("Россия, все города");

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const phone = formData.get("phone") as string;
    const name = formData.get("name") as string;

    if (!phone || !name || !email) {
      toast({
        title: "Ошибка",
        description: "Номер телефона, имя и email обязательны для заполнения",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone,
          name,
          email,
          city: selectedCity || null,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: "Ошибка регистрации",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешная регистрация!",
        description: "Вы успешно зарегистрированы",
      });
      navigate("/");
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    // Check if identifier is email or phone
    let email = identifier;
    
    // If identifier looks like a phone number, find the email from profiles
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("phone", identifier)
        .single();
      
      if (profile?.email) {
        email = profile.email;
      } else {
        toast({
          title: "Ошибка входа",
          description: "Пользователь с таким номером телефона не найден",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Ошибка входа",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешный вход!",
        description: "Добро пожаловать",
      });
      navigate("/");
    }
    setLoading(false);
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("reset-identifier") as string;

    let email = identifier;
    
    // If identifier looks like a phone number, find the email from profiles
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("phone", identifier)
        .single();
      
      if (profile?.email) {
        email = profile.email;
      } else {
        toast({
          title: "Ошибка",
          description: "Пользователь с таким номером телефона не найден",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });

    if (error) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Письмо отправлено",
        description: "Проверьте вашу почту для восстановления пароля",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCityChange={() => {}} />
      <div className="container px-4 py-16 mx-auto max-w-md">
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">Вход</TabsTrigger>
            <TabsTrigger value="signup">Регистрация</TabsTrigger>
            <TabsTrigger value="reset">Восстановление</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Вход в систему</CardTitle>
                <CardDescription>Войдите в свой аккаунт</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-identifier">Email или номер телефона</Label>
                    <Input
                      id="signin-identifier"
                      name="identifier"
                      type="text"
                      required
                      placeholder="your@email.com или +7 (900) 123-45-67"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Пароль</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Вход..." : "Войти"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Регистрация</CardTitle>
                <CardDescription>Создайте новый аккаунт</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">
                      Номер телефона <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="signup-phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+7 (900) 123-45-67"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">
                      Имя <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="signup-name"
                      name="name"
                      type="text"
                      required
                      placeholder="Иван Иванов"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Пароль</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-city">Город</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger id="signup-city">
                        <SelectValue placeholder="Выберите город" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Регистрация..." : "Зарегистрироваться"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reset">
            <Card>
              <CardHeader>
                <CardTitle>Восстановление пароля</CardTitle>
                <CardDescription>Введите email или номер телефона</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-identifier">Email или номер телефона</Label>
                    <Input
                      id="reset-identifier"
                      name="reset-identifier"
                      type="text"
                      required
                      placeholder="your@email.com или +7 (900) 123-45-67"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Отправка..." : "Восстановить пароль"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
