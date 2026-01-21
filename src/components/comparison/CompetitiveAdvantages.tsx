import { Equipment, CompetitiveArgument, Brand } from "@/types/equipment";
import { Trophy } from "lucide-react";
import { AdvantageCard } from "./AdvantageCard";
import { useMemo } from "react";

interface CompetitiveAdvantagesProps {
  selectedModel: Equipment;
  competitors: Equipment[];
  arguments: CompetitiveArgument[];
  brands: Brand[];
}

export function CompetitiveAdvantages({
  selectedModel,
  competitors,
  arguments: args,
  brands,
}: CompetitiveAdvantagesProps) {
  const isJohnDeere = selectedModel.brand?.name === "John Deere";
  
  // Get unique competitor brand IDs from the actual competitors in the comparison
  const competitorBrandIds = useMemo(() => 
    new Set(competitors.map(c => c.brand_id)), 
    [competitors]
  );
  
  // Smart filtering: prioritize arguments for selected competitors
  const { relevantArguments, otherArguments } = useMemo(() => {
    // If John Deere is selected, show JD advantages vs each competitor brand
    // If competitor is selected, show JD advantages vs that brand (reversed perspective)
    const allRelevant = isJohnDeere
      ? args.filter(arg => competitorBrandIds.has(arg.competitor_brand_id))
      : args.filter(arg => arg.competitor_brand_id === selectedModel.brand_id);

    // Sort: arguments matching competitors first, then others
    const matchingCompetitors = allRelevant.filter(arg => 
      competitorBrandIds.has(arg.competitor_brand_id)
    );
    const others = allRelevant.filter(arg => 
      !competitorBrandIds.has(arg.competitor_brand_id)
    );

    return { 
      relevantArguments: matchingCompetitors,
      otherArguments: others 
    };
  }, [args, isJohnDeere, competitorBrandIds, selectedModel.brand_id]);

  // All arguments to display
  const allArguments = [...relevantArguments, ...otherArguments];

  if (allArguments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          Konkurentsieelised pole veel lisatud selle võrdluse jaoks.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Trophy className="h-5 w-5 text-primary" />
          {isJohnDeere 
            ? "John Deere konkurentsieelised" 
            : `Miks valida John Deere ${selectedModel.brand?.name} asemel?`
          }
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Probleem → Lahendus → Kasu kliendile
        </p>
      </div>

      {/* Advantage Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allArguments.map((arg) => {
          const competitorBrand = brands.find(b => b.id === arg.competitor_brand_id);
          const isMatchingCompetitor = competitorBrandIds.has(arg.competitor_brand_id);
          
          return (
            <AdvantageCard
              key={arg.id}
              argument={arg}
              competitorBrand={competitorBrand}
              isHighlighted={isMatchingCompetitor}
            />
          );
        })}
      </div>
    </div>
  );
}