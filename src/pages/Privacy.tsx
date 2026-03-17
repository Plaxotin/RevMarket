import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Privacy = () => {
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
              Политика конфиденциальности
            </h1>

            <div className="space-y-4 text-white/80 leading-relaxed">
              <p>
                <strong>Дата вступления в силу:</strong> 17 марта 2026 г.
              </p>

              <h2 className="text-xl font-semibold text-white mt-6">
                1. Общие положения
              </h2>
              <p>
                РеверсМаркет (далее — «Сервис») уважает вашу конфиденциальность
                и обязуется защищать персональные данные, которые вы
                предоставляете при использовании нашего сервиса.
              </p>

              <h2 className="text-xl font-semibold text-white mt-6">
                2. Какие данные мы собираем
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Номер телефона — для авторизации через SMS</li>
                <li>
                  Имя и контактные данные — для отображения в профиле и
                  коммуникации
                </li>
                <li>
                  Данные запросов и предложений — для работы маркетплейса
                </li>
                <li>Город — для фильтрации по географии</li>
              </ul>

              <h2 className="text-xl font-semibold text-white mt-6">
                3. Как мы используем данные
              </h2>
              <p>
                Персональные данные используются исключительно для
                функционирования Сервиса: авторизация, отображение запросов,
                связь между покупателями и продавцами. Мы не передаём ваши данные
                третьим лицам без вашего согласия.
              </p>

              <h2 className="text-xl font-semibold text-white mt-6">
                4. Хранение данных
              </h2>
              <p>
                Данные хранятся на серверах Supabase (EU/US) с использованием
                шифрования и Row Level Security (RLS) для разграничения доступа.
              </p>

              <h2 className="text-xl font-semibold text-white mt-6">
                5. Ваши права
              </h2>
              <p>
                Вы можете запросить удаление своих данных, написав нам. Мы
                обработаем запрос в течение 30 дней.
              </p>

              <h2 className="text-xl font-semibold text-white mt-6">
                6. Контакты
              </h2>
              <p>
                По вопросам конфиденциальности обращайтесь через контактную форму
                на сайте.
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Privacy;
