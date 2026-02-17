import { useEffect, useState } from "react";
import { Equipment } from "@/types/equipment";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Brochure {
  id: string;
  brochure_url: string;
  original_filename: string;
  extraction_status: string;
  applied_at: string | null;
  created_at: string;
}

interface EquipmentBrochuresListProps {
  equipment: Equipment;
}

export function EquipmentBrochuresList({ equipment }: EquipmentBrochuresListProps) {
  const [brochures, setBrochures] = useState<Brochure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBrochures = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("equipment_brochures")
          .select("*")
          .eq("equipment_id", equipment.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        // Deduplicate by filename — keep only the latest upload per filename
        const seen = new Map<string, Brochure>();
        for (const b of (data || [])) {
          if (!seen.has(b.original_filename)) {
            seen.set(b.original_filename, b);
          }
        }
        setBrochures(Array.from(seen.values()));
      } catch (error) {
        console.error("Failed to fetch brochures:", error);
        setBrochures([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrochures();
  }, [equipment.id]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Üleslaetud brošüürid</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Laen...
        </div>
      </div>
    );
  }

  if (brochures.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Üleslaetud brošüürid</Label>
        <p className="text-sm text-muted-foreground">
          Brošüüre pole üles laetud. Kasutage tabelis olevat brošüüri nuppu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Üleslaetud brošüürid ({brochures.length})</Label>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {brochures.map((brochure) => (
          <div
            key={brochure.id}
            className="flex items-center gap-3 p-2 rounded-md border border-border bg-muted/30"
          >
            <FileText className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={brochure.original_filename}>
                {brochure.original_filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(brochure.created_at).toLocaleDateString("et-EE")}
                {brochure.applied_at && (
                  <span className="text-primary ml-2">• Rakendatud</span>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              asChild
              title="Ava PDF"
            >
              <a href={brochure.brochure_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
