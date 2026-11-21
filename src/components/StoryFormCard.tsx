import React, { useMemo, useState } from 'react';
import {
  Check,
  Film,
  FolderKanban,
  Link2,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import {
  AccentThemeId,
  AspectRatio,
  CharacterProfile,
  StoryFormat,
  StoryProject,
  VisualStyle,
} from '../types/studio';
import { ACCENT_THEMES, GENRE_OPTIONS, VISUAL_STYLE_OPTIONS } from '../constants/themes';

interface StoryFormCardProps {
  accentTheme: AccentThemeId;
  characters: CharacterProfile[];
  projects: StoryProject[];
  activeProjectId: string | null;
  formRef?: React.RefObject<HTMLDivElement | null>;
  onGenerateStoryboard: (payload: {
    title: string;
    premise: string;
    genres: string[];
    customGenre: string;
    visualStyle: VisualStyle;
    customVisualStyle: string;
    format: StoryFormat;
    aspectRatio: AspectRatio;
    flowProjectUrl: string;
    selectedCharacterIds: string[];
  }) => void;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onGoToCharacterStudio: () => void;
  onToast: (message: string) => void;
}

const FORMAT_OPTIONS: StoryFormat[] = [
  '5 Adegan',
  '8 Adegan',
  '10 Adegan',
  'Series (Bersambung)',
];

const RATIO_OPTIONS: AspectRatio[] = ['16:9', '9:16', '1:1'];

export const StoryFormCard: React.FC<StoryFormCardProps> = ({
  accentTheme,
  characters,
  projects,
  activeProjectId,
  formRef,
  onGenerateStoryboard,
  onSelectProject,
  onDeleteProject,
  onGoToCharacterStudio,
  onToast,
}) => {
  const theme = ACCENT_THEMES[accentTheme];

  const safeCharacters = Array.isArray(characters) ? characters : [];
  const safeProjects = Array.isArray(projects) ? projects : [];

  const [tab, setTab] = useState<'create' | 'saved'>('create');
  const [title, setTitle] = useState('');
  const [premise, setPremise] = useState('');
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(() =>
    safeCharacters.slice(0, 3).map((c) => c.id)
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Komedi Santai']);
  const [customGenre, setCustomGenre] = useState('');
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('3D Animation');
  const [customVisualStyle, setCustomVisualStyle] = useState('');
  const [format, setFormat] = useState<StoryFormat>('5 Adegan');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [flowProjectUrl, setFlowProjectUrl] = useState('');

  const toggleCharacter = (id: string) => {
    setSelectedCharacterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((prev) => {
      if (prev.includes(genreId)) {
        if (prev.length <= 1) {
          onToast('Pilih minimal 1 genre cerita!');
          return prev;
        }
        return prev.filter((item) => item !== genreId);
      }
      return [...prev, genreId];
    });
  };

  const resolvedGenres = useMemo(() => {
    const out: string[] = [];
    for (const g of selectedGenres) {
      if (g === 'Kustom') {
        const trimmed = customGenre.trim();
        if (trimmed) out.push(trimmed);
      } else {
        out.push(g);
      }
    }
    return Array.from(new Set(out));
  }, [selectedGenres, customGenre]);

  const activeGenreSummary = useMemo(() => {
    const labels = selectedGenres.map((g) =>
      g === 'Kustom' ? customGenre.trim() || 'Kustom' : g
    );
    return labels.length > 0 ? labels.join(' + ') : 'Belum dipilih';
  }, [selectedGenres, customGenre]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvedGenres.length === 0) {
      onToast('Pilih minimal 1 genre cerita!');
      return;
    }
    if (visualStyle === 'Kustom' && !customVisualStyle.trim()) {
      onToast('Isi deskripsi Gaya Visual Kustom terlebih dahulu!');
      return;
    }
    onGenerateStoryboard({
      title: title.trim(),
      premise: premise.trim(),
      genres: resolvedGenres,
      customGenre: customGenre.trim(),
      visualStyle,
      customVisualStyle: customVisualStyle.trim(),
      format,
      aspectRatio,
      flowProjectUrl: flowProjectUrl.trim(),
      selectedCharacterIds,
    });
  };

  return (
    <div
      ref={formRef}
      className="rounded-2xl bg-[#131722] border border-[#23293A] shadow-xl overflow-hidden"
    >
      {/* Top Mode Tabs */}
      <div className="grid grid-cols-2 border-b border-[#23293A] bg-[#0B0E14]/60 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setTab('create')}
          className={`min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
            tab === 'create'
              ? `${theme.primaryButtonGradient} text-white shadow`
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Buat Cerita Baru</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('saved')}
          className={`min-h-[44px] rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition cursor-pointer ${
            tab === 'saved'
              ? `${theme.primaryButtonGradient} text-white shadow`
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderKanban className="w-4 h-4 shrink-0" />
          <span>Daftar Proyek Tersimpan ({safeProjects.length})</span>
        </button>
      </div>

      {tab === 'create' ? (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Judul Cerita / Episode */}
          <div className="space-y-2">
            <label htmlFor="story-title" className="block text-sm font-bold text-white">
              Judul Cerita / Episode
            </label>
            <input
              id="story-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Kang Shu Buka Warung Kopi Masa Depan"
              className={`w-full min-h-[48px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
            />
            <input
              type="text"
              value={premise}
              onChange={(e) => setPremise(e.target.value)}
              placeholder="Ide singkat / konflik utama (opsional, biarkan kosong jika ingin AI berkreasi)..."
              aria-label="Ide singkat cerita"
              className={`w-full min-h-[42px] rounded-xl bg-[#0B0E14]/70 border border-[#23293A] px-4 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
            />
          </div>

          {/* Pemeran yang Ikut */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white">Pemeran yang Ikut</span>
              <button
                type="button"
                onClick={onGoToCharacterStudio}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:text-sky-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Kelola Karakter</span>
              </button>
            </div>

            {safeCharacters.length === 0 ? (
              <div className="rounded-xl bg-[#0B0E14] border border-[#23293A] p-4 text-xs text-slate-400 flex items-center justify-between">
                <span>Belum ada karakter tersimpan.</span>
                <button
                  type="button"
                  onClick={onGoToCharacterStudio}
                  className="text-sky-400 font-semibold underline"
                >
                  Buat Karakter
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {safeCharacters.map((char) => {
                  const selected = selectedCharacterIds.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => toggleCharacter(char.id)}
                      className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                        selected
                          ? theme.activeChipClass
                          : 'bg-[#0B0E14] border-[#23293A] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-white/10 overflow-hidden flex items-center justify-center shrink-0 text-[10px] font-bold">
                        {char.photoDataUrl ? (
                          <img
                            src={char.photoDataUrl}
                            alt={char.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </span>
                      <span>{char.name}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-sky-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Multi-Genre Pill Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="block text-sm font-bold text-white">
                Genre Cerita (Bisa Pilih Lebih dari 1)
              </span>
              <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                {selectedGenres.length} dipilih
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((item) => {
                const active = selectedGenres.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleGenre(item.id)}
                    className={`min-h-[42px] inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                      active
                        ? `${theme.primaryButtonGradient} border-transparent text-white shadow-md`
                        : 'bg-[#0B0E14] border-[#23293A] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span aria-hidden="true">{item.emoji}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedGenres.includes('Kustom') && (
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="Tulis genre kustom (misal: Sci-Fi Sunda / Aksi Silat Kocak)..."
                className={`w-full min-h-[44px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
              />
            )}

            {/* Active Genre Combination Bar */}
            <div className="rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2.5 text-xs text-slate-300 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-400">Kombinasi Genre Aktif:</span>
              <span className="font-bold text-sky-300">{activeGenreSummary}</span>
            </div>
          </div>

          {/* Gaya Visual (5 Pill Buttons + Kustom Input) */}
          <div className="space-y-2.5">
            <span className="block text-sm font-bold text-white">Gaya Visual</span>
            <div className="flex flex-wrap gap-2">
              {VISUAL_STYLE_OPTIONS.map((style) => {
                const active = visualStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setVisualStyle(style.id)}
                    className={`min-h-[44px] inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                      active
                        ? `${theme.primaryButtonGradient} border-transparent text-white shadow`
                        : 'bg-[#0B0E14] border-[#23293A] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span aria-hidden="true">{style.emoji}</span>
                    <span>{style.label}</span>
                  </button>
                );
              })}
            </div>

            {visualStyle === 'Kustom' && (
              <input
                type="text"
                value={customVisualStyle}
                onChange={(e) => setCustomVisualStyle(e.target.value)}
                placeholder="Tulis gaya visual kustom (misal: Anime Ghibli Cat Air / Komik Retro 90an / Miniatur Diorama)..."
                className={`w-full min-h-[44px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
              />
            )}
          </div>

          {/* Rasio Layar & Jumlah Adegan / Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="block text-sm font-bold text-white">Rasio Layar</span>
              <div className="grid grid-cols-3 gap-2">
                {RATIO_OPTIONS.map((r) => {
                  const active = aspectRatio === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAspectRatio(r)}
                      className={`min-h-[44px] rounded-full border px-3 py-2 text-xs font-bold tabular-nums transition cursor-pointer ${
                        active
                          ? `${theme.primaryButtonGradient} border-transparent text-white shadow`
                          : 'bg-[#0B0E14] border-[#23293A] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-bold text-white">Jumlah Adegan / Format</span>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((fmt) => {
                  const active = format === fmt;
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFormat(fmt)}
                      className={`min-h-[44px] rounded-full border px-2.5 py-2 text-xs font-semibold transition cursor-pointer truncate ${
                        active
                          ? `${theme.primaryButtonGradient} border-transparent text-white shadow`
                          : 'bg-[#0B0E14] border-[#23293A] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {fmt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Link Project Google Flow (Opsional) */}
          <div className="space-y-1.5">
            <label htmlFor="flow-url" className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Link2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Link Project Google Flow (Opsional)</span>
            </label>
            <input
              id="flow-url"
              type="url"
              value={flowProjectUrl}
              onChange={(e) => setFlowProjectUrl(e.target.value)}
              placeholder="https://flow.google.com/... (kosongkan untuk buka beranda Google Flow)"
              className={`w-full min-h-[44px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
            />
          </div>

          {/* Primary CTA: Generate Storyboard */}
          <button
            type="submit"
            className={`w-full min-h-[52px] rounded-2xl ${theme.primaryButtonGradient} ${theme.primaryButtonShadow} flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-extrabold text-white active:scale-[0.99] transition cursor-pointer`}
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>Generate Storyboard</span>
          </button>
        </form>
      ) : (
        /* Saved Projects List */
        <div className="p-5 sm:p-6 space-y-3">
          {safeProjects.length === 0 ? (
            <div className="rounded-xl bg-[#0B0E14] border border-[#23293A] p-8 text-center space-y-3">
              <Film className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Belum ada proyek storyboard tersimpan</p>
              <p className="text-xs text-slate-500">
                Buat cerita pertama Anda di tab &ldquo;Buat Cerita Baru&rdquo;, hasilnya akan otomatis tersimpan di sini.
              </p>
            </div>
          ) : (
            safeProjects.map((proj) => {
              const isCurrent = proj.id === activeProjectId;
              const projScenesCount = Array.isArray(proj?.scenes) ? proj.scenes.length : 0;
              const genreText =
                Array.isArray(proj?.genres) && proj.genres.length > 0
                  ? proj.genres.join(' + ')
                  : proj?.genre === 'Kustom'
                  ? proj?.customGenre || 'Kustom'
                  : proj?.genre || 'Komedi Santai';
              const styleText =
                proj?.visualStyle === 'Kustom'
                  ? proj?.customVisualStyle || 'Kustom'
                  : proj?.visualStyle || proj?.animationStyle || '3D Animation';

              return (
                <div
                  key={proj.id}
                  className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isCurrent
                      ? 'bg-indigo-500/10 border-indigo-400/50'
                      : 'bg-[#0B0E14] border-[#23293A] hover:border-slate-600'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <h3 className="text-sm font-bold text-white truncate">
                      {proj.title} {proj.format === 'Series (Bersambung)' ? `(Ep. ${proj.episodeNumber})` : ''}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {genreText} · {styleText} · {projScenesCount} Adegan · {proj.aspectRatio}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectProject(proj.id)}
                      className={`min-h-[40px] rounded-xl px-4 py-2 text-xs font-bold text-white ${theme.primaryButtonGradient} cursor-pointer`}
                    >
                      Buka Proyek
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj.id)}
                      className="min-h-[40px] min-w-[40px] rounded-xl bg-[#131722] hover:bg-rose-500/20 border border-[#23293A] hover:border-rose-500/40 flex items-center justify-center text-slate-400 hover:text-rose-300 cursor-pointer"
                      aria-label={`Hapus proyek ${proj.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
