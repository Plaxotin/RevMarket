export const HandshakeIcon = ({ className = "w-10 h-10", color = "white" }: { className?: string; color?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Левая рука */}
      <path
        d="M15 70 L10 75 L5 80 L5 90 L15 90 L20 85 L20 75 L20 60 L15 55 L15 65 Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Левая манжета */}
      <rect x="15" y="50" width="5" height="8" fill={color} opacity="0.8" />
      
      {/* Правая рука */}
      <path
        d="M85 55 L85 65 L80 70 L80 80 L80 90 L90 90 L95 85 L95 75 L90 70 L90 60 L85 55 L80 50 Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Правая манжета */}
      <rect x="80" y="50" width="5" height="8" fill={color} opacity="0.8" />
      
      {/* Точка соприкосновения рук */}
      <circle cx="50" cy="60" r="6" fill={color} />
    </svg>
  );
};

