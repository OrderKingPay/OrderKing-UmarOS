import { describe, it, expect } from 'vitest';
import {
  SOUNDBOX_TONE_D5_HZ,
  SOUNDBOX_TONE_A5_HZ,
  D5_FREQUENCY,
  A5_FREQUENCY,
  DEFAULT_CHIME_DURATION_SEC,
  DEFAULT_SAMPLE_RATE,
  DEFAULT_ATTACK_TIME_SEC,
  DEFAULT_DECAY_TIME_CONSTANT,
  DEFAULT_PEAK_GAIN,
  calculateDualToneFrequencies,
  calculateExponentialDecay,
  generateExponentialDecayEnvelope,
  generateDualTonePcmBuffer,
  generateWebAudioSynthBuffers,
  MULTILINGUAL_SPEECH_METADATA,
  getSpeechMetadata,
  listSupportedLanguages,
  convertNumberToSpokenWords,
  amountToSpokenWords,
  numberToSpokenText,
  generateSoundboxVoiceAnnouncement,
  generateSoundboxSpokenText,
  formatSoundboxSpeech,
  generateSoundboxAnnouncementPacket,
  type SupportedLanguage,
} from './soundbox-dsp.ts';

describe('UMAR OS & KingPay Soundbox Audio DSP & Multilingual Media Engine', () => {
  // ==========================================================================
  // 1. DUAL-TONE FREQUENCY & DSP CALCULATIONS
  // ==========================================================================
  describe('1. Dual-tone Frequency Calculation (D5: 587.33 Hz, A5: 880.00 Hz)', () => {
    it('defines exact soundbox alert frequencies for D5 and A5', () => {
      expect(SOUNDBOX_TONE_D5_HZ).toBe(587.33);
      expect(SOUNDBOX_TONE_A5_HZ).toBe(880.00);
      expect(D5_FREQUENCY).toBe(587.33);
      expect(A5_FREQUENCY).toBe(880.00);
    });

    it('calculates acoustic harmonic relationship as a musical perfect fifth', () => {
      const calc = calculateDualToneFrequencies();

      expect(calc.d5).toBe(587.33);
      expect(calc.a5).toBe(880.0);
      expect(calc.frequencyD5).toBe(587.33);
      expect(calc.frequencyA5).toBe(880.0);

      // Acoustic interval ratio = 880.00 / 587.33 ≈ 1.4983 (3:2 perfect fifth)
      expect(calc.intervalRatio).toBeCloseTo(1.4983, 3);
      // Semitone distance = 12 * log2(1.4983) = 7 semitones (musical 5th)
      expect(calc.semitoneDistance).toBe(7);

      // Period calculations (T = 1/f)
      expect(calc.periodD5Sec).toBeCloseTo(0.0017026, 6);
      expect(calc.periodA5Sec).toBeCloseTo(0.0011364, 6);
    });
  });

  // ==========================================================================
  // 2. EXPONENTIAL DECAY ENVELOPE CORRECTNESS
  // ==========================================================================
  describe('2. Exponential Decay Envelope & Web Audio Parameter Buffers', () => {
    it('computes instantaneous exponential envelope curve accurately', () => {
      const initialGain = 0.8;
      const tau = 0.15; // 150ms decay time constant
      const attackSec = 0.015; // 15ms attack

      // At t <= 0, gain is 0
      expect(calculateExponentialDecay(0, initialGain, tau, attackSec)).toBe(0);

      // Mid-attack phase (linear rise)
      const midAttack = calculateExponentialDecay(
        0.0075,
        initialGain,
        tau,
        attackSec
      );
      expect(midAttack).toBeCloseTo(0.4, 2);

      // Peak at end of attack
      const peak = calculateExponentialDecay(
        attackSec,
        initialGain,
        tau,
        attackSec
      );
      expect(peak).toBeCloseTo(initialGain, 4);

      // Exactly 1 time constant (tau) after attack, value must be peak / e ≈ 0.8 / 2.71828 ≈ 0.2943
      const oneTauAfterAttack = calculateExponentialDecay(
        attackSec + tau,
        initialGain,
        tau,
        attackSec
      );
      expect(oneTauAfterAttack).toBeCloseTo(initialGain / Math.E, 3);

      // 3 time constants after attack: value must decay below 5% of peak
      const threeTau = calculateExponentialDecay(
        attackSec + 3 * tau,
        initialGain,
        tau,
        attackSec
      );
      expect(threeTau).toBeLessThan(initialGain * 0.05);
    });

    it('generates Web Audio API setValueCurveAtTime parameter buffer', () => {
      const curve = generateExponentialDecayEnvelope({
        durationSec: 0.6,
        sampleCount: 512,
        initialGain: 0.8,
        attackTimeSec: 0.015,
        decayTimeConstant: 0.15,
      });

      expect(curve).toBeInstanceOf(Float32Array);
      expect(curve.length).toBe(512);

      // Starts near zero or small initial value (handling Float32 precision)
      expect(curve[0]).toBeCloseTo(0.0001, 4);

      // Reaches peak around attack index (15ms / 600ms * 512 ≈ index 12-13)
      const maxVal = Math.max(...Array.from(curve));
      expect(maxVal).toBeCloseTo(0.8, 2);

      // Strictly decays toward tail
      const tailVal = curve[curve.length - 1];
      expect(tailVal).toBeLessThan(0.05);
      expect(tailVal).toBeGreaterThanOrEqual(0.0001);
    });

    it('generates dual-tone PCM audio buffer at standard hardware sample rate', () => {
      const durationSec = 0.6;
      const sampleRate = 44100;
      const pcm = generateDualTonePcmBuffer({
        durationSec,
        sampleRate,
        peakGain: 0.8,
      });

      expect(pcm).toBeInstanceOf(Float32Array);
      const expectedLength = Math.floor(sampleRate * durationSec);
      expect(pcm.length).toBe(expectedLength);

      // Verify no digital clipping occurs (-1.0 <= sample <= 1.0)
      for (let i = 0; i < pcm.length; i += 100) {
        expect(pcm[i]).toBeGreaterThanOrEqual(-1.0);
        expect(pcm[i]).toBeLessThanOrEqual(1.0);
      }

      // Verify presence of energy in audio buffer
      let energy = 0;
      for (let i = 0; i < pcm.length; i++) {
        energy += pcm[i] * pcm[i];
      }
      expect(energy).toBeGreaterThan(100);
    });

    it('generates sequential chime mode without errors', () => {
      const pcmSeq = generateDualTonePcmBuffer({
        durationSec: 0.4,
        sampleRate: 22050,
        mode: 'sequential',
      });

      expect(pcmSeq).toBeInstanceOf(Float32Array);
      expect(pcmSeq.length).toBe(Math.floor(22050 * 0.4));
    });

    it('creates complete Web Audio synthesis parameter packet with node schedules', () => {
      const synth = generateWebAudioSynthBuffers({
        durationSec: DEFAULT_CHIME_DURATION_SEC,
        sampleRate: DEFAULT_SAMPLE_RATE,
        peakGain: DEFAULT_PEAK_GAIN,
      });

      expect(synth.sampleRate).toBe(44100);
      expect(synth.durationSec).toBe(0.6);
      expect(synth.frequencies.d5).toBe(587.33);
      expect(synth.frequencies.a5).toBe(880.0);
      expect(synth.envelopeCurve).toBeInstanceOf(Float32Array);
      expect(synth.pcmBuffer).toBeInstanceOf(Float32Array);
      expect(synth.channelData).toBe(synth.pcmBuffer);

      // Web Audio schedule parameters
      expect(synth.webAudioSchedule.oscillator1.frequency).toBe(587.33);
      expect(synth.webAudioSchedule.oscillator2.frequency).toBe(880.0);
      expect(synth.webAudioSchedule.gainNode.curve.length).toBe(512);
      expect(synth.webAudioSchedule.gainNode.duration).toBe(0.6);
    });
  });

  // ==========================================================================
  // 3. MULTILINGUAL SPEECH SYNTHESIZER METADATA
  // ==========================================================================
  describe('3. Multilingual Speech Synthesizer Metadata (4 Languages)', () => {
    it('verifies metadata and templates for English (en-IN)', () => {
      const meta = getSpeechMetadata('en-IN');
      expect(meta.locale).toBe('en-IN');
      expect(meta.currencyName).toBe('rupees');
      expect(meta.template).toBe('KingPay: Received {amount} rupees.');
      expect(meta.voiceProfile.gender).toBe('FEMALE');
    });

    it('verifies metadata and templates for Hindi (hi-IN)', () => {
      const meta = getSpeechMetadata('hi-IN');
      expect(meta.locale).toBe('hi-IN');
      expect(meta.currencyName).toBe('रुपये');
      expect(meta.template).toBe('किंगपे पर {amount} रुपये प्राप्त हुए।');
      expect(meta.voiceProfile.gender).toBe('FEMALE');
    });

    it('verifies metadata and templates for Bengali (bn-IN)', () => {
      const meta = getSpeechMetadata('bn-IN');
      expect(meta.locale).toBe('bn-IN');
      expect(meta.currencyName).toBe('টাকা');
      expect(meta.template).toBe('কিংপে-তে {amount} টাকা প্রাপ্ত হলো।');
      expect(meta.voiceProfile.gender).toBe('FEMALE');
    });

    it('verifies metadata and templates for Assamese (as-IN)', () => {
      const meta = getSpeechMetadata('as-IN');
      expect(meta.locale).toBe('as-IN');
      expect(meta.currencyName).toBe('টকা');
      expect(meta.template).toBe("কিংপেত {amount} টকা লাভ কৰা হ'ল।");
      expect(meta.voiceProfile.gender).toBe('FEMALE');
    });

    it('lists all 4 supported soundbox languages', () => {
      const langs = listSupportedLanguages();
      expect(langs).toEqual(['en-IN', 'hi-IN', 'bn-IN', 'as-IN']);
      expect(Object.keys(MULTILINGUAL_SPEECH_METADATA)).toEqual([
        'en-IN',
        'hi-IN',
        'bn-IN',
        'as-IN',
      ]);
    });

    it('throws error when querying unsupported locale', () => {
      expect(() => getSpeechMetadata('es-ES' as any)).toThrow(
        'Unsupported soundbox locale'
      );
    });
  });

  // ==========================================================================
  // 4. NUMBER AMOUNTS TO SPOKEN LOCALIZED TEXT
  // ==========================================================================
  describe('4. Number-to-Words Conversion (e.g. 250, 1500) Across All 4 Languages', () => {
    describe('English (en-IN)', () => {
      it('converts 250 into spoken English', () => {
        expect(convertNumberToSpokenWords(250, 'en-IN')).toBe(
          'two hundred fifty'
        );
      });

      it('converts 1500 into spoken English', () => {
        expect(convertNumberToSpokenWords(1500, 'en-IN')).toBe(
          'one thousand five hundred'
        );
      });

      it('converts single digits, teens, hundreds, lakhs and crores', () => {
        expect(convertNumberToSpokenWords(0, 'en-IN')).toBe('zero');
        expect(convertNumberToSpokenWords(1, 'en-IN')).toBe('one');
        expect(convertNumberToSpokenWords(10, 'en-IN')).toBe('ten');
        expect(convertNumberToSpokenWords(15, 'en-IN')).toBe('fifteen');
        expect(convertNumberToSpokenWords(99, 'en-IN')).toBe('ninety nine');
        expect(convertNumberToSpokenWords(100, 'en-IN')).toBe('one hundred');
        expect(convertNumberToSpokenWords(100000, 'en-IN')).toBe('one lakh');
        expect(convertNumberToSpokenWords(10000000, 'en-IN')).toBe('one crore');
      });
    });

    describe('Hindi (hi-IN)', () => {
      it('converts 250 into spoken Hindi', () => {
        expect(convertNumberToSpokenWords(250, 'hi-IN')).toBe('दो सौ पचास');
      });

      it('converts 1500 into spoken Hindi', () => {
        expect(convertNumberToSpokenWords(1500, 'hi-IN')).toBe(
          'एक हजार पांच सौ'
        );
      });

      it('converts basic, intermediate, and large values in Hindi', () => {
        expect(convertNumberToSpokenWords(0, 'hi-IN')).toBe('शून्य');
        expect(convertNumberToSpokenWords(1, 'hi-IN')).toBe('एक');
        expect(convertNumberToSpokenWords(5, 'hi-IN')).toBe('पांच');
        expect(convertNumberToSpokenWords(10, 'hi-IN')).toBe('दस');
        expect(convertNumberToSpokenWords(25, 'hi-IN')).toBe('पच्चीस');
        expect(convertNumberToSpokenWords(100, 'hi-IN')).toBe('एक सौ');
        expect(convertNumberToSpokenWords(100000, 'hi-IN')).toBe('एक लाख');
        expect(convertNumberToSpokenWords(10000000, 'hi-IN')).toBe('एक करोड़');
      });
    });

    describe('Bengali (bn-IN)', () => {
      it('converts 250 into spoken Bengali', () => {
        expect(convertNumberToSpokenWords(250, 'bn-IN')).toBe('দুই শত পঞ্চাশ');
      });

      it('converts 1500 into spoken Bengali', () => {
        expect(convertNumberToSpokenWords(1500, 'bn-IN')).toBe(
          'এক হাজার পাঁচ শত'
        );
      });

      it('converts basic, intermediate, and large values in Bengali', () => {
        expect(convertNumberToSpokenWords(0, 'bn-IN')).toBe('শূন্য');
        expect(convertNumberToSpokenWords(1, 'bn-IN')).toBe('এক');
        expect(convertNumberToSpokenWords(5, 'bn-IN')).toBe('পাঁচ');
        expect(convertNumberToSpokenWords(10, 'bn-IN')).toBe('দশ');
        expect(convertNumberToSpokenWords(20, 'bn-IN')).toBe('বিশ');
        expect(convertNumberToSpokenWords(100, 'bn-IN')).toBe('এক শত');
        expect(convertNumberToSpokenWords(100000, 'bn-IN')).toBe('এক লাখ');
        expect(convertNumberToSpokenWords(10000000, 'bn-IN')).toBe('এক কোটি');
      });
    });

    describe('Assamese (as-IN)', () => {
      it('converts 250 into spoken Assamese', () => {
        expect(convertNumberToSpokenWords(250, 'as-IN')).toBe('দুই শত পঞ্চাশ');
      });

      it('converts 1500 into spoken Assamese with authentic letter Ra (ৰ)', () => {
        expect(convertNumberToSpokenWords(1500, 'as-IN')).toBe(
          'এক হাজাৰ পাঁচ শত'
        );
      });

      it('converts basic, intermediate, and large values in Assamese with proper phonemes', () => {
        expect(convertNumberToSpokenWords(0, 'as-IN')).toBe('শূন্য');
        expect(convertNumberToSpokenWords(1, 'as-IN')).toBe('এক');
        expect(convertNumberToSpokenWords(3, 'as-IN')).toBe('তিনি'); // তিনি in Assamese vs তিন in Bengali
        expect(convertNumberToSpokenWords(4, 'as-IN')).toBe('চাৰি'); // চাৰি with ৰ in Assamese vs চার in Bengali
        expect(convertNumberToSpokenWords(8, 'as-IN')).toBe('আঠ'); // আঠ with ঠ in Assamese vs আট in Bengali
        expect(convertNumberToSpokenWords(10, 'as-IN')).toBe('দহ'); // দহ in Assamese vs দশ in Bengali
        expect(convertNumberToSpokenWords(100, 'as-IN')).toBe('এক শত');
        expect(convertNumberToSpokenWords(100000, 'as-IN')).toBe('এক লাখ');
        expect(convertNumberToSpokenWords(10000000, 'as-IN')).toBe('এক কোটি');
      });
    });
  });

  // ==========================================================================
  // 5. ACCURATE LOCALIZATION OF AMOUNTS IN COMPLETE ANNOUNCEMENTS
  // ==========================================================================
  describe('5. Full Soundbox Voice Announcements (250 and 1500)', () => {
    it('generates accurate spoken announcements for ₹250 in all 4 languages', () => {
      // English: 'KingPay: Received {amount} rupees.'
      expect(generateSoundboxVoiceAnnouncement(250, 'en-IN')).toBe(
        'KingPay: Received two hundred fifty rupees.'
      );

      // Hindi: 'किंगपे पर {amount} रुपये प्राप्त हुए।'
      expect(generateSoundboxVoiceAnnouncement(250, 'hi-IN')).toBe(
        'किंगपे पर दो सौ पचास रुपये प्राप्त हुए।'
      );

      // Bengali: 'কিংপে-তে {amount} টাকা প্রাপ্ত হলো।'
      expect(generateSoundboxVoiceAnnouncement(250, 'bn-IN')).toBe(
        'কিংপে-তে দুই শত পঞ্চাশ টাকা প্রাপ্ত হলো।'
      );

      // Assamese: "কিংপেত {amount} টকা লাভ কৰা হ'ল।"
      expect(generateSoundboxVoiceAnnouncement(250, 'as-IN')).toBe(
        "কিংপেত দুই শত পঞ্চাশ টকা লাভ কৰা হ'ল।"
      );
    });

    it('generates accurate spoken announcements for ₹1500 in all 4 languages', () => {
      // English: 'KingPay: Received {amount} rupees.'
      expect(generateSoundboxVoiceAnnouncement(1500, 'en-IN')).toBe(
        'KingPay: Received one thousand five hundred rupees.'
      );

      // Hindi: 'किंगपे पर {amount} रुपये प्राप्त हुए।'
      expect(generateSoundboxVoiceAnnouncement(1500, 'hi-IN')).toBe(
        'किंगपे पर एक हजार पांच सौ रुपये प्राप्त हुए।'
      );

      // Bengali: 'কিংপে-তে {amount} টাকা প্রাপ্ত হলো।'
      expect(generateSoundboxVoiceAnnouncement(1500, 'bn-IN')).toBe(
        'কিংপে-তে এক হাজার পাঁচ শত টাকা প্রাপ্ত হলো।'
      );

      // Assamese: "কিংপেত {amount} টকা লাভ কৰা হ'ল।"
      expect(generateSoundboxVoiceAnnouncement(1500, 'as-IN')).toBe(
        "কিংপেত এক হাজাৰ পাঁচ শত টকা লাভ কৰা হ'ল।"
      );
    });

    it('supports numeric formatting mode without words when specified', () => {
      expect(
        generateSoundboxVoiceAnnouncement(250, 'en-IN', { useWords: false })
      ).toBe('KingPay: Received 250 rupees.');

      expect(
        generateSoundboxVoiceAnnouncement(1500, 'hi-IN', { useWords: false })
      ).toBe('किंगपे पर 1500 रुपये प्राप्त हुए।');
    });

    it('verifies exported aliases work identically', () => {
      expect(amountToSpokenWords(250, 'en-IN')).toBe('two hundred fifty');
      expect(numberToSpokenText(250, 'en-IN')).toBe('two hundred fifty');
      expect(generateSoundboxSpokenText(250, 'en-IN')).toBe(
        'KingPay: Received two hundred fifty rupees.'
      );
      expect(formatSoundboxSpeech(250, 'en-IN')).toBe(
        'KingPay: Received two hundred fifty rupees.'
      );
    });
  });

  // ==========================================================================
  // 6. MULTIMODAL SOUNDBOX ANNOUNCEMENT PACKET INTEGRATION
  // ==========================================================================
  describe('6. Multimodal Soundbox Announcement Packet Dispatch', () => {
    it('creates cohesive payload bundling DSP chime buffers and localized announcement', () => {
      const packet = generateSoundboxAnnouncementPacket(250, 'bn-IN', {
        durationSec: 0.5,
      });

      expect(packet.amount).toBe(250);
      expect(packet.locale).toBe('bn-IN');
      expect(packet.spokenAmount).toBe('দুই শত পঞ্চাশ');
      expect(packet.announcementText).toBe(
        'কিংপে-তে দুই শত পঞ্চাশ টাকা প্রাপ্ত হলো।'
      );
      expect(packet.template).toBe('কিংপে-তে {amount} টাকা প্রাপ্ত হলো।');

      // DSP synthesis buffers attached
      expect(packet.synthBuffers.frequencies.d5).toBe(587.33);
      expect(packet.synthBuffers.frequencies.a5).toBe(880.0);
      expect(packet.synthBuffers.durationSec).toBe(0.5);
      expect(packet.synthBuffers.pcmBuffer).toBeInstanceOf(Float32Array);
      expect(packet.synthBuffers.envelopeCurve).toBeInstanceOf(Float32Array);

      // Speech metadata attached
      expect(packet.metadata.currencyName).toBe('টাকা');
      expect(packet.metadata.voiceProfile.gender).toBe('FEMALE');
    });

    it('creates cohesive payload for Assamese ₹1500 transaction', () => {
      const packet = generateSoundboxAnnouncementPacket(1500, 'as-IN');

      expect(packet.amount).toBe(1500);
      expect(packet.locale).toBe('as-IN');
      expect(packet.spokenAmount).toBe('এক হাজাৰ পাঁচ শত');
      expect(packet.announcementText).toBe(
        "কিংপেত এক হাজাৰ পাঁচ শত টকা লাভ কৰা হ'ল।"
      );
      expect(packet.metadata.currencyName).toBe('টকা');
    });
  });
});
