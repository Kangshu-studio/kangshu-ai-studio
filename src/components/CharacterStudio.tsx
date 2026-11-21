import React, { useRef, useState } from 'react';
import {
  Briefcase,
  Edit3,
  HeartHandshake,
  ImagePlus,
  Plus,
  Save,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  AccentThemeId,
  AnalyzedCharacterFields,
  CharacterProfile,
} from '../types/studio';
import { ACCENT_THEMES } from '../constants/themes';
import { compressImageFile } from '../utils/imageUtils';

interface CharacterStudioProps {
  accentTheme: AccentThemeId;
  characters: CharacterProfile[];
  onSaveCharacter: (character: CharacterProfile) => void;
  onDeleteCharacter: (id: string) => void;
  onAnalyzeCharacterPhoto: (params: {
    base64: string;
    mimeType: string;
    name: string;
    ageAndHeight: string;
    voiceType: string;
  }) => Promise<AnalyzedCharacterFields | null>;
  onToast: (message: string) => void;
}

export const CharacterStudio: React.FC<CharacterStudioProps> = ({
  accentTheme,
  characters,
  onSaveCharacter,
  onDeleteCharacter,
  onAnalyzeCharacterPhoto,
  onToast,
}) => {
  const theme = ACCENT_THEMES[accentTheme];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [ageAndHeight, setAgeAndHeight] = useState('');
  const [familyStatus, setFamilyStatus] = useState('');
  const [occupation, setOccupation] = useState('');
  const [voiceType, setVoiceType] = useState('');
  const [personalityBio, setPersonalityBio] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [masterVisualPrompt, setMasterVisualPrompt] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAgeAndHeight('');
    setFamilyStatus('');
    setOccupation('');
    setVoiceType('');
    setPersonalityBio('');
    setPhotoDataUrl(undefined);
    setMasterVisualPrompt('');
    setShowForm(false);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setName('');
    setAgeAndHeight('');
    setFamilyStatus('');
    setOccupation('');
    setVoiceType('');
    setPersonalityBio('');
    setPhotoDataUrl(undefined);
    setMasterVisualPrompt('');
    setShowForm(true);
  };

  const openEditForm = (char: CharacterProfile) => {
    setEditingId(char.id);
    setName(char.name);
    setAgeAndHeight(char.ageAndHeight || char.age || '');
    setFamilyStatus(char.familyStatus || '');
    setOccupation(char.occupation || '');
    setVoiceType(char.voiceType || '');
    setPersonalityBio(char.personalityBio || '');
    setPhotoDataUrl(char.photoDataUrl);
    setMasterVisualPrompt(char.masterVisualPrompt || '');
    setShowForm(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      // Compress using HTML Canvas: max 1024px, JPEG quality 0.8
      const compressed = await compressImageFile(file, 1024, 0.8);
      setPhotoDataUrl(compressed.dataUrl);

      const analyzed = await onAnalyzeCharacterPhoto({
        base64: compressed.base64,
        mimeType: compressed.mimeType,
        name: name.trim(),
        ageAndHeight: ageAndHeight.trim(),
        voiceType: voiceType.trim(),
      });

      if (analyzed) {
        if (analyzed.name) setName(analyzed.name);
        if (analyzed.ageAndHeight) setAgeAndHeight(analyzed.ageAndHeight);
        if (analyzed.familyStatus) setFamilyStatus(analyzed.familyStatus);
        if (analyzed.occupation) setOccupation(analyzed.occupation);
        if (analyzed.voiceType) setVoiceType(analyzed.voiceType);
        if (analyzed.personalityBio) setPersonalityBio(analyzed.personalityBio);
        if (analyzed.masterVisualPrompt) setMasterVisualPrompt(analyzed.masterVisualPrompt);
        onToast('Seluruh 7 kolom biodata & visual Character Sheet terisi otomatis!');
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Gagal memproses foto Character Sheet.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onToast('Nama Karakter wajib diisi.');
      return;
    }

    const character: CharacterProfile = {
      id: editingId || `char-${Date.now()}`,
      name: name.trim(),
      ageAndHeight: ageAndHeight.trim() || 'Dewasa Muda',
      familyStatus: familyStatus.trim() || '-',
      occupation: occupation.trim() || '-',
      voiceType: voiceType.trim() || 'Ramah & Ekspresif',
      personalityBio: personalityBio.trim() || '-',
      photoDataUrl,
      masterVisualPrompt:
        masterVisualPrompt.trim() ||
        `${name.trim()}, ${ageAndHeight.trim() || 'young adult'} Indonesian animated character, expressive face, consistent signature outfit.`,
      updatedAt: new Date().toISOString(),
    };

    onSaveCharacter(character);
    onToast(editingId ? `Biodata "${character.name}" diperbarui.` : `Karakter "${character.name}" ditambahkan.`);
    resetForm();
  };

  return (
    <section className="space-y-5">
      {/* Header Bar */}
      <div className="rounded-2xl bg-[#131722] border border-[#23293A] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Character Studio</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Unggah foto Character Sheet agar Gemini Vision membaca seluruh panel teks biodata & mengunci detail kostum ke dalam cerita.
          </p>
        </div>

        {!showForm && (
          <button
            type="button"
            onClick={openCreateForm}
            className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white ${theme.primaryButtonGradient} ${theme.primaryButtonShadow} active:scale-[0.98] transition cursor-pointer whitespace-nowrap shrink-0`}
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Karakter</span>
          </button>
        )}
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-[#131722] border border-[#23293A] p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#23293A]">
            <h3 className="text-base font-bold text-white">
              {editingId ? 'Edit Biodata Karakter' : 'Buat Karakter Baru'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              aria-label="Tutup form karakter"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Character Sheet Upload at Top for One-Tap Auto-Fill */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-sky-300">
              Upload Foto Character Sheet (Isi Otomatis 7 Kolom Biodata + Visual)
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl bg-[#0B0E14] border border-[#23293A] p-3.5">
              <div className="w-24 h-24 rounded-xl bg-[#131722] border border-[#23293A] overflow-hidden flex items-center justify-center shrink-0">
                {photoDataUrl ? (
                  <img
                    src={photoDataUrl}
                    alt={name || 'Character Sheet'}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-9 h-9 text-slate-600" />
                )}
              </div>

              <div className="space-y-2 flex-1">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Unggah gambar Character Sheet dari galeri HP. AI akan membaca teks biodata di dalam gambar sekaligus mendeskripsikan kostum & aksesori ke 7 kolom di bawah.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[42px] inline-flex items-center gap-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>{photoDataUrl ? 'Ganti & Analisis Ulang Foto' : 'Upload Foto Character Sheet'}</span>
                  </button>
                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoDataUrl(undefined)}
                      className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#23293A] px-3 py-2 text-xs text-slate-300 cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* 1. Nama Karakter & 2. Usia & Tinggi Badan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="char-name">
                Nama Karakter
              </label>
              <input
                id="char-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kang Shu"
                className={`w-full min-h-[44px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="char-age-height">
                Usia & Tinggi Badan
              </label>
              <input
                id="char-age-height"
                type="text"
                value={ageAndHeight}
                onChange={(e) => setAgeAndHeight(e.target.value)}
                placeholder="Contoh: 35 tahun, 180 cm"
                className={`w-full min-h-[44px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
              />
            </div>
          </div>

          {/* 3. Status & Hubungan Keluarga & 4. Pekerjaan / Peran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="char-family">
                Status & Hubungan Keluarga
              </label>
              <input
                id="char-family"
                type="text"
                value={familyStatus}
                onChange={(e) => setFamilyStatus(e.target.value)}
                placeholder="Contoh: Suami & Ayah dari 3 anak, Istri: Rahma"
                className={`w-full min-h-[44px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="char-occupation">
                Pekerjaan / Peran
              </label>
              <input
                id="char-occupation"
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Contoh: Kepala Keluarga dan Petani di Desa Kangshu"
                className={`w-full min-h-[44px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
              />
            </div>
          </div>

          {/* 5. Gender & Tipe Suara */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300" htmlFor="char-voice">
              Gender & Tipe Suara
            </label>
            <input
              id="char-voice"
              type="text"
              value={voiceType}
              onChange={(e) => setVoiceType(e.target.value)}
              placeholder="Contoh: Laki-laki, Dewasa — Bijaksana, Penyayang & Ramah khas Sunda"
              className={`w-full min-h-[44px] rounded-xl bg-[#0B0E14] border border-[#23293A] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none ${theme.ringFocusClass}`}
            />
          </div>

          {/* 6. Profil Singkat, Sifat & Motto */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300" htmlFor="char-bio">
              Profil Singkat, Sifat & Motto
            </label>
            <textarea
              id="char-bio"
              rows={3}
              value={personalityBio}
              onChange={(e) => setPersonalityBio(e.target.value)}
              placeholder="Kepribadian, latar belakang, kebiasaan unik, serta motto hidup karakter..."
              className={`w-full rounded-xl bg-[#0B0E14] border border-[#23293A] p-3.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none leading-relaxed ${theme.ringFocusClass}`}
            />
          </div>

          {/* 7. Master Visual Prompt (Bahasa Inggris) */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-slate-300" htmlFor="char-prompt">
                Master Visual Prompt (Bahasa Inggris)
              </label>
              <span className="inline-flex items-center gap-1 text-[11px] text-sky-300">
                <Sparkles className="w-3 h-3" />
                <span>Otomatis disuntikkan ke tiap scene</span>
              </span>
            </div>
            <textarea
              id="char-prompt"
              rows={4}
              value={masterVisualPrompt}
              onChange={(e) => setMasterVisualPrompt(e.target.value)}
              placeholder="Deskripsi fisik, wajah, rambut, dan seluruh detail kostum serta aksesori dalam Bahasa Inggris..."
              className={`w-full rounded-xl bg-[#0B0E14] border border-[#23293A] p-3.5 text-xs sm:text-sm font-mono text-slate-100 placeholder:text-slate-500 outline-none leading-relaxed ${theme.ringFocusClass}`}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[44px] rounded-xl bg-[#0B0E14] hover:bg-[#1A2030] border border-[#23293A] px-4 py-2.5 text-sm font-semibold text-slate-300 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white ${theme.primaryButtonGradient} ${theme.primaryButtonShadow} transition cursor-pointer`}
            >
              <Save className="w-4 h-4" />
              <span>Simpan Karakter</span>
            </button>
          </div>
        </form>
      )}

      {/* Character Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {characters.map((char) => {
          const displayAgeHeight = char.ageAndHeight || char.age || 'Dewasa';
          return (
            <article
              key={char.id}
              className="rounded-2xl bg-[#131722] border border-[#23293A] p-4 space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-[#0B0E14] border border-[#23293A] overflow-hidden flex items-center justify-center shrink-0">
                    {char.photoDataUrl ? (
                      <img
                        src={char.photoDataUrl}
                        alt={char.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <span className="text-lg font-extrabold text-sky-300">
                        {char.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-white truncate">{char.name}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{displayAgeHeight}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{char.voiceType}</p>
                  </div>
                </div>

                {/* Biodata Summary Lines */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  {char.occupation && char.occupation !== '-' && (
                    <div className="flex items-start gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{char.occupation}</span>
                    </div>
                  )}
                  {char.familyStatus && char.familyStatus !== '-' && (
                    <div className="flex items-start gap-2">
                      <HeartHandshake className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{char.familyStatus}</span>
                    </div>
                  )}
                  {char.personalityBio && char.personalityBio !== '-' && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 pt-0.5">
                      {char.personalityBio}
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-[#0B0E14] border border-[#23293A] p-3">
                  <p className="text-[11px] font-mono text-slate-300 leading-relaxed line-clamp-3">
                    {char.masterVisualPrompt}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                {pendingDeleteId === char.id ? (
                  <div className="flex items-center gap-2 w-full justify-end">
                    <span className="text-xs text-rose-300 mr-auto">Hapus karakter ini?</span>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(null)}
                      className="min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold bg-[#0B0E14] border border-[#23293A] text-slate-300 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteCharacter(char.id);
                        setPendingDeleteId(null);
                        onToast(`Karakter "${char.name}" dihapus.`);
                      }}
                      className="min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                    >
                      Ya, Hapus
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditForm(char)}
                      className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B0E14] hover:bg-[#1B2132] border border-[#23293A] px-3 py-2 text-xs font-semibold text-slate-200 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                      <span>Edit Biodata</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(char.id)}
                      className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl bg-[#0B0E14] hover:bg-rose-500/15 border border-[#23293A] hover:border-rose-500/40 px-3 py-2 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                      aria-label={`Hapus ${char.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
