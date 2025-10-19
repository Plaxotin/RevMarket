import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestCard } from "@/components/RequestCard";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2 } from "lucide-react";
import { checkAuth } from "@/utils/auth";

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

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  budget?: string;
  city?: string;
  deadline?: string;
  created_at?: string;
}

const getTimeAgo = (dateString?: string) => {
  if (!dateString) return "недавно";
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

interface Offer {
  id: string;
  request_id: string;
  company: string;
  price: string;
  description: string;
  created_at?: string;
  requests: {
    title: string;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [myOffers, setMyOffers] = useState<Offer[]>([]);
  const [favoriteRequests, setFavoriteRequests] = useState<Request[]>([]);
  const [profileData, setProfileData] = useState({
    phone: "",
    name: "",
    email: "",
    city: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { user, isAuthenticated } = await checkAuth();
      
      if (!isAuthenticated) {
        navigate("/auth");
        return;
      }
      
      setUser(user);
      console.log("User from checkAuth:", user);
      console.log("User email:", user?.email);
      await loadUserData(user.id);
    };

    checkUser();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    setLoading(true);
    
    // Load user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, name, email, city")
      .eq("id", userId)
      .single();

    // Get current user data from auth
    const { user: currentUser } = await checkAuth();

    console.log("Profile data from DB:", profile);
    console.log("Current user from auth:", currentUser);

    // Always prioritize auth user email over profile email
    const authEmail = currentUser?.email || "";
    console.log("Auth email:", authEmail);

    if (profile) {
      const newProfileData = {
        phone: profile.phone || "",
        name: profile.name || "",
        email: authEmail || profile.email || "",
        city: profile.city || "",
      };
      console.log("Setting profile data with auth email:", newProfileData);
      setProfileData(newProfileData);
    } else if (currentUser) {
      // If no profile exists, use auth user data
      const newProfileData = {
        phone: "",
        name: "",
        email: authEmail,
        city: "",
      };
      console.log("No profile found, using auth data:", newProfileData);
      setProfileData(newProfileData);
    }

    // Load user's requests
    const { data: requests, error: requestsError } = await supabase
      .from("requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (requestsError) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить ваши заявки",
        variant: "destructive",
      });
    } else {
      setMyRequests(requests || []);
    }

    // Load user's offers
    const { data: offers, error: offersError } = await supabase
      .from("offers")
      .select(`
        id,
        request_id,
        company,
        price,
        description,
        requests (
          title
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (offersError) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить ваши предложения",
        variant: "destructive",
      });
    } else {
      setMyOffers(offers || []);
    }

    // Load favorite requests
    const { data: favorites, error: favoritesError } = await supabase
      .from("favorites")
      .select(`
        request_id,
        requests (
          id,
          title,
          description,
          category,
          budget,
          city,
          deadline
        )
      `)
      .eq("user_id", userId);

    if (favoritesError) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить избранные заявки",
        variant: "destructive",
      });
    } else {
      const favReqs = favorites?.map((f: any) => f.requests).filter(Boolean) || [];
      setFavoriteRequests(favReqs);
    }

    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setUpdating(true);

    // Update profiles table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        phone: profileData.phone,
        name: profileData.name,
        email: profileData.email,
        city: profileData.city,
      })
      .eq("id", user.id);

    if (profileError) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить профиль: " + profileError.message,
        variant: "destructive",
      });
      setUpdating(false);
      return;
    }

    // Update email in auth.users if changed
    if (profileData.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({
        email: profileData.email,
      });

      if (authError) {
        toast({
          title: "Ошибка",
          description: "Не удалось обновить email: " + authError.message,
          variant: "destructive",
        });
        setUpdating(false);
        return;
      }
    }

    toast({
      title: "Успешно!",
      description: "Профиль обновлен",
    });

    // Reload user data to ensure we have the latest information
    await loadUserData(user.id);
    setUpdating(false);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.")) {
      return;
    }

    const { error } = await supabase
      .from("requests")
      .delete()
      .eq("id", requestId)
      .eq("user_id", user?.id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заявку: " + error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно!",
        description: "Заявка удалена",
      });
      // Reload data
      if (user) {
        loadUserData(user.id);
      }
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm("Вы уверены, что хотите удалить это предложение? Это действие нельзя отменить.")) {
      return;
    }

    const { error } = await supabase
      .from("offers")
      .delete()
      .eq("id", offerId)
      .eq("user_id", user?.id);

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
      // Reload data
      if (user) {
        loadUserData(user.id);
      }
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 py-16 mx-auto">
        <h1 className="text-3xl font-bold mb-8">Личный кабинет</h1>
        
        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="requests">Мои заявки ({myRequests.length})</TabsTrigger>
            <TabsTrigger value="offers">Мои предложения ({myOffers.length})</TabsTrigger>
            <TabsTrigger value="favorites">Избранное ({favoriteRequests.length})</TabsTrigger>
            <TabsTrigger value="settings">Настройки</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            {myRequests.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>У вас пока нет заявок</CardTitle>
                  <CardDescription>Создайте свою первую заявку</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myRequests.map((request) => (
                  <div key={request.id} className="relative">
                    <RequestCard 
                      id={request.id}
                      title={request.title}
                      description={request.description}
                      category={request.category}
                      budget={request.budget || "Не указан"}
                      location={request.city || "Не указан"}
                      timeAgo={getTimeAgo(request.created_at)}
                      offersCount={0}
                      userId={request.user_id}
                      currentUserId={user?.id}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleDeleteRequest(request.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers" className="mt-6">
            {myOffers.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>У вас пока нет предложений</CardTitle>
                  <CardDescription>Откликнитесь на интересующие вас заявки</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="space-y-4">
                {myOffers.map((offer) => (
                  <Card key={offer.id} className="relative">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{offer.company}</CardTitle>
                          <CardDescription>
                            Заявка: {offer.requests.title}
                          </CardDescription>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteOffer(offer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-2">
                        <span className="font-semibold">Цена:</span> {offer.price}
                      </p>
                      <p className="text-sm text-muted-foreground">{offer.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            {favoriteRequests.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>У вас нет избранных заявок</CardTitle>
                  <CardDescription>Добавляйте интересные заявки в избранное</CardDescription>
                </CardHeader>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favoriteRequests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    id={request.id}
                    title={request.title}
                    description={request.description}
                    category={request.category}
                    budget={request.budget || "Не указан"}
                    location={request.city || "Не указан"}
                    timeAgo={getTimeAgo(request.created_at)}
                    offersCount={0}
                    userId={request.user_id}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Редактировать профиль</CardTitle>
                <CardDescription>Обновите свои личные данные</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">
                      Номер телефона <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="profile-phone"
                      type="tel"
                      required
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+7 (900) 123-45-67"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-name">
                      Имя <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="profile-name"
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Иван Иванов"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="profile-email"
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile-city">Город</Label>
                    <Select 
                      value={profileData.city} 
                      onValueChange={(value) => setProfileData({ ...profileData, city: value })}
                    >
                      <SelectTrigger id="profile-city">
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

                  <Button type="submit" className="w-full" disabled={updating}>
                    {updating ? "Сохранение..." : "Сохранить изменения"}
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

export default Profile;
