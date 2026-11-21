import React from 'react';
import { Sparkles, Clapperboard } from 'lucide-react';
import { AccentThemeId } from '../types/studio';
import { ACCENT_THEMES } from '../constants/themes';

interface HeroBannerProps {
  accentTheme: AccentThemeId;
  mascotImageUrl?: string | null;
  onStartStoryClick: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  accentTheme,
  mascotImageUrl,
  onStartStoryClick,
}) => {
  const theme = ACCENT_THEMES[accentTheme];

  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.heroGradient} border border-white/10 shadow-2xl p-5 sm:p-7`}
      aria-label="Kangshu AI Studio Hero"
    >
      {/* Decorative Glowing Diagonal SVG Filmstrip & Star Sparkles */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-35"
        viewBox="0 0 800 360"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="filmGlow" x1="0" y1="0" x2="800" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F472B6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <g transform="rotate(-14 400 180)">
          <rect x="-60" y="90" width="920" height="72" rx="10" stroke="url(#filmGlow)" strokeWidth="2.5" fill="rgba(255,255,255,0.03)" />
          <line x1="-60" y1="104" x2="860" y2="104" stroke="url(#filmGlow)" strokeWidth="1.2" strokeDasharray="10 14" />
          <line x1="-60" y1="148" x2="860" y2="148" stroke="url(#filmGlow)" strokeWidth="1.2" strokeDasharray="10 14" />
          {[0, 90, 180, 270, 360, 450, 540, 630, 720].map((x) => (
            <rect
              key={x}
              x={x}
              y="108"
              width="66"
              height="36"
              rx="4"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.2"
              fill="rgba(255,255,255,0.02)"
            />
          ))}
        </g>
        {/* Star Sparkles */}
        <path d="M120 42L124 54L136 58L124 62L120 74L116 62L104 58L116 54L120 42Z" fill="#BAE6FD" fillOpacity="0.8" />
        <path d="M472 52L475 61L484 64L475 67L472 76L469 67L460 64L469 61L472 52Z" fill="#E9D5FF" fillOpacity="0.85" />
        <path d="M715 74L719 86L731 90L719 94L715 106L711 94L699 90L711 86L715 74Z" fill="#FDE047" fillOpacity="0.75" />
        <circle cx="350" cy="300" r="3" fill="#93C5FD" fillOpacity="0.7" />
        <circle cx="590" cy="288" r="2.5" fill="#F9A8D4" fillOpacity="0.75" />
      </svg>

      {/* Ambient radial glow behind mascot */}
      <div
        className="pointer-events-none absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-indigo-400/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col-reverse sm:flex-row items-center justify-between gap-6">
        {/* Left Side: Headline, Subtitle & Blue Pill CTA */}
        <div className="w-full sm:w-3/5 space-y-3.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-200/90">
            <Clapperboard className="w-3.5 h-3.5 text-sky-300" />
            <span>Studio Storyboard Khusus Google Flow</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white"
            style={{ textWrap: 'balance' }}
          >
            Bikin Cerita Animasi Bareng{' '}
            <span className={theme.accentTextGradient}>Kang Shu</span>
          </h1>

          <p className="text-sm text-slate-200/85 leading-relaxed max-w-lg mx-auto sm:mx-0">
            Susun naskah, kunci konsistensi karakter, lalu kirim prompt Start Frame & Video langsung ke aplikasi Google Flow tanpa kuota gambar.
          </p>

          <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <button
              type="button"
              onClick={onStartStoryClick}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 active:scale-[0.98] transition cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Mulai Buat Cerita</span>
            </button>
          </div>
        </div>

        {/* Right Side: Permanent Locked Kangshu AI Studio Logo / Mascot Portrait */}
        <div className="relative shrink-0 select-none pointer-events-none">
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-[#0B0E14]/70 border-2 border-white/20 shadow-2xl overflow-hidden flex items-end justify-center">
            {mascotImageUrl ? (
              <img
                src={mascotImageUrl}
                alt="Logo Kangshu AI Studio"
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-full h-full object-cover object-top"
              />
            ) : (
              /* Custom Vector Illustration: Sundanese Young Man with Batik Iket Kepala & Black Pangsi Shirt */
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full"
                role="img"
                aria-label="Ilustrasi Maskot Kang Shu Beriket Kepala Batik"
              >
                <defs>
                  <linearGradient id="mascotBg" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <linearGradient id="skinGrad" x1="100" y1="55" x2="100" y2="140" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#D99B72" />
                    <stop offset="100%" stopColor="#C17F56" />
                  </linearGradient>
                </defs>
                <rect width="200" height="200" fill="url(#mascotBg)" />
                {/* Subtle studio rim halo */}
                <circle cx="100" cy="94" r="70" fill="#6366F1" fillOpacity="0.18" />

                {/* Neck & Black Sundanese Pangsi Shirt */}
                <path d="M84 128H116V152H84Z" fill="#B6764E" />
                <path
                  d="M34 200C36 164 58 144 82 142L100 156L118 142C142 144 164 164 166 200H34Z"
                  fill="#111827"
                  stroke="#334155"
                  strokeWidth="2"
                />
                {/* Pangsi collar & buttons */}
                <path d="M80 142L100 162L120 142" stroke="#1F2937" strokeWidth="5" fill="none" strokeLinecap="round" />
                <line x1="100" y1="162" x2="100" y2="198" stroke="#374151" strokeWidth="2" />
                <circle cx="100" cy="172" r="2.5" fill="#94A3B8" />
                <circle cx="100" cy="186" r="2.5" fill="#94A3B8" />

                {/* Ears */}
                <ellipse cx="64" cy="96" rx="7" ry="11" fill="#C6845B" />
                <ellipse cx="136" cy="96" rx="7" ry="11" fill="#C6845B" />

                {/* Face */}
                <path
                  d="M66 78C66 56 80 46 100 46C120 46 134 56 134 78V102C134 122 119 136 100 136C81 136 66 122 66 102V78Z"
                  fill="url(#skinGrad)"
                />

                {/* Hair peeking beneath Iket */}
                <path d="M64 82C64 64 78 52 100 52C122 52 136 64 136 82C132 73 122 69 100 69C78 69 68 73 64 82Z" fill="#18181B" />

                {/* Eyebrows & Expressive Friendly Eyes */}
                <path d="M77 84C81 80 87 80 91 83" stroke="#1E1B18" strokeWidth="3.2" strokeLinecap="round" />
                <path d="M109 83C113 80 119 80 123 84" stroke="#1E1B18" strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="84" cy="92" r="4.5" fill="#1E1B18" />
                <circle cx="116" cy="92" r="4.5" fill="#1E1B18" />
                <circle cx="85.5" cy="90.5" r="1.4" fill="#FFFFFF" />
                <circle cx="117.5" cy="90.5" r="1.4" fill="#FFFFFF" />

                {/* Nose & Warm Smile */}
                <path d="M100 91V104C100 106 103 107 105 106" stroke="#A6653E" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                <path d="M88 115C94 122 106 122 112 115" stroke="#5A2D18" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M91 116C96 120 104 120 109 116" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.85" />

                {/* Traditional Sundanese Batik Headband (Iket Kepala Batik) */}
                <path
                  d="M61 74C61 52 77 38 100 38C123 38 139 52 139 74C131 68 118 65 100 65C82 65 69 68 61 74Z"
                  fill="#1E1B4B"
                  stroke="#D97706"
                  strokeWidth="1.5"
                />
                {/* Batik Motif Accents on Iket */}
                <path d="M73 56L81 48L89 56L81 62Z" fill="#F59E0B" fillOpacity="0.8" />
                <path d="M92 52L100 44L108 52L100 59Z" fill="#FBBF24" fillOpacity="0.9" />
                <path d="M111 56L119 48L127 56L119 62Z" fill="#F59E0B" fillOpacity="0.8" />
                {/* Side knot fold */}
                <path d="M132 52L147 43L142 64Z" fill="#312E81" stroke="#F59E0B" strokeWidth="1.2" />
                <path d="M68 52L53 43L58 64Z" fill="#312E81" stroke="#F59E0B" strokeWidth="1.2" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
