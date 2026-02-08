import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Mic, MicOff, Upload, Sparkles, Loader2, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onVoice?: () => void;
  onUpload?: () => void;
  isRecording?: boolean;
  isTranscribing?: boolean;
  className?: string;
}

const placeholderTexts = [
  "Ask AlignOS anything...",
  "Search decisions, people, or projects...",
  "What changed this week?",
  "Find conflicts in the org...",
];

export function QuickInput({
  placeholder,
  value: controlledValue,
  onChange,
  onSubmit,
  onVoice,
  onUpload,
  isRecording = false,
  isTranscribing = false,
  className,
}: QuickInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  
  // Support both controlled and uncontrolled modes
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const setValue = (newValue: string) => {
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };
  const [isFocused, setIsFocused] = useState(false);

  // Cycle through placeholder texts
  useEffect(() => {
    if (placeholder) return; // Don't cycle if custom placeholder is provided
    
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, [placeholder]);

  const handleSubmit = () => {
    if (value.trim() && onSubmit) {
      onSubmit(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const currentPlaceholder = placeholder || placeholderTexts[placeholderIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "focus-glow relative rounded-2xl border border-border/50 bg-card shadow-soft-sm transition-all duration-200",
        isFocused && "border-primary/30 shadow-soft-md",
        className
      )}
    >
      <div className="flex items-center gap-3 p-3">
        {/* AI indicator with glow */}
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
          <div className={cn(
            "absolute inset-0 rounded-xl bg-primary/20 transition-opacity duration-300",
            isFocused ? "opacity-100" : "opacity-0"
          )} />
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
          </div>
        </div>

        {/* Input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={currentPlaceholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Keyboard shortcut hint */}
        {!isFocused && !value && (
          <div className="hidden items-center gap-1 rounded-md border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:flex">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg transition-all duration-200",
              isRecording 
                ? "text-destructive" 
                : "text-muted-foreground hover:text-foreground hover:scale-105"
            )}
            onClick={onVoice}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isRecording ? (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <MicOff className="h-4 w-4" />
              </motion.div>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105"
            onClick={onUpload}
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg transition-all duration-200",
              value.trim() ? "hover:scale-105" : ""
            )}
            onClick={handleSubmit}
            disabled={!value.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Loading indicator bar */}
      {isTranscribing && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute bottom-0 left-0 right-0 h-0.5 origin-left bg-gradient-to-r from-primary/50 via-primary to-primary/50"
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
