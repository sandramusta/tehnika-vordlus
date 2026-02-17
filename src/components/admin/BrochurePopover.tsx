import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileText, ExternalLink, Trash2, Loader2, Plus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Equipment } from "@/types/equipment";

interface Brochure {
  id: string;
  brochure_url: string;
  original_filename: string;
  extraction_status: string;
  applied_at: string | null;
  created_at: string;
}

interface BrochurePopoverProps {
  equipment: Equipment;
  onUploadNew: (item: Equipment) => void;
}

export function BrochurePopover({ equipment, onUploadNew }: BrochurePopoverProps) {
  const [brochures, setBrochures] = useState<Brochure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasBrochures, setHasBrochures] = useState(false);

  // Quick check on mount for badge display
  useEffect(() => {
    const controller = new AbortController();
    supabase
      .from("equipment_brochures")
      .select("id", { count: "exact", head: true })
      .eq("equipment_id", equipment.id)
      .abortSignal(controller.signal)
      .then(({ count }) => {
        if (count !== null) setHasBrochures(count > 0);
      });
    return () => controller.abort();
  }, [equipment.id]);

  const fetchBrochures = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("equipment_brochures")
        .select("*")
        .eq("equipment_id", equipment.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Deduplicate by filename
      const seen = new Map<string, Brochure>();
      for (const b of data || []) {
        if (!seen.has(b.original_filename)) {
          seen.set(b.original_filename, b);
        }
      }
      const list = Array.from(seen.values());
      setBrochures(list);
      setHasBrochures(list.length > 0);
    } catch {
      setBrochures([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) fetchBrochures();
  };

  const handleDelete = async (brochure: Brochure) => {
    if (!confirm(`Kustutada "${brochure.original_filename}"?`)) return;
    setDeletingId(brochure.id);
    try {
      const { error } = await supabase
        .from("equipment_brochures")
        .delete()
        .eq("id", brochure.id);
      if (error) throw error;
      setBrochures((prev) => {
        const next = prev.filter((b) => b.id !== brochure.id);
        setHasBrochures(next.length > 0);
        return next;
      });
      toast.success("Brošüür kustutatud");
    } catch {
      toast.error("Kustutamine ebaõnnestus");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          onClick={(e) => e.stopPropagation()}
          title={hasBrochures ? "Brošüürid" : "Lae brošüür üles"}
        >
          <FileText className="h-4 w-4 text-primary" />
          {hasBrochures && (
            <CheckCircle2 className="h-3 w-3 text-green-500 absolute -top-0.5 -right-0.5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3"
        align="end"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Brošüürid</h4>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => {
                setIsOpen(false);
                onUploadNew(equipment);
              }}
            >
              <Plus className="h-3 w-3" />
              {hasBrochures ? "Lisa uus" : "Lae üles"}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : brochures.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">
              Brošüüre pole üles laetud
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {brochures.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2 p-2 rounded-md border border-border bg-muted/30 text-sm"
                >
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-xs" title={b.original_filename}>
                      {b.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString("et-EE")}
                      {b.applied_at && (
                        <span className="text-primary ml-1">• Rakendatud</span>
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" asChild>
                    <a href={b.brochure_url} target="_blank" rel="noopener noreferrer" title="Ava">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    disabled={deletingId === b.id}
                    onClick={() => handleDelete(b)}
                    title="Kustuta"
                  >
                    {deletingId === b.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 text-destructive" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
