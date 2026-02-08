import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Mic,
  MicOff,
  Loader2,
  CheckCircle,
  X,
  Sparkles,
  File,
} from "lucide-react";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ExtractionResult } from "@/types/entities";

// Wrap motion components that need refs for AnimatePresence
const MotionDiv = forwardRef<HTMLDivElement, React.ComponentProps<typeof motion.div>>(
  (props, ref) => <motion.div ref={ref} {...props} />
);

type InputMode = "text" | "file" | "voice";
type ProcessingState = "idle" | "processing" | "complete" | "error";

// Mock extraction result
const mockExtractionResult: ExtractionResult = {
  decisions: [
    {
      title: "Migrate to new cloud provider by Q3",
      description: "Team agreed to complete AWS to GCP migration before end of Q3",
      status: "draft",
    },
    {
      title: "Freeze feature development during migration",
      description: "No new features until migration is complete",
      status: "draft",
    },
  ],
  people: [
    { name: "Sarah Chen", role: "Engineering Lead" },
    { name: "Marcus Johnson", role: "DevOps Manager" },
  ],
  projects: [
    { name: "Cloud Migration", status: "active" },
  ],
  relationships: [],
  suggested_stakeholders: ["Platform Team", "Security Team", "Finance"],
  conflicts: [],
  summary: "Meeting covered Q3 cloud migration timeline and feature freeze decision.",
};

export default function Ingest() {
  const [mode, setMode] = useState<InputMode>("text");
  const [textContent, setTextContent] = useState("");
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; extracting: boolean } | null>(null);

  const { isRecording, isTranscribing, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: (text) => {
      setTextContent((prev) => prev ? `${prev}\n\n${text}` : text);
      setMode("text");
      toast.success("Transcription complete!");
    },
    onError: (error) => {
      toast.error(`Transcription failed: ${error}`);
    },
  });

  const handleProcess = async () => {
    if (!textContent.trim()) return;
    
    setProcessingState("processing");
    
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setExtractionResult(mockExtractionResult);
    setProcessingState("complete");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 20MB.");
      return;
    }

    setUploadedFile({ name: file.name, extracting: true });

    try {
      // Handle text files directly
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text();
        setTextContent(text);
        setMode("text");
        setUploadedFile(null);
        toast.success(`Loaded ${file.name}`);
        return;
      }

      // Handle PDF files via edge function
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const formData = new FormData();
        formData.append("file", file);

        const { data: { publicUrl } } = supabase.storage.from("temp").getPublicUrl("dummy");
        const baseUrl = publicUrl.replace("/storage/v1/object/public/temp/dummy", "");
        
        const response = await fetch(`${baseUrl}/functions/v1/extract-pdf`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Extraction failed: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.text) {
          setTextContent(result.text);
          setMode("text");
          toast.success(`Extracted text from ${file.name}`);
        } else {
          throw new Error("No text could be extracted from the PDF");
        }
        
        setUploadedFile(null);
        return;
      }

      // Unsupported file type
      toast.error("Unsupported file type. Please upload a .txt, .md, or .pdf file.");
      setUploadedFile(null);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(`Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
      setUploadedFile(null);
    }
  };


  const handleCommit = () => {
    console.log("Committing to truth:", extractionResult);
    // TODO: Save to database
    setTextContent("");
    setExtractionResult(null);
    setProcessingState("idle");
  };

  const handleReset = () => {
    setTextContent("");
    setExtractionResult(null);
    setProcessingState("idle");
  };

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            Ingest Information
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add new information to the organizational truth
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Mode Selector */}
            <div className="flex gap-2">
              <Button
                variant={mode === "text" ? "default" : "outline"}
                onClick={() => setMode("text")}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Text
              </Button>
              <Button
                variant={mode === "file" ? "default" : "outline"}
                onClick={() => setMode("file")}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button
                variant={mode === "voice" ? "default" : "outline"}
                onClick={() => setMode("voice")}
                className="gap-2"
              >
                <Mic className="h-4 w-4" />
                Voice
              </Button>
            </div>

            {/* Input Area */}
            <AnimatePresence mode="wait">
              {mode === "text" && (
                <MotionDiv
                  key="text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Textarea
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Paste meeting notes, transcripts, or any text content..."
                    className="min-h-[300px] resize-none"
                  />
                </MotionDiv>
              )}

              {mode === "file" && (
                <MotionDiv
                  key="file"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {uploadedFile ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border bg-muted/25">
                      <div className="mb-4 flex items-center gap-3">
                        <File className="h-8 w-8 text-primary" />
                        <span className="font-medium">{uploadedFile.name}</span>
                      </div>
                      {uploadedFile.extracting && (
                        <>
                          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Extracting text from PDF...
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            This may take a moment for scanned documents
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <label className="flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/25 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50">
                      <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
                      <p className="mb-1 text-sm font-medium">
                        Drop files here or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports .txt, .md, and .pdf files (including scanned PDFs)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".txt,.md,.pdf"
                      />
                    </label>
                  )}
                </MotionDiv>
              )}

              {mode === "voice" && (
                <MotionDiv
                  key="voice"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border bg-muted/25"
                >
                  <button
                    onClick={toggleRecording}
                    disabled={isTranscribing}
                    className={cn(
                      "mb-6 flex h-24 w-24 items-center justify-center rounded-full transition-all",
                      isTranscribing
                        ? "bg-muted text-muted-foreground"
                        : isRecording
                        ? "animate-pulse bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {isTranscribing ? (
                      <Loader2 className="h-10 w-10 animate-spin" />
                    ) : isRecording ? (
                      <MicOff className="h-10 w-10" />
                    ) : (
                      <Mic className="h-10 w-10" />
                    )}
                  </button>
                  <p className="text-sm font-medium">
                    {isTranscribing
                      ? "Transcribing..."
                      : isRecording
                      ? "Recording... Click to stop"
                      : "Click to start recording"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isTranscribing
                      ? "Converting speech to text with Whisper"
                      : "Voice will be transcribed automatically"}
                  </p>
                </MotionDiv>
              )}
            </AnimatePresence>

            {/* Process Button */}
            <div className="flex gap-2">
              <Button
                onClick={handleProcess}
                disabled={!textContent.trim() || processingState === "processing"}
                className="gap-2"
              >
                {processingState === "processing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {processingState === "processing" ? "Processing..." : "Extract with AI"}
              </Button>
              {(textContent || extractionResult) && (
                <Button variant="ghost" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Extraction Results */}
          <AnimatePresence>
            {extractionResult && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Summary */}
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-update" />
                    <CardTitle className="text-base">Extraction Complete</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {extractionResult.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Decisions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Decisions Found ({extractionResult.decisions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {extractionResult.decisions.map((decision, i) => (
                      <div
                        key={i}
                        className="rounded-lg border bg-muted/25 p-3"
                      >
                        <p className="font-medium">{decision.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {decision.description}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* People */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      People Mentioned ({extractionResult.people.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {extractionResult.people.map((person, i) => (
                        <Badge key={i} variant="secondary">
                          {person.name} · {person.role}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Stakeholders */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Suggested Stakeholders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {extractionResult.suggested_stakeholders.map((s, i) => (
                        <Badge key={i} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Commit Button */}
                <Button onClick={handleCommit} className="w-full gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Commit to Truth
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
