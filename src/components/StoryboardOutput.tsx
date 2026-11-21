import React, { Component, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  FastForward,
  Link2,
  MapPin,
} from 'lucide-react';
import { AccentThemeId, AspectRatio, SceneCardData, StoryProject } from '../types/studio';
import { ACCENT_THEMES } from '../constants/themes';
import { copyToClipboard } from '../utils/imageUtils';

interface StoryboardErrorBoundaryProps {
  accentTheme: AccentThemeId;
  onBackToForm: () => void;
  children: React.ReactNode;
}

interface StoryboardErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class StoryboardErrorBoundary extends Component<
  StoryboardErrorBoundaryProps,
  StoryboardErrorBoundaryState
> {
  constructor(props: StoryboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): StoryboardErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kesalahan saat menampilkan storyboard.',
    };
  }

  componentDidUpdate(prevProps: StoryboardErrorBoundaryProps) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      const theme = ACCENT_THEMES[this.props.accentTheme] || ACCENT_THEMES['blue-purple'];
      return (
        <div className="rounded-2xl bg-[#131722] border border-amber-400/40 p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Tampilan Storyboard Mengalami Kendala
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              {this.state.errorMessage || 'Data adegan belum lengkap. Silakan kembali ke form cerita untuk membuat ulang.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, errorMessage: '' });
              this.props.onBackToForm();
            }}
            className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white ${theme.primaryButtonGradient} ${theme.primaryButtonShadow} cursor-pointer`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Form Cerita</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface StoryboardOutputProps {
  accentTheme: AccentThemeId;
  project: StoryProject;
  onUpdateProjectFlowUrl: (projectId: string, url: string) => void;
  onContinueSeries: (project: StoryProject) => void;
  onBackToForm?: () => void;
  onToast: (message: string) => void;
}

function getSafeFlowHref(rawUrl?: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return 'https://flow.google.com';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    // Fallback below
  }
  return 'https://flow.google.com';
}

export const StoryboardOutput: React.FC<StoryboardOutputProps> = ({
  accentTheme,
  project,
  onUpdateProjectFlowUrl,
  onContinueSeries,
  onBackToForm,
  onToast,
}) => {
  const theme = ACCENT_THEMES[accentTheme] || ACCENT_THEMES['blue-purple'];
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState(false);
  const [flowUrlInput, setFlowUrlInput] = useState(project?.flowProjectUrl || '');

  const safeScenes: SceneCardData[] = Array.isArray(project?.scenes) ? project.scenes : [];
  const safeTitle = (project?.title || '').trim() || 'Proyek Storyboard Tanpa Judul';
  const safeSummary = (project?.storySummary || '').trim() || 'Ringkasan alur cerita belum tersedia.';
  const safeRatio: AspectRatio =
    project?.aspectRatio === '9:16' || project?.aspectRatio === '1:1' ? project.aspectRatio : '16:9';
  const safeStyle =
    project?.visualStyle === 'Kustom'
      ? project?.customVisualStyle || 'Kustom'
      : project?.visualStyle || project?.animationStyle || '3D Animation';
  const safeGenresText =
    Array.isArray(project?.genres) && project.genres.length > 0
      ? project.genres.join(' + ')
      : project?.genre || '';
  const safeEpisode = typeof project?.episodeNumber === 'number' ? project.episodeNumber : 1;
  const flowHref = getSafeFlowHref(project?.flowProjectUrl);

  const handleCopyPrompt = async (key: string, text: string, successToast: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      onToast(successToast);
      setTimeout(() => {
        setCopiedKey((curr) => (curr === key ? null : curr));
      }, 1800);
    } else {
      onToast('Gagal menyalin otomatis. Silakan salin manual dari kotak teks.');
    }
  };

  const handleOpenFlowClick = (startFramePrompt: string) => {
    // IMPORTANT: Do NOT call e.preventDefault() so native <a target="_blank"> opens Google Flow app/tab immediately on Android
    void copyToClipboard(startFramePrompt).then((ok) => {
      if (ok) {
        onToast('Prompt gambar tersalin! Tinggal tempel di Google Flow');
      }
    });
  };

  if (safeScenes.length === 0) {
    return (
      <section className="rounded-2xl bg-[#131722] border border-amber-400/40 p-6 text-center space-y-4">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Daftar Adegan Masih Kosong</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Proyek ini belum memiliki daftar adegan. Silakan kembali ke form cerita untuk membuat storyboard.
          </p>
        </div>
        {onBackToForm && (
          <button
            type="button"
            onClick={onBackToForm}
            className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white ${theme.primaryButtonGradient} cursor-pointer`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Form Cerita</span>
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {/* Story Summary Card */}
      <div className="rounded-2xl bg-[#131722] border border-[#23293A] p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-sky-300">
              {project?.format === 'Series (Bersambung)'
                ? `Series Bersambung · Episode ${safeEpisode}`
                : `${safeScenes.length} Adegan`}{' '}
              {safeGenresText ? `· ${safeGenresText}` : ''} · {safeStyle} · Rasio {safeRatio}
            </p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
              {safeTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setFlowUrlInput(project?.flowProjectUrl || '');
              setEditingUrl((v) => !v);
            }}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#0B0E14] hover:bg-[#1B2132] border border-[#23293A] px-3 py-2 text-xs font-semibold text-slate-300 shrink-0 cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5 text-sky-400" />
            <span>{project?.flowProjectUrl ? 'Ubah Link Flow' : 'Atur Link Flow'}</span>
          </button>
        </div>

        {editingUrl && (
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="url"
              value={flowUrlInput}
              onChange={(e) => setFlowUrlInput(e.target.value)}
              placeholder="https://flow.google.com/..."
              className={`flex-1 min-h-[42px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2 text-xs text-white outline-none ${theme.ringFocusClass}`}
            />
            <button
              type="button"
              onClick={() => {
                onUpdateProjectFlowUrl(project.id, flowUrlInput.trim());
                setEditingUrl(false);
                onToast('Link Project Google Flow disimpan.');
              }}
              className={`min-h-[42px] rounded-xl px-4 py-2 text-xs font-bold text-white ${theme.primaryButtonGradient} cursor-pointer`}
            >
              Simpan Link
            </button>
          </div>
        )}

        <div className="rounded-xl bg-[#0B0E14] border border-[#23293A] p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-300">Ringkasan Alur Cerita</h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
            {safeSummary}
          </p>
          {project?.cliffhangerHook && (
            <p className="text-xs text-amber-300/95 pt-1 border-t border-[#23293A] mt-2">
              <strong>Gantungan Episode:</strong> {project.cliffhangerHook}
            </p>
          )}
        </div>
      </div>

      {/* Per-Scene Cards (Clean & Compact for Google Flow, NO Character Thumbnail Clutter) */}
      <div className="space-y-5">
        {safeScenes.map((scene: SceneCardData, index: number) => {
          const sceneId = scene?.id || `scene-fallback-${index + 1}`;
          const sceneNum = typeof scene?.sceneNumber === 'number' ? scene.sceneNumber : index + 1;
          const sceneTitle = (scene?.title || scene?.sceneTitle || '').trim() || `Adegan ${sceneNum}`;
          const sceneLocation = (scene?.location || '').trim() || 'Latar adegan utama';
          const startPrompt =
            (scene?.startFrameImagePrompt || '').trim() ||
            `Still opening frame for Scene ${sceneNum} (${sceneTitle}) at ${sceneLocation}.`;
          const vidPrompt =
            (scene?.videoPrompt || '').trim() ||
            `Animate Scene ${sceneNum} (${sceneTitle}) smoothly with expressive character movement.`;

          const imgKey = `${sceneId}-img`;
          const vidKey = `${sceneId}-vid`;

          return (
            <article
              key={sceneId}
              className="rounded-2xl bg-[#131722] border border-[#23293A] p-4 sm:p-5 space-y-4 shadow-lg"
            >
              {/* Scene Heading */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-0.5">
                  <span className="text-xs font-bold text-sky-400 tabular-nums">
                    Scene {sceneNum}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {sceneTitle}
                  </h3>
                  <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{sceneLocation}</span>
                  </p>
                </div>
              </div>

              {/* Full-Width Primary CTA: Buka Google Flow */}
              <a
                href={flowHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleOpenFlowClick(startPrompt)}
                className={`w-full min-h-[46px] rounded-xl ${theme.primaryButtonGradient} ${theme.primaryButtonShadow} px-4 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-white active:scale-[0.98] transition text-center`}
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                <span>Buka Google Flow</span>
              </a>

              {/* Prompt Box 1 (Blue/Cyan Accent): Start Frame Image Prompt */}
              <div className="rounded-xl bg-[#0B0E14] border border-sky-500/35 overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-sky-500/10 border-b border-sky-500/20">
                  <span className="text-xs font-bold text-sky-300">
                    Prompt Gambar Adegan Awal (Start Frame)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyPrompt(
                        imgKey,
                        startPrompt,
                        'Prompt Gambar Start Frame tersalin!'
                      )
                    }
                    className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 px-2.5 py-1 text-[11px] font-bold text-sky-100 transition cursor-pointer shrink-0"
                  >
                    {copiedKey === imgKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Prompt Gambar</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 text-xs font-mono text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                  {startPrompt}
                </pre>
              </div>

              {/* Prompt Box 2 (Purple-Pink Accent): Image-to-Video Prompt */}
              <div className="rounded-xl bg-[#0B0E14] border border-fuchsia-500/35 overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-b border-fuchsia-500/20">
                  <span className="text-xs font-bold text-fuchsia-300">
                    Prompt Video (Image-to-Video)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyPrompt(
                        vidKey,
                        vidPrompt,
                        'Prompt Video tersalin! Siap dianimasikan di Google Flow.'
                      )
                    }
                    className="min-h-[34px] inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/40 px-2.5 py-1 text-[11px] font-bold text-fuchsia-100 transition cursor-pointer shrink-0"
                  >
                    {copiedKey === vidKey ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Prompt Video</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 text-xs font-mono text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                  {vidPrompt}
                </pre>
              </div>
            </article>
          );
        })}
      </div>

      {/* Series Continuation Button */}
      {project?.format === 'Series (Bersambung)' && (
        <div className="rounded-2xl bg-[#131722] border border-[#23293A] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-sm font-bold text-white">Cerita Bersambung — Episode {safeEpisode}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Lanjutkan langsung ke Episode {safeEpisode + 1} dari akhir adegan menggantung di atas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onContinueSeries(project)}
            className={`w-full sm:w-auto min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white ${theme.primaryButtonGradient} ${theme.primaryButtonShadow} active:scale-[0.98] transition cursor-pointer shrink-0`}
          >
            <FastForward className="w-4 h-4" />
            <span>Lanjut Episode Berikutnya</span>
          </button>
        </div>
      )}
    </section>
  );
};
