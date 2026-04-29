import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AiMatch, AI_STATUS_LABELS, AiSearchStatus, getAiJourneySteps } from "@/lib/aiMarketplace";
import { Bot, CheckCircle, ExternalLink, Loader2, Sparkles, Store, Wand2 } from "lucide-react";

interface AiMatchesPanelProps {
  status: AiSearchStatus;
  matches: AiMatch[];
  isOwner: boolean;
  sellerPublished: boolean;
  onGenerateDemoMatches: () => void;
  onPublishForSellers: () => void;
  isBusy: boolean;
}

export const AiMatchesPanel = ({
  status,
  matches,
  isOwner,
  sellerPublished,
  onGenerateDemoMatches,
  onPublishForSellers,
  isBusy,
}: AiMatchesPanelProps) => {
  const steps = getAiJourneySteps(status);
  const isDisabled = status === "disabled";
  const isReady = status === "results_ready" && matches.length > 0;

  return (
    <Card className="shadow-card animate-fade-in overflow-hidden">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-подбор из интернета
            </CardTitle>
            <CardDescription>
              Сервис ищет предложения, объясняет совпадения и помогает решить, стоит ли ждать отклики продавцов.
            </CardDescription>
          </div>
          <Badge variant={isReady ? "default" : "secondary"}>{AI_STATUS_LABELS[status]}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!isDisabled && (
          <div className="grid gap-3 md:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`rounded-xl border p-3 ${
                  step.state === "done"
                    ? "border-green-200 bg-green-50"
                    : step.state === "active"
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-muted/20"
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  {step.state === "done" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : step.state === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  )}
                  {step.label}
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        )}

        {isDisabled ? (
          <div className="rounded-xl border border-dashed p-5 text-center">
            <Store className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="font-medium">AI-подбор выключен для этой заявки</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Покупатель выбрал сбор индивидуальных предложений от продавцов.
            </p>
          </div>
        ) : isReady ? (
          <div className="grid gap-4">
            {matches.map((match) => (
              <Card key={match.id} className="bg-gradient-card">
                <CardContent className="pt-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{match.source_name}</Badge>
                        <Badge variant="secondary">{match.match_score}% совпадение</Badge>
                      </div>
                      <h4 className="text-lg font-semibold">{match.title}</h4>
                      <p className="text-sm text-muted-foreground">{match.match_reason}</p>
                      {(match.difference_note || match.risk_note) && (
                        <div className="grid gap-2 text-sm md:grid-cols-2">
                          {match.difference_note && (
                            <div className="rounded-lg bg-background/70 p-3">
                              <span className="font-medium">Отличие: </span>
                              {match.difference_note}
                            </div>
                          )}
                          {match.risk_note && (
                            <div className="rounded-lg bg-background/70 p-3">
                              <span className="font-medium">Проверить: </span>
                              {match.risk_note}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="min-w-40 space-y-2 text-left md:text-right">
                      {match.price && <p className="text-xl font-bold text-primary">{match.price}</p>}
                      {match.delivery_note && <p className="text-sm text-muted-foreground">{match.delivery_note}</p>}
                      {match.url ? (
                        <Button asChild variant="outline" size="sm">
                          <a href={match.url} target="_blank" rel="noreferrer">
                            Открыть
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="outline">Ссылка ожидает проверки</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">AI-подбор пока в работе</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Для MVP можно сформировать демонстрационную подборку из структуры заявки. Позже этот шаг подключается к реальному интернет-поиску.
                </p>
              </div>
              {isOwner && (
                <Button onClick={onGenerateDemoMatches} disabled={isBusy}>
                  {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  Сформировать подборку
                </Button>
              )}
            </div>
          </div>
        )}

        {isOwner && !sellerPublished && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Не нашли идеальный вариант?</p>
                <p className="text-sm text-muted-foreground">
                  Подвесьте заявку на сайте, чтобы продавцы оставили индивидуальные отклики.
                </p>
              </div>
              <Button variant="outline" onClick={onPublishForSellers} disabled={isBusy}>
                Подвесить для продавцов
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
