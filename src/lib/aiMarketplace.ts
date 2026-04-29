export type AiMode = "ai_only" | "sellers_only" | "ai_and_sellers";
export type AiSearchStatus = "queued" | "searching" | "results_ready" | "needs_review" | "failed" | "disabled";
export type SellerVisibilityStatus = "draft" | "published" | "paused";

export interface AiMatch {
  id: string;
  request_id: string;
  source_name: string;
  title: string;
  price: string | null;
  url: string | null;
  image_url: string | null;
  delivery_note: string | null;
  match_score: number;
  match_reason: string;
  difference_note: string | null;
  risk_note: string | null;
  status: string;
  created_at: string | null;
}

interface RequestLike {
  title?: string | null;
  description?: string | null;
  category?: string | null;
  budget?: string | null;
  city?: string | null;
  ai_search_status?: string | null;
  ai_mode?: string | null;
  seller_visibility_status?: string | null;
}

export const AI_MODE_LABELS: Record<AiMode, string> = {
  ai_only: "Только AI-подбор",
  sellers_only: "Только отклики продавцов",
  ai_and_sellers: "AI-подбор + отклики продавцов",
};

export const AI_STATUS_LABELS: Record<AiSearchStatus, string> = {
  queued: "Заявка принята",
  searching: "AI ищет предложения",
  results_ready: "Подборка готова",
  needs_review: "Нужна проверка",
  failed: "Не удалось найти",
  disabled: "AI-подбор выключен",
};

export const normalizeAiMode = (value?: string | null): AiMode => {
  if (value === "ai_only" || value === "sellers_only" || value === "ai_and_sellers") return value;
  return "ai_and_sellers";
};

export const normalizeAiStatus = (value?: string | null): AiSearchStatus => {
  if (
    value === "queued" ||
    value === "searching" ||
    value === "results_ready" ||
    value === "needs_review" ||
    value === "failed" ||
    value === "disabled"
  ) {
    return value;
  }
  return "queued";
};

export const normalizeSellerVisibility = (value?: string | null): SellerVisibilityStatus => {
  if (value === "draft" || value === "published" || value === "paused") return value;
  return "published";
};

export const buildAiSummary = (request: RequestLike) => {
  const parts = [
    request.title ? `Ищем: ${request.title.trim()}` : null,
    request.category ? `Категория: ${request.category}` : null,
    request.city ? `География: ${request.city}` : null,
    request.budget ? `Бюджет до ${request.budget} ₽` : "Бюджет можно уточнить",
  ].filter(Boolean);

  return parts.join(" · ");
};

export const getAiQualityHints = (request: RequestLike) => {
  const hints: string[] = [];
  const description = request.description?.trim() ?? "";

  if (description.length < 80) {
    hints.push("Добавьте модель, размер, цвет, состояние или другие критерии, чтобы AI точнее отсеял лишнее.");
  }

  if (!request.budget) {
    hints.push("Укажите бюджет: так подборка сможет отделить подходящие предложения от слишком дорогих.");
  }

  if (!request.city) {
    hints.push("Город или регион помогут учесть доставку и наличие рядом.");
  }

  return hints;
};

export const getAiJourneySteps = (status: AiSearchStatus) => {
  const steps = [
    { id: "queued", label: "Заявка принята", description: "AI зафиксировал задачу и критерии." },
    { id: "searching", label: "Ищем в интернете", description: "Проверяем магазины, агрегаторы и похожие варианты." },
    { id: "review", label: "Сравниваем", description: "Отсекаем слабые совпадения и отмечаем риски." },
    { id: "results_ready", label: "Отправляем подборку", description: "Показываем лучшие варианты и уведомляем вас." },
  ];

  const activeIndexByStatus: Record<AiSearchStatus, number> = {
    queued: 0,
    searching: 1,
    needs_review: 2,
    results_ready: 3,
    failed: 2,
    disabled: -1,
  };

  return steps.map((step, index) => ({
    ...step,
    state:
      activeIndexByStatus[status] > index
        ? "done"
        : activeIndexByStatus[status] === index
          ? "active"
          : "pending",
  }));
};

export const createDemoAiMatches = (request: RequestLike, requestId: string): Omit<AiMatch, "id" | "created_at">[] => {
  const title = request.title?.trim() || "Подходящий товар";
  const category = request.category || "маркетплейс";
  const city = request.city || "доставка по России";
  const budget = request.budget ? `${request.budget} ₽` : "цена уточняется";

  return [
    {
      request_id: requestId,
      source_name: "Market AI",
      title: `${title} · лучший баланс цены`,
      price: budget,
      url: null,
      image_url: null,
      delivery_note: city,
      match_score: 92,
      match_reason: `Совпадает с категорией "${category}", бюджетом и базовым описанием запроса.`,
      difference_note: "Проверьте комплектацию и наличие гарантии перед покупкой.",
      risk_note: "AI-подбор требует ручной проверки ссылки и условий продавца.",
      status: "suggested",
    },
    {
      request_id: requestId,
      source_name: "Aggregator Scan",
      title: `${title} · быстрая доставка`,
      price: request.budget ? `${Math.max(Number(request.budget.replace(/\D/g, "")) * 0.95, 1).toFixed(0)} ₽` : null,
      url: null,
      image_url: null,
      delivery_note: `Приоритет: ${city}`,
      match_score: 84,
      match_reason: "Хорошо подходит по срочности и доступности в регионе.",
      difference_note: "Может отличаться комплектация или срок гарантии.",
      risk_note: "Сравните итоговую цену с доставкой.",
      status: "suggested",
    },
    {
      request_id: requestId,
      source_name: "Similar Offers",
      title: `Аналог для запроса: ${title}`,
      price: null,
      url: null,
      image_url: null,
      delivery_note: "Альтернатива, если точной модели нет",
      match_score: 76,
      match_reason: "Похожее решение, которое закрывает основную потребность покупателя.",
      difference_note: "Это аналог, а не точное совпадение с названием заявки.",
      risk_note: "Стоит согласовать допустимость аналога перед покупкой.",
      status: "suggested",
    },
  ];
};
