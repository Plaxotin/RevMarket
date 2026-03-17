import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportButtonProps {
  /** What is being reported */
  targetType: "request" | "offer";
  /** ID of the request or offer */
  targetId: string;
  /** Current user ID (null if not authenticated) */
  currentUserId: string | null;
  /** Variant for styling */
  variant?: "ghost" | "outline";
  /** Size */
  size?: "sm" | "icon" | "default";
}

const REPORT_REASONS = [
  { value: "spam", label: "Спам или реклама" },
  { value: "inappropriate", label: "Неприемлемый контент" },
  { value: "fraud", label: "Мошенничество" },
  { value: "duplicate", label: "Дубликат" },
  { value: "other", label: "Другое" },
];

export const ReportButton = ({
  targetType,
  targetId,
  currentUserId,
  variant = "ghost",
  size = "sm",
}: ReportButtonProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentUserId) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы отправить жалобу",
        variant: "destructive",
      });
      return;
    }

    if (!reason) {
      toast({
        title: "Укажите причину",
        description: "Выберите причину жалобы",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("reports").insert([
        {
          target_type: targetType,
          target_id: targetId,
          reporter_id: currentUserId,
          reason,
          comment: comment || null,
        },
      ]);

      if (error) {
        // If table doesn't exist yet, show a friendlier message
        if (error.code === "42P01") {
          toast({
            title: "Функция в разработке",
            description:
              "Модерация скоро будет доступна. Спасибо за бдительность!",
          });
        } else if (error.message.includes("duplicate") || error.code === "23505") {
          toast({
            title: "Уже отправлено",
            description: "Вы уже отправляли жалобу на этот объект",
          });
        } else {
          toast({
            title: "Ошибка",
            description: "Не удалось отправить жалобу. Попробуйте позже.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Жалоба отправлена",
          description: "Спасибо! Мы рассмотрим вашу жалобу.",
        });
        setOpen(false);
        setReason("");
        setComment("");
      }
    } catch {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить жалобу",
        variant: "destructive",
      });
    }

    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="text-muted-foreground hover:text-destructive"
          title="Пожаловаться"
          aria-label="Пожаловаться"
        >
          <Flag className="w-4 h-4" />
          {size !== "icon" && <span className="ml-1">Пожаловаться</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Отправить жалобу</DialogTitle>
          <DialogDescription>
            {targetType === "request"
              ? "Укажите, что не так с этим запросом"
              : "Укажите, что не так с этим предложением"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Причина *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите причину" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Комментарий (необязательно)</Label>
            <Textarea
              placeholder="Опишите проблему подробнее..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={submitting || !reason}
          >
            {submitting ? "Отправка..." : "Отправить жалобу"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
