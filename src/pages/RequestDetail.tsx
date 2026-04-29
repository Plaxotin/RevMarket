import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, MessageSquare, User, Heart, Loader2, Trash2, ChevronLeft, ChevronRight, X, CheckCircle, Pencil, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { checkAuth } from "@/utils/auth";
import { formatPrice } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityCombobox } from "@/components/CityCombobox";
import { ImageUpload } from "@/components/ImageUpload";
import { CATEGORIES } from "@/data/categories";
import { translateSupabaseError } from "@/utils/errorMessages";
import { BuyerContacts } from "@/components/BuyerContacts";
import { ReportButton } from "@/components/ReportButton";
import { AiMatchesPanel } from "@/components/AiMatchesPanel";
import {
  AiMatch,
  createDemoAiMatches,
  normalizeAiMode,
  normalizeAiStatus,
  normalizeSellerVisibility,
} from "@/lib/aiMarketplace";

/** Сайдбар продавца показываем только для заявок, открытых для индивидуальных откликов. */
const SHOW_OFFER_SIDEBAR = true;

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays} дн. назад`;
  if (diffHours > 0) return `${diffHours} ч. назад`;
  if (diffMins > 0) return `${diffMins} мин. назад`;
  return "только что";
};

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [aiMatches, setAiMatches] = useState<AiMatch[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const companyInputRef = useRef<HTMLInputElement>(null);
  const [offerForm, setOfferForm] = useState({
    company: "",
    price: "",
    description: "",
    phone: "",
    email: "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    city: "",
    deadline: "",
    images: [] as string[],
  });
  const aiStatus = normalizeAiStatus(request?.ai_search_status);
  const aiMode = normalizeAiMode(request?.ai_mode);
  const sellerVisibility = normalizeSellerVisibility(request?.seller_visibility_status);
  const isOwner = !!user && !!request && user.id === request.user_id;
  const sellerPublished = sellerVisibility === "published";

  const formatEditBudgetDisplay = (value: string) => {
    if (!value) return "";
    return formatPrice(value);
  };

  const handleEditBudgetChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setEditForm((prev) => ({ ...prev, budget: digitsOnly }));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (!editOpen || !request) return;
    setEditForm({
      title: request.title ?? "",
      description: request.description ?? "",
      category: request.category ?? "",
      budget: request.budget ? String(request.budget).replace(/\D/g, "") : "",
      city: request.city ?? "",
      deadline: request.deadline ?? "",
      images: Array.isArray(request.images) ? [...request.images] : [],
    });
    // только при открытии модалки, чтобы правки не сбрасывались при обновлении request
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editOpen]);

  useEffect(() => {
    if (!SHOW_OFFER_SIDEBAR) return;
    const shouldFocus = new URLSearchParams(location.search).get("focus") === "true";
    if (shouldFocus && companyInputRef.current && user) {
      setTimeout(() => {
        companyInputRef.current?.focus();
      }, 500);
    }
  }, [location.search, user]);

  const loadData = async () => {
    setLoading(true);

    // Get current user
    const { user: currentUser } = await checkAuth();
    setUser(currentUser);

    // Auto-fill contact info from profile
    if (currentUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, email, name")
        .eq("id", currentUser.id)
        .single();

      if (profile) {
        setOfferForm(prev => ({
          ...prev,
          company: profile.name || prev.company,
          phone: profile.phone || prev.phone,
          email: profile.email || prev.email,
        }));
      }
    }

    // Load request
    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select(`
        *,
        profiles!requests_user_id_fkey (
          name
        )
      `)
      .eq("id", id)
      .single();

    if (requestError) {
      toast({
        title: "Ошибка",
        description: "Запрос не найден",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setRequest(requestData);

    // Load offers (contact скрыт для посторонних через view на стороне БД)
    const { data: offersData } = await supabase
      .from("offers_visible")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    setOffers(offersData || []);

    if (currentUser && requestData?.user_id === currentUser.id) {
      const { data: aiMatchesData } = await supabase
        .from("ai_offer_matches")
        .select("*")
        .eq("request_id", id)
        .order("match_score", { ascending: false });

      setAiMatches((aiMatchesData || []) as AiMatch[]);
    } else {
      setAiMatches([]);
    }

    // Проверяем подписку на уведомления
    if (currentUser && requestData?.user_id === currentUser.id) {
      const { data: subscription } = await supabase
        .from('notification_subscriptions')
        .select('is_active')
        .eq('user_id', currentUser.id)
        .eq('is_active', true)
        .single();
        
      setIsSubscribed(!!subscription);
    }

    // Check if favorite
    if (currentUser) {
      const { data: favoriteData } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", currentUser.id)
        .eq("request_id", id)
        .maybeSingle();

      setIsFavorite(!!favoriteData);
    }

    setLoading(false);
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы добавить в избранное",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (isFavorite) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("request_id", id);

      if (!error) {
        setIsFavorite(false);
        toast({
          title: "Удалено из избранного",
        });
      }
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert([{ user_id: user.id, request_id: id }]);

      if (!error) {
        setIsFavorite(true);
        toast({
          title: "Добавлено в избранное",
        });
      }
    }
  };

  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы сделать предложение",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Проверяем, не создал ли уже пользователь предложение
    const existingOffer = offers.find(offer => offer.user_id === user.id);
    if (existingOffer) {
      toast({
        title: "Предложение уже создано",
        description: "Вы уже создали предложение на этот запрос. Для изменения предложения удалите текущее и создайте новое.",
        variant: "destructive",
      });
      return;
    }

    if (!offerForm.company || !offerForm.price || !offerForm.description || !offerForm.phone) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    // Валидация email, если он указан
    if (offerForm.email && !offerForm.email.includes('@')) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите корректный email адрес",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const contact = `${offerForm.phone}${offerForm.email ? `, ${offerForm.email}` : ''}`;

    const { error } = await supabase
      .from("offers")
      .insert([
        {
          request_id: id,
          user_id: user.id,
          company: offerForm.company,
          price: offerForm.price,
          description: offerForm.description,
          contact: contact,
        },
      ]);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить предложение: " + translateSupabaseError(error.message),
        variant: "destructive",
      });
    } else {
      // Вызываем Edge Function для отправки уведомлений владельцу запроса
      try {
        const { data: offerData } = await supabase
          .from('offers')
          .select('id')
          .eq('request_id', id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (offerData) {
          // Вызов Edge Function асинхронно, не блокируя UI
          supabase.functions.invoke('send-offer-notification', {
            body: {
              requestId: id,
              offerId: offerData.id
            }
          }).catch(error => {
            console.error('Failed to send notifications:', error)
            // Не показываем ошибку пользователю, т.к. предложение уже создано
          })
        }
      } catch (error) {
        console.error('Failed to trigger notifications:', error)
      }

      toast({
        title: "Успешно!",
        description: "Ваше предложение отправлено",
      });
      // Reset form but keep pre-filled values
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone, email, name")
          .eq("id", user.id)
          .single();

        if (profile) {
          setOfferForm({
            company: profile.name || "",
            price: "",
            description: "",
            phone: profile.phone || "",
            email: profile.email || "",
          });
        } else {
          setOfferForm({ company: "", price: "", description: "", phone: "", email: "" });
        }
      } else {
        setOfferForm({ company: "", price: "", description: "", phone: "", email: "" });
      }
      loadData();
    }

    setSubmitting(false);
  };

  const handleGenerateDemoAiMatches = async () => {
    if (!user || !request || user.id !== request.user_id || !id) return;

    setSubmitting(true);
    try {
      const demoMatches = createDemoAiMatches(request, id);
      const { error: insertError } = await supabase
        .from("ai_offer_matches")
        .insert(demoMatches);

      if (insertError) {
        toast({
          title: "Ошибка AI-подбора",
          description: translateSupabaseError(insertError.message),
          variant: "destructive",
        });
        return;
      }

      const completedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          ai_search_status: "results_ready",
          ai_search_completed_at: completedAt,
        })
        .eq("id", id);

      if (updateError) {
        toast({
          title: "Подборка создана",
          description: "Но статус заявки не обновился: " + translateSupabaseError(updateError.message),
        });
      } else {
        setRequest((prev: any) =>
          prev
            ? {
                ...prev,
                ai_search_status: "results_ready",
                ai_search_completed_at: completedAt,
              }
            : prev
        );
      }

      toast({
        title: "AI-подборка готова",
        description: "Показали лучшие варианты и подсказки для ручной проверки.",
      });
      supabase.functions.invoke("send-ai-results-notification", {
        body: { requestId: id },
      }).catch((error) => {
        console.error("Failed to send AI results notification:", error);
      });
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishForSellers = async () => {
    if (!user || !request || user.id !== request.user_id || !id) return;

    setSubmitting(true);
    try {
      const nextAiMode = aiMode === "ai_only" ? "ai_and_sellers" : aiMode;
      const { error } = await supabase
        .from("requests")
        .update({
          ai_mode: nextAiMode,
          seller_visibility_status: "published",
        })
        .eq("id", id);

      if (error) {
        toast({
          title: "Ошибка публикации",
          description: translateSupabaseError(error.message),
          variant: "destructive",
        });
        return;
      }

      setRequest((prev: any) =>
        prev
          ? {
              ...prev,
              ai_mode: nextAiMode,
              seller_visibility_status: "published",
            }
          : prev
      );
      toast({
        title: "Заявка открыта продавцам",
        description: "Теперь продавцы смогут оставить индивидуальные предложения.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateSellerDraft = () => {
    if (!request) return;

    const budgetLine = request.budget ? `Ориентируемся на ваш бюджет ${formatPrice(request.budget)} ₽.` : "Готовы предложить несколько вариантов по бюджету.";
    setOfferForm((prev) => ({
      ...prev,
      description:
        prev.description ||
        `Здравствуйте! Можем предложить вариант по запросу "${request.title}". ${budgetLine} Подскажем по наличию, срокам и комплектации, а также предложим аналог, если точной позиции не будет.`,
    }));
  };

  const handleSaveRequestEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !request || user.id !== request.user_id || !id) return;

    const title = editForm.title.trim();
    const description = editForm.description.trim();
    if (!title || !description || !editForm.category) {
      toast({
        title: "Заполните поля",
        description: "Нужны название, описание и категория",
        variant: "destructive",
      });
      return;
    }

    setEditSaving(true);
    try {
      const { error } = await supabase
        .from("requests")
        .update({
          title,
          description,
          category: editForm.category,
          budget: editForm.budget.trim() || null,
          city: editForm.city.trim() || null,
          deadline: editForm.deadline.trim() || null,
          images: editForm.images.length > 0 ? editForm.images : null,
        })
        .eq("id", id);

      if (error) {
        toast({
          title: "Ошибка",
          description: translateSupabaseError(error.message),
          variant: "destructive",
        });
      } else {
        setRequest((prev: any) =>
          prev
            ? {
                ...prev,
                title,
                description,
                category: editForm.category,
                budget: editForm.budget.trim() || null,
                city: editForm.city.trim() || null,
                deadline: editForm.deadline.trim() || null,
                images: editForm.images.length > 0 ? editForm.images : null,
              }
            : prev
        );
        toast({
          title: "Сохранено",
          description: "Запрос обновлён",
        });
        setEditOpen(false);
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditOpen(false);
  };

  const handleDeleteRequest = async () => {
    if (!user || !request || user.id !== request.user_id) {
      return;
    }

    if (!confirm("Вы уверены, что хотите удалить этот запрос? Это действие нельзя отменить.")) {
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить запрос: " + translateSupabaseError(error.message),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно!",
        description: "Запрос удален",
      });
      navigate("/");
    }

    setSubmitting(false);
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!user) {
      return;
    }

    if (!confirm("Вы уверены, что хотите удалить это предложение? Это действие нельзя отменить.")) {
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("offers")
      .delete()
      .eq("id", offerId)
      .eq("user_id", user.id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить предложение: " + translateSupabaseError(error.message),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно!",
        description: "Предложение удалено",
      });
      loadData();
    }

    setSubmitting(false);
  };

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (request?.images && selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % request.images.length);
    }
  };

  const goToPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (request?.images && selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + request.images.length) % request.images.length);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedImageIndex === null) return;
    
    if (e.key === 'ArrowRight') {
      goToNextImage(e as any);
    } else if (e.key === 'ArrowLeft') {
      goToPrevImage(e as any);
    } else if (e.key === 'Escape') {
      closeImageModal();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        {/* Градиентный фон на весь сайт */}
        <div className="fixed inset-0 z-0 bg-gradient-hero opacity-90" style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 56%), hsl(330 81% 60%))' }} />
        
        {/* Контент поверх градиента */}
        <div className="relative z-10">
          <Navbar onCityChange={() => {}} />
          <div className="container px-4 py-16 mx-auto flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen relative">
        {/* Градиентный фон на весь сайт */}
        <div className="fixed inset-0 z-0 bg-gradient-hero opacity-90" style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 56%), hsl(330 81% 60%))' }} />
        
        {/* Контент поверх градиента */}
        <div className="relative z-10">
          <Navbar onCityChange={() => {}} />
          <div className="container px-4 py-12 mx-auto max-w-5xl text-center">
            <h1 className="text-2xl font-bold mb-4">Запрос не найден</h1>
            <Button onClick={() => navigate("/")}>Вернуться к каталогу</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Градиентный фон на весь сайт */}
      <div className="fixed inset-0 z-0 bg-gradient-hero opacity-90" style={{ background: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 56%), hsl(330 81% 60%))' }} />
      
      {/* Контент поверх градиента */}
      <div className="relative z-10">
        <Navbar onCityChange={() => {}} />
        <div className="container px-4 py-12 mx-auto max-w-5xl">
        <div className="flex flex-row gap-6 overflow-x-auto items-stretch">
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            <Card className="shadow-card animate-slide-up">
              {user?.id === request.user_id && editOpen ? (
                <form onSubmit={handleSaveRequestEdit}>
                  <CardHeader className="gap-4 space-y-0">
                    {isSubscribed && (
                      <div className="mb-2 rounded-lg border border-green-200/20 bg-green-50/10 p-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                          <p className="text-sm text-green-200">
                            Вы подписаны на уведомления о новых предложениях на выбранные каналы (email и/или Telegram, в зависимости от настроек сервиса).
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Label htmlFor="inline-edit-title" className="text-muted-foreground">
                          Название
                        </Label>
                        <Input
                          id="inline-edit-title"
                          value={editForm.title}
                          onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                          required
                          className="border-border bg-background text-xl font-semibold leading-tight md:text-2xl"
                        />
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={editSaving}
                        >
                          Отмена
                        </Button>
                        <Button type="submit" disabled={editSaving}>
                          {editSaving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Сохранение...
                            </>
                          ) : (
                            "Сохранить"
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inline-edit-description">Описание</Label>
                      <Textarea
                        id="inline-edit-description"
                        value={editForm.description}
                        onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                        required
                        className="min-h-[140px] border-border bg-background"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="inline-edit-category">Категория</Label>
                        <Select
                          value={editForm.category}
                          onValueChange={(value) => setEditForm((p) => ({ ...p, category: value }))}
                        >
                          <SelectTrigger id="inline-edit-category">
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inline-edit-budget">Бюджет</Label>
                        <div className="relative">
                          <Input
                            id="inline-edit-budget"
                            inputMode="numeric"
                            placeholder="Например: 50 000"
                            value={formatEditBudgetDisplay(editForm.budget)}
                            onChange={(e) => handleEditBudgetChange(e.target.value)}
                            className="border-border bg-background pr-10"
                          />
                          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                            ₽
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="inline-edit-city">Город</Label>
                        <CityCombobox
                          value={editForm.city}
                          onChange={(value) => setEditForm((p) => ({ ...p, city: value }))}
                          placeholder="Город или регион"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="inline-edit-deadline">Срок (необязательно)</Label>
                        <Input
                          id="inline-edit-deadline"
                          value={editForm.deadline}
                          onChange={(e) => setEditForm((p) => ({ ...p, deadline: e.target.value }))}
                          placeholder="Например: до 15 мая"
                          className="border-border bg-background"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Фотографии</Label>
                      <ImageUpload
                        images={editForm.images}
                        onImagesChange={(imgs) => setEditForm((p) => ({ ...p, images: imgs }))}
                        maxImages={5}
                      />
                    </div>
                  </CardHeader>
                </form>
              ) : (
                <>
                  <CardHeader className="gap-4 space-y-0">
                    <div className="flex min-h-[3rem] items-center justify-between gap-4">
                      <CardTitle className="min-w-0 flex-1 pr-2 text-3xl leading-tight">{request.title}</CardTitle>
                      {user && (
                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
                          {user.id === request.user_id && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setEditOpen(true)}
                                disabled={submitting || editSaving}
                                className="h-12 w-12 shrink-0 border-border"
                                aria-label="Редактировать"
                                title="Редактировать"
                              >
                                <Pencil className="h-6 w-6" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={handleDeleteRequest}
                                disabled={submitting}
                                className="h-12 w-12 shrink-0 border-border"
                                aria-label="Удалить запрос"
                                title="Удалить запрос"
                              >
                                <Trash2 className="h-6 w-6 text-destructive" />
                              </Button>
                            </>
                          )}
                          {user.id !== request.user_id && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleToggleFavorite}
                                className={`h-12 w-12 shrink-0 text-muted-foreground hover:bg-transparent hover:text-destructive [&_svg]:h-[1.725rem] [&_svg]:w-[1.725rem] [&_svg]:shrink-0 ${isFavorite ? "text-red-500 hover:bg-transparent hover:text-red-600" : ""}`}
                                title={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
                              >
                                <Heart
                                  className={
                                    isFavorite ? "fill-red-500 text-red-500" : ""
                                  }
                                />
                              </Button>
                              <ReportButton
                                targetType="request"
                                targetId={request.id}
                                currentUserId={user?.id}
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 shrink-0 [&_svg]:h-6 [&_svg]:w-6"
                              />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-base leading-relaxed">{request.description}</p>
                    <div className="mt-6 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                      {request.budget && (
                        <>
                          <span className="shrink-0 text-lg font-semibold leading-tight text-foreground">
                            {formatPrice(request.budget)} ₽
                          </span>
                          <span className="text-muted-foreground/50 shrink-0 select-none" aria-hidden>
                            ·
                          </span>
                        </>
                      )}
                      <div className="flex min-w-0 items-center gap-1">
                        <User className="h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {Array.isArray(request.profiles) && request.profiles.length > 0
                            ? request.profiles[0].name
                            : request.profiles?.name || "Аноним"}
                        </span>
                      </div>
                      {request.city ? (
                        <>
                          <span className="text-muted-foreground/50 shrink-0 select-none" aria-hidden>
                            ·
                          </span>
                          <div className="flex min-w-0 items-center gap-1">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="truncate">{request.city}</span>
                          </div>
                        </>
                      ) : null}
                      <span className="text-muted-foreground/50 shrink-0 select-none" aria-hidden>
                        ·
                      </span>
                      <span className="truncate">{request.category}</span>
                      <span className="text-muted-foreground/50 shrink-0 select-none" aria-hidden>
                        ·
                      </span>
                      <Clock className="h-4 w-4 shrink-0" />
                      <span className="shrink-0">{getTimeAgo(request.created_at)}</span>
                      {request.ai_mode && (
                        <>
                          <span className="text-muted-foreground/50 shrink-0 select-none" aria-hidden>
                            ·
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            <Sparkles className="h-3 w-3" />
                            {aiMode === "ai_only"
                              ? "AI-подбор"
                              : aiMode === "sellers_only"
                                ? "Отклики продавцов"
                                : "AI + продавцы"}
                          </span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  {((user && user.id === request.user_id && isSubscribed) ||
                    (request.images && request.images.length > 0)) && (
                    <CardContent>
                      {user && user.id === request.user_id && isSubscribed && (
                        <div className="mb-4 rounded-lg border border-green-200/20 bg-green-50/10 p-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                            <p className="text-sm text-green-200">
                              Вы подписаны на уведомления о новых предложениях на выбранные каналы (email и/или
                              Telegram, в зависимости от настроек сервиса).
                            </p>
                          </div>
                        </div>
                      )}

                      {request.images && request.images.length > 0 && (
                        <div className={user && user.id === request.user_id && isSubscribed ? "mt-6" : ""}>
                          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                            Фотографии ({request.images.length})
                          </h3>
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                            {request.images.map((image: string, index: number) => (
                              <div
                                key={index}
                                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-90"
                                onClick={() => openImageModal(index)}
                              >
                                <img
                                  src={image}
                                  alt={`${request.title} - изображение ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </>
              )}
            </Card>

            <AiMatchesPanel
              status={aiStatus}
              matches={aiMatches}
              isOwner={isOwner}
              sellerPublished={sellerPublished}
              onGenerateDemoMatches={handleGenerateDemoAiMatches}
              onPublishForSellers={handlePublishForSellers}
              isBusy={submitting}
            />

            <Card className="shadow-card animate-fade-in flex-1 flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Предложения ({offers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col min-h-0">
                {!sellerPublished ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="font-medium text-foreground">Заявка пока не открыта продавцам</p>
                    <p className="mt-1 text-sm">
                      Покупатель сначала ожидает AI-подборку и сможет подвесить заявку для индивидуальных откликов позже.
                    </p>
                  </div>
                ) : offers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Пока нет предложений
                  </p>
                ) : (
                  offers.map((offer) => (
                    <Card key={offer.id} className="bg-gradient-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>{offer.company[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{offer.company}</h4>
                                  {user && offer.user_id === user.id && (
                                    <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 text-xs">
                                      <User className="w-3 h-3 mr-1" />
                                      Ваше предложение
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {getTimeAgo(offer.created_at)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-primary">{formatPrice(offer.price)} ₽</span>
                                {user && offer.user_id === user.id && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteOffer(offer.id)}
                                    disabled={submitting}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="text-sm mb-3">{offer.description}</p>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-semibold">Контакт:</span>{" "}
                                {offer.contact ? (
                                  offer.contact
                                ) : (
                                  <span className="italic opacity-90">
                                    скрыт — виден только автору объявления и автору этого предложения
                                  </span>
                                )}
                              </p>
                              {user && offer.user_id !== user.id && (
                                <ReportButton
                                  targetType="offer"
                                  targetId={offer.id}
                                  currentUserId={user?.id}
                                  variant="ghost"
                                  size="sm"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {SHOW_OFFER_SIDEBAR && sellerPublished && (
          <div className="flex-1 min-w-[280px] flex flex-col min-h-0 lg:max-w-md">
            <Card className="shadow-card sticky top-6 animate-scale-in flex-1 flex flex-col w-full min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Сделать предложение</CardTitle>
                <CardDescription>
                  {user ? "Предложите свой товар или услугу покупателю" : "Войдите, чтобы сделать предложение"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                {user ? (
                  (() => {
                    const userOffer = offers.find(offer => offer.user_id === user.id);
                    if (userOffer) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-sm bg-blue-50 text-blue-700 px-4 py-3 rounded-lg border border-blue-200">
                            Вы уже создали предложение на этот запрос. Для изменения предложения удалите текущее и создайте новое
                          </p>
                        </div>
                      );
                    }
                    return (
                      <form onSubmit={handleSubmitOffer} className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <Label htmlFor="company">Компания/Имя</Label>
                    <Input
                      ref={companyInputRef}
                      id="company"
                      placeholder={offerForm.company ? "Предзаполнено из профиля" : "Ваше имя или название компании"}
                      value={offerForm.company}
                      onChange={(e) => setOfferForm({ ...offerForm, company: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Ваша цена</Label>
                    <Input
                      id="price"
                      placeholder="Например: 75 000 ₽"
                      value={offerForm.price}
                      onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm">Телефон</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={offerForm.phone ? "Предзаполнено из профиля" : "Ваш телефон"}
                        value={offerForm.phone}
                        onChange={(e) => setOfferForm({ ...offerForm, phone: e.target.value })}
                        required
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm">Email (необязательно)</Label>
                                              <Input
                          id="email"
                          type="email"
                          placeholder={offerForm.email ? "Предзаполнено из профиля" : "your@email.com (необязательно)"}
                          value={offerForm.email}
                          onChange={(e) => setOfferForm({ ...offerForm, email: e.target.value })}
                          className="h-10"
                        />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offer-description">Описание</Label>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="mb-2 flex items-start gap-2 text-sm">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-muted-foreground">
                          AI-помощник проверит, чтобы отклик отвечал на запрос, цену и сроки. Можно начать с черновика.
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleGenerateSellerDraft}>
                        Сгенерировать черновик
                      </Button>
                    </div>
                    <Textarea
                      id="offer-description"
                      placeholder="Опишите ваше предложение..."
                      className="min-h-[120px]"
                      value={offerForm.description}
                      onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                      required
                    />
                  </div>

                    <div className="mt-auto">
                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? "Отправка..." : "Отправить предложение"}
                      </Button>
                    </div>
                    </form>
                    );
                  })()
                ) : (
                  <div className="space-y-4 flex-1 flex flex-col">
                    <div className="space-y-4 opacity-50 pointer-events-none flex-1">
                      <div className="space-y-2">
                        <Label htmlFor="company-disabled">Компания/Имя</Label>
                        <Input
                          id="company-disabled"
                          placeholder="Войдите, чтобы заполнить"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price-disabled">Ваша цена</Label>
                        <Input
                          id="price-disabled"
                          placeholder="Войдите, чтобы заполнить"
                          disabled
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone-disabled" className="text-sm">Телефон</Label>
                          <Input
                            id="phone-disabled"
                            placeholder="Войдите, чтобы заполнить"
                            disabled
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email-disabled" className="text-sm">Email (необязательно)</Label>
                          <Input
                            id="email-disabled"
                            placeholder="Войдите, чтобы заполнить"
                            disabled
                            className="h-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="offer-description-disabled">Описание</Label>
                        <Textarea
                          id="offer-description-disabled"
                          placeholder="Войдите, чтобы заполнить"
                          className="min-h-[120px]"
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="text-center py-4 border-t mt-auto">
                      <p className="text-sm text-muted-foreground mb-3">
                        Для создания предложения необходимо войти в систему
                      </p>
                      <Button asChild className="w-full">
                        <Link to="/auth">
                          Войти в систему
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Контакты покупателя — видны только продавцу, сделавшему оффер */}
            <BuyerContacts
              requestUserId={request.user_id}
              currentUserId={user?.id || null}
              hasUserOffer={!!offers.find((o: any) => o.user_id === user?.id)}
            />
          </div>
          )}
        </div>
        </div>
      </div>

      {/* Модальное окно для просмотра изображений */}
      {selectedImageIndex !== null && request?.images && (
        <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && closeImageModal()}>
          <DialogContent 
            className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none"
            onKeyDown={handleKeyDown}
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Стрелка влево */}
              {request.images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevImage}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Изображение */}
              <img
                src={request.images[selectedImageIndex]}
                alt={`${request.title} - изображение ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
              />

              {/* Стрелка вправо */}
              {request.images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-10 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNextImage}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Счетчик изображений */}
              {request.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
                  {selectedImageIndex + 1} / {request.images.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RequestDetail;
