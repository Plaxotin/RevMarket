import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Loader2, Smartphone } from "lucide-react";
import { translateSupabaseError } from "@/utils/errorMessages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

declare global {
  interface Window {
    VKIDSDK?: any;
  }
}

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(true);
  const vkContainerRef = useRef<HTMLDivElement | null>(null);
  const vkScriptLoadedRef = useRef(false);
  const vkWidgetInitializedRef = useRef(false);

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

  const handleVKSuccess = (data: unknown) => {
    console.log("VK ID success", data);
    toast({
      title: "Авторизация VK ID",
      description: "Вход через VK ID пока в разработке",
    });
  };

  const handleVKError = (error: unknown) => {
    console.error("VK ID error:", error);
    toast({
      title: "Ошибка авторизации VK ID",
      description: "Не удалось завершить вход через VK ID",
      variant: "destructive",
    });
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

  useEffect(() => {
    if (!dialogOpen) {
      if (vkContainerRef.current) {
        vkContainerRef.current.innerHTML = "";
      }
      vkWidgetInitializedRef.current = false;
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen || authStep !== 'phone') return;
    if (vkWidgetInitializedRef.current) return;

    const initializeVKID = async () => {
      if (!window.VKIDSDK && !vkScriptLoadedRef.current) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = "https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js";
          script.async = true;
          script.onload = () => {
            vkScriptLoadedRef.current = true;
            resolve();
          };
          script.onerror = () => reject(new Error("VK ID SDK load failed"));
          document.body.appendChild(script);
        });
      }

      const VKID = window.VKIDSDK;
      const container = vkContainerRef.current;
      if (!VKID || !container || vkWidgetInitializedRef.current) {
        return;
      }

      VKID.Config.init({
        app: 54306382,
        redirectUrl: 'https://rev-market.vercel.app/',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: '',
      });

      const oAuth = new VKID.OAuthList();
      oAuth
        .render({
          container,
          scheme: 'dark',
          styles: {
            borderRadius: 6,
            height: 40,
          },
          oauthList: ['vkid'],
        })
        .on(VKID.WidgetEvents.ERROR, handleVKError)
        .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, (payload: any) => {
          const { code, device_id } = payload;
          VKID.Auth.exchangeCode(code, device_id)
            .then(handleVKSuccess)
            .catch(handleVKError);
        });

      vkWidgetInitializedRef.current = true;
    };

    initializeVKID().catch(handleVKError);
  }, [dialogOpen, authStep]);

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 z-0 opacity-90"
        style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 56%), hsl(330 81% 60%))" }}
      />

      <div className="relative z-10">
        <Navbar onCityChange={() => {}} />
        <Dialog
          open={dialogOpen}
          onOpenChange={(isOpen) => {
            setDialogOpen(isOpen);
            if (!isOpen) {
              navigate("/");
            }
          }}
        >
          <DialogContent className="max-w-lg md:max-w-xl max-h-[90vh] bg-black/30 backdrop-blur-xl border-white/20 p-0 overflow-hidden">
            <div className="overflow-y-auto max-h-[90vh] px-6 py-8 space-y-6 text-white [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full">
              <DialogHeader className="text-left space-y-2">
                <DialogTitle className="text-2xl md:text-3xl text-white">Авторизация по SMS</DialogTitle>
                <DialogDescription className="text-base text-white/80">
                  {authStep === 'phone'
                    ? "Введите номер телефона. Если аккаунта нет, мы создадим его автоматически"
                    : "Введите код из SMS, отправленного на ваш номер"}
                </DialogDescription>
              </DialogHeader>

              {authStep === 'phone' ? (
                <div className="space-y-5">
                  <div className="flex justify-center">
                    <div ref={vkContainerRef} className="min-h-[40px] w-full max-w-[280px]" />
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white/90">
                    <p className="flex items-center gap-2">
                      <span className="font-semibold">Примечание:</span>
                      SMS-коды могут быть недоступны в демо-версии
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-phone" className="text-white">Номер телефона</Label>
                    <Input
                      id="signin-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+7 (900) 123-45-67"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      required
                    />
                  </div>

                  <Button
                    onClick={() => sendSMSCode(phoneNumber)}
                    className="w-full bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity"
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
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-code" className="text-white">SMS код</Label>
                    <Input
                      id="signin-code"
                      type="text"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      required
                    />
                    <p className="text-sm text-white/70">
                      Код отправлен на номер {phoneNumber}
                    </p>
                  </div>

                  <Button
                    onClick={() => verifySMSCode(smsCode)}
                    className="w-full bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity"
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

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                    <Button
                      variant="link"
                      onClick={() => setAuthStep('phone')}
                      className="p-0 h-auto text-white hover:text-white/80"
                    >
                      Изменить номер
                    </Button>
                    <Button
                      variant="link"
                      onClick={resendSMS}
                      disabled={countdown > 0}
                      className="p-0 h-auto text-white hover:text-white/80 disabled:text-white/50"
                    >
                      {countdown > 0 ? `Повторить через ${countdown}с` : "Отправить повторно"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Auth;
