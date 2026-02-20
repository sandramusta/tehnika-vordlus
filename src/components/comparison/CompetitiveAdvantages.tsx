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
 import { getBrandTextColor, getBrandHexColor } from "@/lib/brandColors";

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
  precision: "Täppispõllumajandus",
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
  const isPrimaryBrand = selectedModel.brand?.is_primary === true;
  const ourBrandName = isPrimaryBrand ? selectedModel.brand!.name : 
    brands.find(b => b.is_primary)?.name || "John Deere";
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCompetitorBrandId, setSelectedCompetitorBrandId] = useState<string>("");
  
  // Dynamically get competitor brands that have arguments for this equipment type
  const availableCompetitorBrands = useMemo(() => {
    const brandIdsWithArgs = new Set(args.map(a => a.competitor_brand_id));
    return brands.filter(b => brandIdsWithArgs.has(b.id));
  }, [brands, args]);

  // Get the selected brand name for display
  const selectedBrandName = useMemo(() => {
    const brand = brands.find(b => b.id === selectedCompetitorBrandId);
    return brand?.name || "";
  }, [brands, selectedCompetitorBrandId]);
  
  // Filter arguments: only show those matching selected competitor brand
  const filteredArguments = useMemo(() => {
    if (!selectedCompetitorBrandId) return [];
    
    if (isPrimaryBrand) {
      return args.filter(arg => arg.competitor_brand_id === selectedCompetitorBrandId);
    } else {
      return args.filter(arg => arg.competitor_brand_id === selectedModel.brand_id);
    }
  }, [args, isPrimaryBrand, selectedCompetitorBrandId, selectedModel.brand_id]);

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

  // If no competitor brands available, show nothing
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
              {ourBrandName} konkurentsieelised
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vali bränd, et näha eeliseid
            </p>
          </div>
          
          {/* Brand filter dropdown with brand colors */}
          <Select
            value={selectedCompetitorBrandId}
            onValueChange={setSelectedCompetitorBrandId}
          >
            <SelectTrigger className="w-full sm:w-[220px] bg-card">
              <SelectValue placeholder="Vali bränd võrdluseks" />
            </SelectTrigger>
            <SelectContent className="bg-card z-50">
              {availableCompetitorBrands.map((brand) => (
                <SelectItem 
                  key={brand.id} 
                  value={brand.id}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: getBrandHexColor(brand.name) }}
                    />
                    <span className={getBrandTextColor(brand.name)}>
                      vs {brand.name}
                    </span>
                  </div>
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
            Vali rippmenüüst bränd, et näha {ourBrandName} konkurentsieeliseid.
          </p>
        </div>
      )}

      {/* Show message if no arguments for selected brand */}
      {selectedCompetitorBrandId && filteredArguments.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            Konkurentsieelised pole veel lisatud selle brändi kohta.
          </p>
        </div>
      )}

      {/* Categories with Top 3 logic - Clean minimal design */}
      {selectedCompetitorBrandId && categories.map(category => {
        const categoryArgs = argumentsByCategory[category];
        const isExpanded = expandedCategories.has(category);
        const displayedArgs = isExpanded ? categoryArgs : categoryArgs.slice(0, TOP_COUNT);
        const hasMore = categoryArgs.length > TOP_COUNT;
        const remainingCount = categoryArgs.length - TOP_COUNT;

        return (
          <div 
            key={category} 
            className="rounded-xl border border-border bg-card p-6"
          >
            {/* Category Header - Clean without brand badge */}
            <div className="mb-4">
              <h4 className="text-base font-semibold text-foreground">
                {CATEGORY_LABELS[category] || category}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({categoryArgs.length} argumenti)
                </span>
              </h4>
            </div>

            {/* Advantage Cards Grid - Clean design without brand borders */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedArgs.map((arg) => (
                <AdvantageCard
                  key={arg.id}
                  argument={arg}
                  competitorBrandName={selectedBrandName}
                />
              ))}
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
