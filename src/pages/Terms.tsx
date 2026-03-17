import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 z-0 opacity-90"
        style={{
          background:
            "linear-gradient(135deg, hsl(262 83% 58%), hsl(220 90% 56%), hsl(330 81% 60%))",
        }}
      />

      <div className="relative z-10">
        <Navbar onCityChange={() => {}} />

        <div className="container px-4 mx-auto py-12 max-w-3xl">
          <div className="bg-black/60 backdrop-blur-md rounded-2xl p-8 text-white">
            <h1 className="text-3xl font-bold mb-6">
              Условия использования
            </h1>

            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                <strong>Дата вступления в силу:</strong> 17 марта 2026 г.
              </p>

              <h2 className="text-xl font-semibold text-white mt-6">
                1. Описание сервиса
              </h2>
              <p>
                РеверсМаркет — это обратный маркетплейс, где покупатели
                размещают запросы на товары и услуги, а продавцы откликаются
                предложениями. Сервис выступает площадкой для связи покупателей
                и продавцов.
              </p>

              <h2 className="text-xl font-semibold text-white mt-6">
                2. Регистрация
              </h2>
              <p>
                Для использования Сервиса необходима регистрация через SMS.
                Указывая номер телефона, вы подтверждаете, что вам исполнилось
                18 лет и вы принимаете настоящие Условия.
              </p>

              <h2 className="text-xl font-semibold text-white mt-6">
                3. Правила размещения запросов
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Запросы должны быть на законные товары и услуги</li>
                <li>Запрещён спам и дублирование запросов</li>
                <li>
                  Описание должно быть достоверным и не вводить в заблуждение
                </li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-6">
                4. Правила для продавцов
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Предложения должны соответствовать запросу покупателя
                </li>
                <li>Цены должны быть указаны честно</li>
                <li>Запрещена недобросовестная конкуренция</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-6">
                5. Ответственность
              </h2>
              <p>
                Сервис не несёт ответственности за качество товаров и услуг,
                предлагаемых продавцами. Все сделки заключаются напрямую
                между пользователями.
              </p>

              <h2 className="text-xl font-semibold text-white mt-6">
                6. Изменения условий
              </h2>
              <p>
                Мы оставляем за собой право изменять настоящие Условия.
                Актуальная версия всегда доступна на этой странице.
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Terms;
