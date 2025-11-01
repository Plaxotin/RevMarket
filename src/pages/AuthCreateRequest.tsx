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
import { Loader2, X, HelpCircle } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { translateSupabaseError } from "@/utils/errorMessages";
import { RubleIcon } from "@/components/RubleIcon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const categories = CATEGORIES;

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

const AuthCreateRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [requestData, setRequestData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    city: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

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

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
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
        setPhone(phoneNumber);
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
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: code,
        type: 'sms'
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

      // Проверяем, существует ли профиль, и создаем его автоматически, если нужно
      try {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user?.id)
          .single();
        
        if (!existingProfile) {
          // Создаем профиль автоматически если его нет
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: data.user?.id,
                name: "Пользователь",
                phone: phone,
                email: null,
                city: requestData.city || null,
              },
            ]);
          
          if (insertError) {
            console.warn("Could not create profile:", insertError);
          }
        } else if (requestData.city) {
          // Обновляем город в профиле, если он указан
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ city: requestData.city })
            .eq("id", data.user?.id);
          
          if (updateError) {
            console.warn("Could not update profile city:", updateError);
          }
        }
      } catch (error) {
        console.error("Error handling profile:", error);
      }

      // Проверяем, что пользователь авторизован
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
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
          description: translateSupabaseError(requestError.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Успешно!",
          description: "Запрос создан",
        });
        navigate("/");
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
    await sendSMSCode(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authStep === 'phone') {
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
                      <h3 className="text-lg font-bold mb-2 text-white">Создайте заявку</h3>
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
            <CardTitle className="text-3xl">Создание запроса и регистрация</CardTitle>
            <CardDescription className="text-base">
              Создайте свой первый запрос
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Данные запроса */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    placeholder="Например: Ищу iPhone 15 Pro"
                    value={requestData.title}
                    onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
                    disabled={authStep === 'code'}
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
                    disabled={authStep === 'code'}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Категория *</Label>
                    <Select
                      value={requestData.category}
                      onValueChange={(value) => setRequestData({ ...requestData, category: value })}
                      disabled={authStep === 'code'}
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
                      disabled={authStep === 'code'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Город</Label>
                    <Select
                      value={requestData.city}
                      onValueChange={(value) => setRequestData({ ...requestData, city: value })}
                      disabled={authStep === 'code'}
                    >
                      <SelectTrigger id="city">
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

                  <div className="space-y-2">
                    <Label htmlFor="phone">Телефон *</Label>
                    <Input
                      id="phone"
                      placeholder="+7 (999) 123-45-67"
                      value={phone}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Разрешаем только цифры и "+"
                        value = value.replace(/[^+\d]/g, '');
                        // Если в начале вводят 9, добавляем +7
                        if (value.startsWith('9')) {
                          value = '+7' + value;
                        }
                        // Если вводят "+", разрешаем его только первым символом
                        if (value.startsWith('+')) {
                          setPhone(value);
                        } else if (/^\d/.test(value)) {
                          // Если начинается с цифры (но не с 9), то добавляем +7
                          if (value.startsWith('7')) {
                            setPhone('+' + value);
                          } else if (value.startsWith('8')) {
                            setPhone('+7' + value.substring(1));
                          } else {
                            setPhone(value);
                          }
                        } else {
                          setPhone(value);
                        }
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        let value = target.value.replace(/[^+\d]/g, '');
                        // Форматируем номер в маске +7 (999) 123-45-67
                        if (value.startsWith('+7')) {
                          const digits = value.substring(2).replace(/\D/g, '');
                          if (digits.length === 0) {
                            target.value = '+7';
                          } else if (digits.length <= 3) {
                            target.value = `+7 (${digits}`;
                          } else if (digits.length <= 6) {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
                          } else if (digits.length <= 8) {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                          } else {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
                          }
                          setPhone(target.value);
                        } else if (value.startsWith('7')) {
                          const digits = value.substring(1).replace(/\D/g, '');
                          if (digits.length === 0) {
                            target.value = '+7';
                          } else if (digits.length <= 3) {
                            target.value = `+7 (${digits}`;
                          } else if (digits.length <= 6) {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
                          } else if (digits.length <= 8) {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                          } else {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
                          }
                          setPhone(target.value);
                        } else if (value.startsWith('8')) {
                          const digits = value.substring(1).replace(/\D/g, '');
                          if (digits.length === 0) {
                            target.value = '+7';
                          } else if (digits.length <= 3) {
                            target.value = `+7 (${digits}`;
                          } else if (digits.length <= 6) {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
                          } else if (digits.length <= 8) {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                          } else {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
                          }
                          setPhone(target.value);
                        } else if (value.startsWith('9') || value.match(/^\d/)) {
                          const digits = value.replace(/\D/g, '');
                          if (digits.length === 0) {
                            target.value = '';
                          } else if (digits.length <= 3) {
                            target.value = `+7 (${digits}`;
                          } else if (digits.length <= 6) {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
                          } else if (digits.length <= 8) {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
                          } else {
                            target.value = `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
                          }
                          setPhone(target.value);
                        }
                      }}
                      disabled={authStep === 'code'}
                    />
                  </div>
                </div>
              </div>

              {/* Поле для SMS кода */}
              {authStep === 'code' && (
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

              {/* Загрузка изображений */}
              <ImageUpload
                images={images}
                onImagesChange={setImages}
                maxImages={5}
                className=""
              />

              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full" variant={authStep === 'phone' ? 'sms-gradient' : 'default'} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {authStep === 'phone' ? "Отправка SMS..." : "Проверка кода..."}
                  </>
                ) : (
                  authStep === 'phone' ? "Отправить SMS код" : "Подтвердить код и создать запрос"
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
