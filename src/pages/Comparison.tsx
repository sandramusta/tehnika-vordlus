import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { ModelMultiSelect } from "@/components/comparison/ModelMultiSelect";
import { MultiModelComparison } from "@/components/comparison/MultiModelComparison";
import { CompetitiveAdvantages } from "@/components/comparison/CompetitiveAdvantages";
import { TCOSummary } from "@/components/comparison/TCOSummary";
import { ROIComparisonCalculator } from "@/components/comparison/ROIComparisonCalculator";
import { ComparisonPDFExport } from "@/components/comparison/ComparisonPDFExport";
import {
  useEquipment,
  useBrands,
  useCompetitiveArguments,
  useEquipmentTypes,
} from "@/hooks/useEquipmentData";
import { Equipment } from "@/types/equipment";
import { 
  ROIInputs, 
  defaultInputsExisting, 
  defaultInputsNew 
} from "@/components/comparison/SingleROICalculator";

export default function Comparison() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedModels, setSelectedModels] = useState<Equipment[]>([]);

  // ROI inputs state (for PDF export - using defaults as fallback)
  const [roiExisting] = useState<ROIInputs>(defaultInputsExisting);
  const [roiNew] = useState<ROIInputs>(defaultInputsNew);

  const { data: types } = useEquipmentTypes();
  
  // Get equipment for the selected type (or all types for "all")
  const { data: allEquipment = [], isLoading: loadingEquipment } = useEquipment(
    selectedType !== "all" ? selectedType : undefined
  );
  const { data: brands = [] } = useBrands();
  const { data: competitiveArgs = [] } = useCompetitiveArguments(
    selectedType !== "all" ? selectedType : undefined
  );

  // Get the current equipment type object
  const currentEquipmentType = useMemo(() => {
    if (selectedType === "all" || !types) return null;
    return types.find((t) => t.id === selectedType) || null;
  }, [selectedType, types]);

  // Handle type change - clear selections
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setSelectedModels([]);
  };

  // Handle models change
  const handleModelsChange = (models: Equipment[]) => {
    setSelectedModels(models);
  };

  // Get the first selected model (for TCO and Advantages compatibility)
  const primaryModel = selectedModels.length > 0 ? selectedModels[0] : null;
  const otherModels = selectedModels.slice(1);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">Tehnika võrdlus</h1>
          <p className="mt-2 text-primary-foreground/80">
            Vali tehnika tüüp ja kuni 3 mudelit, mida omavahel kõrvuti võrrelda.
          </p>
        </div>

        {/* Filters & PDF Export */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex-1">
              <h2 className="mb-4 text-lg font-semibold">Vali mudelid võrdluseks</h2>
              <ModelMultiSelect
                selectedType={selectedType}
                selectedModels={selectedModels}
                onTypeChange={handleTypeChange}
                onModelsChange={handleModelsChange}
                equipment={allEquipment}
                maxModels={3}
              />
            </div>
            
            {/* PDF Export Dropdown */}
            <div className="flex-shrink-0">
              <ComparisonPDFExport
                selectedModels={selectedModels}
                equipmentType={currentEquipmentType}
                showTCO={selectedModels.length > 1}
                existingInputs={roiExisting}
                newInputs={roiNew}
              />
            </div>
          </div>
        </div>

        {/* Comparison Content */}
        {loadingEquipment ? (
          <div className="flex h-32 items-center justify-center">
            <div className="text-muted-foreground">Laadin andmeid...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Multi-Model Comparison Table */}
            <MultiModelComparison selectedModels={selectedModels} />

            {/* Show TCO and Advantages sections when multiple models are selected */}
            {primaryModel && otherModels.length > 0 && (
              <>
                <TCOSummary
                  selectedModel={primaryModel}
                  competitors={otherModels}
                />

                <CompetitiveAdvantages
                  selectedModel={primaryModel}
                  competitors={otherModels}
                  arguments={competitiveArgs}
                  brands={brands}
                />
              </>
            )}

            {/* ROI Comparison Calculator - always visible */}
            <ROIComparisonCalculator />
          </div>
        )}
      </div>
    </Layout>
  );
}
