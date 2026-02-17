import { useState, useRef } from "react";
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

export function BrochureUpload({ equipment, onExtractionComplete }: BrochureUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: "Vale failitüüp",
        description: "Palun vali PDF-fail",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 20MB)
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

      // Get public URL
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

      // Step 3: Read PDF content as text (using FileReader for basic text extraction)
      // Note: For complex PDFs, this would need a proper PDF parser
      const pdfContent = await readPdfAsText(file);

      // Step 4: Call edge function to extract specs
      const { data: extractionResult, error: extractionError } = await supabase.functions.invoke(
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

      if (extractionError) {
        throw new Error(`Andmete ekstraheerimine ebaõnnestus: ${extractionError.message}`);
      }

      if (!extractionResult?.success) {
        throw new Error(extractionResult?.error || "Tundmatu viga ekstraheerimise ajal");
      }

      setStatus("completed");
      
      // Merge extraction_metadata into the data for the review component
      const dataWithMeta: ExtractedData = {
        ...extractionResult.data,
        extraction_metadata: extractionResult.extraction_metadata || undefined,
      };
      onExtractionComplete(dataWithMeta);

      toast({
        title: "Andmed ekstraheeritud!",
        description: extractionResult.extraction_metadata?.target_model_found === false
          ? "Mudelit ei leitud otse brošüürist — kontrolli andmeid hoolikalt!"
          : "Vaata üle ja kinnita ekstraheeritud andmed.",
        variant: extractionResult.extraction_metadata?.target_model_found === false ? "destructive" : "default",
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

  // Simple PDF text extraction (for basic PDFs)
  // Note: This is a simplified approach - complex PDFs may need server-side processing
  const readPdfAsText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          
          // Extract text from PDF by looking for text streams
          // This is a simplified extraction - for full support, use a PDF library
          let text = "";
          const decoder = new TextDecoder("utf-8", { fatal: false });
          const content = decoder.decode(bytes);
          
          // Extract text between BT and ET markers (PDF text objects)
          const textMatches = content.match(/BT[\s\S]*?ET/g) || [];
          for (const match of textMatches) {
            // Extract text from Tj and TJ operators
            const tjMatches = match.match(/\((.*?)\)\s*Tj/g) || [];
            const textParts = tjMatches.map((m) => {
              const textMatch = m.match(/\((.*?)\)/);
              return textMatch ? textMatch[1] : "";
            });
            text += textParts.join(" ") + "\n";
          }

          // Also try to extract plain text content
          const plainTextMatches = content.match(/\/Contents\s*\(([\s\S]*?)\)/g) || [];
          for (const match of plainTextMatches) {
            const textMatch = match.match(/\(([\s\S]*?)\)/);
            if (textMatch) {
              text += textMatch[1] + "\n";
            }
          }

          // If we couldn't extract text, send raw content for AI to analyze
          if (text.trim().length < 100) {
            // Send a portion of the raw bytes for pattern matching
            text = content.substring(0, 50000);
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
        return "Ekstraheerin andmeid...";
      case "completed":
        return "Andmed ekstraheeritud!";
      case "error":
        return errorMessage;
      default:
        return selectedFile ? selectedFile.name : "PDF-brošüür pole valitud";
    }
  };

  return (
    <div className="space-y-3">
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
