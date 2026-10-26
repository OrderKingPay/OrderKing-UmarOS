import { create } from "zustand";

export const MAX_VOICE_NOTE_DURATION_SECONDS = 15;

export type VoiceNoteTarget = "delivery" | "kitchen";

export type VoiceNoteItem = {
  id: string;
  target: VoiceNoteTarget;
  audioUrl: string; // Object URL or base64 data URL
  durationSeconds: number;
  recordedAt: string;
  label?: string;
  transcript?: string;
  sampleTranscript?: string;
};

type VoiceNoteState = {
  notes: Record<VoiceNoteTarget, VoiceNoteItem | null>;
  setVoiceNote: (target: VoiceNoteTarget, item: VoiceNoteItem | null) => void;
  deleteVoiceNote: (target: VoiceNoteTarget) => void;
  clearAll: () => void;
  getFormattedNoteText: (target: VoiceNoteTarget) => string;
};

export const useVoiceNoteStore = create<VoiceNoteState>((set, get) => ({
  notes: {
    delivery: null,
    kitchen: null,
  },
  setVoiceNote: (target, item) => {
    // Enforce 15-second cap
    if (item && item.durationSeconds > MAX_VOICE_NOTE_DURATION_SECONDS) {
      item = { ...item, durationSeconds: MAX_VOICE_NOTE_DURATION_SECONDS };
    }
    set((state) => ({
      notes: {
        ...state.notes,
        [target]: item,
      },
    }));
  },
  deleteVoiceNote: (target) => {
    set((state) => ({
      notes: {
        ...state.notes,
        [target]: null,
      },
    }));
  },
  clearAll: () => {
    set({
      notes: {
        delivery: null,
        kitchen: null,
      },
    });
  },
  getFormattedNoteText: (target) => {
    const note = get().notes[target];
    if (!note) return "";
    const prefix = target === "delivery" ? "🛵 Delivery Voice Note" : "👨‍🍳 Kitchen Voice Note";
    const transcriptText = note.transcript || note.sampleTranscript;
    const transcript = transcriptText ? `: "${transcriptText}"` : "";
    return `[${prefix} (${note.durationSeconds}s)${transcript}]`;
  },
}));
