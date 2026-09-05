import React from 'react';

interface ReviveLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showExpansion?: boolean;
  className?: string;
  isDark?: boolean;
}

export const ReviveLogo: React.FC<ReviveLogoProps> = ({
  size = 'md',
  showTagline = true,
  showExpansion = false,
  className = '',
  isDark = false
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-xl sm:text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official Vector Logo Shield & Vital Wave Icon */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Subtle Outer Protective Shield / Ring */}
          <rect
            x="6"
            y="6"
            width="88"
            height="88"
            rx="24"
            className="fill-[#22819A]/10 stroke-[#22819A]/30"
            strokeWidth="3"
          />
          {/* Accent Radiance Fill */}
          <circle cx="50" cy="50" r="34" className="fill-[#90C2E7]/25" />
          
          {/* Stylized Cross & Care Shield Base */}
          <path
            d="M50 18C33 18 24 28 24 45C24 66 50 82 50 82C50 82 76 66 76 45C76 28 67 18 50 18Z"
            className="fill-[#22819A] opacity-95"
          />
          
          {/* Inner Light Glow */}
          <path
            d="M50 24C37 24 30 32 30 46C30 62 50 75 50 75C50 75 70 62 70 46C70 32 63 24 50 24Z"
            className="fill-[#90C2E7]/40"
          />

          {/* Dynamic Vital Heartbeat Line (Revive Pulse) */}
          <path
            d="M32 49H41L45 37L51 59L57 43L61 51H68"
            stroke="#FEF7F8"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Life Spark Node */}
          <circle cx="68" cy="51" r="3" fill="#FEF7F8" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-extrabold tracking-wider font-sans ${titleSizes[size]} ${
              isDark ? 'text-white' : 'text-[#22819A]'
            }`}
          >
            REVIVE
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#90C2E7]" />
        </div>

        {showTagline && (
          <span
            className={`text-[10px] sm:text-xs font-semibold tracking-widest uppercase -mt-0.5 ${
              isDark ? 'text-[#90C2E7]' : 'text-[#22819A]/80'
            }`}
          >
            Healthcare, Reimagined
          </span>
        )}

        {showExpansion && (
          <span className="text-[9px] text-[#64748B] font-medium tracking-tight mt-0.5">
            REACH • ENABLE • VALUE • IMPACT • VITALIZE • EMPOWER
          </span>
        )}
      </div>
    </div>
  );
};
