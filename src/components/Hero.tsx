import heroImage from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <div className="container relative z-10 px-4 pt-8 pb-8 mx-auto">
        <div className="max-w-5xl mx-auto animate-slide-up">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-black leading-tight text-left">
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Ищешь товар?
              </span>
              <br />
              <span className="text-white animate-slide-up">
                Размести запрос!
              </span>
            </h1>
          </div>
          <div>
            <h2 className="text-5xl md:text-7xl font-black leading-tight text-right">
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Продаешь товар?
              </span>
              <br />
              <span className="text-white animate-slide-up">
                Найди покупателя!
              </span>
            </h2>
          </div>
          <div className="mt-16">
            <p className="text-xl md:text-2xl text-blue-100 leading-relaxed animate-fade-in text-center">
              Маркетплейс, где покупатели публикуют свои желания, а продавцы оставляют лучшие предложения
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
