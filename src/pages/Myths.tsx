import { Layout } from "@/components/layout/Layout";
import { MythCategory } from "@/components/myths/MythCategory";
import { Clock, Wallet, Wrench, TrendingDown, CloudSun, HelpCircle, Loader2 } from "lucide-react";
import { useMyths } from "@/hooks/useEquipmentData";

const CATEGORIES = [
  { key: "uncertainty", title: "Ebakindlus ja ajastus", icon: Clock },
  { key: "finance", title: "Finantsid ja rahastus", icon: Wallet },
  { key: "machines", title: "Masinad ja konkurents", icon: Wrench },
  { key: "costs", title: "Turuhinnad ja sisendkulud", icon: TrendingDown },
  { key: "weather", title: "Ilm ja saagitingimused", icon: CloudSun },
  { key: "other", title: "Muud argumendid", icon: HelpCircle },
];

export default function Myths() {
  const { data: myths = [], isLoading } = useMyths();

  // Group myths by category
  const mythsByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    myths: myths
      .filter((m) => m.category === cat.key)
      .map((m) => ({
        id: m.id,
        myth: m.myth,
        reality: m.reality,
        advantage: m.advantage,
      })),
  }));

  // Calculate starting indices for each category
  let runningIndex = 1;
  const categoriesWithIndices = mythsByCategory.map((cat) => {
    const startIndex = runningIndex;
    runningIndex += cat.myths.length;
    return { ...cat, startIndex };
  });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">Müüdid ja tegelikkus</h1>
          <p className="mt-2 text-primary-foreground/80">
            Levinumad väärarusaamad põllumajandustehnika kohta ja kuidas John Deere need ümber lükkab.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && myths.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Müüte pole veel lisatud.</p>
            <p className="text-sm mt-2">Lisa müüte Haldus vahelehe kaudu.</p>
          </div>
        )}

        {/* Myths by Category */}
        {!isLoading && myths.length > 0 && (
          <div className="grid gap-8">
            {categoriesWithIndices
              .filter((cat) => cat.myths.length > 0)
              .map((category) => (
                <MythCategory
                  key={category.key}
                  title={category.title}
                  icon={category.icon}
                  myths={category.myths}
                  startIndex={category.startIndex}
                />
              ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
