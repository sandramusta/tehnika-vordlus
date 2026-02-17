import { useState, useRef, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Equipment } from "@/types/equipment";

interface BrochureUploadProps {
  equipment: Equipment;
  onExtractionComplete: (extractedData: ExtractedData) => void;
}

export interface ExtractionMetadata {
  models_found: string[];
  target_model_found: boolean;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

export interface ExtractedData {
  equipment_columns: Record<string, unknown>;
  detailed_specs: Record<string, Record<string, unknown>>;
  extraction_metadata?: ExtractionMetadata;
}

type UploadStatus = "idle" | "uploading" | "extracting" | "completed" | "error";

export const BrochureUpload = forwardRef<HTMLDivElement, BrochureUploadProps>(
  function BrochureUpload({ equipment, onExtractionComplete }, ref) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<UploadStatus>("idle");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast({
          title: "Vale failitüüp",
          description: "Palun vali PDF-fail",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "Fail on liiga suur",
          description: "Maksimaalne faili suurus on 20MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setErrorMessage("");
      await processFile(file);
    };

    const processFile = async (file: File) => {
      setStatus("uploading");
      setErrorMessage("");

      try {
        // Step 1: Upload PDF to storage
        const fileExt = file.name.split(".").pop();
        const fileName = `brochures/${equipment.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("equipment-brochures")
          .upload(fileName, file);

        if (uploadError) throw new Error(`Üleslaadimine ebaõnnestus: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("equipment-brochures")
          .getPublicUrl(fileName);

        // Step 2: Create brochure record
        const { data: brochureRecord, error: insertError } = await supabase
          .from("equipment_brochures")
          .insert({
            equipment_id: equipment.id,
            brochure_url: urlData.publicUrl,
            original_filename: file.name,
            extraction_status: "processing",
          })
          .select()
          .single();

        if (insertError) throw new Error(`Kirje loomine ebaõnnestus: ${insertError.message}`);

        setStatus("extracting");

        // Step 3: Read PDF content as text
        const pdfContent = await readPdfAsText(file);

        // Step 4: Call edge function with 120s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000);

        let extractionResult: Record<string, unknown> | null = null;
        let extractionError: Error | null = null;

        try {
          const response = await supabase.functions.invoke(
            "extract-brochure-specs",
            {
              body: {
                brochure_id: brochureRecord.id,
                pdf_content: pdfContent,
                model_name: equipment.model_name,
                equipment_type: equipment.equipment_type?.name || "combine",
              },
            }
          );
          extractionResult = response.data;
          extractionError = response.error;
        } catch (err: unknown) {
          clearTimeout(timeoutId);
          if (err instanceof DOMException && err.name === "AbortError") {
            throw new Error("Ekstraheerimine aegus (2 min). Proovi väiksema PDF-iga.");
          }
          throw err;
        }
        clearTimeout(timeoutId);

        if (extractionError) {
          throw new Error(`Andmete ekstraheerimine ebaõnnestus: ${extractionError.message}`);
        }

        if (!extractionResult?.success) {
          throw new Error((extractionResult?.error as string) || "Tundmatu viga ekstraheerimise ajal");
        }

        setStatus("completed");

        const dataWithMeta: ExtractedData = {
          ...(extractionResult.data as { equipment_columns: Record<string, unknown>; detailed_specs: Record<string, Record<string, unknown>> }),
          extraction_metadata: (extractionResult.extraction_metadata as ExtractionMetadata) || undefined,
        };
        onExtractionComplete(dataWithMeta);

        toast({
          title: "Andmed ekstraheeritud!",
          description: (extractionResult.extraction_metadata as ExtractionMetadata | undefined)?.target_model_found === false
            ? "Mudelit ei leitud otse brošüürist — kontrolli andmeid hoolikalt!"
            : "Vaata üle ja kinnita ekstraheeritud andmed.",
          variant: (extractionResult.extraction_metadata as ExtractionMetadata | undefined)?.target_model_found === false ? "destructive" : "default",
        });
      } catch (error) {
        console.error("Brochure processing error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Tundmatu viga");

        toast({
          title: "Viga",
          description: error instanceof Error ? error.message : "Brošüüri töötlemine ebaõnnestus",
          variant: "destructive",
        });
      }
    };

    const readPdfAsText = async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer);
            const decoder = new TextDecoder("utf-8", { fatal: false });
            const content = decoder.decode(bytes);

            // Extract text from PDF text objects (BT...ET blocks)
            let text = "";
            const textMatches = content.match(/BT[\s\S]*?ET/g) || [];
            for (const match of textMatches) {
              const tjMatches = match.match(/\((.*?)\)\s*Tj/g) || [];
              const textParts = tjMatches.map((m) => {
                const textMatch = m.match(/\((.*?)\)/);
                return textMatch ? textMatch[1] : "";
              });
              text += textParts.join(" ") + "\n";
            }

            const plainTextMatches = content.match(/\/Contents\s*\(([\s\S]*?)\)/g) || [];
            for (const match of plainTextMatches) {
              const textMatch = match.match(/\(([\s\S]*?)\)/);
              if (textMatch) {
                text += textMatch[1] + "\n";
              }
            }

            // If we couldn't extract meaningful text, tell the AI honestly
            if (text.trim().length < 100) {
              text = `[PDF teksti ei õnnestunud kliendipoolselt ekstraheerida. Fail: ${file.name}, suurus: ${file.size} baiti. Palun kasuta brošüüri URL-i andmete saamiseks.]`;
            }

            resolve(text);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
    };

    const getStatusIcon = () => {
      switch (status) {
        case "uploading":
          return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
        case "extracting":
          return <Loader2 className="h-5 w-5 animate-spin text-amber-500" />;
        case "completed":
          return <Check className="h-5 w-5 text-green-500" />;
        case "error":
          return <AlertCircle className="h-5 w-5 text-destructive" />;
        default:
          return <FileText className="h-5 w-5 text-muted-foreground" />;
      }
    };

    const getStatusText = () => {
      switch (status) {
        case "uploading":
          return "Laen üles...";
        case "extracting":
          return "Ekstraheerin andmeid (kuni 2 min)...";
        case "completed":
          return "Andmed ekstraheeritud!";
        case "error":
          return errorMessage;
        default:
          return selectedFile ? selectedFile.name : "PDF-brošüür pole valitud";
      }
    };

    return (
      <div ref={ref} className="space-y-3">
        <Label>Ametlik PDF-brošüür</Label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={status === "uploading" || status === "extracting"}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Lae brošüür üles
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon()}
            <span className={status === "error" ? "text-destructive" : ""}>
              {getStatusText()}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Lae üles tootja ametlik PDF-brošüür. Süsteem ekstraheerib automaatselt tehnilised andmed vastavalt tabeliskeemile.
        </p>
      </div>
    );
  }
);
