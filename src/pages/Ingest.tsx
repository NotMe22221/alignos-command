import { useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
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

// Wrap motion components that need refs for AnimatePresence
const MotionDiv = forwardRef<HTMLDivElement, React.ComponentProps<typeof motion.div>>(
  (props, ref) => <motion.div ref={ref} {...props} />
);

type InputMode = "text" | "file" | "voice";
type ProcessingState = "idle" | "processing" | "complete" | "error" | "committing";

interface ExtractionResult {
  decisions: Array<{ title: string; description: string; rationale?: string }>;
  people: Array<{ name: string; role: string }>;
  projects: Array<{ name: string; description: string }>;
  suggested_stakeholders: string[];
  summary: string;
}

export default function Ingest() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<InputMode>("text");
  const [textContent, setTextContent] = useState("");
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; extracting: boolean } | null>(null);
  const [sourceType, setSourceType] = useState<"text" | "file" | "voice">("text");

  const { isRecording, isTranscribing, toggleRecording } = useVoiceRecording({
    onTranscriptionComplete: (text) => {
      setTextContent((prev) => prev ? `${prev}\n\n${text}` : text);
      setMode("text");
      setSourceType("voice");
      toast.success("Transcription complete!");
    },
    onError: (error) => {
      toast.error(`Transcription failed: ${error}`);
    },
  });

  const handleProcess = async () => {
    if (!textContent.trim()) return;
    
    setProcessingState("processing");
    
    try {
      const response = await supabase.functions.invoke("extract-entities", {
        body: { content: textContent },
      });

      if (response.error) {
        throw new Error(response.error.message || "Extraction failed");
      }

      if (!response.data) {
        throw new Error("No data returned from extraction");
      }

      setExtractionResult(response.data as ExtractionResult);
      setProcessingState("complete");
      toast.success("Extraction complete!");
    } catch (error) {
      console.error("Extraction error:", error);
      toast.error(`Extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      setProcessingState("error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 20MB.");
      return;
    }

    setUploadedFile({ name: file.name, extracting: true });
    setSourceType("file");

    try {
      if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const text = await file.text();
        setTextContent(text);
        setMode("text");
        setUploadedFile(null);
        toast.success(`Loaded ${file.name}`);
        return;
      }

      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-pdf`, {
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

      toast.error("Unsupported file type. Please upload a .txt, .md, or .pdf file.");
      setUploadedFile(null);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(`Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
      setUploadedFile(null);
    }
  };

  const handleCommit = async () => {
    if (!extractionResult) return;

    setProcessingState("committing");

    try {
      // 1. Save the source
      const { error: sourceError } = await supabase
        .from("sources")
        .insert({
          type: sourceType,
          raw_content: textContent,
          processed_content: extractionResult.summary,
        });

      if (sourceError) {
        console.error("Source save error:", sourceError);
      }

      // 2. Create persons (check for existing by name pattern)
      const personIds: string[] = [];
      for (const person of extractionResult.people) {
        // Generate email from name (simple pattern)
        const email = `${person.name.toLowerCase().replace(/\s+/g, ".")}@placeholder.com`;
        
        // Check if person exists
        const { data: existing } = await supabase
          .from("persons")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          personIds.push(existing.id);
        } else {
          const { data: newPerson, error: personError } = await supabase
            .from("persons")
            .insert({
              name: person.name,
              email,
              role: person.role,
            })
            .select("id")
            .single();

          if (personError) {
            console.error("Person save error:", personError);
          } else if (newPerson) {
            personIds.push(newPerson.id);
            
            // Log event
            await supabase.from("events").insert({
              entity_type: "person",
              entity_id: newPerson.id,
              event_type: "created",
              metadata: { name: person.name },
            });
          }
        }
      }

      // 3. Create projects (check for existing by name)
      for (const project of extractionResult.projects) {
        const { data: existing } = await supabase
          .from("projects")
          .select("id")
          .eq("name", project.name)
          .maybeSingle();

        if (!existing) {
          const { data: newProject, error: projectError } = await supabase
            .from("projects")
            .insert({
              name: project.name,
              description: project.description,
              status: "active",
            })
            .select("id")
            .single();

          if (projectError) {
            console.error("Project save error:", projectError);
          } else if (newProject) {
            await supabase.from("events").insert({
              entity_type: "project",
              entity_id: newProject.id,
              event_type: "created",
              metadata: { name: project.name },
            });
          }
        }
      }

      // 4. Create decisions with version 1
      let decisionsCreated = 0;
      for (const decision of extractionResult.decisions) {
        const { data: newDecision, error: decisionError } = await supabase
          .from("decisions")
          .insert({
            title: decision.title,
            description: decision.description,
            rationale: decision.rationale || null,
            status: "draft",
          })
          .select("id")
          .single();

        if (decisionError) {
          console.error("Decision save error:", decisionError);
        } else if (newDecision) {
          decisionsCreated++;

          // Create version 1
          await supabase.from("decision_versions").insert({
            decision_id: newDecision.id,
            version: 1,
            content: { title: decision.title, description: decision.description },
            change_summary: "Initial version",
          });

          // Log event
          await supabase.from("events").insert({
            entity_type: "decision",
            entity_id: newDecision.id,
            event_type: "created",
            metadata: { title: decision.title },
          });
        }
      }

      const peopleCreated = extractionResult.people.length;
      const projectsCreated = extractionResult.projects.length;

      toast.success(
        `Committed: ${decisionsCreated} decisions, ${peopleCreated} people, ${projectsCreated} projects`
      );

      // Reset and navigate to ledger
      setTextContent("");
      setExtractionResult(null);
      setProcessingState("idle");
      navigate("/ledger");
    } catch (error) {
      console.error("Commit error:", error);
      toast.error(`Failed to commit: ${error instanceof Error ? error.message : "Unknown error"}`);
      setProcessingState("complete");
    }
  };

  const handleReset = () => {
    setTextContent("");
    setExtractionResult(null);
    setProcessingState("idle");
    setSourceType("text");
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
            {/* Mode Selector with pill indicator */}
            <div className="inline-flex gap-1 rounded-xl border border-border/50 bg-muted/30 p-1">
              <Button
                variant={mode === "text" ? "default" : "ghost"}
                onClick={() => { setMode("text"); setSourceType("text"); }}
                className={cn(
                  "gap-2 rounded-lg transition-all",
                  mode === "text" ? "shadow-soft-xs" : "hover:bg-background/50"
                )}
              >
                <FileText className="h-4 w-4" />
                Text
              </Button>
              <Button
                variant={mode === "file" ? "default" : "ghost"}
                onClick={() => setMode("file")}
                className={cn(
                  "gap-2 rounded-lg transition-all",
                  mode === "file" ? "shadow-soft-xs" : "hover:bg-background/50"
                )}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button
                variant={mode === "voice" ? "default" : "ghost"}
                onClick={() => setMode("voice")}
                className={cn(
                  "gap-2 rounded-lg transition-all",
                  mode === "voice" ? "shadow-soft-xs" : "hover:bg-background/50"
                )}
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
                    className="min-h-[300px] resize-none rounded-xl border-border/50 focus-glow"
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
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/25">
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
                    <label className="group flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/25 transition-all hover:border-primary/50 hover:bg-muted/50">
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Upload className="mb-4 h-10 w-10 text-muted-foreground transition-colors group-hover:text-primary" />
                      </motion.div>
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
                  className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border/50 bg-muted/25"
                >
                  {/* Concentric rings */}
                  <div className="relative mb-6">
                    {isRecording && (
                      <>
                        <div className="absolute inset-0 -m-4 rounded-full border-2 border-destructive/20 ring-pulse" />
                        <div className="absolute inset-0 -m-4 rounded-full border-2 border-destructive/20 ring-pulse-delay-1" />
                      </>
                    )}
                    <button
                      onClick={toggleRecording}
                      disabled={isTranscribing}
                      className={cn(
                        "relative flex h-24 w-24 items-center justify-center rounded-full transition-all",
                        isTranscribing
                          ? "bg-muted text-muted-foreground"
                          : isRecording
                          ? "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25"
                          : "bg-primary text-primary-foreground shadow-soft-md hover:shadow-soft-lg hover:scale-105"
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
                  </div>
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
                disabled={!textContent.trim() || processingState === "processing" || processingState === "committing"}
                className="gap-2 rounded-xl shadow-soft-xs hover:shadow-soft-sm"
              >
                {processingState === "processing" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {processingState === "processing" ? "Processing..." : "Extract with AI"}
              </Button>
              {(textContent || extractionResult) && (
                <Button variant="ghost" onClick={handleReset} className="rounded-xl">
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
                {extractionResult.decisions.length > 0 && (
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
                          {decision.rationale && (
                            <p className="mt-2 text-xs text-muted-foreground/80 italic">
                              Rationale: {decision.rationale}
                            </p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* People */}
                {extractionResult.people.length > 0 && (
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
                )}

                {/* Projects */}
                {extractionResult.projects.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Projects Found ({extractionResult.projects.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {extractionResult.projects.map((project, i) => (
                          <Badge key={i} variant="outline">
                            {project.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Stakeholders */}
                {extractionResult.suggested_stakeholders.length > 0 && (
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
                )}

                {/* Commit Button */}
                <Button 
                  onClick={handleCommit} 
                  disabled={processingState === "committing"}
                  className="w-full gap-2"
                >
                  {processingState === "committing" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {processingState === "committing" ? "Saving..." : "Commit to Truth"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
