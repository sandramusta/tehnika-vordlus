import { AlertTriangle, CheckCircle, Star } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface MythData {
  id: string;
  myth: string;
  reality: string;
  advantage: string;
}

interface MythCardProps {
  myth: MythData;
  index: number;
}

export function MythCard({ myth, index }: MythCardProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={myth.id} className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive font-semibold text-sm">
              {index}
            </div>
            <span className="font-medium text-foreground">{myth.myth}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-5 pb-5 pt-2">
          <div className="space-y-4">
            {/* Tegelikkus - Reality */}
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/10">
                <CheckCircle className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-warning mb-1">
                  Tegelikkus
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {myth.reality}
                </p>
              </div>
            </div>

            {/* John Deere'i Eelis - Advantage */}
            <div className="flex items-start gap-3 rounded-lg bg-primary/10 p-4 border border-primary/20">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
                <Star className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">
                  John Deere'i Eelis
                </p>
                <p className="text-sm text-foreground leading-relaxed font-medium">
                  {myth.advantage}
                </p>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
