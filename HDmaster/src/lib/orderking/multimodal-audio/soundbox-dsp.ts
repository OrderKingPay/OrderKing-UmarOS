/**
 * UMAR OS & KingPay Soundbox Hardware Audio DSP & Multilingual Media Engine
 *
 * Provides:
 * 1. Dual-tone frequency calculation (D5: 587.33 Hz, A5: 880.00 Hz) with exponential decay envelope.
 * 2. Web Audio API synthesis parameter buffers (gain curve parameter buffer + PCM sample buffer).
 * 3. Multilingual speech synthesizer metadata for en-IN, hi-IN, bn-IN, and as-IN.
 * 4. Spoken number and payment amount localization in English, Hindi, Bengali, and Assamese.
 */

// ============================================================================
// 1. HARDWARE AUDIO SYNTHESIZER CONSTANTS & TYPES
// ============================================================================

/** Soundbox alert D5 note frequency in Hz */
export const SOUNDBOX_TONE_D5_HZ = 587.33;
export const D5_FREQUENCY = 587.33;

/** Soundbox alert A5 note frequency in Hz */
export const SOUNDBOX_TONE_A5_HZ = 880.00;
export const A5_FREQUENCY = 880.00;

/** Default alert chime duration in seconds */
export const DEFAULT_CHIME_DURATION_SEC = 0.6;

/** Default Web Audio API / I2S DAC sample rate in Hz */
export const DEFAULT_SAMPLE_RATE = 44100;

/** Default attack duration in seconds to eliminate speaker transients/clicks */
export const DEFAULT_ATTACK_TIME_SEC = 0.015;

/** Default exponential decay time constant (tau in seconds) */
export const DEFAULT_DECAY_TIME_CONSTANT = 0.15;

/** Default peak gain (0.0 to 1.0) */
export const DEFAULT_PEAK_GAIN = 0.8;

export type AudioToneMode = 'chord' | 'sequential';

export interface DualToneConfig {
  freq1?: number; // Default D5: 587.33 Hz
  freq2?: number; // Default A5: 880.00 Hz
  durationSec?: number; // Default 0.6s
  sampleRate?: number; // Default 44100 Hz
  peakGain?: number; // Default 0.8
  attackTimeSec?: number; // Default 0.015s
  decayTimeConstant?: number; // Default 0.15s
  mode?: AudioToneMode; // 'chord' (simultaneous) or 'sequential'
}

export interface EnvelopeConfig {
  durationSec?: number;
  sampleCount?: number;
  initialGain?: number;
  attackTimeSec?: number;
  decayTimeConstant?: number;
  minGain?: number;
}

export interface DualToneFrequencyCalculation {
  d5: number;
  a5: number;
  frequencyD5: number;
  frequencyA5: number;
  intervalRatio: number;
  semitoneDistance: number;
  periodD5Sec: number;
  periodA5Sec: number;
}

export interface WebAudioSynthesisBuffers {
  sampleRate: number;
  durationSec: number;
  frequencies: {
    d5: number;
    a5: number;
  };
  envelopeCurve: Float32Array; // Value curve buffer for Web Audio setValueCurveAtTime
  pcmBuffer: Float32Array; // Synthesized audio PCM buffer [-1.0, 1.0]
  channelData: Float32Array; // AudioBuffer channel 0 data alias
  metadata: {
    peakGain: number;
    attackTimeSec: number;
    decayTimeConstant: number;
    curveSampleCount: number;
    totalAudioSamples: number;
    mode: AudioToneMode;
  };
  webAudioSchedule: {
    oscillator1: {
      type: 'sine';
      frequency: number;
      startTime: number;
      stopTime: number;
    };
    oscillator2: {
      type: 'sine';
      frequency: number;
      startTime: number;
      stopTime: number;
    };
    gainNode: {
      curve: Float32Array;
      startTime: number;
      duration: number;
    };
  };
}

// ============================================================================
// 2. HARDWARE AUDIO SYNTHESIZER PARAMETER ENGINE (DSP)
// ============================================================================

/**
 * Calculates dual-tone harmonic parameters (D5: 587.33 Hz, A5: 880.00 Hz).
 * In music acoustics, D5 to A5 is an acoustic perfect fifth (7 semitones).
 */
