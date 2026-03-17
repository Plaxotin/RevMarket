import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BuyerContactsProps {
  requestUserId: string;
  currentUserId: string | null;
  hasUserOffer: boolean;
}

interface BuyerProfile {
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
}

export const BuyerContacts = ({
  requestUserId,
  currentUserId,
  hasUserOffer,
}: BuyerContactsProps) => {
  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasUserOffer && currentUserId && currentUserId !== requestUserId) {
      loadBuyerProfile();
    }
  }, [hasUserOffer, currentUserId, requestUserId]);

  const loadBuyerProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("name, phone, email, city")
      .eq("id", requestUserId)
      .single();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
  };

  // Owner of the request sees nothing
  if (currentUserId === requestUserId) return null;

  // Not logged in
  if (!currentUserId) {
    return (
      <Card className="shadow-card border-dashed border-muted-foreground/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Контакты покупателя
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Войдите и сделайте предложение, чтобы увидеть контакты покупателя
          </p>
          <Button asChild size="sm" className="w-full">
            <Link to="/auth">Войти</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Logged in but hasn't made an offer yet
  if (!hasUserOffer) {
    return (
      <Card className="shadow-card border-dashed border-muted-foreground/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Контакты покупателя
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Отправьте предложение, чтобы увидеть контакты покупателя
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading
  if (loading) {
    return (
      <Card className="shadow-card">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Загрузка контактов...
        </CardContent>
      </Card>
    );
  }

  // Has offer — show buyer contacts
  if (!profile) return null;

  return (
    <Card className="shadow-card border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-green-800">
          <User className="w-4 h-4" />
          Контакты покупателя
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm font-medium">{profile.name}</p>

        {profile.phone && (
          <a
            href={`tel:${profile.phone}`}
            className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 transition-colors"
          >
            <Phone className="w-4 h-4" />
            {profile.phone}
          </a>
        )}

        {profile.email && (
          <a
            href={`mailto:${profile.email}`}
            className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 transition-colors"
          >
            <Mail className="w-4 h-4" />
            {profile.email}
          </a>
        )}

        {profile.city && (
          <p className="text-xs text-muted-foreground">
            {profile.city}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
