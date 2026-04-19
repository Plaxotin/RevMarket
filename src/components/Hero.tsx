import type { CSSProperties } from "react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden select-none">
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
      
      <div className="container relative z-10 px-4 pt-3 pb-3 mx-auto">
        <div className="max-w-5xl mx-auto animate-slide-up">
          <div className="mb-3">
            <h1 className="text-4xl md:text-6xl font-black leading-none text-left">
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Ищешь товар?
              </span>
              <br />
              <span className="text-3xl md:text-5xl text-white animate-slide-up">
                Размести запрос!
              </span>
            </h1>
          </div>
          <div className="mt-3">
            <h2 className="text-4xl md:text-6xl font-black leading-none text-right">
              <span className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Продаешь товар?
              </span>
              <br />
              <span className="text-3xl md:text-5xl text-white animate-slide-up">
                Найди покупателя!
              </span>
            </h2>
          </div>
          <div className="mt-5">
            <p className="text-xs md:text-base text-blue-100 leading-relaxed animate-fade-in text-center">
              Маркетплейс, где покупатели публикуют свои желания, а продавцы оставляют лучшие предложения
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
