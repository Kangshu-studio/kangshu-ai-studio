export type AccentThemeId = 'blue-purple' | 'sunset-tropis' | 'emerald-kartun';

export type ApiAccountSlot = 'primary' | 'backup';

export type StoryGenre =
  | 'Komedi Santai'
  | 'Petualangan'
  | 'Drama Kehidupan'
  | 'Satir Sosial'
  | 'Horor Komedi'
  | 'Fakta Unik / Edukasi'
  | 'Dongeng / Cerita Rakyat'
  | 'Konten Affiliate / Review'
  | 'Kustom';

export type VisualStyle =
  | '2D Animation'
  | '3D Animation'
  | 'Realistic / Orang Asli'
  | 'Stop Motion / Clay'
  | 'Kustom';

/** @deprecated legacy alias kept for backward compatibility */
export type AnimationStyle = VisualStyle;

export type StoryFormat = '5 Adegan' | '8 Adegan' | '10 Adegan' | 'Series (Bersambung)';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type ActiveView = 'dashboard' | 'characters' | 'backup';

export interface CharacterProfile {
  id: string;
  name: string;
  ageAndHeight: string;
  familyStatus: string;
  occupation: string;
  voiceType: string;
  personalityBio: string;
  photoDataUrl?: string;
  masterVisualPrompt: string;
  updatedAt: string;
  /** @deprecated legacy field kept optional for backward-compatible backup loading */
  age?: string;
}

export interface AnalyzedCharacterFields {
  name: string;
  ageAndHeight: string;
  familyStatus: string;
  occupation: string;
  voiceType: string;
  personalityBio: string;
  masterVisualPrompt: string;
}

export interface SceneCardData {
  id: string;
  sceneNumber: number;
  title: string;
  location: string;
  /** @deprecated legacy field kept optional for backward-compatible saved projects */
  sceneTitle?: string;
  charactersPresent: string[];
  startFrameImagePrompt: string;
  videoPrompt: string;
  uploadedImageDataUrl?: string;
}

export interface StoryProject {
  id: string;
  title: string;
  premise?: string;
  episodeNumber: number;
  genres: string[];
  customGenre?: string;
  visualStyle: VisualStyle;
  customVisualStyle?: string;
  /** @deprecated legacy fields kept optional for backward-compatible saved projects */
  genre?: string;
  animationStyle?: string;
  format: StoryFormat;
  aspectRatio: AspectRatio;
  flowProjectUrl: string;
  selectedCharacterIds: string[];
  storySummary: string;
  isCliffhanger: boolean;
  cliffhangerHook?: string;
  scenes: SceneCardData[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressState {
  active: boolean;
  percent: number;
  title: string;
  stageLabel: string;
  stageType: 'scan' | 'story' | 'scene' | 'done' | 'backup';
  isQueue503?: boolean;
}

export interface BackupPackage {
  app: string;
  exportedAt: string;
  mascotPhotoDataUrl: string | null;
  characters: CharacterProfile[];
  projects: StoryProject[];
  accentTheme: AccentThemeId;
}
