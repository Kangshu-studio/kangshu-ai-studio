import React from 'react';
import { CheckCircle2, Clapperboard, HardDrive, ScanSearch, Sparkles, AlertTriangle } from 'lucide-react';
import { ProgressState, AccentThemeId } from '../types/studio';
import { ACCENT_THEMES } from '../constants/themes';

interface ProgressOverlayProps {
  progress: ProgressState;
  accentTheme: AccentThemeId;
}

export const ProgressOverlay: React.FC<ProgressOverlayProps> = ({ progress, accentTheme }) => {
  if (!progress.active) return null;

  const theme = ACCENT_THEMES[accentTheme];
  const clamped = Math.max(0, Math.min(100, Math.round(progress.percent)));
  const isDone = clamped >= 100 || progress.stageType === 'done';

  const renderIcon = () => {
    if (isDone) {
      return <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-bounce" />;
    }
    if (progress.stageType === 'backup') {
      return <HardDrive className="w-7 h-7 text-sky-400 animate-pulse" />;
    }
    if (clamped < 35 || progress.stageType === 'scan') {
      return <ScanSearch className="w-7 h-7 text-sky-400 animate-pulse" />;
    }
    if (clamped < 72 || progress.stageType === 'story') {
      return <Sparkles className="w-7 h-7 text-purple-400 animate-spin" style={{ animationDuration: '2.6s' }} />;
    }
    return <Clapperboard className="w-7 h-7 text-pink-400 animate-pulse" />;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-label={progress.title}
    >
      <div className="w-full max-w-md rounded-2xl bg-[#131722] border border-[#23293A] p-6 shadow-2xl space-y-5">
        {progress.isQueue503 && (
          <div className="flex items-start gap-3 rounded-xl bg-amber-500/15 border border-amber-400/40 px-3.5 py-3 text-amber-200 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300">Server Sedang Penuh (Antrian 503)</p>
              <p className="text-amber-200/85 mt-0.5">
                Sistem otomatis mengantre & beralih ke jalur cadangan tanpa menghapus input Anda.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#0B0E14] border border-[#23293A] flex items-center justify-center shrink-0">
              {renderIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate">{progress.title}</h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                {isDone ? '100% Selesai!' : progress.stageLabel}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span
              className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                isDone ? 'text-emerald-400' : 'text-white'
              }`}
            >
              {clamped}%
            </span>
          </div>
        </div>

        {/* Thick gradient progress bar with shimmer */}
        <div className="relative h-4 w-full rounded-full bg-[#0B0E14] border border-[#23293A] overflow-hidden">
          <div
            className={`relative h-full rounded-full transition-all duration-300 ease-out overflow-hidden ${
              isDone
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : `bg-gradient-to-r ${theme.progressGradient}`
            }`}
            style={{ width: `${clamped}%` }}
          >
            {!isDone && (
              <div className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-shimmer" />
            )}
          </div>
        </div>

        {/* Stage milestone indicators */}
        <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1">
          <div className={`flex items-center gap-1 ${clamped >= 15 ? 'text-sky-300 font-medium' : ''}`}>
            <span>15%</span>
            <span className="truncate">Karakter</span>
          </div>
          <div className={`flex items-center gap-1 ${clamped >= 45 ? 'text-indigo-300 font-medium' : ''}`}>
            <span>45%</span>
            <span className="truncate">Cerita</span>
          </div>
          <div className={`flex items-center gap-1 ${clamped >= 80 ? 'text-pink-300 font-medium' : ''}`}>
            <span>80%</span>
            <span className="truncate">Prompt</span>
          </div>
          <div className={`flex items-center justify-end gap-1 ${clamped >= 100 ? 'text-emerald-400 font-semibold' : ''}`}>
            <span>100%</span>
            <span>Selesai</span>
          </div>
        </div>
      </div>
    </div>
  );
};
