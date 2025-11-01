import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Loader2, Smartphone } from "lucide-react";
import { translateSupabaseError } from "@/utils/errorMessages";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'code'>('phone');
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
        toast({
          title: "Ошибка отправки SMS",
          description: translateSupabaseError(error.message),
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
        title: "Ошибка",
        description: "Не удалось отправить SMS. Попробуйте позже",
        variant: "destructive",
      });
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
        // Проверяем, существует ли профиль, и создаем его автоматически, если нужно
        try {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", data.user?.id)
            .single();
          
          let userName = "пользователь";
          if (existingProfile?.name) {
            userName = existingProfile.name;
          } else {
            // Создаем профиль автоматически если его нет
            const { error: insertError } = await supabase
              .from("profiles")
              .insert([
                {
                  id: data.user?.id,
                  name: "Пользователь",
                  phone: phoneNumber,
                  email: null,
                  city: null,
                },
              ]);
            
            if (insertError) {
              console.warn("Could not create profile:", insertError);
            }
          }
          
          toast({
            title: "Успешный вход!",
            description: `Добро пожаловать, ${userName}`,
          });
          navigate("/");
          return true;
        } catch (error) {
          console.error("Error handling profile:", error);
          // Пользователь все равно входит, просто без имени
          toast({
            title: "Успешный вход!",
            description: "Добро пожаловать",
          });
          navigate("/");
          return true;
        }
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

  return (
    <div className="min-h-screen relative">
      {/* Градиентный фон на весь сайт */}
      <div className="fixed inset-0 z-0 bg-gradient-hero opacity-90" style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 56%), hsl(330 81% 60%))' }} />
      
      {/* Контент поверх градиента */}
      <div className="relative z-10">
        <Navbar onCityChange={() => {}} />
        <div className="container px-4 py-16 mx-auto max-w-md">
          <Card className="w-full">
          <CardHeader>
            <CardTitle>Авторизация по SMS</CardTitle>
            <CardDescription>
              {authStep === 'phone' 
                ? "Введите номер телефона для получения SMS кода. Если аккаунта нет, он будет создан автоматически" 
                : "Введите код из SMS сообщения"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authStep === 'phone' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Примечание:</strong> SMS-коды могут быть недоступны в демо-версии
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
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
