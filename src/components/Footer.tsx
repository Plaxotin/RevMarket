import { Link } from "react-router-dom";
import RevMarketLogo from "../../revMarketLogo3.svg";

export const Footer = () => {
  return (
    <footer className="relative z-20 bg-black/60 backdrop-blur-md border-t border-white/10">
      <div className="container px-4 py-6 mx-auto text-white">
        <div className="flex flex-col md:flex-row items-start justify-between gap-10">
          <div className="flex flex-col gap-3 text-sm w-full md:w-auto text-left">
            <a href="#about" className="hover:text-gray-300 transition-colors">
              О нас
            </a>
            <a href="#faq" className="hover:text-gray-300 transition-colors">
              Часто задаваемые вопросы
            </a>
            <a href="#contacts" className="hover:text-gray-300 transition-colors">
              Контакты
            </a>
            <a href="#help" className="hover:text-gray-300 transition-colors">
              Помощь
            </a>
          </div>

          <div className="flex justify-center md:justify-end items-center w-full md:w-auto -mt-8 md:-mt-[30px]">
            <img
              src={RevMarketLogo}
              alt="РеверсМаркет"
              className="h-40 w-auto object-contain select-none brightness-40 self-center"
            />
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
