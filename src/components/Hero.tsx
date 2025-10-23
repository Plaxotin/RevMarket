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
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-primary-foreground">
            Скажите, что вам нужно
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90">
            Маркетплейс, где покупатели размещают свои потребности, 
            а продавцы дают лучшие предложения
          </p>
        </div>
      </div>
    </section>
  );
};
