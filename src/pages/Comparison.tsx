import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { ComparisonModeSelector, ComparisonMode } from "@/components/comparison/ComparisonModeSelector";
import { AutoModeFilters } from "@/components/comparison/AutoModeFilters";
import { ModelMultiSelect } from "@/components/comparison/ModelMultiSelect";
import { MultiModelComparison } from "@/components/comparison/MultiModelComparison";
import { CompetitiveAdvantages } from "@/components/comparison/CompetitiveAdvantages";
import { TCOSummary } from "@/components/comparison/TCOSummary";
import { ROIComparisonCalculator } from "@/components/comparison/ROIComparisonCalculator";
import { ComparisonPDFExport } from "@/components/comparison/ComparisonPDFExport";
import { useCompetitors, getCompetitorSummary } from "@/hooks/useCompetitors";
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
  // Shared state
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("auto");
  const [selectedType, setSelectedType] = useState<string>("all");

  // Auto mode state
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedModelId, setSelectedModelId] = useState<string>("all");

  // Manual mode state
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

  // Auto mode: find the selected model object
  const selectedModel = useMemo(() => {
    if (selectedModelId === "all") return null;
    return allEquipment.find((m) => m.id === selectedModelId) || null;
  }, [selectedModelId, allEquipment]);

  // Auto mode: find competitors
  const competitors = useCompetitors(selectedModel, allEquipment);
  const competitorSummary = getCompetitorSummary(selectedModel, competitors);

  // Compute display models based on mode
  const displayModels = useMemo((): Equipment[] => {
    if (comparisonMode === "auto") {
      if (!selectedModel) return [];
      return [selectedModel, ...competitors];
    } else {
      return selectedModels;
    }
  }, [comparisonMode, selectedModel, competitors, selectedModels]);

  // Handle mode change - reset selections
  const handleModeChange = (mode: ComparisonMode) => {
    setComparisonMode(mode);
    // Reset selections when switching modes
    setSelectedBrand("all");
    setSelectedModelId("all");
    setSelectedModels([]);
  };

  // Handle type change - clear all selections
  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setSelectedBrand("all");
    setSelectedModelId("all");
    setSelectedModels([]);
  };

  // Auto mode: handle brand change
  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    setSelectedModelId("all");
  };

  // Auto mode: handle model change
  const handleModelChange = (value: string) => {
    setSelectedModelId(value);
  };

  // Manual mode: handle models change
  const handleModelsChange = (models: Equipment[]) => {
    setSelectedModels(models);
  };

  // Get the first selected model (for TCO and Advantages compatibility)
  const primaryModel = displayModels.length > 0 ? displayModels[0] : null;
  const otherModels = displayModels.slice(1);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground">
          <h1 className="text-3xl font-bold">Tehnika võrdlus</h1>
          <p className="mt-2 text-primary-foreground/80">
            Vali tehnika tüüp ja võrdle kuni 3 mudelit omavahel kõrvuti.
          </p>
        </div>

        {/* Filters & PDF Export */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          {/* Mode Selector */}
          <ComparisonModeSelector
            mode={comparisonMode}
            onModeChange={handleModeChange}
          />

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex-1">
              <h2 className="mb-4 text-lg font-semibold">
                {comparisonMode === "auto" 
                  ? "Automaatne konkurendisobitamine" 
                  : "Vali mudelid võrdluseks"}
              </h2>
              
              {/* Auto Mode Filters */}
              {comparisonMode === "auto" && (
                <AutoModeFilters
                  selectedType={selectedType}
                  selectedBrand={selectedBrand}
                  selectedModelId={selectedModelId}
                  onTypeChange={handleTypeChange}
                  onBrandChange={handleBrandChange}
                  onModelChange={handleModelChange}
                  equipment={allEquipment}
                  competitorCount={competitors.length}
                  competitorSummary={competitorSummary}
                />
              )}

              {/* Manual Mode Multi-Select */}
              {comparisonMode === "manual" && (
                <ModelMultiSelect
                  selectedType={selectedType}
                  selectedModels={selectedModels}
                  onTypeChange={handleTypeChange}
                  onModelsChange={handleModelsChange}
                  equipment={allEquipment}
                  maxModels={3}
                />
              )}
            </div>
            
            {/* PDF Export Dropdown */}
            <div className="flex-shrink-0">
              <ComparisonPDFExport
                selectedModels={displayModels}
                equipmentType={currentEquipmentType}
                showTCO={displayModels.length > 1}
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
            <MultiModelComparison selectedModels={displayModels} />

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
