import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mic, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickInputProps {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  onVoice?: () => void;
  onUpload?: () => void;
  className?: string;
}

export function QuickInput({
  placeholder = "Ask AlignOS anything...",
  onSubmit,
  onVoice,
  onUpload,
  className,
}: QuickInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-xl border bg-card shadow-sm transition-all duration-200",
        isFocused && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        className
      )}
    >
      <div className="flex items-center gap-2 p-2">
        {/* AI indicator */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onVoice}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onUpload}
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-8 w-8"
            onClick={handleSubmit}
            disabled={!value.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