export function calculateDualToneFrequencies(): DualToneFrequencyCalculation {
  const d5 = SOUNDBOX_TONE_D5_HZ;
  const a5 = SOUNDBOX_TONE_A5_HZ;
  const intervalRatio = a5 / d5;
  const semitoneDistance = Math.round(12 * Math.log2(intervalRatio));

  return {
    d5,
    a5,
    frequencyD5: d5,
    frequencyA5: a5,
    intervalRatio,
    semitoneDistance,
    periodD5Sec: 1 / d5,
    periodA5Sec: 1 / a5,
  };
}

/**
 * Computes instantaneous amplitude at time t using an exponential decay envelope:
 * - Linear ramp from 0 to initialGain during attack phase [0, attackTimeSec].
 * - Exponential decay V(t) = V0 * exp(-(t - attackTimeSec) / tau) thereafter.
 */
export function calculateExponentialDecay(
  t: number,
  initialGain: number = DEFAULT_PEAK_GAIN,
  decayTimeConstant: number = DEFAULT_DECAY_TIME_CONSTANT,
  attackTimeSec: number = DEFAULT_ATTACK_TIME_SEC
): number {
  if (t <= 0) return 0;

  if (attackTimeSec > 0 && t < attackTimeSec) {
    return (t / attackTimeSec) * initialGain;
  }

  const decayT = t - attackTimeSec;
  return initialGain * Math.exp(-decayT / decayTimeConstant);
}

/**
 * Generates an exponential decay parameter curve buffer for Web Audio API:
 * Suitable for `gainNode.gain.setValueCurveAtTime(envelopeCurve, startTime, duration)`.
 */
export function generateExponentialDecayEnvelope(
  config?: EnvelopeConfig
): Float32Array {
  const durationSec = config?.durationSec ?? DEFAULT_CHIME_DURATION_SEC;
  const sampleCount = config?.sampleCount ?? 512;
  const initialGain = config?.initialGain ?? DEFAULT_PEAK_GAIN;
  const attackTimeSec = config?.attackTimeSec ?? DEFAULT_ATTACK_TIME_SEC;
  const decayTimeConstant = config?.decayTimeConstant ?? DEFAULT_DECAY_TIME_CONSTANT;
  const minGain = config?.minGain ?? 0.0001;

  const curve = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const t = (i / (sampleCount - 1)) * durationSec;
    const value = calculateExponentialDecay(
      t,
      initialGain,
      decayTimeConstant,
      attackTimeSec
    );
    curve[i] = Math.max(minGain, value);
  }

  return curve;
}

/**
 * Synthesizes a mono Float32Array PCM audio buffer containing the dual-tone chime:
 * s(t) = envelope(t) * (0.5 * sin(2*pi*f1*t) + 0.5 * sin(2*pi*f2*t))
 */
export function generateDualTonePcmBuffer(
  config?: Partial<DualToneConfig>
): Float32Array {
  const freq1 = config?.freq1 ?? SOUNDBOX_TONE_D5_HZ;
  const freq2 = config?.freq2 ?? SOUNDBOX_TONE_A5_HZ;
  const durationSec = config?.durationSec ?? DEFAULT_CHIME_DURATION_SEC;
  const sampleRate = config?.sampleRate ?? DEFAULT_SAMPLE_RATE;
  const peakGain = config?.peakGain ?? DEFAULT_PEAK_GAIN;
  const attackTimeSec = config?.attackTimeSec ?? DEFAULT_ATTACK_TIME_SEC;
  const decayTimeConstant = config?.decayTimeConstant ?? DEFAULT_DECAY_TIME_CONSTANT;
  const mode = config?.mode ?? 'chord';

  const totalSamples = Math.floor(sampleRate * durationSec);
  const pcm = new Float32Array(totalSamples);

  const twoPiF1 = 2 * Math.PI * freq1;
  const twoPiF2 = 2 * Math.PI * freq2;

  if (mode === 'sequential') {
    const halfSamples = Math.floor(totalSamples / 2);
    const halfDuration = durationSec / 2;

    for (let i = 0; i < totalSamples; i++) {
      const isSecondHalf = i >= halfSamples;
      const subIdx = isSecondHalf ? i - halfSamples : i;
      const t = subIdx / sampleRate;
      const env = calculateExponentialDecay(
        t,
        peakGain,
        decayTimeConstant / 1.5,
        attackTimeSec
      );
      const freq = isSecondHalf ? twoPiF2 : twoPiF1;
      pcm[i] = env * Math.sin(freq * t);
    }
  } else {
    // Simultaneous chord (standard Soundbox payment alert chime)
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const env = calculateExponentialDecay(
        t,
        peakGain,
        decayTimeConstant,
        attackTimeSec
      );
      const s1 = Math.sin(twoPiF1 * t);
      const s2 = Math.sin(twoPiF2 * t);
      pcm[i] = env * 0.5 * (s1 + s2);
    }
  }

  return pcm;
}

