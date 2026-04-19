import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="relative z-20 bg-black/60 backdrop-blur-md border-t border-white/10 overflow-hidden">
      <div className="container px-4 py-6 mx-auto text-white relative z-10">
        <div className="flex flex-col md:flex-row items-start gap-10">
          <div className="flex flex-col gap-3 text-sm w-full md:w-auto text-left">
            <Link to="/" className="hover:text-gray-300 transition-colors">
              Главная
            </Link>
            <Link to="/auth" className="hover:text-gray-300 transition-colors">
              Войти
            </Link>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2024–2026 РеверсМаркет. Все права защищены.</p>
            <div className="flex flex-wrap gap-6 text-sm justify-center">
              <Link to="/privacy" className="hover:text-gray-300 transition-colors">
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="hover:text-gray-300 transition-colors">
                Условия использования
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
