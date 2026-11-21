import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false, className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white border border-indigo-400/30 transition whitespace-nowrap shrink-0 cursor-pointer ${className}`}
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{compact ? 'Install' : 'Install Aplikasi'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`min-h-[40px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#23293A] bg-[#131722] hover:bg-[#1B2131] px-3 py-2 text-xs font-medium text-slate-200 transition whitespace-nowrap shrink-0 cursor-pointer ${className}`}
        >
          <Smartphone className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{compact ? 'Install iOS' : 'Pasang di iPhone'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#131722] border border-[#23293A] p-6 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold text-white">Pasang di Layar Utama iPhone</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
                  aria-label="Tutup panduan"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-slate-300 list-decimal list-inside">
                <li>Ketuk ikon <strong>Bagikan (Share)</strong> di bar bawah Safari.</li>
                <li>Gulir ke bawah lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
