import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { EquipmentFilters } from "@/components/comparison/EquipmentFilters";
import { ModelComparison } from "@/components/comparison/ModelComparison";
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
  const [selectedModel, setSelectedModel] = useState<string>("all");

  const { data: types } = useEquipmentTypes();
  
  // Get equipment for the selected type (or all types for "all")
  const { data: allEquipment = [], isLoading: loadingEquipment } = useEquipment(
    selectedType !== "all" ? selectedType : undefined
  );
  const { data: brands = [] } = useBrands();
  const { data: competitiveArgs = [] } = useCompetitiveArguments(
    selectedType !== "all" ? selectedType : undefined
  );

  // Get the selected model (any brand)
  const selectedEquipmentModel = useMemo(() => {
    if (selectedModel === "all") return null;
    return allEquipment.find((e) => e.id === selectedModel) || null;
  }, [selectedModel, allEquipment]);

  // Get competitors in the same power class as the selected model (from other brands)
  const competitors = useMemo(() => {
    if (!selectedEquipmentModel || !selectedEquipmentModel.power_class_id) return [];
    
    return allEquipment.filter((e) => {
      // Exclude same brand
      if (e.brand_id === selectedEquipmentModel.brand_id) return false;
      // Must be same power class
      if (e.power_class_id !== selectedEquipmentModel.power_class_id) return false;
      return true;
    });
  }, [selectedEquipmentModel, allEquipment]);

  // Reset model when type or brand changes
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setSelectedModel("all");
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    setSelectedModel("all");
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">Tehnika võrdlus</h1>
          <p className="mt-2 text-primary-foreground/80">
            Vali John Deere mudel ja vaata, kuidas see võrdleb konkurentide alternatiividega samas jõuklassis.
          </p>
        </div>

        {/* Filters */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Vali mudel võrdluseks</h2>
          <EquipmentFilters
            selectedType={selectedType}
            selectedBrand={selectedBrand}
            selectedModel={selectedModel}
            onTypeChange={handleTypeChange}
            onBrandChange={handleBrandChange}
            onModelChange={setSelectedModel}
            equipment={allEquipment}
          />
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="comparison" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-none">
            <TabsTrigger value="comparison" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Mudeli võrdlus</span>
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
              <ModelComparison
                selectedModel={selectedEquipmentModel}
                competitors={competitors}
                competitiveArgs={competitiveArgs}
                brands={brands}
              />
            )}
          </TabsContent>

          <TabsContent value="advantages">
            <CompetitiveAdvantages arguments={competitiveArgs} brands={brands} />
          </TabsContent>

          <TabsContent value="tco">
            <TCOSummary equipment={allEquipment} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
