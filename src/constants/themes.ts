import { AccentThemeId, CharacterProfile, StoryGenre, VisualStyle } from '../types/studio';

export interface ThemeConfig {
  id: AccentThemeId;
  label: string;
  swatchClass: string;
  primaryButtonGradient: string;
  primaryButtonShadow: string;
  heroGradient: string;
  accentTextGradient: string;
  activeChipClass: string;
  ringFocusClass: string;
  progressGradient: string;
}

export const ACCENT_THEMES: Record<AccentThemeId, ThemeConfig> = {
  'blue-purple': {
    id: 'blue-purple',
    label: 'Blue-Purple Studio',
    swatchClass: 'from-blue-500 via-indigo-500 to-purple-600',
    primaryButtonGradient: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-400 hover:via-indigo-400 hover:to-purple-500',
    primaryButtonShadow: 'shadow-lg shadow-indigo-600/25',
    heroGradient: 'from-[#101C3D] via-[#1E2B6B] to-[#4C1D95]',
    accentTextGradient: 'bg-gradient-to-r from-sky-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent',
    activeChipClass: 'bg-indigo-500/20 border-indigo-400/70 text-indigo-100',
    ringFocusClass: 'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/25',
    progressGradient: 'from-blue-500 via-purple-500 to-pink-500',
  },
  'sunset-tropis': {
    id: 'sunset-tropis',
    label: 'Sunset Tropis',
    swatchClass: 'from-amber-500 via-orange-500 to-rose-600',
    primaryButtonGradient: 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-400 hover:to-rose-500',
    primaryButtonShadow: 'shadow-lg shadow-orange-600/25',
    heroGradient: 'from-[#2A1412] via-[#5C2318] to-[#9A3412]',
    accentTextGradient: 'bg-gradient-to-r from-amber-200 via-orange-200 to-rose-300 bg-clip-text text-transparent',
    activeChipClass: 'bg-orange-500/20 border-orange-400/70 text-orange-100',
    ringFocusClass: 'focus:border-orange-400 focus:ring-2 focus:ring-orange-500/25',
    progressGradient: 'from-amber-400 via-orange-500 to-rose-500',
  },
  'emerald-kartun': {
    id: 'emerald-kartun',
    label: 'Emerald Kartun',
    swatchClass: 'from-emerald-500 via-teal-500 to-cyan-600',
    primaryButtonGradient: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-500',
    primaryButtonShadow: 'shadow-lg shadow-emerald-600/25',
    heroGradient: 'from-[#0D2824] via-[#114B43] to-[#0F766E]',
    accentTextGradient: 'bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-300 bg-clip-text text-transparent',
    activeChipClass: 'bg-emerald-500/20 border-emerald-400/70 text-emerald-100',
    ringFocusClass: 'focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/25',
    progressGradient: 'from-emerald-400 via-teal-400 to-cyan-400',
  },
};

export const GENRE_OPTIONS: { id: StoryGenre; emoji: string; label: string }[] = [
  { id: 'Komedi Santai', emoji: '🎬', label: 'Komedi Santai' },
  { id: 'Petualangan', emoji: '🗺️', label: 'Petualangan' },
  { id: 'Drama Kehidupan', emoji: '🎭', label: 'Drama Kehidupan' },
  { id: 'Satir Sosial', emoji: '😏', label: 'Satir Sosial' },
  { id: 'Horor Komedi', emoji: '👻', label: 'Horor Komedi' },
  { id: 'Fakta Unik / Edukasi', emoji: '💡', label: 'Fakta Unik / Edukasi' },
  { id: 'Dongeng / Cerita Rakyat', emoji: '📖', label: 'Dongeng / Cerita Rakyat' },
  { id: 'Konten Affiliate / Review', emoji: '🛍️', label: 'Konten Affiliate / Review' },
  { id: 'Kustom', emoji: '✨', label: 'Kustom' },
];

export const VISUAL_STYLE_OPTIONS: { id: VisualStyle; emoji: string; label: string }[] = [
  { id: '2D Animation', emoji: '🎨', label: '2D Animation' },
  { id: '3D Animation', emoji: '🧊', label: '3D Animation' },
  { id: 'Realistic / Orang Asli', emoji: '📸', label: 'Realistic / Orang Asli' },
  { id: 'Stop Motion / Clay', emoji: '🧱', label: 'Stop Motion / Clay' },
  { id: 'Kustom', emoji: '✨', label: 'Kustom' },
];

