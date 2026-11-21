import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  CheckCircle2,
  KeyRound,
  Menu,
  Palette,
  Sparkles,
} from 'lucide-react';
import {
  AccentThemeId,
  ActiveView,
  AnalyzedCharacterFields,
  ApiAccountSlot,
  AspectRatio,
  BackupPackage,
  CharacterProfile,
  ProgressState,
  StoryFormat,
  StoryProject,
  VisualStyle,
} from './types/studio';
import { ACCENT_THEMES, DEFAULT_CHARACTERS } from './constants/themes';
import { HeroBanner } from './components/HeroBanner';
import { SideDrawer } from './components/SideDrawer';
import { StoryFormCard } from './components/StoryFormCard';
import { StoryboardErrorBoundary, StoryboardOutput } from './components/StoryboardOutput';
import { CharacterStudio } from './components/CharacterStudio';
import { BackupPanel } from './components/BackupPanel';
import { ProgressOverlay } from './components/ProgressOverlay';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEYS = {
  characters: 'kangshu_characters_v1',
  projects: 'kangshu_projects_v1',
  mascotPhoto: 'kangshu_mascot_photo_v1',
  accentTheme: 'kangshu_accent_theme_v1',
  accountSlot: 'kangshu_account_slot_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function normalizeCharacters(list: CharacterProfile[]): CharacterProfile[] {
  return list.map((c) => ({
    ...c,
    ageAndHeight: c.ageAndHeight || c.age || 'Dewasa Muda',
    familyStatus: c.familyStatus || '-',
    occupation: c.occupation || '-',
    voiceType: c.voiceType || 'Ramah & Ekspresif',
    personalityBio: c.personalityBio || '-',
    masterVisualPrompt: c.masterVisualPrompt || '',
  }));
}

