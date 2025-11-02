import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="relative z-20 bg-black/60 backdrop-blur-md border-t border-white/10">
      <div className="container px-4 py-6 mx-auto text-white">
        <div className="flex flex-col items-start">
          {/* Брендинг и описание */}
          <div className="mb-6">
            <Link to="/" className="flex items-center gap-3">
              <span className="font-bold text-xl">РеверсМаркет</span>
            </Link>
          </div>

          {/* Полезная информация */}
          <div className="w-full">
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-sm hover:text-gray-300 transition-colors">
                  О нас
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm hover:text-gray-300 transition-colors">
                  Часто задаваемые вопросы
                </a>
              </li>
              <li>
                <a href="#contacts" className="text-sm hover:text-gray-300 transition-colors">
                  Контакты
                </a>
              </li>
              <li>
                <a href="#help" className="text-sm hover:text-gray-300 transition-colors">
                  Помощь
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Нижняя часть с копирайтом */}
        <div className="border-t border-white/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2024 РеверсМаркет. Все права защищены.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#privacy" className="hover:text-gray-300 transition-colors">
                Политика конфиденциальности
              </a>
              <a href="#terms" className="hover:text-gray-300 transition-colors">
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
