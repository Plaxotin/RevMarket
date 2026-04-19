// Категории для запросов и предложений
export const CATEGORIES = [
  "Электроника",
  "Мебель",
  "Авто",
  "Одежда и обувь",
  "Хобби и отдых",
  "Запчасти",
  "Детские товары",
  "Красота и здоровье",
  "Другое"
] as const;

// Категории для фильтра (включая "Все")
export const FILTER_CATEGORIES = [
  "Все",
  ...CATEGORIES
] as const;

export type Category = typeof CATEGORIES[number];
export type FilterCategory = typeof FILTER_CATEGORIES[number];
