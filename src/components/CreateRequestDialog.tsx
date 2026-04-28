import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CATEGORIES } from "@/data/categories";
import { Loader2, HelpCircle } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { translateSupabaseError } from "@/utils/errorMessages";
import { RubleIcon } from "@/components/RubleIcon";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CITIES } from "@/data/cities";
import { checkAuth } from "@/utils/auth";
import { CityCombobox } from "@/components/CityCombobox";
import { formatPrice } from "@/lib/utils";
import { RequestCard } from "@/components/RequestCard";
import { isMockSmsAuth, signInForSmsMock } from "@/utils/mockSmsAuth";

const categories = CATEGORIES;

type GuestWizardStep = "product" | "contacts";

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialCity?: string;
}

export const CreateRequestDialog = ({ open, onOpenChange, onSuccess, initialCity }: CreateRequestDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authStep, setAuthStep] = useState<'phone' | 'code'>('phone');
  const [guestWizardStep, setGuestWizardStep] = useState<GuestWizardStep>("product");
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
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [cityTouched, setCityTouched] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    email: '',
    telegramUsername: '',
    subscribe: true,
  });

  const formatBudgetDisplay = (value: string) => {
    if (!value) return "";
    return formatPrice(value);
  };

  const handleBudgetChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setRequestData((prev) => ({
      ...prev,
      budget: digitsOnly,
    }));
  };

  useEffect(() => {
    if (open) {
      loadUser();
    }
  }, [open]);

  useEffect(() => {
    if (
      open &&
      initialCity &&
      initialCity !== "Россия, все города" &&
      !cityTouched
    ) {
      setRequestData((prev) => ({
        ...prev,
        city: initialCity,
      }));
    }
  }, [open, initialCity, cityTouched]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (open && !user) {
      setHowItWorksOpen(true);
    } else {
      setHowItWorksOpen(false);
    }
  }, [open, user]);

  const loadUser = async () => {
    const { user: currentUser, isAuthenticated } = await checkAuth();
    if (!isAuthenticated || !currentUser) {
      setUser(null);
      return;
    }
    setUser(currentUser);
    setGuestWizardStep("product");

    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, email, city")
      .eq("id", currentUser.id)
      .single();

    if (profile) {
      setRequestData((prev) => ({
        ...prev,
        city: profile.city || prev.city,
      }));

      if (profile.email) {
        setSubscriptionData((prev) => ({
          ...prev,
          email: profile.email || prev.email,
        }));
      }
    }
  };

  const saveNotificationSubscription = async (userId: string) => {
    if (!subscriptionData.subscribe || !subscriptionData.email) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notification_subscriptions')
        .upsert({
          user_id: userId,
          email: subscriptionData.email,
          telegram_username: subscriptionData.telegramUsername || null,
          is_active: true,
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('Failed to save subscription:', error);
        // Не блокируем создание запроса при ошибке подписки
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const resetForm = () => {
    // Clear countdown timer if it's running
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    setAuthStep('phone');
    setPhone("");
    setSmsCode("");
    setCountdown(0);
    setRequestData({
      title: "",
      description: "",
      category: "",
      budget: "",
      city: "",
    });
    setImages([]);
    setHowItWorksOpen(false);
    setCityTouched(false);
    setSubscriptionData({
      email: '',
      telegramUsername: '',
      subscribe: true,
    });
    setGuestWizardStep("product");
  };

  const goToContactsStep = () => {
    const isTitleEmpty = !requestData.title || requestData.title.trim() === "";
    const isCategoryEmpty = !requestData.category || requestData.category.trim() === "";
    const isCityEmpty = !requestData.city || requestData.city.trim() === "";
    if (isTitleEmpty || isCategoryEmpty || isCityEmpty) {
      const missing: string[] = [];
      if (isTitleEmpty) missing.push("Название");
      if (isCategoryEmpty) missing.push("Категория");
      if (isCityEmpty) missing.push("Город");
      toast({
        title: "Заполните поля",
        description: `Нужны: ${missing.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    setGuestWizardStep("contacts");
  };

  const goBackToProductStep = () => {
    setGuestWizardStep("product");
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
    const isTitleEmpty = !requestData.title || requestData.title.trim() === '';
    const isCategoryEmpty = !requestData.category || requestData.category.trim() === '';
    const isCityEmpty = !requestData.city || requestData.city.trim() === '';

    if (isTitleEmpty || isCategoryEmpty || isCityEmpty) {
      let missingFields = [];
      if (isTitleEmpty) missingFields.push("Название");
      if (isCategoryEmpty) missingFields.push("Категория");
      if (isCityEmpty) missingFields.push("Город");
      
      toast({
        title: "Ошибка",
        description: `Пожалуйста, заполните: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      toast({
        title: "Нужен номер для SMS",
        description: "Укажите телефон, чтобы отправить код, или введите номер в поле выше.",
        variant: "destructive",
      });
      return false;
    }

    if (subscriptionData.subscribe && !subscriptionData.email?.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите email для уведомлений о предложениях или снимите галочку подписки",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      if (isMockSmsAuth()) {
        setPhone(phoneNumber);
        setAuthStep("code");
        startCountdown();
        toast({
          title: "Заглушка SMS",
          description: "SMS не отправляется. Введите любой непустой код и нажмите «Подтвердить и опубликовать».",
        });
        return true;
      }

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
          return;
        }
        sessionUser = data.user;
      }

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
        return;
      }

      if (subscriptionData.subscribe && !subscriptionData.email?.trim()) {
        toast({
          title: "Ошибка",
          description: "Укажите email для уведомлений или отключите подписку",
          variant: "destructive",
        });
        return;
      }

      await createRequest(sessionUser.id);
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

  // Создание запроса для авторизованного пользователя
  const createRequest = async (userId: string) => {
    if (!requestData.title || !requestData.category || !requestData.city) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: inserted, error } = await supabase
        .from("requests")
        .insert([
          {
            user_id: userId,
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

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось создать запрос: " + translateSupabaseError(error.message),
          variant: "destructive",
        });
      } else if (inserted?.id) {
        if (subscriptionData.subscribe) {
          await saveNotificationSubscription(userId);
        }

        toast({
          title: "Успешно!",
          description: "Запрос создан",
        });
        resetForm();
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
        navigate(`/request/${inserted.id}`);
      }
    } catch (error: any) {
      console.error("Ошибка при создании запроса:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка: " + translateSupabaseError(error.message || "Неизвестная ошибка"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user) {
      await createRequest(user.id);
      return;
    }

    if (guestWizardStep === "product") {
      goToContactsStep();
      return;
    }

    if (authStep === "phone") {
      await sendSMSCode(phone);
    } else {
      await verifySMSCodeAndCreateRequest(smsCode);
    }
  };

  const startCountdown = () => {
    // Clear any existing timer before starting a new one
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

  const resendSMS = async () => {
    if (countdown > 0) return;
    await sendSMSCode(phone);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) {
        resetForm();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-black/30 backdrop-blur-xl border-white/20 p-0 overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] pl-6 pr-3 py-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:my-2 [&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-white/50">
        <DialogHeader className="pr-9">
          <DialogTitle className="text-2xl md:text-3xl text-white">
            Создать запрос
          </DialogTitle>
          <DialogDescription className="text-base text-white/80">
            {user
              ? "Заполните форму ниже, чтобы создать новый запрос"
              : guestWizardStep === "product"
                ? "Шаг 1 из 2: опишите искомый товар"
                : "Шаг 2 из 2: так запрос увидят продавцы. Укажите телефон и контакты для уведомлений о предложениях"}
          </DialogDescription>
        </DialogHeader>

        {/* Секция "Как это работает?" */}
        {!user && guestWizardStep === "product" && (
          <div className="mb-4">
            <Collapsible open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
              <CollapsibleTrigger className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
                <h2 className="text-sm md:text-base font-bold text-white">
                  Как это работает?
                </h2>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-white" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold mb-2 text-white">Создайте запрос</h3>
                    <p className="text-xs text-white/80">
                      Опишите, что вам нужно: название товара, описание, желаемую цену и сроки
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                      <RubleIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold mb-2 text-white">Получите предложения</h3>
                    <p className="text-xs text-white/80">
                      Продавцы найдут вашу заявку и предложат свои варианты с ценами и условиями
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold mb-2 text-white">Выберите лучшее</h3>
                    <p className="text-xs text-white/80">
                      Сравните предложения, выберите подходящее и оформите сделку безопасно
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(user || (!user && guestWizardStep === "product")) && (
            <>
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Название</Label>
            <Input
              id="title"
              placeholder="Например: Ищу iPhone 15 Pro"
              value={requestData.title}
              onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Описание</Label>
            <Textarea
              id="description"
              placeholder="Подробно опишите, что вам нужно..."
              className="min-h-[80px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
              value={requestData.description}
              onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-white">Категория</Label>
              <Select
                value={requestData.category}
                onValueChange={(value) => setRequestData({ ...requestData, category: value })}
              >
                <SelectTrigger id="category" className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent className="bg-black/40 backdrop-blur-xl border-white/10">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-white focus:bg-white/20 focus:text-white">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-white">Ваш бюджет</Label>
              <div className="relative">
                <Input
                  id="budget"
                  inputMode="numeric"
                  placeholder="Например: 50 000"
                  value={formatBudgetDisplay(requestData.budget)}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pr-12"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400 text-base">
                  ₽
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-white">Город</Label>
            {user ? (
              <CityCombobox
                value={requestData.city}
                onChange={(value) => {
                  setCityTouched(true);
                  setRequestData({ ...requestData, city: value });
                }}
                placeholder="Выберите или введите город"
              />
            ) : (
              <Select
                value={requestData.city}
                onValueChange={(value) => {
                  setCityTouched(true);
                  setRequestData({ ...requestData, city: value });
                }}
              >
                <SelectTrigger id="city" className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Выберите город" />
                </SelectTrigger>
                <SelectContent className="bg-black/40 backdrop-blur-xl border-white/10">
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city} className="text-white focus:bg-white/20 focus:text-white">
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
            </>
          )}

          {!user && guestWizardStep === "contacts" && (
            <div className="space-y-3">
              <p className="text-sm text-white/90 text-center">
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
            </div>
          )}

          {(user || (!user && guestWizardStep === "contacts")) && (
          <div className="space-y-4 p-4 bg-blue-50/10 border border-blue-200/20 rounded-lg">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="subscribe-notifications"
                checked={subscriptionData.subscribe}
                onChange={(e) => setSubscriptionData({
                  ...subscriptionData,
                  subscribe: e.target.checked
                })}
                disabled={!user && authStep === 'code'}
                className="rounded cursor-pointer"
              />
              <Label htmlFor="subscribe-notifications" className="text-white cursor-pointer">
                Получать уведомления о новых предложениях
              </Label>
            </div>
            
            {subscriptionData.subscribe && (
              <div className="space-y-3 mt-3 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="notification-email" className="text-white text-sm">
                    Email для уведомлений
                  </Label>
                  <Input
                    id="notification-email"
                    type="email"
                    placeholder="your@email.com"
                    value={subscriptionData.email}
                    onChange={(e) => setSubscriptionData({
                      ...subscriptionData,
                      email: e.target.value
                    })}
                    disabled={!user && authStep === 'code'}
                    required={subscriptionData.subscribe}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telegram-username" className="text-white text-sm">
                    Telegram username (необязательно)
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">@</span>
                    <Input
                      id="telegram-username"
                      type="text"
                      placeholder="username"
                      value={subscriptionData.telegramUsername}
                      onChange={(e) => setSubscriptionData({
                        ...subscriptionData,
                        telegramUsername: e.target.value.replace('@', '')
                      })}
                      disabled={!user && authStep === 'code'}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    />
                  </div>
                  <p className="text-xs text-white/60">
                    Укажите ваш Telegram username для получения уведомлений в боте
                  </p>
                </div>
              </div>
            )}
          </div>
          )}

          {!user && guestWizardStep === "contacts" && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">
                  Телефон{" "}
                  <span className="text-white/60 font-normal">(необязательно, для SMS-кода)</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="+7 (999) 123-45-67"
                  value={phone}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^+\d]/g, '');
                    if (value.startsWith('9')) {
                      value = '+7' + value;
                    } else if (value.startsWith('8')) {
                      value = '+7' + value.substring(1);
                    } else if (value.startsWith('7') && !value.startsWith('+')) {
                      value = '+' + value;
                    } else if (!value.startsWith('+') && value.length > 0) {
                      value = '+7' + value;
                    }
                    setPhone(value);
                  }}
                  disabled={authStep === 'code'}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
          )}

          {!user && guestWizardStep === "contacts" && authStep === 'code' && (
            <div className="space-y-2">
              <Label htmlFor="smsCode" className="text-white">Код из SMS</Label>
              <Input
                id="smsCode"
                placeholder="Введите код из SMS"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                maxLength={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              {countdown > 0 && (
                <p className="text-sm text-white/80">
                  Отправить повторно через {countdown} сек.
                </p>
              )}
              {countdown === 0 && (
                <Button
                  type="button"
                  variant="link"
                  onClick={resendSMS}
                  className="p-0 h-auto text-white hover:text-white/80"
                >
                  Отправить код повторно
                </Button>
              )}
            </div>
          )}

          {(user || (!user && guestWizardStep === "product")) && (
          <ImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={5}
            variant="transparent"
          />
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            {!user && guestWizardStep === "contacts" && (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={goBackToProductStep}
                disabled={loading}
                className="sm:w-auto border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                Изменить запрос
              </Button>
            )}
            <Button 
              type="submit" 
              size="lg" 
              className="flex-1 w-full bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity" 
              disabled={loading}
            >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {user
                  ? "Публикация..."
                  : guestWizardStep === "contacts" && authStep === "phone"
                    ? "Отправка SMS..."
                    : guestWizardStep === "contacts"
                      ? "Проверка кода..."
                      : "Загрузка..."}
              </>
            ) : (
              user
                ? "Опубликовать запрос"
                : guestWizardStep === "product"
                  ? "Далее: контакты и публикация"
                  : authStep === "phone"
                    ? "Отправить код"
                    : "Подтвердить и опубликовать"
            )}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

