import { GoogleGenAI, Type } from '@google/genai';

const MODEL_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-4-hydrogen',
] as const;

const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const IS_SERVERLESS_ENV =
  process.env.NETLIFY === 'true' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const PER_CALL_TIMEOUT_MS = IS_SERVERLESS_ENV ? 8_500 : 18_000;

interface CharacterInput {
  id: string;
  name: string;
  ageAndHeight: string;
  familyStatus: string;
  occupation: string;
  voiceType: string;
  personalityBio: string;
  masterVisualPrompt: string;
}

export interface ServiceResponse {
  status: number;
  body: Record<string, unknown>;
}

function getApiKeyForSlot(accountSlot?: string): string {
  if (accountSlot === 'backup') {
    const backup = process.env.GEMINI_BACKUP_API_KEY?.trim();
    if (backup && backup !== 'MY_BACKUP_GEMINI_API_KEY') {
      return backup;
    }
  }
  const primary = process.env.GEMINI_API_KEY?.trim();
  if (!primary || primary === 'MY_GEMINI_API_KEY') {
    return '';
  }
  return primary;
}

function createGeminiClient(apiKey: string) {
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractStatusCode(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const e = err as Record<string, unknown>;
  if (typeof e.status === 'number') return e.status;
  if (typeof e.code === 'number') return e.code;
  const msg = String(e.message ?? '');
  if (
    msg.includes('503') ||
    msg.toLowerCase().includes('unavailable') ||
    msg.toLowerCase().includes('overloaded')
  ) {
    return 503;
  }
  if (
    msg.includes('429') ||
    msg.toLowerCase().includes('resource_exhausted') ||
    msg.toLowerCase().includes('quota')
  ) {
    return 429;
  }
  if (msg.includes('404') || msg.toLowerCase().includes('not_found')) {
    return 404;
  }
  if (msg.includes('403') || msg.toLowerCase().includes('permission_denied')) {
    return 403;
  }
  if (msg.includes('400') || msg.toLowerCase().includes('api_key_invalid')) {
    return 400;
  }
  return undefined;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Batas waktu ${label} terlampaui.`));
      }, ms);
    }),
  ]);
}

async function generateWithFallback(params: {
  accountSlot?: string;
  contents: unknown;
  config?: Record<string, unknown>;
}) {
  const apiKey = getApiKeyForSlot(params.accountSlot);
  if (!apiKey) {
    const err = new Error('API key Gemini belum dikonfigurasi pada Settings > Secrets / Environment Variables.');
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }

  const ai = createGeminiClient(apiKey);
  let saw503 = false;
  let lastError: unknown = null;
  const maxAttempts = IS_SERVERLESS_ENV ? 1 : 2;

  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: params.contents as Parameters<typeof ai.models.generateContent>[0]['contents'],
            config: params.config as Parameters<typeof ai.models.generateContent>[0]['config'],
          }),
          PER_CALL_TIMEOUT_MS,
          `model ${model}`
        );

        return {
          response,
          usedModel: model,
          fallbackUsed: i > 0,
          saw503,
        };
      } catch (err) {
        lastError = err;
        const status = extractStatusCode(err);

        if (status === 400 || status === 403) {
          throw err;
        }

        if (status === 503) {
          saw503 = true;
          if (attempt < maxAttempts) {
            await sleep(700 * attempt);
            continue;
          }
        }

        break;
      }
    }
  }

  const finalErr = lastError instanceof Error ? lastError : new Error('Server AI sedang sibuk.');
  (finalErr as Error & { saw503?: boolean }).saw503 = saw503;
  throw finalErr;
}

function sanitizeShortText(value: unknown, maxLen = 300): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function mapGeminiError(err: unknown, fallbackMessage: string): ServiceResponse {
  const status =
    (err as Error & { statusCode?: number })?.statusCode ?? extractStatusCode(err) ?? 500;
  const saw503 = Boolean((err as Error & { saw503?: boolean })?.saw503) || status === 503;

  if (saw503) {
    return {
      status: 503,
      body: {
        code: 'SERVER_BUSY_503',
        retryAfterSeconds: 6,
        error: 'Server AI sedang penuh (503). Antrian otomatis aktif, mencoba ulang sebentar lagi...',
      },
    };
  }
  if (status === 429) {
    return {
      status: 429,
      body: {
        code: 'RATE_LIMIT_429',
        error: 'Kuota akun saat ini sedang padat (429). Coba ganti ke Akun Cadangan atau tunggu sebentar.',
      },
    };
  }
  if (status === 400 || status === 403) {
    return {
      status,
      body: {
        error:
          err instanceof Error && err.message.includes('API key Gemini belum dikonfigurasi')
            ? err.message
            : 'Kunci API Gemini belum aktif atau tidak valid. Periksa panel Settings > Secrets / Environment Variables.',
      },
    };
  }
  return {
    status: 500,
    body: {
      error: err instanceof Error ? err.message : fallbackMessage,
    },
  };
}

function sanitizeVisualPromptForStyle(rawPrompt: string, visualStyle: string): string {
  if (!rawPrompt) return '';

  let cleaned = rawPrompt;
  if (visualStyle === 'Realistic / Orang Asli') {
    cleaned = cleaned.replace(
      /\b(anime[-\s]?style|anime|2d\s*(?:animation|animated|style)?|3d\s*(?:animation|animated|cgi|style)?|cartoon(?:ish|y)?|illustration|illustrated|cel[-\s]?shaded|cgi|claymation|stop[-\s]?motion|stylized\s+animated)\b/gi,
      ''
    );
  } else if (visualStyle === '2D Animation') {
    cleaned = cleaned.replace(
      /\b(3d\s*(?:animation|animated|cgi|style)?|cgi|photorealistic|live[-\s]?action|real\s+human\s+actors?|claymation|stop[-\s]?motion)\b/gi,
      ''
    );
  } else if (visualStyle === '3D Animation') {
    cleaned = cleaned.replace(
      /\b(2d\s*(?:animation|animated|style)?|anime[-\s]?style|anime|cel[-\s]?shaded|hand[-\s]?drawn|photorealistic|live[-\s]?action|real\s+human\s+actors?|claymation|stop[-\s]?motion)\b/gi,
      ''
    );
  } else if (visualStyle === 'Stop Motion / Clay') {
    cleaned = cleaned.replace(
      /\b(anime[-\s]?style|anime|2d\s*(?:animation|animated|style)?|3d\s*(?:animation|animated|cgi|style)?|cgi|cel[-\s]?shaded|photorealistic|live[-\s]?action|real\s+human\s+actors?)\b/gi,
      ''
    );
  } else if (visualStyle === 'Kustom') {
    cleaned = cleaned.replace(
      /\b(anime[-\s]?style|anime|2d\s*(?:animation|animated|style)?|3d\s*(?:animation|animated|cgi|style)?|cartoon(?:ish|y)?|illustration|illustrated|cel[-\s]?shaded|cgi|claymation|stop[-\s]?motion|photorealistic|live[-\s]?action)\b/gi,
      ''
    );
  }

  return cleaned
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,;:-]+|[\s,;:-]+$/g, '')
    .trim();
}

function getVisualStyleConfig(visualStyle: string, customVisualStyle: string) {
  if (visualStyle === 'Realistic / Orang Asli') {
    return {
      label: 'Realistic / Orang Asli (Live-Action)',
      openingPrefix:
        'Photorealistic 8k live-action film still, real Indonesian human actors, natural skin texture, authentic clothing fabric, cinematic 35mm lens lighting,',
      videoMotionDirective:
        'CRITICAL LIVE-ACTION MOTION RULE: Describe realistic, grounded physical movements of real human actors, subtle natural facial micro-expressions, authentic fabric/environment physics, and cinematic live-action camera motion (NEVER describe cartoon/animated/CGI exaggerated motion!).',
      openingCheckToken: 'photorealistic 8k live-action film still',
    };
  }
  if (visualStyle === '2D Animation') {
    return {
      label: '2D Animation',
      openingPrefix:
        '2D stylized modern animation still frame, crisp clean linework, expressive cel-shaded lighting, vibrant hand-painted background art,',
      videoMotionDirective:
        'Describe expressive 2D animation motion, dynamic character gestures, clean facial acting, and smooth camera motion.',
      openingCheckToken: '2d stylized modern animation',
    };
  }
  if (visualStyle === 'Stop Motion / Clay') {
    return {
      label: 'Stop Motion / Clay',
      openingPrefix:
        'Tactile stop-motion claymation still frame, handcrafted polymer clay characters with subtle artisan texture, miniature physical diorama set, warm practical studio lighting,',
      videoMotionDirective:
        'Describe charming tactile stop-motion claymation character movement, subtle handcrafted frame cadence, miniature practical props, and smooth camera motion.',
      openingCheckToken: 'tactile stop-motion claymation',
    };
  }
  if (visualStyle === 'Kustom') {
    const cleanCustom = sanitizeShortText(customVisualStyle, 140) || 'Custom Stylized Visual';
    return {
      label: cleanCustom,
      openingPrefix: `${cleanCustom}, still opening frame, rich cohesive atmosphere and lighting,`,
      videoMotionDirective: `Describe character movements, gestures, facial acting, and camera motion staying 100% faithful to the "${cleanCustom}" visual aesthetic.`,
      openingCheckToken: cleanCustom.toLowerCase().slice(0, 24),
    };
  }
  return {
    label: '3D Animation',
    openingPrefix:
      '3D stylized CGI animation still frame, Pixar and modern feature-film lighting, soft subsurface scattering, detailed fabric textures, rich cinematic depth,',
    videoMotionDirective:
      'Describe expressive 3D feature-film CGI character movement, subtle cloth/hair simulation, facial acting, and smooth cinematic camera motion.',
    openingCheckToken: '3d stylized cgi animation',
  };
}

function buildGenreBlendingDirective(genres: string[]): string {
  const joined = genres.join(' + ');
  const specificTips: string[] = [];

  for (const g of genres) {
    const lower = g.toLowerCase();
    if (lower.includes('affiliate') || lower.includes('review')) {
      specificTips.push(
        '- GENRE KONTEN AFFILIATE / REVIEW: Seamlessly weave a natural "Hook -> Masalah Sehari-hari -> Solusi / Demo Produk Nyata -> Soft/Natural CTA (ajakan cek keranjang/coba produk)" arc across the scenes and dialogue so it feels engaging and authentic rather than a stiff advertisement.'
      );
    } else if (lower.includes('komedi santai')) {
      specificTips.push(
        '- GENRE KOMEDI SANTAI: Infuse warm relatable humor, witty Indonesian/Sundanese banter, lighthearted mishaps, and comedic timing in every scene.'
      );
    } else if (lower.includes('petualangan')) {
      specificTips.push(
        '- GENRE PETUALANGAN: Incorporate active exploration, journey progression, environmental challenges, and dynamic sense of discovery.'
      );
    } else if (lower.includes('drama kehidupan')) {
      specificTips.push(
        '- GENRE DRAMA KEHIDUPAN: Ground character choices in heartfelt family warmth, emotional stakes, and relatable human values.'
      );
    } else if (lower.includes('satir sosial')) {
      specificTips.push(
        '- GENRE SATIR SOSIAL: Include sharp, playful social commentary and ironic observations about everyday modern habits.'
      );
    } else if (lower.includes('horor komedi')) {
      specificTips.push(
        '- GENRE HOROR KOMEDI: Blend spooky suspenseful atmosphere (eerie shadows, mysterious sounds) with hilarious character reactions, misunderstandings, and comic relief.'
      );
    } else if (lower.includes('fakta unik') || lower.includes('edukasi')) {
      specificTips.push(
        '- GENRE FAKTA UNIK / EDUKASI: Embed accurate, surprising real-world facts or practical tips naturally into character discoveries and spoken dialogue.'
      );
    } else if (lower.includes('dongeng') || lower.includes('cerita rakyat')) {
      specificTips.push(
        '- GENRE DONGENG / CERITA RAKYAT: Deliver Indonesian folklore charm, legendary wonder, and a warm moral takeaway.'
      );
    } else {
      specificTips.push(
        `- GENRE KUSTOM (${g}): Honor the exact tone, tropes, setting, and pacing of "${g}" throughout every scene.`
      );
    }
  }

  return `MANDATORY MULTI-GENRE BLENDING (${joined}):
You MUST blend ALL ${genres.length} selected genres (${joined}) harmoniously and proportionately inside EVERY scene — do NOT isolate one genre to one scene only!
${specificTips.join('\n')}`;
}

export async function analyzeCharacterSheet(rawBody: unknown): Promise<ServiceResponse> {
  try {
    const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>;
    const { imageBase64, mimeType, characterName, ageAndHeight, voiceType, accountSlot } = body;

    if (typeof imageBase64 !== 'string' || imageBase64.length < 32 || imageBase64.length > 10_000_000) {
      return {
        status: 400,
        body: { error: 'Data gambar Character Sheet tidak valid atau terlalu besar.' },
      };
    }
    if (typeof mimeType !== 'string' || !ALLOWED_IMAGE_MIMES.has(mimeType)) {
      return {
        status: 400,
        body: { error: 'Format gambar harus JPEG, PNG, atau WebP.' },
      };
    }

    const hintName = sanitizeShortText(characterName, 80);
    const hintAge = sanitizeShortText(ageAndHeight, 60);
    const hintVoice = sanitizeShortText(voiceType, 120);

    const analysisPrompt = `You are an expert Character Sheet OCR & Visual Concept Analyst for animated series production.
Carefully inspect EVERY part of this uploaded Character Sheet image — including ALL text panels, info boxes, captions, labels, mottos, family notes, costume annotations, AND the character illustration(s) themselves.

${hintName || hintAge || hintVoice ? `User-provided hints (prefer exact text printed inside the Character Sheet image whenever present): Name="${hintName}", Age/Height="${hintAge}", Voice="${hintVoice}".` : ''}

Extract and synthesize ALL 7 structured fields below:
1. "name": Character name read from the image (or hint / sensible name if unlabeled).
2. "ageAndHeight": Age and height read from the image (e.g., "35 tahun, 180 cm"). If height isn't written, estimate or write age clearly in Indonesian.
3. "familyStatus": Family status & relationships read from the image (e.g., "Suami & Ayah dari 3 anak, Istri: Rahma"). If not printed in the image, provide a natural concise status in Indonesian or "-".
4. "occupation": Occupation / role in the story read from the image (e.g., "Kepala Keluarga dan Petani di Desa Kangshu").
5. "voiceType": Gender & voice/speech tone in Indonesian (e.g., "Laki-laki, Dewasa — Bijaksana, Penyayang & Ramah khas Sunda").
6. "personalityBio": Short profile, personality traits, background, signature habits, and motto in Indonesian (2–4 sentences combining all text panels & visual vibe).
7. "masterVisualPrompt": ONE rich, production-ready ENGLISH visual prompt paragraph (90 to 150 words) capturing EVERY visual detail AND costume/accessory annotation visible or written in the image:
   - Exact apparent age, height/build proportions, ethnicity/skin tone, facial structure, eyes, typical expression.
   - Exact hairstyle, hair color, facial hair.
   - ALL headwear, clothing layers, and EVERY accessory seen or labeled (for example: batik headband / iket kepala batik, black traditional pangsi shirt & pants, batik waist belt / ikat pinggang batik, batik-motif sling bag / tas selempang motif batik, black sport wristwatch / jam tangan sport hitam, footwear, etc. with exact colors and patterns).`;

    const result = await generateWithFallback({
      accountSlot: accountSlot === 'backup' ? 'backup' : 'primary',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          { text: analysisPrompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            ageAndHeight: { type: Type.STRING },
            familyStatus: { type: Type.STRING },
            occupation: { type: Type.STRING },
            voiceType: { type: Type.STRING },
            personalityBio: { type: Type.STRING },
            masterVisualPrompt: { type: Type.STRING },
          },
          required: [
            'name',
            'ageAndHeight',
            'familyStatus',
            'occupation',
            'voiceType',
            'personalityBio',
            'masterVisualPrompt',
          ],
        },
      },
    });

    const rawText = (result.response.text ?? '').trim();
    if (!rawText) {
      return {
        status: 502,
        body: { error: 'Gagal menghasilkan analisis Character Sheet. Silakan coba lagi.' },
      };
    }

    const parsed = JSON.parse(rawText) as {
      name?: string;
      ageAndHeight?: string;
      familyStatus?: string;
      occupation?: string;
      voiceType?: string;
      personalityBio?: string;
      masterVisualPrompt?: string;
    };

    const profile = {
      name: (parsed.name ?? hintName ?? '').trim(),
      ageAndHeight: (parsed.ageAndHeight ?? hintAge ?? '').trim(),
      familyStatus: (parsed.familyStatus ?? '').trim(),
      occupation: (parsed.occupation ?? '').trim(),
      voiceType: (parsed.voiceType ?? hintVoice ?? '').trim(),
      personalityBio: (parsed.personalityBio ?? '').trim(),
      masterVisualPrompt: (parsed.masterVisualPrompt ?? '').trim(),
    };

    if (!profile.masterVisualPrompt) {
      return {
        status: 502,
        body: {
          error: 'Prompt visual tidak terbaca. Silakan coba unggah gambar yang lebih jelas.',
        },
      };
    }

    return {
      status: 200,
      body: {
        profile,
        masterVisualPrompt: profile.masterVisualPrompt,
        usedModel: result.usedModel,
        fallbackUsed: result.fallbackUsed,
        saw503: result.saw503,
      },
    };
  } catch (err) {
    return mapGeminiError(err, 'Terjadi kesalahan saat menganalisis gambar karakter.');
  }
}

export async function generateStoryboard(rawBody: unknown): Promise<ServiceResponse> {
  try {
    const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>;
    const {
      title,
      premise,
      genres,
      genre,
      customGenre,
      visualStyle,
      customVisualStyle,
      animationStyle,
      format,
      aspectRatio,
      characters,
      previousEpisodeContext,
      episodeNumber,
      accountSlot,
    } = body;

    const safeTitle = sanitizeShortText(title, 120);
    if (!safeTitle) {
      return { status: 400, body: { error: 'Judul Cerita / Episode wajib diisi.' } };
    }

    let resolvedGenres: string[] = Array.isArray(genres)
      ? genres.map((g) => sanitizeShortText(g, 80)).filter(Boolean)
      : [];
    if (resolvedGenres.length === 0 && typeof genre === 'string' && genre.trim()) {
      const legacy =
        genre === 'Kustom' ? sanitizeShortText(customGenre, 80) : sanitizeShortText(genre, 80);
      if (legacy) resolvedGenres = [legacy];
    }
    resolvedGenres = Array.from(new Set(resolvedGenres));
    if (resolvedGenres.length === 0) {
      return { status: 400, body: { error: 'Pilih minimal 1 genre cerita!' } };
    }

    const safeVisualStyle =
      sanitizeShortText(visualStyle || animationStyle, 60) || '3D Animation';
    const safeCustomVisualStyle = sanitizeShortText(customVisualStyle, 140);
    const styleConfig = getVisualStyleConfig(safeVisualStyle, safeCustomVisualStyle);

    const safePremise = sanitizeShortText(premise, 500);
    const safeRatio = aspectRatio === '9:16' || aspectRatio === '1:1' ? aspectRatio : '16:9';
    const safeFormat = sanitizeShortText(format, 40) || '5 Adegan';
    const isSeries = safeFormat === 'Series (Bersambung)';
    const sceneCount =
      safeFormat === '8 Adegan' ? 8 : safeFormat === '10 Adegan' ? 10 : isSeries ? 6 : 5;
    const epNum =
      typeof episodeNumber === 'number' && episodeNumber >= 1 ? Math.floor(episodeNumber) : 1;

    const castList: CharacterInput[] = Array.isArray(characters)
      ? characters.slice(0, 12).map((c: Record<string, unknown>) => {
          const rawMaster =
            sanitizeShortText(c.masterVisualPrompt, 1200) ||
            `${sanitizeShortText(c.name, 60)}, distinctive Indonesian character`;
          const sanitizedMaster = sanitizeVisualPromptForStyle(rawMaster, safeVisualStyle);
          return {
            id: sanitizeShortText(c.id, 64),
            name: sanitizeShortText(c.name, 60) || 'Karakter',
            ageAndHeight: sanitizeShortText(c.ageAndHeight ?? c.age, 60) || 'Dewasa',
            familyStatus: sanitizeShortText(c.familyStatus, 140) || '-',
            occupation: sanitizeShortText(c.occupation, 140) || '-',
            voiceType: sanitizeShortText(c.voiceType, 120) || 'Ramah & Ekspresif',
            personalityBio: sanitizeShortText(c.personalityBio, 500) || '-',
            masterVisualPrompt: sanitizedMaster || rawMaster,
          };
        })
      : [];

    const castContextBlock =
      castList.length > 0
        ? castList
            .map(
              (c, idx) =>
                `${idx + 1}. Name: "${c.name}"
   - Usia & Tinggi Badan: ${c.ageAndHeight}
   - Status & Hubungan Keluarga: ${c.familyStatus}
   - Pekerjaan / Peran: ${c.occupation}
   - Gender & Tipe Suara: ${c.voiceType}
   - Profil Singkat, Sifat & Motto: ${c.personalityBio}
   - MANDATORY Sanitized Visual Prompt (inject FULL physical, costume & accessory description adapted to ${styleConfig.label} whenever ${c.name} appears): ${c.masterVisualPrompt}`
            )
            .join('\n\n')
        : `No pre-saved cast selected. Create consistent original Indonesian characters adapted to "${styleConfig.label}" and keep their physical & outfit details identical across every scene.`;

    const ratioHint =
      safeRatio === '9:16'
        ? 'vertical 9:16 framing, characters composed nicely within vertical portrait frame'
        : safeRatio === '1:1'
        ? 'balanced 1:1 square composition'
        : 'cinematic 16:9 widescreen composition';

    const seriesDirective = isSeries
      ? `FORMAT SERIES BERSAMBUNG (Episode ${epNum}):
${previousEpisodeContext ? `PREVIOUS EPISODE CONTEXT / CLIFFHANGER TO CONTINUE DIRECTLY:\n${sanitizeShortText(previousEpisodeContext, 1000)}\n` : ''}
- End the final scene (${sceneCount}) on an exciting, suspenseful or hilarious cliffhanger hook!
- Populate "cliffhangerHook" in Indonesian summarizing the unresolved hook for the next episode.`
      : `FORMAT STANDALONE (${sceneCount} Adegan):
- Deliver a complete story arc with a clear beginning, escalation, and satisfying ending within ${sceneCount} scenes.`;

    const genreBlendingBlock = buildGenreBlendingDirective(resolvedGenres);

    const systemInstruction = `You are Kangshu AI Studio's Lead Showrunner & Google Flow Prompt Architect.
Your job is to craft an engaging Indonesian story blending all selected genres and produce production-grade prompts tailored for Google Flow's Image-to-Video workflow.

${genreBlendingBlock}

STRICT RULES FOR OUTPUT QUALITY:
1. Story Summary ("storySummary"), Scene Title ("title"), and Scene Location ("location") MUST be written in natural, engaging Indonesian (with light relatable Sundanese/Indonesian warmth when appropriate).
2. CHARACTER BIODATA CONSISTENCY: Respect each character's Family Status & Relationships, Occupation/Role, Personality/Traits/Motto, and Voice/Tone throughout the plot, conflicts, and spoken dialogue!
3. "startFrameImagePrompt" MUST be written in rich, vivid ENGLISH:
   - MUST BEGIN DIRECTLY with this exact visual medium opening: "${styleConfig.openingPrefix}" followed by framing "${ratioHint}" (wide shot or medium-wide shot).
   - Depicts the EXACT STILL FRAME at 0.0 seconds BEFORE movement begins (no motion blur, frozen opening pose).
   - Must describe the setting, props, time of day, and lighting in rich detail.
   - CRITICAL ANTI-CONFLICT & CONSISTENCY RULE: Never include contradictory medium words (e.g., never mention cartoon/anime/2D/3D/illustration when Visual Style is Realistic / Orang Asli!). For EVERY character appearing in that scene, embed their FULL sanitized physical appearance, hairstyle, age, facial features, and complete clothing/accessories from their "MANDATORY Sanitized Visual Prompt" directly inside "startFrameImagePrompt".
4. "videoPrompt" MUST be written clearly for Google Flow Image-to-Video animation:
   - ${styleConfig.videoMotionDirective}
   - Include COMPLETE spoken dialogue in Indonesian (in quotes with speaker name and exact vocal emotion/tone matching the character's Gender & Voice Type metadata, e.g., [Kang Shu - nada bijaksana ramah Sunda]: "...").
   - Include camera movement and ambient environmental sound/atmosphere.
5. Generate EXACTLY ${sceneCount} scenes numbered 1 through ${sceneCount}.`;

    const userPrompt = `PROJECT BRIEF:
- Title / Episode: "${safeTitle}" (Episode ${epNum})
- Active Genre Combination: ${resolvedGenres.join(' + ')}
- Premise / Notes: ${safePremise || 'Buat ide cerita segar, memadukan seluruh genre aktif secara seimbang, sesuai judul, biodata karakter, hubungan keluarga, serta peran masing-masing.'}
- Selected Visual Style: ${styleConfig.label}
- Aspect Ratio: ${safeRatio}
- Total Scenes: ${sceneCount}

SELECTED CAST (FULL BIODATA & SANITIZED VISUAL CUES):
${castContextBlock}

${seriesDirective}`;

    const result = await generateWithFallback({
      accountSlot: accountSlot === 'backup' ? 'backup' : 'primary',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storySummary: {
              type: Type.STRING,
              description: 'Ringkasan alur cerita lengkap dalam Bahasa Indonesia yang menarik.',
            },
            isCliffhanger: {
              type: Type.BOOLEAN,
              description: 'True jika format Series (Bersambung) dengan akhir menggantung.',
            },
            cliffhangerHook: {
              type: Type.STRING,
              description: 'Ringkasan adegan menggantung untuk modal lanjutan episode berikutnya.',
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  location: { type: Type.STRING },
                  charactersPresent: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  startFrameImagePrompt: { type: Type.STRING },
                  videoPrompt: { type: Type.STRING },
                },
                required: [
                  'sceneNumber',
                  'title',
                  'location',
                  'charactersPresent',
                  'startFrameImagePrompt',
                  'videoPrompt',
                ],
              },
            },
          },
          required: ['storySummary', 'isCliffhanger', 'cliffhangerHook', 'scenes'],
        },
      },
    });

    const rawText = (result.response.text ?? '').trim();
    if (!rawText) {
      return {
        status: 502,
        body: { error: 'Respons AI kosong. Silakan coba generate ulang.' },
      };
    }

    const parsed = JSON.parse(rawText) as {
      storySummary?: string;
      isCliffhanger?: boolean;
      cliffhangerHook?: string;
      scenes?: Array<{
        sceneNumber?: number;
        title?: string;
        sceneTitle?: string;
        location?: string;
        charactersPresent?: string[];
        startFrameImagePrompt?: string;
        videoPrompt?: string;
      }>;
    };

    if (!parsed || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
      return {
        status: 502,
        body: {
          error: 'Struktur adegan dari AI tidak valid atau kosong. Silakan coba generate ulang.',
        },
      };
    }

    const enrichedScenes = parsed.scenes.map((sc, index) => {
      let startPrompt = (sc?.startFrameImagePrompt ?? '').trim();
      const presentNames = Array.isArray(sc?.charactersPresent) ? sc.charactersPresent : [];
      const resolvedTitle = (sc?.title || sc?.sceneTitle || '').trim() || `Adegan ${index + 1}`;
      const resolvedLocation = (sc?.location || '').trim() || 'Latar Cerita';
      const resolvedVideoPrompt = (sc?.videoPrompt ?? '').trim();

      if (safeVisualStyle === 'Realistic / Orang Asli') {
        startPrompt = sanitizeVisualPromptForStyle(startPrompt, safeVisualStyle);
      }

      for (const char of castList) {
        const isMentioned =
          presentNames.some((n) => String(n).toLowerCase().includes(char.name.toLowerCase())) ||
          startPrompt.toLowerCase().includes(char.name.toLowerCase()) ||
          resolvedVideoPrompt.toLowerCase().includes(char.name.toLowerCase());

        if (isMentioned && char.masterVisualPrompt) {
          const snippet = char.masterVisualPrompt.slice(0, 28).toLowerCase();
          if (!startPrompt.toLowerCase().includes(snippet)) {
            startPrompt = `${startPrompt} [${char.name} visual reference: ${char.masterVisualPrompt}]`.trim();
          }
        }
      }

      if (!startPrompt) {
        startPrompt = `${styleConfig.openingPrefix} ${ratioHint}, still frame at ${resolvedLocation}.`;
      } else if (!startPrompt.toLowerCase().includes(styleConfig.openingCheckToken)) {
        startPrompt = `${styleConfig.openingPrefix} ${startPrompt}`;
      }

      return {
        id: `scene-${Date.now()}-${index + 1}`,
        sceneNumber: typeof sc?.sceneNumber === 'number' ? sc.sceneNumber : index + 1,
        title: resolvedTitle,
        location: resolvedLocation,
        charactersPresent: presentNames,
        startFrameImagePrompt: startPrompt,
        videoPrompt: resolvedVideoPrompt || `Animate the scene at ${resolvedLocation} smoothly.`,
      };
    });

    return {
      status: 200,
      body: {
        storySummary: (parsed.storySummary ?? '').trim() || `Ringkasan cerita "${safeTitle}".`,
        isCliffhanger: isSeries ? true : Boolean(parsed.isCliffhanger),
        cliffhangerHook: (parsed.cliffhangerHook ?? '').trim(),
        scenes: enrichedScenes,
        usedModel: result.usedModel,
        fallbackUsed: result.fallbackUsed,
        saw503: result.saw503,
      },
    };
  } catch (err) {
    return mapGeminiError(err, 'Gagal menyusun storyboard. Silakan coba lagi.');
  }
}