/**
 * Generates complete Web Audio API synthesis parameter buffers and scheduling specs:
 * Returns both the value curve gain parameter buffer and PCM waveform buffer.
 */
export function generateWebAudioSynthBuffers(
  config?: Partial<DualToneConfig>
): WebAudioSynthesisBuffers {
  const durationSec = config?.durationSec ?? DEFAULT_CHIME_DURATION_SEC;
  const sampleRate = config?.sampleRate ?? DEFAULT_SAMPLE_RATE;
  const peakGain = config?.peakGain ?? DEFAULT_PEAK_GAIN;
  const attackTimeSec = config?.attackTimeSec ?? DEFAULT_ATTACK_TIME_SEC;
  const decayTimeConstant = config?.decayTimeConstant ?? DEFAULT_DECAY_TIME_CONSTANT;
  const mode = config?.mode ?? 'chord';

  const envelopeCurve = generateExponentialDecayEnvelope({
    durationSec,
    sampleCount: 512,
    initialGain: peakGain,
    attackTimeSec,
    decayTimeConstant,
  });

  const pcmBuffer = generateDualTonePcmBuffer({
    ...config,
    durationSec,
    sampleRate,
    peakGain,
    attackTimeSec,
    decayTimeConstant,
    mode,
  });

  return {
    sampleRate,
    durationSec,
    frequencies: {
      d5: SOUNDBOX_TONE_D5_HZ,
      a5: SOUNDBOX_TONE_A5_HZ,
    },
    envelopeCurve,
    pcmBuffer,
    channelData: pcmBuffer,
    metadata: {
      peakGain,
      attackTimeSec,
      decayTimeConstant,
      curveSampleCount: envelopeCurve.length,
      totalAudioSamples: pcmBuffer.length,
      mode,
    },
    webAudioSchedule: {
      oscillator1: {
        type: 'sine',
        frequency: SOUNDBOX_TONE_D5_HZ,
        startTime: 0,
        stopTime: durationSec,
      },
      oscillator2: {
        type: 'sine',
        frequency: SOUNDBOX_TONE_A5_HZ,
        startTime: 0,
        stopTime: durationSec,
      },
      gainNode: {
        curve: envelopeCurve,
        startTime: 0,
        duration: durationSec,
      },
    },
  };
}

// ============================================================================
// 3. MULTILINGUAL SPEECH SYNTHESIZER METADATA (4 LANGUAGES)
// ============================================================================

export type SupportedLanguage = 'en-IN' | 'hi-IN' | 'bn-IN' | 'as-IN';
export type SoundboxLanguageCode = SupportedLanguage;

export interface SpeechVoiceProfile {
  voiceName: string;
  gender: 'FEMALE' | 'MALE';
  naturalSampleRateHertz: number;
  speakingRate: number;
  pitch: number;
}

export interface SpeechSynthesizerMetadata {
  locale: SupportedLanguage;
  languageName: string;
  nativeName: string;
  currencyName: string;
  currencySymbol: string;
  template: string;
  ssmlTemplate: string;
  voiceProfile: SpeechVoiceProfile;
}

