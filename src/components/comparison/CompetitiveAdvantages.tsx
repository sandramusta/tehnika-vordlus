import { CompetitiveArgument, Brand } from "@/types/equipment";
import { Shield, Zap, Wrench, Leaf, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompetitiveAdvantagesProps {
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
  arguments: args,
  brands,
}: CompetitiveAdvantagesProps) {
  const competitorBrands = brands.filter((b) => !b.is_primary);

  if (args.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Konkurentsieelised pole veel lisatud.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Lisage argumendid administraatori vaates.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {competitorBrands.map((brand) => {
        const brandArguments = args.filter(
          (a) => a.competitor_brand_id === brand.id
        );

        if (brandArguments.length === 0) return null;

        return (
          <div key={brand.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">
                Miks John Deere on parem kui {brand.name}?
              </h3>
              <span className="text-sm text-muted-foreground">
                ({brandArguments.length} argumenti)
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {brandArguments.map((arg) => {
                const Icon = getCategoryIcon(arg.category);

                return (
                  <div
                    key={arg.id}
                    className={cn(
                      "rounded-lg border-l-4 bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
                      getBrandBorderColor(brand.name)
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {getCategoryLabel(arg.category)}
                        </span>
                      </div>
                    </div>
                    <h4 className="mb-2 font-semibold text-foreground">
                      {arg.argument_title}
                    </h4>
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
  );
}
