import { Equipment, CompetitiveArgument, Brand } from "@/types/equipment";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { AdvantageCard } from "./AdvantageCard";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface CompetitiveAdvantagesProps {
  selectedModel: Equipment;
  competitors: Equipment[];
  arguments: CompetitiveArgument[];
  brands: Brand[];
}

// Category display names in Estonian
const CATEGORY_LABELS: Record<string, string> = {
  technology: "Tehnoloogia",
  performance: "Jõudlus",
  fuel: "Kütusesääst",
  efficiency: "Tõhusus",
  automation: "Automatiseerimine",
  comfort: "Mugavus",
  precision: "Täpsuspõllumajandus",
  service: "Teenindus",
  value: "Väärtus",
  general: "Üldine",
};

const TOP_COUNT = 3;

export function CompetitiveAdvantages({
  selectedModel,
  competitors,
  arguments: args,
  brands,
}: CompetitiveAdvantagesProps) {
  const isJohnDeere = selectedModel.brand?.name === "John Deere";
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Get unique competitor brand IDs from the actual competitors in the comparison
  const competitorBrandIds = useMemo(() => 
    new Set(competitors.map(c => c.brand_id)), 
    [competitors]
  );
  
  // Filter arguments: only show those matching selected competitor brands
  const filteredArguments = useMemo(() => {
    if (isJohnDeere) {
      // JD selected: show arguments for each competitor brand in the comparison
      return args.filter(arg => competitorBrandIds.has(arg.competitor_brand_id));
    } else {
      // Competitor selected: show JD arguments against that specific brand
      return args.filter(arg => arg.competitor_brand_id === selectedModel.brand_id);
    }
  }, [args, isJohnDeere, competitorBrandIds, selectedModel.brand_id]);

  // Group arguments by category
  const argumentsByCategory = useMemo(() => {
    const grouped: Record<string, CompetitiveArgument[]> = {};
    
    filteredArguments.forEach(arg => {
      const category = arg.category || "general";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(arg);
    });

    // Sort each category by sort_order
    Object.values(grouped).forEach(categoryArgs => {
      categoryArgs.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    });

    return grouped;
  }, [filteredArguments]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (filteredArguments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          Konkurentsieelised pole veel lisatud valitud konkurentide jaoks.
        </p>
      </div>
    );
  }

  const categories = Object.keys(argumentsByCategory).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-2">
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
      </div>

      {/* Categories with Top 3 logic */}
      {categories.map(category => {
        const categoryArgs = argumentsByCategory[category];
        const isExpanded = expandedCategories.has(category);
        const displayedArgs = isExpanded ? categoryArgs : categoryArgs.slice(0, TOP_COUNT);
        const hasMore = categoryArgs.length > TOP_COUNT;
        const remainingCount = categoryArgs.length - TOP_COUNT;

        return (
          <div key={category} className="rounded-xl border border-border bg-card p-6">
            {/* Category Header */}
            <h4 className="mb-4 text-base font-semibold text-foreground">
              {CATEGORY_LABELS[category] || category}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({categoryArgs.length} argumenti)
              </span>
            </h4>

            {/* Advantage Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedArgs.map((arg) => {
                const competitorBrand = brands.find(b => b.id === arg.competitor_brand_id);
                
                return (
                  <AdvantageCard
                    key={arg.id}
                    argument={arg}
                    competitorBrand={competitorBrand}
                    isHighlighted={true}
                  />
                );
              })}
            </div>

            {/* Show More/Less Button */}
            {hasMore && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleCategory(category)}
                  className="gap-2"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Näita vähem
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Näita kõiki {remainingCount + TOP_COUNT} argumenti
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}