/**
 * Exact Soundbox speech synthesizer metadata for the 4 supported languages:
 * - English (en-IN): 'KingPay: Received {amount} rupees.'
 * - Hindi (hi-IN): 'किंगपे पर {amount} रुपये प्राप्त हुए।'
 * - Bengali (bn-IN): 'কিংপে-তে {amount} টাকা প্রাপ্ত হলো।'
 * - Assamese (as-IN): 'কিংপেত {amount} টকা লাভ কৰা হ\'ল।'
 */
export const MULTILINGUAL_SPEECH_METADATA: Record<
  SupportedLanguage,
  SpeechSynthesizerMetadata
> = {
  'en-IN': {
    locale: 'en-IN',
    languageName: 'English (India)',
    nativeName: 'English (India)',
    currencyName: 'rupees',
    currencySymbol: '₹',
    template: 'KingPay: Received {amount} rupees.',
    ssmlTemplate: '<speak><s>KingPay: Received {amount} rupees.</s></speak>',
    voiceProfile: {
      voiceName: 'en-IN-Wavenet-D',
      gender: 'FEMALE',
      naturalSampleRateHertz: 24000,
      speakingRate: 1.0,
      pitch: 0.0,
    },
  },
  'hi-IN': {
    locale: 'hi-IN',
    languageName: 'Hindi',
    nativeName: 'हिन्दी',
    currencyName: 'रुपये',
    currencySymbol: '₹',
    template: 'किंगपे पर {amount} रुपये प्राप्त हुए।',
    ssmlTemplate: '<speak><s>किंगपे पर {amount} रुपये प्राप्त हुए।</s></speak>',
    voiceProfile: {
      voiceName: 'hi-IN-Wavenet-A',
      gender: 'FEMALE',
      naturalSampleRateHertz: 24000,
      speakingRate: 1.0,
      pitch: 0.0,
    },
  },
  'bn-IN': {
    locale: 'bn-IN',
    languageName: 'Bengali (India)',
    nativeName: 'বাংলা',
    currencyName: 'টাকা',
    currencySymbol: '₹',
    template: 'কিংপে-তে {amount} টাকা প্রাপ্ত হলো।',
    ssmlTemplate: '<speak><s>কিংপে-তে {amount} টাকা প্রাপ্ত হলো।</s></speak>',
    voiceProfile: {
      voiceName: 'bn-IN-Wavenet-A',
      gender: 'FEMALE',
      naturalSampleRateHertz: 24000,
      speakingRate: 1.0,
      pitch: 0.0,
    },
  },
  'as-IN': {
    locale: 'as-IN',
    languageName: 'Assamese (India)',
    nativeName: 'অসমীয়া',
    currencyName: 'টকা',
    currencySymbol: '₹',
    template: "কিংপেত {amount} টকা লাভ কৰা হ'ল।",
    ssmlTemplate: "<speak><s>কিংপেত {amount} টকা লাভ কৰা হ'ল।</s></speak>",
    voiceProfile: {
      voiceName: 'as-IN-Standard-A',
      gender: 'FEMALE',
      naturalSampleRateHertz: 24000,
      speakingRate: 1.0,
      pitch: 0.0,
    },
  },
};

export function getSpeechMetadata(locale: SupportedLanguage): SpeechSynthesizerMetadata {
  const metadata = MULTILINGUAL_SPEECH_METADATA[locale];
  if (!metadata) {
    throw new Error(`Unsupported soundbox locale: ${locale}`);
  }
  return metadata;
}

export function listSupportedLanguages(): SupportedLanguage[] {
  return ['en-IN', 'hi-IN', 'bn-IN', 'as-IN'];
}

// ============================================================================
// 4. MULTILINGUAL NUMBER-TO-WORDS CONVERSION ENGINE
// ============================================================================

// --- English Dictionary ---
const EN_ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const EN_TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

function convertEnglishBelowHundred(n: number): string {
  if (n < 20) return EN_ONES[n];
  const ten = Math.floor(n / 10);
  const rem = n % 10;
  return rem === 0 ? EN_TENS[ten] : `${EN_TENS[ten]} ${EN_ONES[rem]}`;
}

