import React, { useRef } from 'react';
import { Download, FolderOpen, ShieldCheck } from 'lucide-react';
import { AccentThemeId } from '../types/studio';
import { ACCENT_THEMES } from '../constants/themes';

interface BackupPanelProps {
  accentTheme: AccentThemeId;
  characterCount: number;
  projectCount: number;
  onSaveBackup: () => void;
  onLoadBackup: (file: File) => void;
}

export const BackupPanel: React.FC<BackupPanelProps> = ({
  accentTheme,
  characterCount,
  projectCount,
  onSaveBackup,
  onLoadBackup,
}) => {
  const theme = ACCENT_THEMES[accentTheme];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadBackup(file);
    }
    e.target.value = '';
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-[#131722] border border-[#23293A] p-5 sm:p-6 space-y-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Penyimpanan Aman di Perangkat</span>
          </div>
          <h2 className="text-xl font-bold text-white">Simpan & Muat Cadangan</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Amankan seluruh profil Character Studio, foto maskot Kang Shu, dan daftar proyek cerita ke penyimpanan HP agar bisa dipulihkan kapan saja.
          </p>
        </div>

        {/* Summary stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#0B0E14] border border-[#23293A] p-3.5">
            <div className="text-xs text-slate-400">Karakter Tersimpan</div>
            <div className="text-2xl font-extrabold text-white tabular-nums mt-0.5">{characterCount}</div>
          </div>
          <div className="rounded-xl bg-[#0B0E14] border border-[#23293A] p-3.5">
            <div className="text-xs text-slate-400">Proyek Cerita</div>
            <div className="text-2xl font-extrabold text-white tabular-nums mt-0.5">{projectCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Simpan Cadangan */}
          <button
            type="button"
            onClick={onSaveBackup}
            className={`min-h-[68px] flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left text-white ${theme.primaryButtonGradient} ${theme.primaryButtonShadow} active:scale-[0.99] transition cursor-pointer`}
          >
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold">Simpan Cadangan</div>
              <div className="text-xs text-white/85 mt-0.5">Simpan karakter & cerita ke HP</div>
            </div>
          </button>

          {/* Muat Cadangan */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[68px] flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left bg-[#0B0E14] hover:bg-[#1A2030] border border-[#23293A] hover:border-slate-500 transition active:scale-[0.99] cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white">Muat Cadangan</div>
              <div className="text-xs text-slate-400 mt-0.5">Pulihkan data dari HP</div>
            </div>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          aria-label="Pilih file cadangan dari HP"
        />
      </div>
    </section>
  );
};
