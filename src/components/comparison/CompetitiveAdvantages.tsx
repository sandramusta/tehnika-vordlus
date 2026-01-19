import { Equipment, CompetitiveArgument, Brand } from "@/types/equipment";
import { Zap, TrendingUp, Armchair, Wrench, Fuel, PiggyBank, Trophy, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface CompetitiveAdvantagesProps {
  selectedModel: Equipment;
  competitors: Equipment[];
  arguments: CompetitiveArgument[];
  brands: Brand[];
}

// Consolidated category mapping (9 -> 6 categories)
type ConsolidatedCategory = "technology" | "performance" | "comfort" | "service" | "fuel" | "value";

function consolidateCategory(originalCategory: string): ConsolidatedCategory {
  switch (originalCategory) {
    case "technology":
    case "automation":
    case "precision":
      return "technology";
    case "performance":
    case "efficiency":
      return "performance";
    case "comfort":
      return "comfort";
    case "service":
    case "reliability":
      return "service";
    case "fuel":
      return "fuel";
    case "value":
    default:
      return "value";
  }
}

function getCategoryIcon(category: ConsolidatedCategory) {
  switch (category) {
    case "technology":
      return Zap;
    case "performance":
      return TrendingUp;
    case "comfort":
      return Armchair;
    case "service":
      return Wrench;
    case "fuel":
      return Fuel;
    case "value":
      return PiggyBank;
  }
}

function getCategoryLabel(category: ConsolidatedCategory): string {
  switch (category) {
    case "technology":
      return "Tehnoloogia";
    case "performance":
      return "Jõudlus";
    case "comfort":
      return "Mugavus";
    case "service":
      return "Teenindus";
    case "fuel":
      return "Kütusesääst";
    case "value":
      return "Väärtus";
  }
}

function getCategoryDescription(category: ConsolidatedCategory): string {
  switch (category) {
    case "technology":
      return "Automatiseerimine, täppispõllumajandus ja nutikad süsteemid";
    case "performance":
      return "Jõudlus, efektiivsus ja tootlikkus";
    case "comfort":
      return "Operaatori mugavus ja töökeskkond";
    case "service":
      return "Teenindus, hooldus ja töökindlus";
    case "fuel":
      return "Kütusekulud ja säästlikkus";
    case "value":
      return "Investeeringu väärtus ja tasuvus";
  }
}

// Category priority order
const CATEGORY_ORDER: ConsolidatedCategory[] = [
  "technology",
  "performance",
  "fuel",
  "comfort",
  "service",
  "value",
];

interface ArgumentItemProps {
  argument: CompetitiveArgument;
  competitorBrand?: Brand;
}

function ArgumentItem({ argument, competitorBrand }: ArgumentItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/50">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {argument.argument_title}
            </span>
            {competitorBrand && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                vs {competitorBrand.name}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-3 pb-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {argument.argument_description}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
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

  // Group arguments by consolidated category
  const argumentsByCategory = new Map<ConsolidatedCategory, { argument: CompetitiveArgument; competitorBrand?: Brand }[]>();
  
  relevantArguments.forEach(arg => {
    const consolidatedCat = consolidateCategory(arg.category);
    const competitorBrand = brands.find(b => b.id === arg.competitor_brand_id);
    
    const existing = argumentsByCategory.get(consolidatedCat);
    if (existing) {
      existing.push({ argument: arg, competitorBrand });
    } else {
      argumentsByCategory.set(consolidatedCat, [{ argument: arg, competitorBrand }]);
    }
  });

  // Sort categories by priority order and filter to only those with arguments
  const sortedCategories = CATEGORY_ORDER.filter(cat => argumentsByCategory.has(cat));

  // Default open categories
  const defaultOpenCategories = ["technology", "performance"];

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
          Kliki kategooriale, et näha üksikasjalikke eeliseid
        </p>
      </div>

      <Accordion 
        type="multiple" 
        defaultValue={defaultOpenCategories}
        className="space-y-3"
      >
        {sortedCategories.map((category) => {
          const categoryArgs = argumentsByCategory.get(category) || [];
          const Icon = getCategoryIcon(category);
          
          return (
            <AccordionItem
              key={category}
              value={category}
              className="rounded-lg border border-border bg-background px-4 data-[state=open]:bg-muted/30"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {getCategoryLabel(category)}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {categoryArgs.length}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {getCategoryDescription(category)}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="divide-y divide-border">
                  {categoryArgs.map(({ argument, competitorBrand }) => (
                    <ArgumentItem
                      key={argument.id}
                      argument={argument}
                      competitorBrand={competitorBrand}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
