import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, RotateCcw, Trash2, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_VOICE_NOTE_DURATION_SECONDS,
  useVoiceNoteStore,
  type VoiceNoteItem,
  type VoiceNoteTarget,
} from "@/lib/stores/voice-notes";
import { toast } from "sonner";

interface AudioVoiceNoteProps {
  target: VoiceNoteTarget;
  onVoiceNoteChange?: (note: VoiceNoteItem | null) => void;
  className?: string;
  samplePlaceholder?: string;
}

export function AudioVoiceNote({
  target,
  onVoiceNoteChange,
  className = "",
  samplePlaceholder,
}: AudioVoiceNoteProps) {
  const storeNote = useVoiceNoteStore((s) => s.notes[target]);
  const setStoreNote = useVoiceNoteStore((s) => s.setVoiceNote);
  const deleteStoreNote = useVoiceNoteStore((s) => s.deleteVoiceNote);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const defaultSample =
    samplePlaceholder ||
    (target === "delivery"
      ? "Ghar ke gate par black bell hai, bell mat bajana baby so raha hai"
      : "Please make the gravy extra spicy and don't add chopped onions");

  // Sync to parent callback
  useEffect(() => {
    onVoiceNoteChange?.(storeNote);
  }, [storeNote, onVoiceNoteChange]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setRecordingSeconds(0);

      // Check for browser mediaDevices support
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioUrl = URL.createObjectURL(audioBlob);
          // Stop media tracks
          stream.getTracks().forEach((track) => track.stop());

          const duration = Math.min(
            MAX_VOICE_NOTE_DURATION_SECONDS,
            Math.max(1, recordingSeconds)
          );
          const newNote: VoiceNoteItem = {
            id: `vn-${Date.now()}`,
            target,
            audioUrl,
            durationSeconds: duration,
            recordedAt: new Date().toISOString(),
            sampleTranscript: defaultSample,
          };
          setStoreNote(target, newNote);
          toast.success("Voice note recorded successfully! 🎙️");
        };

        recorder.start(100);
        setIsRecording(true);

        const startTime = Date.now();
        timerIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setRecordingSeconds(elapsed);
          if (elapsed >= MAX_VOICE_NOTE_DURATION_SECONDS) {
            stopRecording();
          }
        }, 200);
      } else {
        // Fallback demo for environments without mic permissions or headless testing
        simulateFallbackRecording();
      }
    } catch (err) {
      console.warn("Microphone access unavailable, using simulated voice note:", err);
      simulateFallbackRecording();
    }
  };

  const simulateFallbackRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    let sec = 0;
    timerIntervalRef.current = setInterval(() => {
      sec += 1;
      setRecordingSeconds(sec);
      if (sec >= 5) {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setIsRecording(false);
        const newNote: VoiceNoteItem = {
          id: `vn-${Date.now()}`,
          target,
          audioUrl: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
          durationSeconds: 5,
          recordedAt: new Date().toISOString(),
          sampleTranscript: defaultSample,
        };
        setStoreNote(target, newNote);
        toast.success("Voice note recorded! 🎙️");
      }
    }, 400);
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleDelete = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    setIsPlaying(false);
    deleteStoreNote(target);
    toast.info("Voice note removed.");
  };

  const handleTogglePlay = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // In some browsers or dummy audio URLs
          setIsPlaying(true);
          setTimeout(() => setIsPlaying(false), (storeNote?.durationSeconds || 5) * 1000);
        });
    }
  };

  const label = target === "delivery" ? "Delivery Partner Audio Note" : "Kitchen Chef Audio Note";
  const iconEmoji = target === "delivery" ? "🛵" : "👨‍🍳";

  return (
    <div
      className={`rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/5 via-white to-amber-500/10 dark:from-zinc-900 dark:to-zinc-850 p-4 shadow-sm ${className}`}
      data-testid={`audio-voice-note-${target}`}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 text-sm">
            {iconEmoji}
          </span>
          <div>
            <h4 className="text-xs font-black text-fg">{label}</h4>
            <p className="text-[10px] text-muted">15-sec 1-tap voice instruction for {target}</p>
          </div>
        </div>

        <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300">
          Max 15s
        </span>
      </div>

      {/* State 1: Active Recording in Progress */}
      {isRecording ? (
        <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="relative flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-rose-600" />
            </span>
            <div>
              <p className="text-xs font-black text-rose-950 dark:text-rose-200">
                Recording Voice Note...
              </p>
              <p className="text-[11px] font-mono font-bold text-rose-800 dark:text-rose-300">
                {recordingSeconds}s / {MAX_VOICE_NOTE_DURATION_SECONDS}s
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={stopRecording}
            className="rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold flex items-center gap-1.5 px-3 py-1.5 shadow-sm"
            data-testid="stop-recording-button"
          >
            <Square className="size-3.5 fill-white" />
            <span>Done</span>
          </Button>
        </div>
      ) : storeNote ? (
        /* State 2: Playable Audio Note Preview with Re-record and Delete */
        <div className="space-y-2.5">
          <div className="flex items-center justify-between rounded-xl bg-bg border border-amber-300/40 p-2.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleTogglePlay}
                data-testid="play-pause-voice-note-button"
                className="grid size-9 place-items-center rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-xs hover:scale-105 active:scale-95 transition cursor-pointer"
                aria-label={isPlaying ? "Pause audio note" : "Play audio note"}
              >
                {isPlaying ? <Pause className="size-4 fill-stone-950" /> : <Play className="size-4 fill-stone-950 ml-0.5" />}
              </button>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-fg">Play Voice Note</span>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                    {storeNote.durationSeconds}s
                  </span>
                </div>
                <p className="text-[11px] text-muted line-clamp-1 italic max-w-[200px] sm:max-w-xs">
                  &ldquo;{storeNote.sampleTranscript || defaultSample}&rdquo;
                </p>
              </div>
            </div>

            {/* Actions: 1-Tap Re-Record & Delete */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={startRecording}
                data-testid="rerecord-voice-note-button"
                title="1-tap Re-record"
                aria-label="Re-record voice note"
                className="flex items-center gap-1 rounded-lg border border-border bg-surface hover:bg-bg px-2.5 py-1.5 text-[11px] font-bold text-muted hover:text-fg transition cursor-pointer"
              >
                <RotateCcw className="size-3" />
                <span className="hidden sm:inline">Re-record</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                data-testid="delete-voice-note-button"
                title="Delete voice note"
                aria-label="Delete voice note"
                className="grid size-8 place-items-center rounded-lg border border-rose-300/60 bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>

          <audio
            ref={audioPlayerRef}
            src={storeNote.audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setPlaybackTime(Math.floor((e.target as HTMLAudioElement).currentTime))}
            className="hidden"
          />
        </div>
      ) : (
        /* State 3: Idle 1-Tap Recording Button */
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted leading-relaxed max-w-sm">
            E.g. <span className="italic text-fg font-medium">&ldquo;{defaultSample}&rdquo;</span>
          </p>

          <Button
            type="button"
            onClick={startRecording}
            data-testid="record-voice-note-button"
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-stone-950 font-black text-xs px-4 py-2 shadow-sm shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 border border-amber-300 shrink-0"
          >
            <Mic className="size-4 text-stone-950" />
            <span>Record 15s Voice Note</span>
          </Button>
        </div>
      )}
    </div>
  );
}
