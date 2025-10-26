import heroImage from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-gradient-hero opacity-90 z-0" />
      
      <div className="container relative z-10 px-4 py-24 mx-auto">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              Нужен товар?
            </span>
            <br />
            <span className="text-white animate-slide-up">
              Размести запрос!
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed animate-fade-in">
            Маркетплейс, где покупатели публикуют свои желания, а продавцы оставляют лучшие предложения
          </p>
        </div>
      </div>
    </section>
  );
};