function convertEnglishNumber(num: number): string {
  if (num === 0) return 'zero';

  const parts: string[] = [];

  const crores = Math.floor(num / 10000000);
  const afterCrores = num % 10000000;

  const lakhs = Math.floor(afterCrores / 100000);
  const afterLakhs = afterCrores % 100000;

  const thousands = Math.floor(afterLakhs / 1000);
  const afterThousands = afterLakhs % 1000;

  const hundreds = Math.floor(afterThousands / 100);
  const remainder = afterThousands % 100;

  if (crores > 0) {
    parts.push(`${convertEnglishNumber(crores)} crore`);
  }
  if (lakhs > 0) {
    parts.push(`${convertEnglishNumber(lakhs)} lakh`);
  }
  if (thousands > 0) {
    parts.push(`${convertEnglishNumber(thousands)} thousand`);
  }
  if (hundreds > 0) {
    parts.push(`${EN_ONES[hundreds]} hundred`);
  }
  if (remainder > 0) {
    parts.push(convertEnglishBelowHundred(remainder));
  }

  return parts.join(' ');
}

// --- Hindi Dictionary (0 - 99) ---
const HI_NUMBERS_0_TO_99: string[] = [
  'शून्य',
  'एक',
  'दो',
  'तीन',
  'चार',
  'पांच',
  'छह',
  'सात',
  'आठ',
  'नौ',
  'दस',
  'ग्यारह',
  'बारह',
  'तेरह',
  'चौदह',
  'पंद्रह',
  'सोलह',
  'सत्रह',
  'अठारह',
  'उन्नीस',
  'बीस',
  'इक्कीस',
  'बाईस',
  'तेईस',
  'चौबीस',
  'पच्चीस',
  'छब्बीस',
  'सत्ताईस',
  'अट्ठाईस',
  'उनतीस',
  'तीस',
  'इकतीस',
  'बत्तीस',
  'तैंतीस',
  'चौंतीस',
  'पैंतीस',
  'छत्तीस',
  'सैंतीस',
  'अड़तीस',
  'उनतालीस',
  'चालीस',
  'इकतालीस',
  'बयालीस',
  'तैंतालीस',
  'चवालीस',
  'पैंतालीस',
  'छियालीस',
  'सैंतालीस',
  'अड़तालीस',
  'उनचास',
  'पचास',
  'इक्यावन',
  'बावन',
  'तिरपन',
  'चौवन',
  'पचपन',
  'छप्पन',
  'सत्तावन',
  'अट्ठावन',
  'उनसठ',
  'साठ',
  'इकसठ',
  'बासठ',
  'तिरसठ',
  'चौंसठ',
  'पैंसठ',
  'छियासठ',
  'सड़सठ',
  'अड़सठ',
  'उनहत्तर',
  'सत्तर',
  'इकहत्तर',
  'बहत्तर',
  'तिहत्तर',
  'चौहत्तर',
  'पचहत्तर',
  'छिहत्तर',
  'सतहत्तर',
  'अठहत्तर',
  'उन्यासी',
  'अस्सी',
  'इक्यासी',
  'बयासी',
  'तिरासी',
  'चौरासी',
  'पचासी',
  'छियासी',
  'सत्तासी',
  'अट्ठासी',
  'नवासी',
  'नब्बे',
  'इक्यानवे',
  'बानवे',
  'तिरानवे',
  'चौरानवे',
  'पचानवे',
  'छियानवे',
  'सत्तानवे',
  'अट्ठानवे',
  'निन्यानवे',
];

function convertHindiNumber(num: number): string {
  if (num === 0) return 'शून्य';
  if (num < 100) return HI_NUMBERS_0_TO_99[num];

  const parts: string[] = [];

  const crores = Math.floor(num / 10000000);
  const afterCrores = num % 10000000;

  const lakhs = Math.floor(afterCrores / 100000);
  const afterLakhs = afterCrores % 100000;

  const thousands = Math.floor(afterLakhs / 1000);
  const afterThousands = afterLakhs % 1000;

  const hundreds = Math.floor(afterThousands / 100);
  const remainder = afterThousands % 100;

  if (crores > 0) {
    parts.push(`${convertHindiNumber(crores)} करोड़`);
  }
  if (lakhs > 0) {
    parts.push(`${convertHindiNumber(lakhs)} लाख`);
  }
  if (thousands > 0) {
    parts.push(`${convertHindiNumber(thousands)} हजार`);
  }
  if (hundreds > 0) {
    parts.push(`${HI_NUMBERS_0_TO_99[hundreds]} सौ`);
  }
  if (remainder > 0) {
    parts.push(HI_NUMBERS_0_TO_99[remainder]);
  }

  return parts.join(' ');
}

