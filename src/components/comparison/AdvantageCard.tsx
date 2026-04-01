import { CompetitiveArgument } from "@/types/equipment";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { AlertTriangle, Lightbulb, TrendingUp, LucideIcon } from "lucide-react";
import { getBrandBgClass } from "@/lib/brandColors";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface AdvantageCardProps {
  argument: CompetitiveArgument;
  competitorBrandName?: string;
  primaryBrandName?: string;
}

// Get icon by name from lucide-react
function getIconByName(iconName: string | null): LucideIcon {
  if (!iconName) return Lightbulb;

  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  const icon = icons[iconName];

  if (icon && typeof icon === "function") {
    return icon;
  }

  return Lightbulb;
}

export function AdvantageCard({ argument, competitorBrandName, primaryBrandName = "John Deere" }: AdvantageCardProps) {
  const { t } = useTranslation();
  const Icon = getIconByName(argument.icon_name);

  // Fallback: if only argument_description exists, show it as solution
  const problemText = argument.problem_text;
  const solutionText = argument.solution_text || argument.argument_description;
  const benefitText = argument.benefit_text;

  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg shadow-sm"
      )}
    >
      {/* Brand badge in top-right corner */}
      {competitorBrandName && (
        <div className="absolute top-3 right-3">
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-md",
            getBrandBgClass(competitorBrandName)
          )}>
            vs {competitorBrandName}
          </span>
        </div>
      )}

      {/* Category badge */}
      <Badge variant="secondary" className="mb-3">
        {t(`advantage.category.${argument.category}`, { defaultValue: argument.category })}
      </Badge>

      {/* Header with icon */}
      <div className="mb-4 flex items-center gap-3 pr-16">
        <h4 className="text-base font-semibold text-foreground leading-tight">
          {argument.argument_title}
        </h4>
      </div>

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
                {t("advantage.problem")}
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
                {t("advantage.solution", { brand: primaryBrandName })}
              </p>
              <p className="mt-0.5 text-sm text-foreground">
                {solutionText}
              </p>
            </div>
          </div>
        )}

        {/* Benefit */}
        {benefitText && (
          <div className="flex items-start gap-3 rounded-lg bg-primary/10 p-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                {t("advantage.benefit")}
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