function normalizeProjects(list: unknown): StoryProject[] {
  if (!Array.isArray(list)) return [];
  return list.map((p: Record<string, unknown>, pIdx: number) => {
    const rawScenes = Array.isArray(p?.scenes) ? p.scenes : [];
    const safeScenes = rawScenes.map((s: Record<string, unknown>, sIdx: number) => ({
      id: typeof s?.id === 'string' && s.id ? s.id : `scene-${Date.now()}-${sIdx + 1}`,
      sceneNumber: typeof s?.sceneNumber === 'number' ? s.sceneNumber : sIdx + 1,
      title:
        (typeof s?.title === 'string' && s.title.trim()) ||
        (typeof s?.sceneTitle === 'string' && s.sceneTitle.trim()) ||
        `Adegan ${sIdx + 1}`,
      location: (typeof s?.location === 'string' && s.location.trim()) || 'Latar adegan utama',
      charactersPresent: Array.isArray(s?.charactersPresent) ? (s.charactersPresent as string[]) : [],
      startFrameImagePrompt:
        (typeof s?.startFrameImagePrompt === 'string' && s.startFrameImagePrompt) || '',
      videoPrompt: (typeof s?.videoPrompt === 'string' && s.videoPrompt) || '',
      uploadedImageDataUrl:
        typeof s?.uploadedImageDataUrl === 'string' ? s.uploadedImageDataUrl : undefined,
    }));

    const legacyGenre =
      typeof p?.genre === 'string' && p.genre.trim()
        ? p.genre === 'Kustom' && typeof p?.customGenre === 'string' && p.customGenre.trim()
          ? p.customGenre.trim()
          : p.genre.trim()
        : 'Komedi Santai';
    const normalizedGenres =
      Array.isArray(p?.genres) && p.genres.length > 0
        ? p.genres.map((g) => String(g).trim()).filter(Boolean)
        : [legacyGenre];
    const resolvedStyle =
      (typeof p?.visualStyle === 'string' && p.visualStyle) ||
      (typeof p?.animationStyle === 'string' && p.animationStyle) ||
      '3D Animation';

    return {
      id: typeof p?.id === 'string' && p.id ? p.id : `proj-${Date.now()}-${pIdx}`,
      title: (typeof p?.title === 'string' && p.title) || 'Proyek Storyboard',
      premise: typeof p?.premise === 'string' ? p.premise : '',
      episodeNumber: typeof p?.episodeNumber === 'number' ? p.episodeNumber : 1,
      genres: normalizedGenres.length > 0 ? normalizedGenres : ['Komedi Santai'],
      customGenre: typeof p?.customGenre === 'string' ? p.customGenre : '',
      visualStyle: resolvedStyle as VisualStyle,
      customVisualStyle: typeof p?.customVisualStyle === 'string' ? p.customVisualStyle : '',
      format: (p?.format as StoryFormat) || '5 Adegan',
      aspectRatio: (p?.aspectRatio as AspectRatio) || '16:9',
      flowProjectUrl: typeof p?.flowProjectUrl === 'string' ? p.flowProjectUrl : '',
      selectedCharacterIds: Array.isArray(p?.selectedCharacterIds)
        ? (p.selectedCharacterIds as string[])
        : [],
      storySummary: typeof p?.storySummary === 'string' ? p.storySummary : '',
      isCliffhanger: Boolean(p?.isCliffhanger),
      cliffhangerHook: typeof p?.cliffhangerHook === 'string' ? p.cliffhangerHook : '',
      scenes: safeScenes,
      createdAt: typeof p?.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
      updatedAt: typeof p?.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
    };
  });
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const [accentTheme, setAccentTheme] = useState<AccentThemeId>(() =>
    readStorage<AccentThemeId>(STORAGE_KEYS.accentTheme, 'blue-purple')
  );
  const [accountSlot, setAccountSlot] = useState<ApiAccountSlot>(() =>
    readStorage<ApiAccountSlot>(STORAGE_KEYS.accountSlot, 'primary')
  );
  const [characters, setCharacters] = useState<CharacterProfile[]>(() =>
    normalizeCharacters(readStorage<CharacterProfile[]>(STORAGE_KEYS.characters, DEFAULT_CHARACTERS))
  );
  const [projects, setProjects] = useState<StoryProject[]>(() =>
    normalizeProjects(readStorage<StoryProject[]>(STORAGE_KEYS.projects, []))
  );
  const [mascotPhotoDataUrl, setMascotPhotoDataUrl] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.mascotPhoto);
    } catch {
      return null;
    }
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const saved = readStorage<StoryProject[]>(STORAGE_KEYS.projects, []);
    return saved[0]?.id ?? null;
  });

  const [serverQueueBanner, setServerQueueBanner] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [progress, setProgress] = useState<ProgressState>({
    active: false,
    percent: 0,
    title: '',
    stageLabel: '',
    stageType: 'scan',
    isQueue503: false,
  });

  const storyFormRef = useRef<HTMLDivElement | null>(null);
  const storyboardRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const theme = ACCENT_THEMES[accentTheme];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3600);
  };

  useEffect(() => {
    writeStorage(STORAGE_KEYS.accentTheme, accentTheme);
  }, [accentTheme]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.accountSlot, accountSlot);
  }, [accountSlot]);

  useEffect(() => {
    const ok = writeStorage(STORAGE_KEYS.characters, characters);
    if (!ok) {
      showToast('Penyimpanan HP hampir penuh. Hapus proyek lama atau simpan cadangan.');
    }
  }, [characters]);

  useEffect(() => {
    const ok = writeStorage(STORAGE_KEYS.projects, projects);
    if (!ok) {
      showToast('Penyimpanan proyek penuh. Simpan cadangan ke HP lalu hapus proyek lama.');
    }
  }, [projects]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 360);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  // Helper to run smooth stage progress alongside async network work (anti-92% hang via try/catch/finally)
  const runWithProgress = async <T,>(
    title: string,
    stages: Array<{ at: number; label: string; type: ProgressState['stageType'] }>,
    task: (markQueue503: (busy: boolean) => void) => Promise<T>
  ): Promise<T> => {
    let currentPercent = 5;
    let isFinished = false;
    let isQueue503 = false;

    const getStageForPercent = (pct: number) => {
      let chosen = stages[0];
      for (const s of stages) {
        if (pct >= s.at) chosen = s;
      }
      return chosen;
    };

    setProgress({
      active: true,
      percent: currentPercent,
      title,
      stageLabel: stages[0].label,
      stageType: stages[0].type,
      isQueue503: false,
    });

    const timer = window.setInterval(() => {
      if (isFinished) return;
      const step = currentPercent < 30 ? 4 : currentPercent < 70 ? 2.5 : currentPercent < 90 ? 1 : 0;
      currentPercent = Math.min(91, currentPercent + step);
      const st = getStageForPercent(currentPercent);
      setProgress({
        active: true,
        percent: Math.round(currentPercent),
        title,
        stageLabel: st.label,
        stageType: st.type,
        isQueue503,
      });
    }, 180);

    try {
      const result = await task((busy) => {
        isQueue503 = busy;
        setProgress((prev) => ({ ...prev, isQueue503: busy }));
      });
      isFinished = true;
      window.clearInterval(timer);

      setProgress({
        active: true,
        percent: 100,
        title,
        stageLabel: '100% Selesai!',
        stageType: 'done',
        isQueue503: false,
      });

      await new Promise((r) => setTimeout(r, 550));
      return result;
    } catch (err) {
      isFinished = true;
      throw err;
    } finally {
      window.clearInterval(timer);
      setProgress((prev) => ({ ...prev, active: false, isQueue503: false }));
    }
  };

  // Fetch with 25s hard timeout & automatic 503 queue retry
  const fetchJsonWith503Queue = async <T,>(
    url: string,
    body: unknown,
    markQueue503: (busy: boolean) => void
  ): Promise<T> => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 25_000);

      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new Error('Koneksi melebihi batas waktu 25 detik. Silakan coba lagi.');
        }
        throw err;
      } finally {
        window.clearTimeout(timeoutId);
      }

      const data = (await res.json().catch(() => ({}))) as T & {
        error?: string;
        code?: string;
        saw503?: boolean;
        retryAfterSeconds?: number;
      };

      if (res.status === 503 || data.code === 'SERVER_BUSY_503') {
        markQueue503(true);
        setServerQueueBanner(
          'Server AI sedang penuh (503). Sistem mengantre otomatis dan menjaga seluruh data Anda tetap aman...'
        );
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        throw new Error(
          data.error || 'Server AI sedang penuh (503). Coba klik ulang atau pindah ke Akun Cadangan.'
        );
      }

      if (!res.ok) {
        throw new Error(data.error || `Permintaan gagal (${res.status}).`);
      }

      if (data.saw503) {
        setServerQueueBanner(
          'Antrian server (503) berhasil dilewati otomatis menggunakan model cadangan.'
        );
        window.setTimeout(() => setServerQueueBanner(null), 5000);
      } else {
        setServerQueueBanner(null);
      }

      return data;
    }

    throw new Error('Server sedang sibuk. Silakan coba beberapa saat lagi.');
  };

  const handleAnalyzeCharacterPhoto = async (params: {
    base64: string;
    mimeType: string;
    name: string;
    ageAndHeight: string;
    voiceType: string;
  }): Promise<AnalyzedCharacterFields | null> => {
    try {
      const result = await runWithProgress(
        'Analisis Foto Character Sheet',
        [
          { at: 0, label: 'Membaca panel teks biodata & nama karakter...', type: 'scan' },
          { at: 40, label: 'Menganalisis sifat, keluarga & peran cerita...', type: 'story' },
          { at: 75, label: 'Menyusun Master Visual Prompt kostum & aksesori...', type: 'scene' },
        ],
        (mark503) =>
          fetchJsonWith503Queue<{ profile: AnalyzedCharacterFields }>(
            '/api/gemini/analyze-character',
            {
              imageBase64: params.base64,
              mimeType: params.mimeType,
              characterName: params.name,
              ageAndHeight: params.ageAndHeight,
              voiceType: params.voiceType,
              accountSlot,
            },
            mark503
          )
      );
      return result.profile;
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menganalisis foto karakter.');
      return null;
    }
  };

  const handleGenerateStoryboard = async (payload: {
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
    episodeNumber?: number;
    previousEpisodeContext?: string;
  }) => {
    if (!payload.title.trim()) {
      showToast('Isi Judul Cerita / Episode terlebih dahulu.');
      return;
    }

    const activeGenres = Array.isArray(payload.genres)
      ? payload.genres.map((g) => g.trim()).filter(Boolean)
      : [];
    if (activeGenres.length === 0) {
      showToast('Pilih minimal 1 genre cerita!');
      return;
    }

    const selectedChars = characters.filter((c) => payload.selectedCharacterIds.includes(c.id));
    const epNum = payload.episodeNumber ?? 1;

    try {
      const result = await runWithProgress(
        epNum > 1 ? `Menyusun Episode ${epNum}` : 'Generate Storyboard Google Flow',
        [
          { at: 0, label: 'Memindai biodata & sanitasi gaya visual karakter...', type: 'scan' },
          { at: 40, label: `Memadukan genre ${activeGenres.join(' + ')} & dialog...`, type: 'story' },
          { at: 75, label: 'Meracik prompt Start Frame & Video per adegan...', type: 'scene' },
        ],
        (mark503) =>
          fetchJsonWith503Queue<{
            storySummary: string;
            isCliffhanger: boolean;
            cliffhangerHook: string;
            scenes: StoryProject['scenes'];
          }>(
            '/api/gemini/generate-storyboard',
            {
              ...payload,
              genres: activeGenres,
              episodeNumber: epNum,
              characters: selectedChars.map((c) => ({
                id: c.id,
                name: c.name,
                ageAndHeight: c.ageAndHeight || c.age || 'Dewasa',
                familyStatus: c.familyStatus || '-',
                occupation: c.occupation || '-',
                voiceType: c.voiceType || 'Ramah & Ekspresif',
                personalityBio: c.personalityBio || '-',
                masterVisualPrompt: c.masterVisualPrompt,
              })),
              accountSlot,
            },
            mark503
          )
      );

      if (
        !result ||
        typeof result.storySummary !== 'string' ||
        !Array.isArray(result.scenes) ||
        result.scenes.length === 0
      ) {
        throw new Error(
          'Hasil storyboard dari AI tidak lengkap atau daftar adegan kosong. Silakan coba generate ulang.'
        );
      }

      const now = new Date().toISOString();
      const newProject: StoryProject = normalizeProjects([
        {
          id: `proj-${Date.now()}`,
          title: payload.title,
          premise: payload.premise,
          episodeNumber: epNum,
          genres: activeGenres,
          customGenre: payload.customGenre,
          visualStyle: payload.visualStyle,
          customVisualStyle: payload.customVisualStyle,
          format: payload.format,
          aspectRatio: payload.aspectRatio,
          flowProjectUrl: payload.flowProjectUrl,
          selectedCharacterIds: payload.selectedCharacterIds,
          storySummary: result.storySummary,
          isCliffhanger: result.isCliffhanger,
          cliffhangerHook: result.cliffhangerHook,
          scenes: result.scenes,
          createdAt: now,
          updatedAt: now,
        },
      ])[0];

      setProjects((prev) => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      showToast(`Storyboard "${newProject.title}" siap digunakan di Google Flow!`);

      window.setTimeout(() => {
        storyboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal membuat storyboard.');
    }
  };

  const handleContinueSeries = (project: StoryProject) => {
    const nextEp = (project?.episodeNumber || 1) + 1;
    const baseTitle = (project?.title || 'Cerita').replace(/\s*-\s*Episode\s*\d+$/i, '').trim();
    const nextTitle = `${baseTitle} - Episode ${nextEp}`;
    const safeScenes = Array.isArray(project?.scenes) ? project.scenes : [];
    const lastScenePrompt =
      safeScenes.length > 0 ? safeScenes[safeScenes.length - 1]?.videoPrompt || '' : '';
    const prevContext = `Summary Episode ${project?.episodeNumber || 1}: ${project?.storySummary || ''}\nCliffhanger Hook: ${project?.cliffhangerHook || lastScenePrompt}`;
    const nextGenres =
      Array.isArray(project?.genres) && project.genres.length > 0
        ? project.genres
        : [project?.genre || 'Komedi Santai'];

    void handleGenerateStoryboard({
      title: nextTitle,
      premise: project.premise || '',
      genres: nextGenres,
      customGenre: project.customGenre || '',
      visualStyle: (project.visualStyle || project.animationStyle || '3D Animation') as VisualStyle,
      customVisualStyle: project.customVisualStyle || '',
      format: 'Series (Bersambung)',
      aspectRatio: project.aspectRatio,
      flowProjectUrl: project.flowProjectUrl,
      selectedCharacterIds: project.selectedCharacterIds,
      episodeNumber: nextEp,
      previousEpisodeContext: prevContext,
    });
  };

  const handleSaveCharacter = (character: CharacterProfile) => {
    setCharacters((prev) => {
      const exists = prev.some((c) => c.id === character.id);
      if (exists) {
        return prev.map((c) => (c.id === character.id ? character : c));
      }
      return [character, ...prev];
    });
  };

  const handleDeleteCharacter = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateProjectFlowUrl = (projectId: string, url: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, flowProjectUrl: url, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
    showToast('Proyek cerita dihapus.');
  };

  const handleSaveBackup = async () => {
    await runWithProgress(
      'Menyimpan Paket Cadangan',
      [
        { at: 0, label: 'Mengumpulkan profil Character Studio...', type: 'backup' },
        { at: 45, label: 'Mengemas proyek storyboard & foto adegan...', type: 'backup' },
        { at: 80, label: 'Menyiapkan file unduhan ke HP...', type: 'backup' },
      ],
      async () => {
        await new Promise((r) => setTimeout(r, 550));
        const pkg: BackupPackage = {
          app: 'Kangshu AI Studio',
          exportedAt: new Date().toISOString(),
          mascotPhotoDataUrl,
          characters,
          projects,
          accentTheme,
        };
        const dateStr = new Date().toISOString().slice(0, 10);
        const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cadangan-Kangshu-Studio-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    );

    showToast('Berhasil! Paket cadangan karakter & cerita tersimpan di folder Download HP.');
  };

  const handleLoadBackup = async (file: File) => {
    try {
      await runWithProgress(
        'Memulihkan Data Studio',
        [
          { at: 0, label: 'Membaca file cadangan dari perangkat...', type: 'backup' },
          { at: 45, label: 'Memvalidasi karakter & foto maskot...', type: 'scan' },
          { at: 80, label: 'Memulihkan proyek storyboard...', type: 'scene' },
        ],
        async () => {
          const text = await file.text();
          const parsed = JSON.parse(text) as Partial<BackupPackage>;
          if (!Array.isArray(parsed.characters) || !Array.isArray(parsed.projects)) {
            throw new Error('File cadangan tidak dikenali atau rusak.');
          }
          await new Promise((r) => setTimeout(r, 500));
          const restoredProjects = normalizeProjects(parsed.projects);
          setCharacters(normalizeCharacters(parsed.characters));
          setProjects(restoredProjects);
          setActiveProjectId(restoredProjects[0]?.id ?? null);
          if (parsed.mascotPhotoDataUrl) {
            setMascotPhotoDataUrl(parsed.mascotPhotoDataUrl);
            try {
              localStorage.setItem(STORAGE_KEYS.mascotPhoto, parsed.mascotPhotoDataUrl);
            } catch {
              // ignore
            }
          }
          if (parsed.accentTheme && ACCENT_THEMES[parsed.accentTheme]) {
            setAccentTheme(parsed.accentTheme);
          }
        }
      );

      showToast('Semua karakter & proyek cerita berhasil dipulihkan!');
      setActiveView('dashboard');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal memulihkan file cadangan.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 overflow-x-hidden flex flex-col">
      {/* Compact Sticky Mobile-First Top Bar */}
      <header className="sticky top-0 z-30 h-14 bg-[#0B0E14]/90 backdrop-blur-md border-b border-[#23293A] px-3 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="min-h-[42px] min-w-[42px] rounded-xl bg-[#131722] hover:bg-[#1B2132] border border-[#23293A] flex items-center justify-center text-slate-200 transition shrink-0 cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="text-left min-w-0 cursor-pointer"
          >
            <span className="block text-sm sm:text-base font-extrabold tracking-tight text-white truncate">
              Kangshu AI Studio
            </span>
          </button>
        </div>

        {/* Right Quick Controls: API Account Toggle + Accent Theme Switcher + PWA Install */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick API Account Selector */}
          <button
            type="button"
            onClick={() => {
              const next = accountSlot === 'primary' ? 'backup' : 'primary';
              setAccountSlot(next);
              showToast(
                next === 'primary'
                  ? 'Beralih ke Akun API Key Utama.'
                  : 'Beralih ke Akun API Key Cadangan.'
              );
            }}
            title="Ganti Akun API Key"
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#131722] hover:bg-[#1B2132] border border-[#23293A] px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition whitespace-nowrap cursor-pointer"
          >
            <KeyRound className={`w-3.5 h-3.5 ${accountSlot === 'primary' ? 'text-sky-400' : 'text-amber-400'}`} />
            <span className="hidden xs:inline sm:inline">
              {accountSlot === 'primary' ? 'Akun Utama' : 'Akun Cadangan'}
            </span>
            <span className="sm:hidden xs:hidden">
              {accountSlot === 'primary' ? 'Utama' : 'Cadangan'}
            </span>
          </button>

          {/* Quick Theme Accent Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeMenuOpen((v) => !v)}
              title="Ganti Nuansa Aksen"
              aria-label="Ganti Nuansa Aksen"
              className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#131722] hover:bg-[#1B2132] border border-[#23293A] px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-purple-300" />
              <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.swatchClass}`} />
            </button>

            {themeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setThemeMenuOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-52 z-40 rounded-2xl bg-[#131722] border border-[#23293A] shadow-2xl p-2 space-y-1">
                  {(Object.keys(ACCENT_THEMES) as AccentThemeId[]).map((id) => {
                    const t = ACCENT_THEMES[id];
                    const active = accentTheme === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setAccentTheme(id);
                          setThemeMenuOpen(false);
                          showToast(`Nuansa "${t.label}" aktif!`);
                        }}
                        className={`w-full min-h-[40px] flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                          active
                            ? 'bg-white/10 text-white'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{t.label}</span>
                        <span className={`w-5 h-2.5 rounded-full bg-gradient-to-r ${t.swatchClass}`} />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <PWAInstallButton compact />
        </div>
      </header>

      {/* Main Content Container with Safe Bottom Padding (pb-28) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-6 pt-4 pb-28 space-y-6">
        {/* Automatic 503 Server Queue Banner */}
        {serverQueueBanner && (
          <div
            role="status"
            className="rounded-xl bg-amber-500/15 border border-amber-400/50 px-4 py-3 flex items-start gap-3 text-xs sm:text-sm text-amber-200"
          >
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-amber-300">Antrian Server Penuh (503)</p>
              <p className="text-amber-100/90 mt-0.5">{serverQueueBanner}</p>
            </div>
            <button
              type="button"
              onClick={() => setServerQueueBanner(null)}
              className="text-xs font-semibold text-amber-300 hover:text-white cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Quick View Switcher Strip below Header for Desktop/Mobile thumb convenience */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#131722] border border-[#23293A] p-1.5">
          {(
            [
              { id: 'dashboard', label: 'Buat Cerita' },
              { id: 'characters', label: `Karakter (${characters.length})` },
              { id: 'backup', label: 'Cadangan' },
            ] as { id: ActiveView; label: string }[]
          ).map((tab) => {
            const active = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`min-h-[42px] rounded-xl px-2 py-2 text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap truncate ${
                  active
                    ? `${theme.primaryButtonGradient} text-white shadow`
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeView === 'dashboard' && (
          <>
            <HeroBanner
              accentTheme={accentTheme}
              mascotImageUrl={mascotPhotoDataUrl}
              onStartStoryClick={() =>
                storyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            />

            <StoryFormCard
              accentTheme={accentTheme}
              characters={characters}
              projects={projects}
              activeProjectId={activeProjectId}
              formRef={storyFormRef}
              onGenerateStoryboard={handleGenerateStoryboard}
              onSelectProject={(id) => {
                setActiveProjectId(id);
                window.setTimeout(() => {
                  storyboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }}
              onDeleteProject={handleDeleteProject}
              onGoToCharacterStudio={() => setActiveView('characters')}
              onToast={showToast}
            />

            {activeProject && (
              <div ref={storyboardRef}>
                <StoryboardErrorBoundary
                  accentTheme={accentTheme}
                  onBackToForm={() => {
                    setActiveProjectId(null);
                    storyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <StoryboardOutput
                    accentTheme={accentTheme}
                    project={activeProject}
                    onUpdateProjectFlowUrl={handleUpdateProjectFlowUrl}
                    onContinueSeries={handleContinueSeries}
                    onBackToForm={() => {
                      setActiveProjectId(null);
                      storyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    onToast={showToast}
                  />
                </StoryboardErrorBoundary>
              </div>
            )}
          </>
        )}

        {activeView === 'characters' && (
          <CharacterStudio
            accentTheme={accentTheme}
            characters={characters}
            onSaveCharacter={handleSaveCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            onAnalyzeCharacterPhoto={handleAnalyzeCharacterPhoto}
            onToast={showToast}
          />
        )}

        {activeView === 'backup' && (
          <BackupPanel
            accentTheme={accentTheme}
            characterCount={characters.length}
            projectCount={projects.length}
            onSaveBackup={handleSaveBackup}
            onLoadBackup={handleLoadBackup}
          />
        )}
      </main>

      {/* Side Drawer Navigation */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeView={activeView}
        onSelectView={setActiveView}
        accentTheme={accentTheme}
        onSelectTheme={(t) => {
          setAccentTheme(t);
          showToast(`Nuansa "${ACCENT_THEMES[t].label}" aktif!`);
        }}
        accountSlot={accountSlot}
        onSelectAccount={(slot) => {
          setAccountSlot(slot);
          showToast(
            slot === 'primary'
              ? 'Akun API Key Utama dipilih.'
              : 'Akun API Key Cadangan dipilih.'
          );
        }}
      />

      {/* Colored Animated Progress Overlay */}
      <ProgressOverlay progress={progress} accentTheme={accentTheme} />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-md rounded-2xl bg-[#131722] border border-emerald-400/50 px-4 py-3 shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold text-white"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="leading-snug">{toastMessage}</span>
        </div>
      )}

      {/* Floating Bottom-Right Quick Button (safe thanks to pb-28 on main) */}
      <button
        type="button"
        onClick={() => {
          if (showScrollTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setActiveView('dashboard');
            window.setTimeout(() => {
              storyFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
          }
        }}
        aria-label={showScrollTop ? 'Kembali ke atas' : 'Buat cerita baru'}
        className={`fixed bottom-5 right-4 z-30 min-h-[48px] min-w-[48px] rounded-2xl ${theme.primaryButtonGradient} ${theme.primaryButtonShadow} px-4 py-3 flex items-center justify-center gap-2 text-xs font-bold text-white shadow-2xl active:scale-95 transition cursor-pointer`}
      >
        {showScrollTop ? (
          <>
            <ArrowUp className="w-4 h-4" />
            <span className="hidden sm:inline">Ke Atas</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Buat Cerita</span>
          </>
        )}
      </button>

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