// --- Bengali Dictionary (0 - 99) ---
const BN_NUMBERS_0_TO_99: string[] = [
  'শূন্য',
  'এক',
  'দুই',
  'তিন',
  'চার',
  'পাঁচ',
  'ছয়',
  'সাত',
  'আট',
  'নয়',
  'দশ',
  'এগারো',
  'বারো',
  'তেরো',
  'চৌদ্দ',
  'পনেরো',
  'ষোলো',
  'সতেরো',
  'আঠারো',
  'উনিশ',
  'বিশ',
  'একুশ',
  'বাইশ',
  'তেইশ',
  'চব্বিশ',
  'পঁচিশ',
  'ছাব্বিশ',
  'সাতাইশ',
  'আঠাশ',
  'উনত্রিশ',
  'ত্রিশ',
  'একত্রিশ',
  'বত্রিশ',
  'তেত্রিশ',
  'চৌত্রিশ',
  'পঁয়ত্রিশ',
  'ছত্রিশ',
  'সাঁইত্রিশ',
  'আটত্রিশ',
  'উনচল্লিশ',
  'চল্লিশ',
  'একচল্লিশ',
  'বিয়াল্লিশ',
  'তেতাল্লিশ',
  'চুয়াল্লিশ',
  'পঁয়তাল্লিশ',
  'ছেচল্লিশ',
  'সাতচল্লিশ',
  'আটচল্লিশ',
  'উনপঞ্চাশ',
  'পঞ্চাশ',
  'একান্ন',
  'বায়ান্ন',
  'তিপ্পান্ন',
  'চুয়ান্ন',
  'পঞ্চান্ন',
  'ছাপ্পান্ন',
  'সাতান্ন',
  'আটান্ন',
  'উনষাট',
  'ষাট',
  'একষট্টি',
  'বাষট্টি',
  'তেষট্টি',
  'চৌষট্টি',
  'পঁয়ষট্টি',
  'ছেষট্টি',
  'সাতষট্টি',
  'আটষট্টি',
  'উনসত্তর',
  'সত্তর',
  'একাত্তর',
  'বাহাত্তর',
  'তিহাত্তর',
  'চুয়াত্তর',
  'পঁচাত্তর',
  'ছিয়াত্তর',
  'সাতাত্তর',
  'আটাত্তর',
  'উনআশি',
  'আশি',
  'একাশি',
  'বিরাশি',
  'তিরাশি',
  'চুরাশি',
  'পঁচাশি',
  'ছিয়াশি',
  'সাতাশি',
  'আটাশি',
  'উননব্বই',
  'নব্বই',
  'একানব্বই',
  'বিরানব্বই',
  'তিরানব্বই',
  'চুরানব্বই',
  'পঁচানব্বই',
  'ছিয়ানব্বই',
  'সাতানব্বই',
  'আটানব্বই',
  'নিরানব্বই',
];

function convertBengaliNumber(num: number): string {
  if (num === 0) return 'শূন্য';
  if (num < 100) return BN_NUMBERS_0_TO_99[num];

  const parts: string[] = [];

  const crores = Math.floor(num / 10000000);
  const afterCrores = num % 10000000;

  const lakhs = Math.floor(afterCrores / 100000);
  const afterLakhs = afterCrores % 100000;

  const thousands = Math.floor(afterLakhs / 1000);
  const afterThousands = afterLakhs % 1000;

  const hundreds = Math.floor(afterThousands / 100);
  const remainder = afterThousands % 100;

  if (crores > 0) {
    parts.push(`${convertBengaliNumber(crores)} কোটি`);
  }
  if (lakhs > 0) {
    parts.push(`${convertBengaliNumber(lakhs)} লাখ`);
  }
  if (thousands > 0) {
    parts.push(`${convertBengaliNumber(thousands)} হাজার`);
  }
  if (hundreds > 0) {
    parts.push(`${BN_NUMBERS_0_TO_99[hundreds]} শত`);
  }
  if (remainder > 0) {
    parts.push(BN_NUMBERS_0_TO_99[remainder]);
  }

  return parts.join(' ');
}

