import { Equipment, CompetitiveArgument, Brand } from "@/types/equipment";
import { Shield, Zap, Wrench, Leaf, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompetitiveAdvantagesProps {
  selectedModel: Equipment;
  competitors: Equipment[];
  arguments: CompetitiveArgument[];
  brands: Brand[];
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "technology":
      return Zap;
    case "reliability":
      return Shield;
    case "service":
      return Wrench;
    case "efficiency":
      return Leaf;
    case "value":
      return TrendingUp;
    default:
      return Shield;
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "technology":
      return "Tehnoloogia";
    case "reliability":
      return "Töökindlus";
    case "service":
      return "Teenindus";
    case "efficiency":
      return "Efektiivsus";
    case "value":
      return "Väärtus";
    default:
      return "Üldine";
  }
}

function getBrandBorderColor(brandName: string): string {
  switch (brandName) {
    case "John Deere":
      return "border-l-primary";
    case "Claas":
      return "border-l-claas";
    case "Case IH":
      return "border-l-case-ih";
    case "New Holland":
      return "border-l-new-holland";
    default:
      return "border-l-muted";
  }
}

export function CompetitiveAdvantages({
  selectedModel,
  competitors,
  arguments: args,
  brands,
}: CompetitiveAdvantagesProps) {
  const isJohnDeere = selectedModel.brand?.name === "John Deere";
  
  // Get unique competitor brand IDs from the actual competitors in the comparison
  const competitorBrandIds = new Set(competitors.map(c => c.brand_id));
  
  // If John Deere is selected, show JD advantages vs each competitor brand
  // If competitor is selected, show JD advantages vs that brand (reversed perspective)
  const relevantArguments = isJohnDeere
    ? args.filter(arg => competitorBrandIds.has(arg.competitor_brand_id))
    : args.filter(arg => arg.competitor_brand_id === selectedModel.brand_id);

  if (relevantArguments.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          Konkurentsieelised pole veel lisatud selle võrdluse jaoks.
        </p>
      </div>
    );
  }

  // Group arguments by competitor brand
  const argumentsByBrand = new Map<string, { brand: Brand; arguments: CompetitiveArgument[] }>();
  
  relevantArguments.forEach(arg => {
    const brand = brands.find(b => b.id === arg.competitor_brand_id);
    if (brand) {
      const existing = argumentsByBrand.get(brand.id);
      if (existing) {
        existing.arguments.push(arg);
      } else {
        argumentsByBrand.set(brand.id, { brand, arguments: [arg] });
      }
    }
  });

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Trophy className="h-5 w-5 text-primary" />
        {isJohnDeere 
          ? "John Deere konkurentsieelised" 
          : `Miks valida John Deere ${selectedModel.brand?.name} asemel?`
        }
      </h3>

      <div className="space-y-8">
        {Array.from(argumentsByBrand.values()).map(({ brand, arguments: brandArgs }) => {
          // Find the competitor model for this brand
          const competitorModel = competitors.find(c => c.brand_id === brand.id);
          
          return (
            <div key={brand.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <h4 className="text-base font-semibold text-foreground">
                  {isJohnDeere 
                    ? `John Deere vs ${brand.name}`
                    : `John Deere eelised`
                  }
                  {competitorModel && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({competitorModel.model_name})
                    </span>
                  )}
                </h4>
                <span className="text-sm text-muted-foreground">
                  ({brandArgs.length} argumenti)
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {brandArgs.map((arg) => {
                  const Icon = getCategoryIcon(arg.category);

                  return (
                    <div
                      key={arg.id}
                      className={cn(
                        "rounded-lg border-l-4 bg-muted/30 p-4 shadow-sm transition-shadow hover:shadow-md",
                        getBrandBorderColor(brand.name)
                      )}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {getCategoryLabel(arg.category)}
                        </span>
                      </div>
                      <h5 className="mb-2 font-semibold text-foreground">
                        {arg.argument_title}
                      </h5>
                      <p className="text-sm text-muted-foreground">
                        {arg.argument_description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
