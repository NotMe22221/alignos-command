import { useConversation } from "@elevenlabs/react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceAgentProps {
  className?: string;
  onMessage?: (message: string, isUser: boolean) => void;
}

export function VoiceAgent({ className, onMessage }: VoiceAgentProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs agent");
      setError(null);
    },
    onDisconnect: () => {
      console.log("Disconnected from agent");
    },
    onMessage: (message: unknown) => {
      console.log("Message:", message);
      const msg = message as { type?: string; user_transcription_event?: { user_transcript?: string }; agent_response_event?: { agent_response?: string } };
      if (msg.type === "user_transcript") {
        onMessage?.(msg.user_transcription_event?.user_transcript || "", true);
      } else if (msg.type === "agent_response") {
        onMessage?.(msg.agent_response_event?.agent_response || "", false);
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      setError("Connection error occurred");
    },
  });

  const startConversation = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-conversation-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to get conversation token");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.signed_url) {
        throw new Error("No signed URL received");
      }

      // Start the conversation with WebSocket
      await conversation.startSession({
        signedUrl: data.signed_url,
      });
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const isConnected = conversation.status === "connected";
  const isSpeaking = conversation.isSpeaking;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative flex flex-col items-center gap-6 rounded-2xl border bg-card p-8",
        className
      )}
    >
      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            isConnected
              ? isSpeaking
                ? "animate-pulse bg-primary"
                : "bg-success"
              : "bg-muted"
          )}
        />
        <span>
          {isConnecting
            ? "Connecting..."
            : isConnected
            ? isSpeaking
              ? "Agent speaking..."
              : "Listening..."
            : "Ready to connect"}
        </span>
      </div>

      {/* Visual feedback ring */}
      <div className="relative">
        <AnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: isSpeaking ? [1, 1.2, 1] : 1,
                opacity: 1,
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                scale: {
                  duration: 0.6,
                  repeat: isSpeaking ? Infinity : 0,
                  ease: "easeInOut",
                },
              }}
              className="absolute inset-0 -m-4 rounded-full bg-primary/20"
            />
          )}
        </AnimatePresence>

        <motion.div
          animate={{
            scale: isConnected ? (isSpeaking ? 1.05 : 1) : 1,
          }}
          className={cn(
            "relative flex h-24 w-24 items-center justify-center rounded-full transition-colors",
            isConnected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isConnecting ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isConnected ? (
            isSpeaking ? (
              <Volume2 className="h-10 w-10" />
            ) : (
              <Mic className="h-10 w-10" />
            )
          ) : (
            <MicOff className="h-10 w-10" />
          )}
        </motion.div>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Action button */}
      <Button
        size="lg"
        variant={isConnected ? "destructive" : "default"}
        onClick={isConnected ? stopConversation : startConversation}
        disabled={isConnecting}
        className="gap-2"
      >
        {isConnected ? (
          <>
            <PhoneOff className="h-4 w-4" />
            End Conversation
          </>
        ) : (
          <>
            <Phone className="h-4 w-4" />
            {isConnecting ? "Connecting..." : "Start Conversation"}
          </>
        )}
      </Button>

      {/* Helper text */}
      <p className="max-w-xs text-center text-xs text-muted-foreground">
        {isConnected
          ? "Speak naturally. The AI agent will respond in real-time."
          : "Click to start a voice conversation with the AI assistant."}
      </p>
    </motion.div>
  );
}
