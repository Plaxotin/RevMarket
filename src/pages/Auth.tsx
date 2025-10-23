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
import { Loader2, Smartphone, Mail } from "lucide-react";

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
  const [authStep, setAuthStep] = useState<'phone' | 'code' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Функция для отправки SMS кода
  const sendSMSCode = async (phone: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          channel: 'sms'
        }
      });

      if (error) {
        // Если SMS провайдер не настроен, предлагаем альтернативу
        if (error.message.includes('Unsupported phone provider') || error.message.includes('phone provider')) {
          toast({
            title: "SMS временно недоступен",
            description: "Пожалуйста, используйте вход по email и паролю",
            variant: "destructive",
          });
          setAuthStep('email');
          return false;
        }
        
        toast({
          title: "Ошибка отправки SMS",
          description: error.message,
          variant: "destructive",
        });
        return false;
      } else {
        toast({
          title: "SMS отправлен",
          description: "Код подтверждения отправлен на ваш номер",
        });
        setPhoneNumber(phone);
        setAuthStep('code');
        startCountdown();
        return true;
      }
    } catch (error) {
      toast({
        title: "SMS временно недоступен",
        description: "Пожалуйста, используйте вход по email и паролю",
        variant: "destructive",
      });
      setAuthStep('email');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Функция для проверки SMS кода
  const verifySMSCode = async (code: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: code,
        type: 'sms'
      });

      if (error) {
        toast({
          title: "Неверный код",
          description: "Проверьте правильность введенного кода",
          variant: "destructive",
        });
        return false;
      } else {
        toast({
          title: "Успешный вход!",
          description: "Добро пожаловать",
        });
        navigate("/");
        return true;
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить код",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Функция для обратного отсчета
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Функция для повторной отправки SMS
  const resendSMS = async () => {
    if (countdown > 0) return;
    await sendSMSCode(phoneNumber);
  };

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
                <CardDescription>
                  {authStep === 'phone' 
                    ? "Введите номер телефона для получения SMS кода" 
                    : "Введите код из SMS сообщения"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {authStep === 'phone' ? (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Примечание:</strong> SMS-коды могут быть недоступны в демо-версии. 
                        Используйте вход по email и паролю для тестирования.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-phone">Номер телефона</Label>
                      <Input
                        id="signin-phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+7 (900) 123-45-67"
                        required
                      />
                    </div>
                    <Button 
                      onClick={() => sendSMSCode(phoneNumber)} 
                      className="w-full" 
                      disabled={loading || !phoneNumber}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Отправка SMS...
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 mr-2" />
                          Получить SMS код
                        </>
                      )}
                    </Button>
                    
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">или</span>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setAuthStep('email')}
                      className="w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Войти по email и паролю
                    </Button>
                  </div>
                ) : authStep === 'code' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-code">SMS код</Label>
                      <Input
                        id="signin-code"
                        type="text"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Код отправлен на номер {phoneNumber}
                      </p>
                    </div>
                    <Button 
                      onClick={() => verifySMSCode(smsCode)} 
                      className="w-full" 
                      disabled={loading || smsCode.length !== 6}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Проверка...
                        </>
                      ) : (
                        "Подтвердить код"
                      )}
                    </Button>
                    
                    <div className="flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => setAuthStep('phone')}
                        className="text-sm"
                      >
                        Изменить номер
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={resendSMS}
                        disabled={countdown > 0}
                        className="text-sm"
                      >
                        {countdown > 0 ? `Повторить через ${countdown}с` : "Отправить повторно"}
                      </Button>
                    </div>
                  </div>
                ) : (
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
                    
                    <div className="text-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => setAuthStep('phone')}
                        className="text-sm"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Войти по SMS
                      </Button>
                    </div>
                  </form>
                )}
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
