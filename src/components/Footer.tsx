import { Link } from "react-router-dom";
import logo from "../../Adobe Express - file.png";

export const Footer = () => {
  return (
    <footer className="bg-background/80 backdrop-blur-md border-t text-black">
      <div className="container px-4 py-12 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Брендинг и описание */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
              <span className="font-bold text-xl">РеверсМаркет</span>
            </Link>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h3 className="font-bold mb-4">Быстрые ссылки</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#catalog" 
                  className="text-sm hover:text-gray-500 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    const catalogElement = document.getElementById("catalog");
                    if (catalogElement) {
                      catalogElement.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                >
                  Каталог запросов
                </a>
              </li>
              <li>
                <Link to="/create-request" className="text-sm hover:text-gray-500 transition-colors">
                  Создать запрос
                </Link>
              </li>
              <li>
                <a 
                  href="#how-it-works" 
                  className="text-sm hover:text-gray-500 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    const howItWorksElement = document.getElementById("how-it-works");
                    if (howItWorksElement) {
                      howItWorksElement.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                >
                  Как это работает
                </a>
              </li>
              <li>
                <Link to="/profile" className="text-sm hover:text-gray-500 transition-colors">
                  Личный кабинет
                </Link>
              </li>
            </ul>
          </div>

          {/* Полезная информация */}
          <div>
            <h3 className="font-bold mb-4">Полезная информация</h3>
            <ul className="space-y-2">
              <li>
                <a href="#about" className="text-sm hover:text-gray-500 transition-colors">
                  О нас
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm hover:text-gray-500 transition-colors">
                  Часто задаваемые вопросы
                </a>
              </li>
              <li>
                <a href="#contacts" className="text-sm hover:text-gray-500 transition-colors">
                  Контакты
                </a>
              </li>
              <li>
                <a href="#help" className="text-sm hover:text-gray-500 transition-colors">
                  Помощь
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Нижняя часть с копирайтом */}
        <div className="border-t border-gray-300 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
              © 2024 РеверсМаркет. Все права защищены.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#privacy" className="hover:text-gray-500 transition-colors">
                Политика конфиденциальности
              </a>
              <a href="#terms" className="hover:text-gray-500 transition-colors">
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
