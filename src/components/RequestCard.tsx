import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, User } from "lucide-react";
import { Link } from "react-router-dom";

interface RequestCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: string;
  location: string;
  timeAgo: string;
  offersCount: number;
  userId?: string;
  currentUserId?: string;
}

export const RequestCard = ({
  id,
  title,
  description,
  category,
  budget,
  location,
  timeAgo,
  offersCount,
  userId,
  currentUserId,
}: RequestCardProps) => {
  const isOwner = userId && currentUserId && userId === currentUserId;
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in flex flex-col h-full">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="shrink-0">
              {category.charAt(0).toLowerCase() + category.slice(1)}
            </Badge>
            {isOwner && (
              <Badge variant="default" className="shrink-0 bg-primary/20 text-primary border-primary/30">
                <User className="w-3 h-3 mr-1" />
                ваш запрос
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-xl mb-3">
          <Link 
            to={`/request/${id}`} 
            className="hover:text-primary transition-colors cursor-pointer"
          >
            {title}
          </Link>
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-foreground">₽</span>
              <span className="text-lg font-bold text-foreground">{budget}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{timeAgo}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              {offersCount} {offersCount === 1 ? "предложение" : "предложений"}
            </span>
            <Link to={`/request/${id}`}>
              <Button>Посмотреть предложения</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
