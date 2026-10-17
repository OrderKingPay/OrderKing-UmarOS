import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, Volume2, X, Sparkles, Globe } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  defaultLang?: "en-IN" | "hi-IN" | "bn-IN";
}

const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "English", nativeLabel: "English", icon: "🇬🇧" },
  { code: "hi-IN", label: "Hindi", nativeLabel: "हिन्दी", icon: "🇮🇳" },
  { code: "bn-IN", label: "Bengali", nativeLabel: "বাংলা", icon: "🇮🇳" },
] as const;

type LangCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export function VoiceSearchDialog({
  isOpen,
  onClose,
  onSearch,
  defaultLang = "en-IN",
}: VoiceSearchDialogProps) {
  const [selectedLang, setSelectedLang] = useState<LangCode>(defaultLang);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      setTranscript("");
      setErrorMessage(null);
      return;
    }

    startListening(selectedLang);

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [isOpen, selectedLang]);

  const startListening = (langCode: LangCode) => {
    setErrorMessage(null);
    setTranscript("");

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("Voice search is not supported in this browser. Try Chrome or Edge.");
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = langCode;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = final || interim;
        setTranscript(currentText);

        if (final) {
          setTimeout(() => {
            onSearch(final.trim());
            onClose();
          }, 400);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setErrorMessage("Microphone permission was denied. Please allow microphone access to search.");
        } else if (event.error === "no-speech") {
          setErrorMessage("No speech detected. Please tap mic and speak again.");
        } else {
          setErrorMessage(`Voice recognition failed (${event.error}). Try again.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setErrorMessage("Could not initialize microphone. Please check permissions.");
      setIsListening(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
    } else {
      startListening(selectedLang);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-amber-200/80 text-center space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close voice search"
          className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
            <Sparkles className="size-3 text-amber-600" />
            <span>OrderKing Voice AI</span>
          </div>
          <h3 className="text-xl font-black text-gray-900 tracking-tight">
            {isListening ? "Listening to your craving..." : "Tap to Speak"}
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Try saying <span className="font-bold text-amber-700">&quot;Chicken Biryani&quot;</span> or{" "}
            <span className="font-bold text-amber-700">&quot;Cold Coffee&quot;</span>
          </p>
        </div>

        {/* Language Selection Pills */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setSelectedLang(lang.code);
              }}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black transition-all border",
                selectedLang === lang.code
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm scale-105"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
              )}
            >
              <span>{lang.icon}</span>
              <span>{lang.nativeLabel}</span>
            </button>
          ))}
        </div>

        {/* Animated Pulse Ring Microphone Button */}
        <div className="relative flex items-center justify-center py-4">
          {isListening && (
            <>
              {/* Ripple 1 */}
              <span className="absolute inline-flex size-28 rounded-full bg-red-400 opacity-25 animate-ping" />
              {/* Ripple 2 */}
              <span className="absolute inline-flex size-24 rounded-full bg-amber-400 opacity-40 animate-pulse" />
            </>
          )}

          <button
            type="button"
            onClick={handleMicClick}
            aria-label={isListening ? "Stop listening" : "Start listening"}
            className={cn(
              "relative z-10 flex size-20 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 transform active:scale-95",
              isListening
                ? "bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 shadow-red-500/40 ring-4 ring-red-300 animate-pulse"
                : "bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 shadow-orange-500/30 hover:scale-105",
            )}
          >
            {isListening ? (
              <Mic className="size-9 animate-bounce" />
            ) : (
              <Mic className="size-9" />
            )}
          </button>
        </div>

        {/* Live Transcript Display */}
        <div className="min-h-14 flex items-center justify-center rounded-2xl bg-amber-50/70 border border-amber-100 px-4 py-2">
          {transcript ? (
            <p className="text-base font-extrabold text-gray-900 leading-snug">
              &ldquo;{transcript}&rdquo;
            </p>
          ) : errorMessage ? (
            <p className="text-xs font-semibold text-rose-600 leading-snug">
              {errorMessage}
            </p>
          ) : isListening ? (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
              <span className="size-2 rounded-full bg-red-500 animate-ping" />
              <span>Listening in {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.label}...</span>
            </div>
          ) : (
            <p className="text-xs text-gray-400 font-medium">Tap microphone to begin speaking</p>
          )}
        </div>

        {/* Action button if transcript captured */}
        {transcript && (
          <button
            type="button"
            onClick={() => {
              onSearch(transcript.trim());
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm shadow-md hover:from-emerald-700 hover:to-teal-700 transition"
          >
            Search for &ldquo;{transcript}&rdquo; →
          </button>
        )}
      </div>
    </div>
  );
}
