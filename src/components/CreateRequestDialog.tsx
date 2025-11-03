import { useState, useEffect } from "react";
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

const categories = CATEGORIES;

interface CreateRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateRequestDialog = ({ open, onOpenChange, onSuccess }: CreateRequestDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
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

  useEffect(() => {
    if (open) {
      loadUser();
    }
  }, [open]);

  const loadUser = async () => {
    const { user: currentUser, isAuthenticated } = await checkAuth();
    if (isAuthenticated && currentUser) {
      setUser(currentUser);
      
      // Загружаем профиль пользователя для автозаполнения
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, email, city")
        .eq("id", currentUser.id)
        .single();

      if (profile) {
        setRequestData(prev => ({
          ...prev,
          city: profile.city || prev.city,
        }));
      }
    }
  };

  const resetForm = () => {
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
  };

  // Функция для отправки SMS кода
  const sendSMSCode = async (phoneNumber: string) => {
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

      if (data.user && requestData.city) {
        try {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ city: requestData.city })
            .eq("id", data.user.id);
          
          if (updateError) {
            console.warn("Could not update profile city:", updateError);
          }
        } catch (error) {
          console.error("Error updating profile city:", error);
        }
      }

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

      await createRequest(currentUser.id);
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
    if (!requestData.title || !requestData.description || !requestData.category) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
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
      resetForm();
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Если пользователь авторизован
    if (user) {
      await createRequest(user.id);
    } else {
      // Если не авторизован
      if (authStep === 'phone') {
        await sendSMSCode(phone);
      } else {
        await verifySMSCodeAndCreateRequest(smsCode);
      }
    }
  };

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
            {user ? "Создать запрос" : "Создание запроса и регистрация"}
          </DialogTitle>
          <DialogDescription className="text-base text-white/80">
            {user ? "Заполните форму ниже, чтобы создать новый запрос" : "Создайте свой первый запрос"}
          </DialogDescription>
        </DialogHeader>

        {/* Секция "Как это работает?" */}
        {!user && (
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
                    <h3 className="text-sm font-bold mb-2 text-white">Создайте заявку</h3>
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
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">Название *</Label>
            <Input
              id="title"
              placeholder="Например: Ищу iPhone 15 Pro"
              value={requestData.title}
              onChange={(e) => setRequestData({ ...requestData, title: e.target.value })}
              disabled={authStep === 'code'}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Описание *</Label>
            <Textarea
              id="description"
              placeholder="Подробно опишите, что вам нужно..."
              className="min-h-[80px] bg-white/10 border-white/20 text-white placeholder:text-white/50"
              value={requestData.description}
              onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
              disabled={authStep === 'code'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-white">Категория *</Label>
              <Select
                value={requestData.category}
                onValueChange={(value) => setRequestData({ ...requestData, category: value })}
                disabled={authStep === 'code'}
              >
                <SelectTrigger id="category" className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="text-white focus:bg-white/20 focus:text-white">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="text-white">Бюджет</Label>
              <Input
                id="budget"
                placeholder="Например: 50 000 - 70 000 ₽"
                value={requestData.budget}
                onChange={(e) => setRequestData({ ...requestData, budget: e.target.value })}
                disabled={authStep === 'code'}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-white">Город</Label>
              {user ? (
                <CityCombobox
                  value={requestData.city}
                  onChange={(value) => setRequestData({ ...requestData, city: value })}
                  placeholder="Выберите или введите город"
                />
              ) : (
                <Select
                  value={requestData.city}
                  onValueChange={(value) => setRequestData({ ...requestData, city: value })}
                  disabled={authStep === 'code'}
                >
                  <SelectTrigger id="city" className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Выберите город" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-xl border-white/20">
                    {CITIES.map((city) => (
                      <SelectItem key={city} value={city} className="text-white focus:bg-white/20 focus:text-white">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {!user && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Телефон *</Label>
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
          </div>

          {!user && authStep === 'code' && (
            <div className="space-y-2">
              <Label htmlFor="smsCode" className="text-white">Код из SMS *</Label>
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

          <ImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={5}
            variant="transparent"
          />

          <Button 
            type="submit" 
            size="lg" 
            className="w-full bg-gradient-to-r from-primary to-accent-purple hover:opacity-90 transition-opacity" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {user ? "Публикация..." : (authStep === 'phone' ? "Отправка SMS..." : "Проверка кода...")}
              </>
            ) : (
              user ? "Опубликовать запрос" : (authStep === 'phone' ? "Отправить SMS код" : "Подтвердить код и создать запрос")
            )}
          </Button>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

