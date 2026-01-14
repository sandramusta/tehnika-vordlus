import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  name: string;
  label: string;
  currentImageUrl?: string | null;
  onImageUploaded: (url: string) => void;
  folder?: string;
}

export function ImageUpload({
  name,
  label,
  currentImageUrl,
  onImageUploaded,
  folder = "equipment",
}: ImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Vale failitüüp",
        description: "Palun vali pildifail (jpg, png, gif, webp)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fail on liiga suur",
        description: "Maksimaalne faili suurus on 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("equipment-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("equipment-images")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      setPreview(publicUrl);
      onImageUploaded(publicUrl);

      toast({
        title: "Pilt üles laetud!",
        description: "Pilt on edukalt salvestatud.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Üleslaadimine ebaõnnestus",
        description: "Pildi üleslaadimine ebaõnnestus. Proovi uuesti.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input type="hidden" name={name} value={preview || ""} />
      
      {preview ? (
        <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="relative flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              <span className="mt-2 text-sm text-muted-foreground">Laen üles...</span>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="mt-2 text-sm text-muted-foreground">
                Kliki pildi valimiseks
              </span>
            </>
          )}
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
    </div>
  );
}
