import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Package, MapPin, Clock, MessageSquare, User, Heart, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { checkAuth } from "@/utils/auth";

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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [request, setRequest] = useState<any>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [offerForm, setOfferForm] = useState({
    company: "",
    price: "",
    description: "",
    contact: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

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
          contact: profile.phone && profile.email 
            ? `${profile.phone}, ${profile.email}`
            : profile.phone || profile.email || prev.contact,
        }));
      }
    }

    // Load request
    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select(`
        *,
        profiles (
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

    // Load offers
    const { data: offersData } = await supabase
      .from("offers")
      .select(`
        *,
        profiles (
          name
        )
      `)
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    setOffers(offersData || []);

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

    if (!offerForm.company || !offerForm.price || !offerForm.description || !offerForm.contact) {
      toast({
        title: "Ошибка",
        description: "Заполните все поля",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await supabase
      .from("offers")
      .insert([
        {
          request_id: id,
          user_id: user.id,
          company: offerForm.company,
          price: offerForm.price,
          description: offerForm.description,
          contact: offerForm.contact,
        },
      ]);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить предложение: " + error.message,
        variant: "destructive",
      });
    } else {
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
            contact: profile.phone && profile.email 
              ? `${profile.phone}, ${profile.email}`
              : profile.phone || profile.email || "",
          });
        } else {
          setOfferForm({ company: "", price: "", description: "", contact: "" });
        }
      } else {
        setOfferForm({ company: "", price: "", description: "", contact: "" });
      }
      loadData();
    }

    setSubmitting(false);
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
        description: "Не удалось удалить запрос: " + error.message,
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
        description: "Не удалось удалить предложение: " + error.message,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onCityChange={() => {}} />
        <div className="container px-4 py-16 mx-auto flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onCityChange={() => {}} />
        <div className="container px-4 py-12 mx-auto max-w-5xl text-center">
          <h1 className="text-2xl font-bold mb-4">Запрос не найден</h1>
          <Button onClick={() => navigate("/")}>Вернуться к каталогу</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onCityChange={() => {}} />
      <div className="container px-4 py-12 mx-auto max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card animate-slide-up">
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <Badge variant="secondary">{request.category}</Badge>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {getTimeAgo(request.created_at)}
                    </div>
                    {user && user.id === request.user_id && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteRequest}
                        disabled={submitting}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить запрос
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleFavorite}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-3xl">{request.title}</CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{request.profiles?.name || "Аноним"}</span>
                  </div>
                  {request.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{request.city}</span>
                    </div>
                  )}
                  {request.budget && (
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span className="font-semibold text-foreground">{request.budget}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed mb-4">{request.description}</p>
                {request.deadline && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Срок:</span> {request.deadline}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-card animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Предложения ({offers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Пока нет предложений. Будьте первым!
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
                                <span className="text-lg font-bold text-primary">{offer.price}</span>
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
                            <p className="text-sm text-muted-foreground mb-3">
                              <span className="font-semibold">Контакт:</span> {offer.contact}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="shadow-card sticky top-6 animate-scale-in">
              <CardHeader>
                <CardTitle>Сделать предложение</CardTitle>
                <CardDescription>
                  {user ? "Предложите свой товар или услугу покупателю" : "Войдите, чтобы сделать предложение"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <form onSubmit={handleSubmitOffer} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Компания/Имя *</Label>
                    <Input
                      id="company"
                      placeholder={offerForm.company ? "Предзаполнено из профиля" : "Ваше имя или название компании"}
                      value={offerForm.company}
                      onChange={(e) => setOfferForm({ ...offerForm, company: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Ваша цена *</Label>
                    <Input
                      id="price"
                      placeholder="Например: 75 000 ₽"
                      value={offerForm.price}
                      onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact">Контакт *</Label>
                    <Input
                      id="contact"
                      placeholder={offerForm.contact ? "Предзаполнено из профиля" : "Телефон или email"}
                      value={offerForm.contact}
                      onChange={(e) => setOfferForm({ ...offerForm, contact: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offer-description">Описание *</Label>
                    <Textarea
                      id="offer-description"
                      placeholder="Опишите ваше предложение..."
                      className="min-h-[120px]"
                      value={offerForm.description}
                      onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                      required
                    />
                  </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Отправка..." : "Отправить предложение"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-4 opacity-50 pointer-events-none">
                      <div className="space-y-2">
                        <Label htmlFor="company-disabled">Компания/Имя *</Label>
                        <Input
                          id="company-disabled"
                          placeholder="Войдите, чтобы заполнить"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price-disabled">Ваша цена *</Label>
                        <Input
                          id="price-disabled"
                          placeholder="Войдите, чтобы заполнить"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact-disabled">Контакт *</Label>
                        <Input
                          id="contact-disabled"
                          placeholder="Войдите, чтобы заполнить"
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="offer-description-disabled">Описание *</Label>
                        <Textarea
                          id="offer-description-disabled"
                          placeholder="Войдите, чтобы заполнить"
                          className="min-h-[120px]"
                          disabled
                        />
                      </div>

                      <Button className="w-full" disabled>
                        Войти для отправки предложения
                      </Button>
                    </div>
                    
                    <div className="text-center py-4 border-t">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetail;