// --- Assamese Dictionary (0 - 99) ---
// Utilizes authentic Assamese orthography: ৰ (ra), তিনি (3), চাৰি (4), আঠ (8), ন (9), দহ (10)
const AS_NUMBERS_0_TO_99: string[] = [
  'শূন্য',
  'এক',
  'দুই',
  'তিনি',
  'চাৰি',
  'পাঁচ',
  'ছয়',
  'সাত',
  'আঠ',
  'ন',
  'দহ',
  'এঘাৰ',
  'বাৰ',
  'তেৰ',
  'চৈধ্য',
  'পোন্ধৰ',
  'ষোল্ল',
  'সোতৰ',
  'ওঠৰ',
  'উনৈশ',
  'বিশ',
  'একৈশ',
  'বাইশ',
  'তেইশ',
  'চৌব্বিশ',
  'পঁচিশ',
  'ছাব্বিশ',
  'সাতাইশ',
  'আঠাইশ',
  'উনত্ৰিশ',
  'ত্ৰিশ',
  'একত্রিশ',
  'বত্রিশ',
  'তেত্রিশ',
  'চৌত্রিশ',
  'পঁয়ত্রিশ',
  'ছত্রিশ',
  'সাঁইত্রিশ',
  'আটত্রিশ',
  'উনচল্লিশ',
  'চল্লিছ',
  'একচল্লিছ',
  'বিয়াল্লিছ',
  'তেতাল্লিছ',
  'চুয়াল্লিছ',
  'পঞ্চাল্লিছ',
  'ছেচল্লিছ',
  'সাতচল্লিছ',
  'আটচল্লিছ',
  'উনপঞ্চাশ',
  'পঞ্চাশ',
  'একান্ন',
  'বাৱান্ন',
  'তিপ্পান্ন',
  'চৌৱান্ন',
  'পঞ্চান্ন',
  'ছাপ্পান্ন',
  'সাতান্ন',
  'আঠান্ন',
  'উনষাঠি',
  'ষাঠি',
  'একষষ্ঠি',
  'বাষষ্ঠি',
  'তেষষ্ঠি',
  'চৌষষ্ঠি',
  'পঁয়ষষ্ঠি',
  'ছেষষ্ঠি',
  'সাতষষ্ঠি',
  'আটষষ্ঠি',
  'উনসত্তৰ',
  'সত্তৰ',
  'একাত্তৰ',
  'বাহাত্তৰ',
  'তিহাত্তৰ',
  'চুয়াত্তৰ',
  'পঁচাত্তৰ',
  'ছিয়াত্তৰ',
  'সাতাত্তৰ',
  'আটাত্তৰ',
  'উনআশী',
  'আশী',
  'একাশী',
  'বিৰাশী',
  'তিৰাশী',
  'চুৰাশী',
  'পঁচাশী',
  'ছিয়াশী',
  'সাতাশী',
  'আটাশী',
  'উননব্বৈ',
  'নব্বৈ',
  'একানব্বৈ',
  'বিৰানব্বৈ',
  'তিৰানব্বৈ',
  'চুৰানব্বৈ',
  'পঁচানব্বৈ',
  'ছিয়ানব্বৈ',
  'সাতানব্বৈ',
  'আটানব্বৈ',
  'নিৰানব্বৈ',
];

