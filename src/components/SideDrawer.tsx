import React from 'react';
import {
  Clapperboard,
  HardDriveDownload,
  KeyRound,
  Palette,
  Users,
  X,
} from 'lucide-react';
import { AccentThemeId, ActiveView, ApiAccountSlot } from '../types/studio';
import { ACCENT_THEMES } from '../constants/themes';
import { PWAInstallButton } from './PWAInstallButton';

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  accentTheme: AccentThemeId;
  onSelectTheme: (theme: AccentThemeId) => void;
  accountSlot: ApiAccountSlot;
  onSelectAccount: (slot: ApiAccountSlot) => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  open,
  onClose,
  activeView,
  onSelectView,
  accentTheme,
  onSelectTheme,
  accountSlot,
  onSelectAccount,
}) => {
  if (!open) return null;

  const navItems: { id: ActiveView; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard / Buat Cerita',
      desc: 'Susun naskah & prompt Google Flow',
      icon: <Clapperboard className="w-5 h-5" />,
    },
    {
      id: 'characters',
      label: 'Character Studio',
      desc: 'Kelola profil & foto Character Sheet',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'backup',
      label: 'Simpan & Muat Cadangan',
      desc: 'Cadangkan data ke penyimpanan HP',
      icon: <HardDriveDownload className="w-5 h-5" />,
    },
  ];

  const handleNav = (view: ActiveView) => {
    onSelectView(view);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 w-[84vw] max-w-xs h-full bg-[#131722] border-r border-[#23293A] flex flex-col justify-between overflow-y-auto p-5">
        <div className="space-y-6">
          {/* Top Brand + Close */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#23293A]">
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">Kangshu AI Studio</h2>
              <p className="text-xs text-slate-400">Produksi Animasi Google Flow</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation */}
          <nav className="space-y-2" aria-label="Menu Utama">
            <p className="text-xs font-semibold text-slate-400 px-1">Menu Studio</p>
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNav(item.id)}
                  className={`w-full min-h-[52px] flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-500/20 border border-indigo-400/50 text-white'
                      : 'border border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-sky-300' : 'text-slate-400'}>{item.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{item.label}</div>
                    <div className="text-[11px] text-slate-400 truncate">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* API Key Account Selector */}
          <div className="space-y-2.5 pt-2 border-t border-[#23293A]">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 px-1">
              <KeyRound className="w-4 h-4 text-sky-400" />
              <span>Akun API Key</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['primary', 'backup'] as ApiAccountSlot[]).map((slot) => {
                const active = accountSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => onSelectAccount(slot)}
                    className={`min-h-[44px] rounded-xl px-3 py-2 text-xs font-semibold border transition cursor-pointer ${
                      active
                        ? 'bg-indigo-500/25 border-indigo-400 text-white'
                        : 'bg-[#0B0E14] border-[#23293A] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {slot === 'primary' ? 'Akun Utama' : 'Akun Cadangan'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Accent Switcher */}
          <div className="space-y-2.5 pt-2 border-t border-[#23293A]">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 px-1">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Nuansa Aksen Studio</span>
            </div>
            <div className="space-y-1.5">
              {(Object.keys(ACCENT_THEMES) as AccentThemeId[]).map((id) => {
                const t = ACCENT_THEMES[id];
                const active = accentTheme === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectTheme(id)}
                    className={`w-full min-h-[44px] flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-semibold border transition cursor-pointer ${
                      active
                        ? 'bg-white/10 border-white/30 text-white'
                        : 'bg-[#0B0E14] border-[#23293A] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className={`w-6 h-3 rounded-full bg-gradient-to-r ${t.swatchClass}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom PWA Install CTA */}
        <div className="pt-4 border-t border-[#23293A] flex flex-col gap-2">
          <PWAInstallButton className="w-full" />
        </div>
      </aside>
    </div>
  );
};
