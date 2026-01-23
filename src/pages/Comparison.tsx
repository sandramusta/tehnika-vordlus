import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { EquipmentFilters } from "@/components/comparison/EquipmentFilters";
import { ModelComparison } from "@/components/comparison/ModelComparison";
import { CompetitiveAdvantages } from "@/components/comparison/CompetitiveAdvantages";
import { TCOSummary } from "@/components/comparison/TCOSummary";
import { ROICalculator } from "@/components/comparison/ROICalculator";
import {
  useEquipment,
  useBrands,
  useCompetitiveArguments,
  useEquipmentTypes,
} from "@/hooks/useEquipmentData";

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

  // Get competitors within 100 HP of the selected model (from other brands)
  const competitors = useMemo(() => {
    if (!selectedEquipmentModel || !selectedEquipmentModel.engine_power_hp) return [];
    
    const selectedPower = selectedEquipmentModel.engine_power_hp;
    
    return allEquipment.filter((e) => {
      // Exclude same brand
      if (e.brand_id === selectedEquipmentModel.brand_id) return false;
      // Must have engine power defined
      if (!e.engine_power_hp) return false;
      // Power difference must be within 100 HP
      const powerDiff = Math.abs(e.engine_power_hp - selectedPower);
      if (powerDiff > 100) return false;
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

        {/* Comparison Content */}
        {loadingEquipment ? (
          <div className="flex h-32 items-center justify-center">
            <div className="text-muted-foreground">Laadin andmeid...</div>
          </div>
        ) : (
          <div className="space-y-8">
            <ModelComparison
              selectedModel={selectedEquipmentModel}
              competitors={competitors}
              competitiveArgs={competitiveArgs}
              brands={brands}
            />

            {/* Show TCO and Advantages sections when model is selected */}
            {selectedEquipmentModel && competitors.length > 0 && (
              <>
                <TCOSummary
                  selectedModel={selectedEquipmentModel}
                  competitors={competitors}
                />

                <CompetitiveAdvantages
                  selectedModel={selectedEquipmentModel}
                  competitors={competitors}
                  arguments={competitiveArgs}
                  brands={brands}
                />
              </>
            )}

            {/* ROI Calculator - always visible */}
            <ROICalculator />
          </div>
        )}
      </div>
    </Layout>
  );
}