export const DEFAULT_CHARACTERS: CharacterProfile[] = [
  {
    id: 'char-kang-shu',
    name: 'Kang Shu',
    ageAndHeight: '35 tahun, 180 cm',
    familyStatus: 'Suami & Ayah dari 3 anak, Istri: Rahma',
    occupation: 'Kepala Keluarga dan Petani di Desa Kangshu',
    voiceType: 'Laki-laki, Dewasa — Bijaksana, Penyayang & Ramah khas Sunda',
    personalityBio:
      'Sosok kepala keluarga pekerja keras yang sabar, humoris, dan selalu mengutamakan musyawarah. Senang menyapa tetangga dengan logat Sunda halus dan punya motto: "Rezeki mah moal pahili, nu penting ikhtiar jeung sauyunan."',
    masterVisualPrompt:
      '35-year-old tall charismatic Indonesian Sundanese man (180 cm), warm tan skin, expressive dark brown eyes, gentle wise smile, short neat black hair tucked under a traditional dark indigo and sogan brown Sundanese batik headband (iket kepala batik), wearing a crisp black long-sleeve traditional Sundanese pangsi shirt, matching black pangsi trousers, patterned brown-and-gold batik waist belt (ikat pinggang batik), batik-motif sling bag worn diagonally across chest, black sport wristwatch on left wrist, sturdy dark sandals, athletic lean build.',
    updatedAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'char-yandi',
    name: 'Yandi',
    ageAndHeight: '25 tahun, 172 cm',
    familyStatus: 'Lajang, Adik sepupu Kang Shu',
    occupation: 'Pemuda Kreatif & Penjual Kopi Keliling Desa',
    voiceType: 'Laki-laki, Muda — Ceria, Cepat & Penuh Semangat',
    personalityBio:
      'Selalu penuh ide nyentrik dan melek teknologi di kampung. Kadang ceroboh tapi setia kawan. Motto hidup: "Gagal mah biasa, nu penting gaya heula!"',
    masterVisualPrompt:
      '25-year-old energetic Indonesian young man (172 cm) with medium-tan skin, round black glasses, messy spiky black hair, wide curious eyes, wearing a mustard yellow t-shirt layered under an open denim vest, dark blue jeans, red-and-white canvas sneakers, digital wristwatch, lean build.',
    updatedAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'char-raka',
    name: 'Raka',
    ageAndHeight: '32 tahun, 178 cm',
    familyStatus: 'Menikah, Sahabat dekat Kang Shu',
    occupation: 'Tukang Bengkel & Pengurus Karang Taruna',
    voiceType: 'Laki-laki, Dewasa — Berat, Kalem & Serius Kocak',
    personalityBio:
      'Bicara irit tapi sekali nyeletuk selalu bikin ngakak. Jadi andalan warga kalau ada motor mogok atau alat pertanian rusak. Motto: "Tenang, bautna aya keneh."',
    masterVisualPrompt:
      '32-year-old Indonesian man (178 cm) with slightly broader sturdy build, light brown skin, clean-shaven jaw with faint stubble, neat side-parted dark hair, calm deadpan expression, wearing an olive green utility jacket over a plain white crewneck shirt, cargo khaki pants, sturdy brown work boots.',
    updatedAt: '2026-11-20T00:00:00.000Z',
  },
  {
    id: 'char-yasar',
    name: 'Yasar',
    ageAndHeight: '22 tahun, 168 cm',
    familyStatus: 'Lajang, Anak sulung tetangga sebelah',
    occupation: 'Mahasiswa & Konten Kreator Desa',
    voiceType: 'Laki-laki, Remaja Dewasa — Polos, Ekspresif & Suka Kaget',
    personalityBio:
      'Selalu bawa HP dan kamera ke mana-mana buat bikin konten desa. Gampang panik kalau lihat hal mistis atau kejadian aneh, tapi cepat akrab dengan siapa saja.',
    masterVisualPrompt:
      '22-year-old expressive Indonesian young man (168 cm) with warm light-tan skin, curly black hair slightly covering forehead, big expressive eyebrows, wearing an oversized teal-and-cream striped hoodie with front pocket, dark jogger pants, carrying a small sling bag across chest, white sneakers.',
    updatedAt: '2026-11-20T00:00:00.000Z',
  },
];