function convertAssameseNumber(num: number): string {
  if (num === 0) return 'শূন্য';
  if (num < 100) return AS_NUMBERS_0_TO_99[num];

  const parts: string[] = [];

  const crores = Math.floor(num / 10000000);
  const afterCrores = num % 10000000;

  const lakhs = Math.floor(afterCrores / 100000);
  const afterLakhs = afterCrores % 100000;

  const thousands = Math.floor(afterLakhs / 1000);
  const afterThousands = afterLakhs % 1000;

  const hundreds = Math.floor(afterThousands / 100);
  const remainder = afterThousands % 100;

  if (crores > 0) {
    parts.push(`${convertAssameseNumber(crores)} কোটি`);
  }
  if (lakhs > 0) {
    parts.push(`${convertAssameseNumber(lakhs)} লাখ`);
  }
  // Assamese uses হাজাৰ with authentic Assamese letter Ra (ৰ)
  if (thousands > 0) {
    parts.push(`${convertAssameseNumber(thousands)} হাজাৰ`);
  }
  if (hundreds > 0) {
    parts.push(`${AS_NUMBERS_0_TO_99[hundreds]} শত`);
  }
  if (remainder > 0) {
    parts.push(AS_NUMBERS_0_TO_99[remainder]);
  }

  return parts.join(' ');
}

/**
 * Converts a positive number (e.g. 250, 1500) into spoken localized words
 * across all 4 languages (English, Hindi, Bengali, Assamese).
 */
export function convertNumberToSpokenWords(
  amount: number,
  locale: SupportedLanguage
): string {
  const integerPart = Math.floor(Math.abs(amount));

  switch (locale) {
    case 'en-IN':
      return convertEnglishNumber(integerPart);
    case 'hi-IN':
      return convertHindiNumber(integerPart);
    case 'bn-IN':
      return convertBengaliNumber(integerPart);
    case 'as-IN':
      return convertAssameseNumber(integerPart);
    default:
      throw new Error(`Unsupported soundbox locale: ${locale}`);
  }
}

// Aliases
export const amountToSpokenWords = convertNumberToSpokenWords;
export const numberToSpokenText = convertNumberToSpokenWords;

// ============================================================================
// 5. SOUNDBOX SPEECH ANNOUNCEMENT FORMATTER & PACKET GENERATOR
// ============================================================================

/**
 * Converts a payment amount (e.g. 250, 1500) into the exact localized speech
 * synthesizer announcement text by injecting spoken words into the language template:
 * - English (en-IN): 'KingPay: Received {amount} rupees.'
 * - Hindi (hi-IN): 'किंगपे पर {amount} रुपये प्राप्त हुए।'
 * - Bengali (bn-IN): 'কিংপে-তে {amount} টাকা প্রাপ্ত হলো।'
 * - Assamese (as-IN): 'কিংপেত {amount} টকা লাভ কৰা হ\'ল।'
 */
export function generateSoundboxVoiceAnnouncement(
  amount: number,
  locale: SupportedLanguage,
  options?: { useWords?: boolean }
): string {
  const metadata = getSpeechMetadata(locale);
  const useWords = options?.useWords ?? true;

  const spokenAmount = useWords
    ? convertNumberToSpokenWords(amount, locale)
    : amount.toString();

  return metadata.template.replace('{amount}', spokenAmount);
}

// Aliases
export const generateSoundboxSpokenText = generateSoundboxVoiceAnnouncement;
export const formatSoundboxSpeech = generateSoundboxVoiceAnnouncement;

/**
 * Complete multimodal Soundbox dispatch payload:
 * Combines Web Audio API dual-tone chime synthesis buffers,
 * metadata, and the localized speech announcement text.
 */
export interface SoundboxAnnouncementPacket {
  locale: SupportedLanguage;
  amount: number;
  spokenAmount: string;
  announcementText: string;
  template: string;
  synthBuffers: WebAudioSynthesisBuffers;
  metadata: SpeechSynthesizerMetadata;
}

export function generateSoundboxAnnouncementPacket(
  amount: number,
  locale: SupportedLanguage,
  synthConfig?: Partial<DualToneConfig>
): SoundboxAnnouncementPacket {
  const metadata = getSpeechMetadata(locale);
  const spokenAmount = convertNumberToSpokenWords(amount, locale);
  const announcementText = metadata.template.replace('{amount}', spokenAmount);
  const synthBuffers = generateWebAudioSynthBuffers(synthConfig);

  return {
    locale,
    amount,
    spokenAmount,
    announcementText,
    template: metadata.template,
    synthBuffers,
    metadata,
  };
}
