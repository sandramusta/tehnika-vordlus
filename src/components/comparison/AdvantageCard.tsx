import { CompetitiveArgument, Brand } from "@/types/equipment";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { AlertTriangle, Lightbulb, TrendingUp, LucideIcon } from "lucide-react";

interface AdvantageCardProps {
  argument: CompetitiveArgument;
  competitorBrand?: Brand;
  isHighlighted?: boolean;
}

// Get icon by name from lucide-react
function getIconByName(iconName: string | null): LucideIcon {
  if (!iconName) return Lightbulb;
  
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const icon = icons[iconName];
  
  if (icon && typeof icon === 'function') {
    return icon;
  }
  
  return Lightbulb;
}

// Helper function to get brand-specific text color
function getBrandTextClass(brandName: string): string {
  switch (brandName) {
    case "Claas":
      return "text-claas";
    case "Case IH":
      return "text-case-ih";
    case "New Holland":
      return "text-new-holland";
    case "Fendt":
      return "text-fendt";
    default:
      return "text-muted-foreground";
  }
}

function getBrandBgClass(brandName: string): string {
  switch (brandName) {
    case "Claas":
      return "bg-claas/10";
    case "Case IH":
      return "bg-case-ih/10";
    case "New Holland":
      return "bg-new-holland/10";
    case "Fendt":
      return "bg-fendt/10";
    default:
      return "bg-muted";
  }
}

export function AdvantageCard({ argument, competitorBrand, isHighlighted = false }: AdvantageCardProps) {
  const Icon = getIconByName(argument.icon_name);
  
  // Fallback: if only argument_description exists, show it as solution
  const problemText = argument.problem_text;
  const solutionText = argument.solution_text || argument.argument_description;
  const benefitText = argument.benefit_text;

  return (
    <div 
      className={cn(
        "rounded-xl border bg-card p-5 transition-all hover:shadow-lg",
        isHighlighted ? "border-primary ring-2 ring-primary/20" : "border-border"
      )}
    >
      {/* Header with icon and competitor badge */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        {competitorBrand && (
          <span className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            getBrandBgClass(competitorBrand.name),
            getBrandTextClass(competitorBrand.name)
          )}>
            vs {competitorBrand.name}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="mb-4 text-lg font-semibold text-foreground">
        {argument.argument_title}
      </h4>

      {/* Problem-Solution-Benefit Structure */}
      <div className="space-y-3">
        {/* Problem */}
        {problemText && (
          <div className="flex items-start gap-3 rounded-lg bg-destructive/5 p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                Probleem
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                {problemText}
              </p>
            </div>
          </div>
        )}

        {/* Solution */}
        {solutionText && (
          <div className="flex items-start gap-3 rounded-lg bg-primary/5 p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                John Deere lahendus
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                {solutionText}
              </p>
            </div>
          </div>
        )}

        {/* Benefit */}
        {benefitText && (
          <div className="flex items-start gap-3 rounded-lg bg-success/10 p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/20">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-success">
                Kasu kliendile
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {benefitText}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}