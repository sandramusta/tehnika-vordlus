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
  const [selectedPowerClass, setSelectedPowerClass] = useState<string>("all");
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

  // Find John Deere brand
  const johnDeereBrand = brands.find((b) => b.name === "John Deere");

  // Get the selected John Deere model
  const selectedJohnDeereModel = useMemo(() => {
    if (selectedModel === "all") return null;
    return allEquipment.find((e) => e.id === selectedModel) || null;
  }, [selectedModel, allEquipment]);

  // Get competitors in the same power class as the selected model
  const competitors = useMemo(() => {
    if (!selectedJohnDeereModel || !selectedJohnDeereModel.power_class_id) return [];
    
    return allEquipment.filter((e) => {
      // Exclude John Deere models
      if (e.brand_id === johnDeereBrand?.id) return false;
      // Must be same power class
      if (e.power_class_id !== selectedJohnDeereModel.power_class_id) return false;
      // Filter by brand if selected
      if (selectedBrand !== "all" && e.brand_id !== selectedBrand) return false;
      return true;
    });
  }, [selectedJohnDeereModel, allEquipment, johnDeereBrand, selectedBrand]);

  // Filter equipment for other views
  const filteredEquipment = allEquipment.filter((item) => {
    if (selectedBrand !== "all" && item.brand_id !== selectedBrand) return false;
    if (selectedPowerClass !== "all" && item.power_class_id !== selectedPowerClass)
      return false;
    return true;
  });

  // Reset model when type or power class changes
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setSelectedModel("all");
  };

  const handlePowerClassChange = (value: string) => {
    setSelectedPowerClass(value);
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
          <h2 className="mb-4 text-lg font-semibold">Filtrid</h2>
          <EquipmentFilters
            selectedType={selectedType}
            selectedBrand={selectedBrand}
            selectedPowerClass={selectedPowerClass}
            selectedModel={selectedModel}
            onTypeChange={handleTypeChange}
            onBrandChange={setSelectedBrand}
            onPowerClassChange={handlePowerClassChange}
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
                selectedModel={selectedJohnDeereModel}
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
            <TCOSummary equipment={filteredEquipment} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
