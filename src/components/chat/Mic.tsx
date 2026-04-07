"use client";

import { FaMicrophone, FaStop } from "react-icons/fa";
import { useSpeechRecognition } from "@/hooks/useMic";

interface MicButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function MicButton({ onTranscript, disabled = false }: MicButtonProps) {
  const { isListening, isSupported, start, stop, error } = useSpeechRecognition({
    onTranscript,
  });

  if (!isSupported) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isListening ? stop : start}
        disabled={disabled}
        title={
          error
            ? error
            : isListening
            ? "Stop recording"
            : "Transcribe speech"
        }
        className={`shrink-0 flex items-center justify-center w-9 h-9 mb-1.5 mr-1 rounded-lg transition-colors
          ${
            isListening
              ? "text-destructive hover:text-destructive/80 hover:bg-destructive/10 animate-pulse"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }
          disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label={isListening ? "Stop recording" : "Start voice input"}
      >
        {isListening ? (
          <FaStop className="size-3.5 sm:size-4" />
        ) : (
          <FaMicrophone className="size-3.5 sm:size-4" />
        )}
      </button>

      {/* Listening ring animation */}
      {isListening && (
        <span className="absolute inset-0 mb-1.5 mr-1 rounded-lg ring-2 ring-destructive/50 animate-ping pointer-events-none" />
      )}
    </div>
  );
}