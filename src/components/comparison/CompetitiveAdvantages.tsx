import { Equipment, CompetitiveArgument, Brand } from "@/types/equipment";
import { Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { AdvantageCard } from "./AdvantageCard";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Helper function to get brand-specific styling
function getBrandBorderClass(brandName: string): string {
  switch (brandName) {
    case "Claas":
      return "border-claas";
    case "Case IH":
      return "border-case-ih";
    case "New Holland":
      return "border-new-holland";
    case "Fendt":
      return "border-fendt";
    default:
      return "border-primary";
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
      return "text-foreground";
  }
}

export function CompetitiveAdvantages({
  selectedModel,
  competitors,
  arguments: args,
  brands,
}: CompetitiveAdvantagesProps) {
  const isJohnDeere = selectedModel.brand?.name === "John Deere";
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCompetitorBrandId, setSelectedCompetitorBrandId] = useState<string>("");
  
  // Get unique competitor brands from the actual competitors in the comparison
  const availableCompetitorBrands = useMemo(() => {
    const brandIds = new Set(competitors.map(c => c.brand_id));
    return brands.filter(b => brandIds.has(b.id));
  }, [competitors, brands]);

  // Get selected competitor brand
  const selectedCompetitorBrand = useMemo(() => 
    brands.find(b => b.id === selectedCompetitorBrandId),
    [brands, selectedCompetitorBrandId]
  );
  
  // Filter arguments: only show those matching selected competitor brand
  const filteredArguments = useMemo(() => {
    if (!selectedCompetitorBrandId) return [];
    
    if (isJohnDeere) {
      // JD selected: show arguments for the selected competitor brand
      return args.filter(arg => arg.competitor_brand_id === selectedCompetitorBrandId);
    } else {
      // Competitor selected: show JD arguments against that specific brand
      return args.filter(arg => arg.competitor_brand_id === selectedModel.brand_id);
    }
  }, [args, isJohnDeere, selectedCompetitorBrandId, selectedModel.brand_id]);

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

  // If no competitors, show message
  if (availableCompetitorBrands.length === 0) {
    return null;
  }

  const categories = Object.keys(argumentsByCategory).sort();

  return (
    <div className="space-y-6">
      {/* Header with dropdown */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Trophy className="h-5 w-5 text-primary" />
              John Deere konkurentsieelised
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vali bränd, et näha eeliseid
            </p>
          </div>
          
          {/* Brand filter dropdown */}
          <Select
            value={selectedCompetitorBrandId}
            onValueChange={setSelectedCompetitorBrandId}
          >
            <SelectTrigger className="w-full sm:w-[200px] bg-card">
              <SelectValue placeholder="Vali bränd võrdluseks" />
            </SelectTrigger>
            <SelectContent className="bg-card z-50">
              {availableCompetitorBrands.map((brand) => (
                <SelectItem 
                  key={brand.id} 
                  value={brand.id}
                  className="cursor-pointer"
                >
                  <span className={getBrandTextClass(brand.name)}>
                    vs {brand.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Show message if no brand selected */}
      {!selectedCompetitorBrandId && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            Vali rippmenüüst bränd, et näha John Deere konkurentsieeliseid.
          </p>
        </div>
      )}

      {/* Show message if no arguments for selected brand */}
      {selectedCompetitorBrandId && filteredArguments.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            Konkurentsieelised pole veel lisatud {selectedCompetitorBrand?.name} kohta.
          </p>
        </div>
      )}

      {/* Categories with Top 3 logic */}
      {selectedCompetitorBrandId && categories.map(category => {
        const categoryArgs = argumentsByCategory[category];
        const isExpanded = expandedCategories.has(category);
        const displayedArgs = isExpanded ? categoryArgs : categoryArgs.slice(0, TOP_COUNT);
        const hasMore = categoryArgs.length > TOP_COUNT;
        const remainingCount = categoryArgs.length - TOP_COUNT;
        
        // Get brand-specific styling
        const brandBorderClass = selectedCompetitorBrand ? getBrandBorderClass(selectedCompetitorBrand.name) : "border-border";
        const brandBgClass = selectedCompetitorBrand ? getBrandBgClass(selectedCompetitorBrand.name) : "bg-muted";

        return (
          <div 
            key={category} 
            className={`rounded-xl border-2 ${brandBorderClass} bg-card p-6`}
          >
            {/* Category Header with brand badge */}
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-foreground">
                {CATEGORY_LABELS[category] || category}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({categoryArgs.length} argumenti)
                </span>
              </h4>
              {selectedCompetitorBrand && (
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${brandBgClass} ${getBrandTextClass(selectedCompetitorBrand.name)}`}>
                  Eelis vs {selectedCompetitorBrand.name}
                </span>
              )}
            </div>

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
