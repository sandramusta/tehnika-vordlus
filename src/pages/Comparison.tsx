import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { EquipmentFilters } from "@/components/comparison/EquipmentFilters";
import { ComparisonTable } from "@/components/comparison/ComparisonTable";
import { CompetitiveAdvantages } from "@/components/comparison/CompetitiveAdvantages";
import { TCOSummary } from "@/components/comparison/TCOSummary";
import {
  useEquipment,
  useBrands,
  useCompetitiveArguments,
  useEquipmentTypes,
} from "@/hooks/useEquipmentData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Trophy, Calculator } from "lucide-react";

export default function Comparison() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedPowerClass, setSelectedPowerClass] = useState<string>("all");

  const { data: types } = useEquipmentTypes();
  const combineType = types?.find((t) => t.name === "combine");

  const { data: equipment = [], isLoading: loadingEquipment } = useEquipment(
    selectedType !== "all" ? selectedType : combineType?.id
  );
  const { data: brands = [] } = useBrands();
  const { data: competitiveArgs = [] } = useCompetitiveArguments(
    selectedType !== "all" ? selectedType : combineType?.id
  );

  // Filter equipment
  const filteredEquipment = equipment.filter((item) => {
    if (selectedBrand !== "all" && item.brand_id !== selectedBrand) return false;
    if (selectedPowerClass !== "all" && item.power_class_id !== selectedPowerClass)
      return false;
    return true;
  });

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">Tehnika võrdlus</h1>
          <p className="mt-2 text-primary-foreground/80">
            Võrdle John Deere kombaine konkurentidega. Vaata tehnilisi näitajaid,
            jõuklasse ja TCO analüüsi.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Filtrid</h2>
          <EquipmentFilters
            selectedType={selectedType}
            selectedBrand={selectedBrand}
            selectedPowerClass={selectedPowerClass}
            onTypeChange={setSelectedType}
            onBrandChange={setSelectedBrand}
            onPowerClassChange={setSelectedPowerClass}
          />
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="comparison" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none">
            <TabsTrigger value="comparison" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Võrdlustabel</span>
            </TabsTrigger>
            <TabsTrigger value="advantages" className="gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Eelised</span>
            </TabsTrigger>
            <TabsTrigger value="tco" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">TCO analüüs</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comparison" className="space-y-4">
            {loadingEquipment ? (
              <div className="flex h-32 items-center justify-center">
                <div className="text-muted-foreground">Laadin andmeid...</div>
              </div>
            ) : (
              <ComparisonTable equipment={filteredEquipment} />
            )}
          </TabsContent>

          <TabsContent value="advantages">
            <CompetitiveAdvantages arguments={competitiveArgs} brands={brands} />
          </TabsContent>

          <TabsContent value="tco">
            <TCOSummary equipment={filteredEquipment} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
