import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, FileDown, TrendingUp, ArrowRight, Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  SingleROICalculator, 
  ROIInputs, 
  calculateROI, 
  defaultInputsExisting, 
  defaultInputsNew,
  ROIEquipmentCategory,
  getROIEquipmentCategory,
} from "./SingleROICalculator";
import { addPDFHeader, addPDFFooter, ensureSpaceForContent } from "@/lib/pdfHelpers";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useEquipmentTypes } from "@/hooks/useEquipmentData";

interface ROIComparisonCalculatorProps {
  equipmentTypeName?: string;
}

export function ROIComparisonCalculator({ equipmentTypeName }: ROIComparisonCalculatorProps) {
  const { t } = useTranslation();
  const [existingInputs, setExistingInputs] = useState<ROIInputs>(() => ({
    ...defaultInputsExisting,
    machineName: t("roi.defaultExistingMachine"),
  }));
  const [newInputs, setNewInputs] = useState<ROIInputs>(() => ({
    ...defaultInputsNew,
    machineName: t("roi.defaultNewMachine"),
  }));
  const [selectedTypeId, setSelectedTypeId] = useState<string>("combine");
  const { logActivity } = useActivityLog();

  const { data: equipmentTypes } = useEquipmentTypes();

  // Auto-sync with parent equipment type
  const hasParentType = !!equipmentTypeName;
  
  useEffect(() => {
    if (equipmentTypeName) {
      const category = getROIEquipmentCategory(equipmentTypeName);
      setSelectedTypeId(category);
    }
  }, [equipmentTypeName]);

  // Determine equipment category
  const equipmentCategory: ROIEquipmentCategory = useMemo(() => {
    if (selectedTypeId === "combine") return "combine";
    if (selectedTypeId === "sprayer") return "sprayer";
    if (selectedTypeId === "baler") return "baler";
    if (selectedTypeId === "none") return "none";
    const typeObj = equipmentTypes?.find(t => t.id === selectedTypeId);
    if (typeObj) return getROIEquipmentCategory(typeObj.name);
    return "combine";
  }, [selectedTypeId, equipmentTypes]);

  const updateExistingInput = (key: keyof ROIInputs, value: string | number) => {
    if (key === "machineName") {
      setExistingInputs(prev => ({ ...prev, [key]: String(value) }));
    } else {
      const strVal = String(value);
      const numValue = strVal === "" ? 0 : parseFloat(strVal);
      setExistingInputs(prev => ({ ...prev, [key]: isNaN(numValue) ? 0 : numValue }));
    }
  };

  const updateNewInput = (key: keyof ROIInputs, value: string | number) => {
    if (key === "machineName") {
      setNewInputs(prev => ({ ...prev, [key]: String(value) }));
    } else {
      const strVal = String(value);
      const numValue = strVal === "" ? 0 : parseFloat(strVal);
      setNewInputs(prev => ({ ...prev, [key]: isNaN(numValue) ? 0 : numValue }));
    }
  };

  const existingCalc = useMemo(() => calculateROI(existingInputs, equipmentCategory), [existingInputs, equipmentCategory]);
  const newCalc = useMemo(() => calculateROI(newInputs, equipmentCategory), [newInputs, equipmentCategory]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("et-EE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number, decimals: number = 1) =>
    new Intl.NumberFormat("et-EE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  // Comparison calculations
  const comparison = useMemo(() => {
    const tcoSavings = existingCalc.totalLifetimeCosts - newCalc.totalLifetimeCosts;
    const tcoSavingsPercent = existingCalc.totalLifetimeCosts > 0 
      ? (tcoSavings / existingCalc.totalLifetimeCosts) * 100 
      : 0;
    
    const annualSavingsDiff = newCalc.totalAnnualBenefits - existingCalc.totalAnnualBenefits;
    const costPerHaDiff = existingCalc.costPerHectare - newCalc.costPerHectare;
    const roiDiff = newCalc.roi - existingCalc.roi;
    
    const additionalInvestment = newInputs.purchasePrice - existingInputs.purchasePrice;
    const annualBenefit = tcoSavings / newInputs.expectedLifespan;
    const paybackYears = annualBenefit > 0 ? additionalInvestment / annualBenefit : Infinity;

    return {
      tcoSavings,
      tcoSavingsPercent,
      annualSavingsDiff,
      costPerHaDiff,
      roiDiff,
      additionalInvestment,
      paybackYears,
      newIsBetter: tcoSavings > 0,
    };
  }, [existingCalc, newCalc, existingInputs.purchasePrice, newInputs.purchasePrice, newInputs.expectedLifespan]);

  // TCO Chart data
  const tcoChartData = [
    {
      name: existingInputs.machineName,
      tco: existingCalc.totalLifetimeCosts,
      fill: "hsl(220, 10%, 50%)",
    },
    {
      name: newInputs.machineName,
      tco: newCalc.totalLifetimeCosts,
      fill: "hsl(122, 39%, 30%)",
    },
  ];

  const { profile } = useAuth();

  // Generate PDF Report
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    let yPos = addPDFHeader(doc, pageWidth, {
      title: t("pdf.roiReport"),
      generatorName: profile?.full_name || "",
      generatorEmail: profile?.email || "",
    });

    doc.setFontSize(16);
    doc.setTextColor(34, 87, 46);
    doc.text(t("pdf.roiReport"), pageWidth / 2, yPos, { align: "center" });
    
    yPos += 12;
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(t("pdf.inputParameters"), 14, yPos);
    yPos += 6;
    
    autoTable(doc, {
      startY: yPos,
      head: [[t("pdf.parameter"), existingInputs.machineName, newInputs.machineName]],
      body: [
        [t("pdf.purchasePrice"), formatCurrency(existingInputs.purchasePrice), formatCurrency(newInputs.purchasePrice)],
        [t("pdf.analysisperiod"), `${existingInputs.expectedLifespan} a`, `${newInputs.expectedLifespan} a`],
        [t("pdf.residualValue"), `${existingInputs.residualValuePercent}%`, `${newInputs.residualValuePercent}%`],
        [t("pdf.annualHectares"), `${existingInputs.annualHectares} ha`, `${newInputs.annualHectares} ha`],
        [t("pdf.annualWorkHours"), `${existingInputs.annualWorkHours} h`, `${newInputs.annualWorkHours} h`],
        [t("pdf.fuelConsumption"), `${existingInputs.fuelConsumption} l/h`, `${newInputs.fuelConsumption} l/h`],
        [t("pdf.fuelSavings"), `${existingInputs.fuelSavingsPercent}%`, `${newInputs.fuelSavingsPercent}%`],
        [t("pdf.maintenanceCost"), formatCurrency(existingInputs.annualMaintenance), formatCurrency(newInputs.annualMaintenance)],
        [t("pdf.maintenanceSavings"), `${existingInputs.maintenanceSavingsPercent}%`, `${newInputs.maintenanceSavingsPercent}%`],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 87, 46] },
    });
    
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    
    // Ensure "Tulemused" table fits on current page
    yPos = ensureSpaceForContent(doc, yPos, 70);
    
    doc.setFontSize(12);
    doc.text(t("pdf.results"), 14, yPos);
    yPos += 6;
    
    autoTable(doc, {
      startY: yPos,
      head: [[t("pdf.indicator"), existingInputs.machineName, newInputs.machineName, t("pdf.difference")]],
      body: [
        [
          `${t("pdf.tco")} (${newInputs.expectedLifespan}a)`, 
          formatCurrency(existingCalc.totalLifetimeCosts), 
          formatCurrency(newCalc.totalLifetimeCosts),
          formatCurrency(comparison.tcoSavings)
        ],
        [
          t("pdf.roi"), 
          `${formatNumber(existingCalc.roi, 0)}%`, 
          `${formatNumber(newCalc.roi, 0)}%`,
          `${comparison.roiDiff >= 0 ? "+" : ""}${formatNumber(comparison.roiDiff, 0)}%`
        ],
        [
          t("pdf.costPerHectare"), 
          formatCurrency(existingCalc.costPerHectare), 
          formatCurrency(newCalc.costPerHectare),
          formatCurrency(comparison.costPerHaDiff)
        ],
        [
          t("pdf.annualSavings"), 
          formatCurrency(existingCalc.totalAnnualBenefits), 
          formatCurrency(newCalc.totalAnnualBenefits),
          formatCurrency(comparison.annualSavingsDiff)
        ],
        [
          t("pdf.annualProfit"), 
          formatCurrency(existingCalc.annualProfit), 
          formatCurrency(newCalc.annualProfit),
          formatCurrency(newCalc.annualProfit - existingCalc.annualProfit)
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 87, 46] },
    });
    
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    
    // Ensure "Kokkuvõte" section fits on current page
    yPos = ensureSpaceForContent(doc, yPos, 40);
    
    doc.setFontSize(11);
    doc.setTextColor(34, 87, 46);
    doc.text(t("pdf.summary"), 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    if (comparison.newIsBetter) {
      doc.text(
        `• ${t("roi.pdfSummaryNewBetter", { newMachine: newInputs.machineName, years: newInputs.expectedLifespan, savings: formatCurrency(comparison.tcoSavings), percent: formatNumber(comparison.tcoSavingsPercent, 1) })}`,
        14, yPos, { maxWidth: pageWidth - 28 }
      );
      yPos += 10;
      if (comparison.paybackYears !== Infinity && comparison.paybackYears > 0) {
        doc.text(
          `• ${t("roi.pdfSummaryPayback", { investment: formatCurrency(comparison.additionalInvestment), years: formatNumber(comparison.paybackYears, 1) })}`,
          14, yPos, { maxWidth: pageWidth - 28 }
        );
        yPos += 10;
      }
    } else {
      doc.text(
        `• ${t("roi.pdfSummaryExistingBetter", { existingMachine: existingInputs.machineName, savings: formatCurrency(Math.abs(comparison.tcoSavings)) })}`,
        14, yPos, { maxWidth: pageWidth - 28 }
      );
      yPos += 10;
    }

    doc.text(
      `• ${t("roi.pdfSummaryROIDiff", { newMachine: newInputs.machineName, diff: formatNumber(comparison.roiDiff, 0), direction: comparison.roiDiff >= 0 ? t("roi.roiHigher") : t("roi.roiLower"), existingMachine: existingInputs.machineName })}`,
      14, yPos, { maxWidth: pageWidth - 28 }
    );
    
    addPDFFooter(doc, pageWidth, 1, 1);
    
    doc.save("roi-vordlusraport.pdf");
    
    // Log ROI calculation activity
    logActivity("ROI_CALCULATED", {
      existing: existingInputs.machineName,
      new: newInputs.machineName,
    });
  };

  // Category label for display
  const categoryLabel = useMemo(() => {
    switch (equipmentCategory) {
      case "combine": return t("roi.equipmentTypeCombine");
      case "sprayer": return t("roi.equipmentTypeSprayer");
      case "baler": return t("roi.equipmentTypeBaler");
      case "none": return t("roi.equipmentTypeNone");
      default: return t("roi.equipmentType");
    }
  }, [equipmentCategory, t]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          {t("roi.title")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("roi.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Equipment type selector - only shown when no parent type */}
        {!hasParentType && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("roi.equipmentType")}</Label>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="combine">{t("roi.equipmentTypeCombine")}</SelectItem>
                <SelectItem value="sprayer">{t("roi.equipmentTypeSprayer")}</SelectItem>
                <SelectItem value="baler">{t("roi.equipmentTypeBaler")}</SelectItem>
                <SelectItem value="none">{t("roi.equipmentTypeNone")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("roi.typeHint")}
            </p>
          </div>
        )}

        {/* Desktop: Two columns side by side */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          <SingleROICalculator
            inputs={existingInputs}
            onInputChange={updateExistingInput}
            variant="existing"
            title={t("roi.defaultExistingMachine")}
            equipmentCategory={equipmentCategory}
          />
          <SingleROICalculator
            inputs={newInputs}
            onInputChange={updateNewInput}
            variant="new"
            title={t("roi.defaultNewMachine")}
            equipmentCategory={equipmentCategory}
          />
        </div>

        {/* Mobile/Tablet: Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">{t("roi.defaultExistingMachine")}</TabsTrigger>
              <TabsTrigger value="new">{t("roi.defaultNewMachine")}</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="mt-4">
              <SingleROICalculator
                inputs={existingInputs}
                onInputChange={updateExistingInput}
                variant="existing"
                title={t("roi.defaultExistingMachine")}
                equipmentCategory={equipmentCategory}
              />
            </TabsContent>
            <TabsContent value="new" className="mt-4">
              <SingleROICalculator
                inputs={newInputs}
                onInputChange={updateNewInput}
                variant="new"
                title={t("roi.defaultNewMachine")}
                equipmentCategory={equipmentCategory}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Comparison Summary */}
        <div className="border-t border-border pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            {t("roi.comparisonSummary")}
          </h3>
          
          {/* Key Comparison Metrics */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
            <div className={`rounded-lg p-4 ${comparison.tcoSavings > 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
              <div className={`flex items-center gap-2 mb-2 ${comparison.tcoSavings > 0 ? "text-green-600" : "text-destructive"}`}>
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{t("roi.tcoSavings")}</span>
              </div>
              <div className="text-2xl font-bold">
                {comparison.tcoSavings >= 0 ? "+" : ""}{formatCurrency(comparison.tcoSavings)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatNumber(Math.abs(comparison.tcoSavingsPercent), 1)}% {comparison.newIsBetter ? t("roi.lower") : t("roi.higher")}
              </div>
            </div>

            <div className={`rounded-lg p-4 ${comparison.roiDiff >= 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
              <div className={`flex items-center gap-2 mb-2 ${comparison.roiDiff >= 0 ? "text-green-600" : "text-destructive"}`}>
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">{t("roi.roiDifference")}</span>
              </div>
              <div className="text-2xl font-bold">
                {comparison.roiDiff >= 0 ? "+" : ""}{formatNumber(comparison.roiDiff, 0)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("roi.newVsExisting")}
              </div>
            </div>

            <div className={`rounded-lg p-4 ${comparison.costPerHaDiff > 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
              <div className={`flex items-center gap-2 mb-2 ${comparison.costPerHaDiff > 0 ? "text-green-600" : "text-destructive"}`}>
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm font-medium">{t("roi.costPerHaSavings")}</span>
              </div>
              <div className="text-2xl font-bold">
                {comparison.costPerHaDiff >= 0 ? "+" : ""}{formatCurrency(comparison.costPerHaDiff)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("roi.costPerHaPerYear")}
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calculator className="h-4 w-4" />
                <span className="text-sm font-medium">{t("roi.paybackYears")}</span>
              </div>
              <div className="text-2xl font-bold">
                {comparison.paybackYears === Infinity 
                  ? "—"
                  : comparison.paybackYears < 0
                    ? t("roi.immediate")
                    : `${formatNumber(comparison.paybackYears, 1)}a`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t("roi.additionalPayback")}
              </div>
            </div>
          </div>

          {/* Savings breakdown comparison */}
          {(newCalc.totalAnnualBenefits > 0 || existingCalc.totalAnnualBenefits > 0) && (
            <div className="rounded-lg border border-border p-4 mb-6">
              <h4 className="font-medium mb-3 text-sm">{t("roi.savingsBreakdown")}</h4>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-muted-foreground font-medium">{t("roi.category")}</div>
                <div className="text-muted-foreground font-medium text-right">{existingInputs.machineName}</div>
                <div className="text-muted-foreground font-medium text-right">{newInputs.machineName}</div>
                
                <div className="text-muted-foreground">{t("roi.fuel")}</div>
                <div className="text-right">{formatCurrency(existingCalc.fuelSavings)}</div>
                <div className="text-right">{formatCurrency(newCalc.fuelSavings)}</div>
                
                <div className="text-muted-foreground">{t("roi.maintenance")}</div>
                <div className="text-right">{formatCurrency(existingCalc.maintenanceSavings)}</div>
                <div className="text-right">{formatCurrency(newCalc.maintenanceSavings)}</div>
                
                {equipmentCategory !== "none" && (
                  <>
                    <div className="text-muted-foreground">{t(`roi.${newCalc.qualitySavingsLabel || existingCalc.qualitySavingsLabel || "qualityGeneric"}`)}</div>
                    <div className="text-right">{formatCurrency(existingCalc.qualitySavings)}</div>
                    <div className="text-right">{formatCurrency(newCalc.qualitySavings)}</div>
                  </>
                )}
                
                <div className="font-semibold border-t border-border pt-1">{t("roi.total")}</div>
                <div className="font-semibold text-right border-t border-border pt-1">{formatCurrency(existingCalc.totalAnnualBenefits)}</div>
                <div className="font-semibold text-right border-t border-border pt-1 text-green-600">{formatCurrency(newCalc.totalAnnualBenefits)}</div>
              </div>
            </div>
          )}

          {/* TCO Bar Chart */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-medium mb-4">{t("roi.tcoComparison", { years: newInputs.expectedLifespan })}</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tcoChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
                    domain={[0, 'auto']}
                  />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Bar dataKey="tco" name="TCO" radius={[0, 4, 4, 0]}>
                    {tcoChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {comparison.newIsBetter && (
              <div className="mt-4 p-3 rounded-lg bg-success/10 text-center">
                <span className="text-success font-medium">
                  {t("roi.newSaves", { newMachine: newInputs.machineName, savings: formatCurrency(comparison.tcoSavings), existingMachine: existingInputs.machineName })}
                </span>
              </div>
            )}
          </div>

          {/* Generate PDF Button */}
          <div className="flex justify-center mt-6">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={generatePDFReport}
            >
              <FileDown className="h-5 w-5" />
              {t("roi.generatePdf")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
