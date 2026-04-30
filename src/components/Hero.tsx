import type { CSSProperties } from "react";
import { ChevronsDown } from "lucide-react";

const heroSteps = [
  {
    step: "1",
    title: "Создайте запрос",
    description: "Опишите, что хотите купить, и укажите важные условия.",
  },
  {
    step: "2",
    title: "Сравните предложения",
    description: "Продавцы сами откликнутся, а вы выберете лучшее предложение.",
  },
  {
    step: "3",
    title: "Покупайте выгодно",
    description: "Оформляйте сделку на своих условиях, когда нашли идеальный вариант.",
  },
];

const scrollToCatalog = () => {
  document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const Hero = () => {
  return (
    <section className="relative overflow-hidden select-none flex items-center min-h-[240px] sm:min-h-[280px] md:min-h-[300px] py-8 md:py-10">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="hero-orb hero-orb-blue animate-orb"
          style={{
            top: "-4%",
            left: "-3%",
            width: "280px",
            height: "280px",
            "--orb-delay": "0s",
            "--orb-duration": "22s",
            "--shimmer-duration": "11s",
            "--shimmer-delay": "1s",
          } as CSSProperties}
        />
        <div
          className="hero-orb hero-orb-pink animate-orb"
          style={{
            bottom: "-10%",
            right: "-4%",
            width: "320px",
            height: "320px",
            "--orb-delay": "6s",
            "--orb-duration": "26s",
            "--shimmer-duration": "10s",
            "--shimmer-delay": "2s",
          } as CSSProperties}
        />
        <div
          className="hero-orb hero-orb-purple animate-orb"
          style={{
            top: "25%",
            left: "42%",
            width: "220px",
            height: "220px",
            "--orb-delay": "3s",
            "--orb-duration": "18s",
            "--shimmer-duration": "8s",
            "--shimmer-delay": "0.5s",
          } as CSSProperties}
        />
        <div
          className="hero-orb hero-orb-cyan animate-orb"
          style={{
            top: "8%",
            right: "18%",
            width: "190px",
            height: "190px",
            opacity: 0.4,
            "--orb-delay": "1s",
            "--orb-duration": "20s",
            "--shimmer-duration": "7s",
            "--shimmer-delay": "1.5s",
          } as CSSProperties}
        />
        <div
          className="hero-orb hero-orb-amber animate-orb"
          style={{
            bottom: "6%",
            left: "28%",
            width: "260px",
            height: "260px",
            opacity: 0.45,
            "--orb-delay": "4s",
            "--orb-duration": "24s",
            "--shimmer-duration": "9s",
            "--shimmer-delay": "0.8s",
          } as CSSProperties}
        />
        <div
          className="hero-orb hero-orb-magenta animate-orb"
          style={{
            top: "55%",
            right: "34%",
            width: "160px",
            height: "160px",
            opacity: 0.35,
            "--orb-delay": "2s",
            "--orb-duration": "16s",
            "--shimmer-duration": "6s",
            "--shimmer-delay": "2.5s",
          } as CSSProperties}
        />
      </div>
      
      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-5xl mx-auto animate-slide-up text-center">
          <h1 className="hero-title-shimmer text-2xl sm:text-3xl md:text-4xl font-black leading-snug tracking-tight">
            ПОКУПАЙ НА СВОИХ УСЛОВИЯХ
          </h1>
          <p className="mt-3 md:mt-4 text-sm md:text-[15px] text-white/90 leading-relaxed max-w-2xl mx-auto animate-fade-in">
            РеверсМаркет меняет привычную схему торговли: разместите, что хотите купить — и пусть продавцы сделают вам подходящее предложение.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-7 sm:grid-cols-3 sm:gap-4">
            {heroSteps.map((item) => (
              <article
                key={item.step}
                className="relative rounded-2xl border border-white/20 bg-white/10 p-4 text-center backdrop-blur-md transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-black text-primary shadow-sm">
                  {item.step}
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-tight text-white md:text-[15px]">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/80 md:text-sm">{item.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex justify-center md:mt-6">
            <button
              type="button"
              onClick={scrollToCatalog}
              className="inline-flex flex-col items-center rounded-full p-1.5 text-white/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-0"
              aria-label="Прокрутить к каталогу запросов"
            >
              <ChevronsDown
                className="h-7 w-7 animate-bounce-slow md:h-8 md:w-8"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
