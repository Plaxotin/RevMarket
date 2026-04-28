import { useState, useRef, useEffect } from "react";
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
import { Loader2, X, HelpCircle } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { translateSupabaseError } from "@/utils/errorMessages";
import { validateRussianPhone, handlePhoneInput, normalizePhone } from "@/utils/phoneValidation";
import { RubleIcon } from "@/components/RubleIcon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CITIES } from "@/data/cities";
import { RequestCard } from "@/components/RequestCard";
import { isMockSmsAuth, signInForSmsMock } from "@/utils/mockSmsAuth";

const categories = CATEGORIES;

type WizardStep = "product" | "contacts";

const AuthCreateRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    city: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>("product");
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  const goToContactsStep = () => {
    const missing: string[] = [];
    if (!requestData.title?.trim()) missing.push("Название");
    if (!requestData.description?.trim()) missing.push("Описание");
    if (!requestData.category?.trim()) missing.push("Категория");
    if (!requestData.city?.trim()) missing.push("Город");
    if (missing.length) {
      toast({
        title: "Заполните поля",
        description: `Нужны: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    setWizardStep("contacts");
  };

  const goBackToProductStep = () => {
    setWizardStep("product");
    setAuthStep("phone");
    setSmsCode("");
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(0);
  };

  // Функция для отправки SMS кода
  const sendSMSCode = async (phoneNumber: string) => {
    // Проверяем валидность данных запроса перед отправкой SMS
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
      return false;
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите номер телефона",
        variant: "destructive",
      });
      return false;
    }

    // Валидация номера телефона
    const validation = validateRussianPhone(phoneNumber);
    if (!validation.valid) {
      setPhoneError(validation.error || 'Некорректный номер телефона');
      toast({
        title: "Ошибка валидации",
        description: validation.error || 'Некорректный номер телефона',
        variant: "destructive",
      });
      return false;
    }

    setPhoneError(null);
    const normalizedPhone = validation.normalized || normalizePhone(phoneNumber);
    
    if (!normalizedPhone) {
      toast({
        title: "Ошибка",
        description: "Не удалось обработать номер телефона",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      if (isMockSmsAuth()) {
        setPhone(normalizedPhone);
        setAuthStep("code");
        startCountdown();
        toast({
          title: "Заглушка SMS",
          description: "SMS не отправляется. Введите любой непустой код и подтвердите.",
        });
        return true;
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
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
        setPhone(normalizedPhone);
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

  // Функция для проверки SMS кода и создания запроса
  const verifySMSCodeAndCreateRequest = async (code: string) => {
    if (!code || code.trim() === '') {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите код из SMS",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let sessionUser: { id: string } | null = null;

      if (isMockSmsAuth()) {
        const { data, error } = await signInForSmsMock(supabase);
        if (error || !data.user) {
          toast({
            title: "Заглушка SMS",
            description:
              translateSupabaseError(error?.message ?? "") ||
              "Не удалось войти. Включите Anonymous sign-ins в Supabase (Authentication → Providers → Anonymous).",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        sessionUser = data.user;
      } else {
        const { data, error } = await supabase.auth.verifyOtp({
          phone: phone,
          token: code,
          type: "sms",
        });

        if (error) {
          toast({
            title: "Неверный код",
            description: "Проверьте правильность введенного кода",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        sessionUser = data.user;
      }

      // Profile creation is handled by the backend handle_new_user trigger
      // If city needs to be updated, do it after authentication
      if (sessionUser && requestData.city) {
        try {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ city: requestData.city })
            .eq("id", sessionUser.id);
          
          if (updateError) {
            console.warn("Could not update profile city:", updateError);
          }
        } catch (error) {
          console.error("Error updating profile city:", error);
        }
      }

      if (!sessionUser) {
        toast({
          title: "Ошибка авторизации",
          description: "Пользователь не авторизован",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { data: inserted, error: requestError } = await supabase
        .from("requests")
        .insert([
          {
            user_id: sessionUser.id,
            title: requestData.title,
            description: requestData.description,
            category: requestData.category,
            budget: requestData.budget || null,
            city: requestData.city || null,
            images: images.length > 0 ? images : null,
          },
        ])
        .select("id")
        .single();

      if (requestError) {
        toast({
          title: "Ошибка создания запроса",
          description: translateSupabaseError(requestError.message),
          variant: "destructive",
        });
      } else if (inserted?.id) {
        toast({
          title: "Успешно!",
          description: "Запрос создан",
        });
        navigate(`/request/${inserted.id}`);
      }
    } catch (error) {
      console.error("Ошибка:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при проверке кода",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    setCountdown(60);
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Функция для повторной отправки SMS
  const resendSMS = async () => {
    if (countdown > 0) return;
    await sendSMSCode(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (wizardStep === "product") {
      goToContactsStep();
      return;
    }

    if (authStep === "phone") {
      await sendSMSCode(phone);
    } else {
      await verifySMSCodeAndCreateRequest(smsCode);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Градиентный фон на весь сайт */}
      <div className="fixed inset-0 z-0 bg-gradient-hero opacity-90" style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 56%), hsl(330 81% 60%))' }} />
      
      {/* Контент поверх градиента */}
      <div className="relative z-10">
        <Navbar onCityChange={() => {}} />
        <div className="container px-4 py-12 mx-auto max-w-4xl relative">
          {/* Секция "Как это работает?" */}
          {wizardStep === "product" && (
          <div className="mb-8" style={{ background: 'transparent' }}>
            <div className="text-center">
              <Collapsible open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
                <CollapsibleTrigger className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <h2 className="text-[0.9rem] md:text-[1.2rem] font-bold text-white">
                    Как это работает?
                  </h2>
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    <HelpCircle className="w-6 h-6 text-white" />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Шаг 1 */}
                    <div className="text-center">
                      <div className="w-[68px] h-[68px] mx-auto mb-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-[34px] h-[34px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-white">Создайте запрос</h3>
                      <p className="text-sm text-white/90">
                        Опишите, что вам нужно: название товара, описание, желаемую цену и сроки
                      </p>
                    </div>
                    
                    {/* Шаг 2 */}
                    <div className="text-center">
                      <div className="w-[68px] h-[68px] mx-auto mb-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <RubleIcon className="w-[34px] h-[34px]" />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-white">Получите предложения</h3>
                      <p className="text-sm text-white/90">
                        Продавцы найдут вашу заявку и предложат свои варианты с ценами и условиями
                      </p>
                    </div>
                    
                    {/* Шаг 3 */}
                    <div className="text-center">
                      <div className="w-[68px] h-[68px] mx-auto mb-5 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        <svg className="w-[34px] h-[34px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-white">Выберите лучшее</h3>
                      <p className="text-sm text-white/90">
                        Сравните предложения, выберите подходящее и оформите сделку безопасно
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
          )}
          
          <Card className="shadow-card animate-slide-up relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-20"
            onClick={() => navigate("/")}
          >
            <X className="h-6 w-6" />
          </Button>
          <CardHeader>
            <CardTitle className="text-3xl">Создать запрос</CardTitle>
            <CardDescription className="text-base">
              {wizardStep === "product"
                ? "Шаг 1 из 2: опишите искомый товар"
                : "Шаг 2 из 2: предпросмотр запроса, телефон и публикация"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {wizardStep === "product" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    placeholder="Например: Ищу iPhone 15 Pro"
                    value={requestData.title}
                    onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Описание *</Label>
                  <Textarea
                    id="description"
                    placeholder="Подробно опишите, что вам нужно..."
                    className="min-h-[60px] max-h-[150px] resize-none overflow-hidden"
                    value={requestData.description}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      if (lines.length <= 5) {
                        setRequestData({ ...requestData, description: e.target.value });
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="city">Город *</Label>
                  <Select
                    value={requestData.city}
                    onValueChange={(value) => setRequestData({ ...requestData, city: value })}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Выберите город" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              )}

              {wizardStep === "contacts" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Так ваш запрос увидят продавцы после публикации
                  </p>
                  <RequestCard
                    id="__preview__"
                    title={requestData.title}
                    description={requestData.description}
                    category={requestData.category}
                    budget={requestData.budget}
                    location={requestData.city}
                    timeAgo="Предпросмотр"
                    offersCount={0}
                    images={images}
                    preview
                  />

                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      placeholder="+7 (999) 123-45-67"
                      value={phone}
                      onChange={(e) => {
                        const formatted = handlePhoneInput(e.target.value);
                        setPhone(formatted);
                        setPhoneError(null);
                      }}
                      onBlur={() => {
                        if (phone) {
                          const validation = validateRussianPhone(phone);
                          if (!validation.valid) {
                            setPhoneError(validation.error || null);
                          } else {
                            setPhoneError(null);
                          }
                        }
                      }}
                      className={phoneError ? 'border-red-500' : ''}
                      disabled={authStep === 'code'}
                    />
                    {phoneError && (
                      <p className="text-sm text-red-500">{phoneError}</p>
                    )}
                    {!phoneError && phone && (
                      <p className="text-sm text-gray-500">
                        Формат: +7 (XXX) XXX-XX-XX
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Поле для SMS кода */}
              {wizardStep === "contacts" && authStep === 'code' && (
                <div className="space-y-2">
                  <Label htmlFor="smsCode">Код из SMS *</Label>
                  <Input
                    id="smsCode"
                    placeholder="Введите код из SMS"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value)}
                    maxLength={6}
                  />
                  {countdown > 0 && (
                    <p className="text-sm text-gray-500">
                      Отправить повторно через {countdown} сек.
                    </p>
                  )}
                  {countdown === 0 && (
                    <Button
                      type="button"
                      variant="link"
                      onClick={resendSMS}
                      className="p-0 h-auto"
                    >
                      Отправить код повторно
                    </Button>
                  )}
                </div>
              )}

              {wizardStep === "product" && (
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
                className=""
              />
              )}

              <div className="pt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                {wizardStep === "contacts" && (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={goBackToProductStep}
                    disabled={loading}
                    className="sm:w-auto shrink-0"
                  >
                    Изменить запрос
                  </Button>
                )}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="flex-1 w-full" 
                  variant={wizardStep === "contacts" && authStep === 'phone' ? 'sms-gradient' : 'default'} 
                  disabled={
                    loading ||
                    (wizardStep === "contacts" &&
                      authStep === "phone" &&
                      (!!phoneError || !phone))
                  }
                >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {wizardStep === "product"
                      ? "Загрузка..."
                      : authStep === "phone"
                        ? "Отправка SMS..."
                        : "Проверка кода..."}
                  </>
                ) : (
                  wizardStep === "product"
                    ? "Далее: телефон и публикация"
                    : authStep === "phone"
                      ? "Отправить SMS код"
                      : "Подтвердить и опубликовать"
                )}
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

export default AuthCreateRequest;
