import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Clock, Fuel, Wrench, Wheat, Cog, PiggyBank, FileDown, DollarSign, Tractor } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ROIInputs {
  // Purchase & depreciation
  purchasePrice: number;
  expectedLifespan: number;
  residualValuePercent: number;
  
  // Operating parameters
  annualWorkHours: number;
  annualHectares: number;
  
  // Fuel
  fuelConsumption: number;
  fuelPrice: number;
  fuelSavingsPercent: number;
  
  // Maintenance
  annualMaintenance: number;
  maintenanceSavingsPercent: number;
  
  // Harvest quality
  grainLossReduction: number; // €/ha savings from reduced grain loss
  
  // Labor
  operatorHourlyCost: number;
  
  // Revenue (optional for profit calculation)
  revenuePerHectare: number;
}

// Default values based on the article: 500,000€ combine, 800 ha farm
const defaultInputs: ROIInputs = {
  purchasePrice: 500000,
  expectedLifespan: 5,
  residualValuePercent: 52, // 260,000 / 500,000 = 52%
  
  annualWorkHours: 400,
  annualHectares: 800,
  
  fuelConsumption: 45,
  fuelPrice: 1.5,
  fuelSavingsPercent: 5, // 5% fuel savings from optimization
  
  annualMaintenance: 12000,
  maintenanceSavingsPercent: 25, // 25% savings from preventive maintenance
  
  grainLossReduction: 3, // 3 €/ha from reduced grain losses
  
  operatorHourlyCost: 25,
  
  revenuePerHectare: 150,
};

export function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputs>(defaultInputs);
  const resultsRef = useRef<HTMLDivElement>(null);

  const updateInput = (key: keyof ROIInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [key]: numValue }));
  };

  const calculations = useMemo(() => {
    // Base costs
    const baseFuelCost = inputs.annualWorkHours * inputs.fuelConsumption * inputs.fuelPrice;
    const baseMaintenanceCost = inputs.annualMaintenance;
    
    // Benefits (savings) from modern equipment - based on article methodology
    const grainLossSavings = inputs.grainLossReduction * inputs.annualHectares; // Terakadude vähenemine
    const fuelSavings = baseFuelCost * (inputs.fuelSavingsPercent / 100); // Kütusesääst
    const maintenanceSavings = baseMaintenanceCost * (inputs.maintenanceSavingsPercent / 100); // Hoolduse kokkuhoid
    const totalAnnualBenefits = grainLossSavings + fuelSavings + maintenanceSavings; // Aastane kogukasulikkus
    
    // Actual costs after savings
    const actualFuelCost = baseFuelCost - fuelSavings;
    const actualMaintenanceCost = baseMaintenanceCost - maintenanceSavings;
    const operatorCost = inputs.annualWorkHours * inputs.operatorHourlyCost;
    
    // Depreciation calculation with residual value
    const residualValue = inputs.purchasePrice * (inputs.residualValuePercent / 100);
    const annualDepreciation = (inputs.purchasePrice - residualValue) / inputs.expectedLifespan;
    
    // Total annual ownership cost (TCO components)
    const totalAnnualCosts = actualFuelCost + actualMaintenanceCost + operatorCost + annualDepreciation;
    
    // Net annual ownership cost (depreciation minus benefits)
    const netAnnualOwnershipCost = annualDepreciation - totalAnnualBenefits;
    
    // Revenue and profit
    const annualRevenue = inputs.annualHectares * inputs.revenuePerHectare;
    const annualProfit = annualRevenue - totalAnnualCosts;
    
    // Per-unit costs
    const costPerHectare = inputs.annualHectares > 0 ? totalAnnualCosts / inputs.annualHectares : 0;
    const costPerHour = inputs.annualWorkHours > 0 ? totalAnnualCosts / inputs.annualWorkHours : 0;
    
    // ROI calculation based on article formula
    // ROI = total benefits over lifetime / purchase price
    const totalLifetimeBenefits = totalAnnualBenefits * inputs.expectedLifespan;
    const roi = inputs.purchasePrice > 0 ? (totalLifetimeBenefits / inputs.purchasePrice) * 100 : 0;
    
    // Payback period based on annual benefits
    const paybackYears = totalAnnualBenefits > 0 ? inputs.purchasePrice / totalAnnualBenefits : Infinity;
    
    // Alternative payback based on profit
    const profitBasedPayback = annualProfit > 0 ? inputs.purchasePrice / annualProfit : Infinity;
    
    // Total cost of ownership over lifespan (TCO 5 years)
    const totalLifetimeCosts = totalAnnualCosts * inputs.expectedLifespan;

    // TCO for chart (simulated competitor - 15% higher)
    const competitorTCO = totalLifetimeCosts * 1.15;

    return {
      // Benefits
      grainLossSavings,
      fuelSavings,
      maintenanceSavings,
      totalAnnualBenefits,
      
      // Costs
      baseFuelCost,
      actualFuelCost,
      actualMaintenanceCost,
      operatorCost,
      annualDepreciation,
      totalAnnualCosts,
      netAnnualOwnershipCost,
      
      // Residual value
      residualValue,
      
      // Revenue & profit
      annualRevenue,
      annualProfit,
      
      // Per-unit
      costPerHectare,
      costPerHour,
      
      // ROI metrics
      totalLifetimeBenefits,
      roi,
      paybackYears,
      profitBasedPayback,
      totalLifetimeCosts,
      competitorTCO,
    };
  }, [inputs]);

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

  // TCO Chart data
  const tcoChartData = [
    {
      name: "John Deere",
      tco: calculations.totalLifetimeCosts,
      fill: "hsl(122, 39%, 30%)", // Wihuri green
    },
    {
      name: "Konkurent (keskmine)",
      tco: calculations.competitorTCO,
      fill: "hsl(220, 10%, 60%)", // Gray
    },
  ];

  // Generate PDF Report
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(34, 87, 46); // Wihuri green
    doc.text("ROI Kalkulaatori Raport", pageWidth / 2, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Genereeritud: ${new Date().toLocaleDateString("et-EE")}`, pageWidth / 2, 28, { align: "center" });
    
    let yPos = 40;
    
    // Input Parameters Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Sisendparameetrid", 14, yPos);
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [["Parameeter", "Väärtus"]],
      body: [
        ["Ostuhind", formatCurrency(inputs.purchasePrice)],
        ["Analüüsiperiood", `${inputs.expectedLifespan} aastat`],
        ["Jääkväärtus", `${inputs.residualValuePercent}%`],
        ["Hektarid aastas", `${inputs.annualHectares} ha`],
        ["Töötunnid aastas", `${inputs.annualWorkHours} h`],
        ["Kütusekulu", `${inputs.fuelConsumption} l/h`],
        ["Kütuse hind", `${inputs.fuelPrice} €/l`],
        ["Hoolduskulu aastas", formatCurrency(inputs.annualMaintenance)],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 87, 46] },
    });
    
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    
    // Results Section
    doc.setFontSize(14);
    doc.text("Tulemused", 14, yPos);
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [["Näitaja", "Väärtus"]],
      body: [
        ["ROI", `${formatNumber(calculations.roi, 0)}%`],
        ["Kogu omamiskulu (TCO)", formatCurrency(calculations.totalLifetimeCosts)],
        ["Aastane kogusääst", formatCurrency(calculations.totalAnnualBenefits)],
        ["Terakadude vähenemine", formatCurrency(calculations.grainLossSavings)],
        ["Kütusesääst", formatCurrency(calculations.fuelSavings)],
        ["Hoolduse kokkuhoid", formatCurrency(calculations.maintenanceSavings)],
        ["Kulu hektari kohta", formatCurrency(calculations.costPerHectare)],
        ["Aastane kasum", formatCurrency(calculations.annualProfit)],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 87, 46] },
    });
    
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    
    // TCO Comparison
    doc.setFontSize(14);
    doc.text("Kogukulu võrdlus (TCO)", 14, yPos);
    yPos += 8;
    
    autoTable(doc, {
      startY: yPos,
      head: [["Masin", `TCO (${inputs.expectedLifespan}a)`, "Vahe"]],
      body: [
        ["John Deere", formatCurrency(calculations.totalLifetimeCosts), "—"],
        ["Konkurent (keskmine)", formatCurrency(calculations.competitorTCO), formatCurrency(calculations.competitorTCO - calculations.totalLifetimeCosts)],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 87, 46] },
    });
    
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(34, 87, 46);
    const savingsVsCompetitor = calculations.competitorTCO - calculations.totalLifetimeCosts;
    doc.text(`Kokkuvõte: John Deere'iga säästad ${inputs.expectedLifespan} aasta jooksul ${formatCurrency(savingsVsCompetitor)} võrreldes keskmise konkurendiga.`, 14, yPos, { maxWidth: pageWidth - 28 });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Wihuri Agri - Tehnika võrdlus ja ROI analüüs", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    
    doc.save("roi-raport.pdf");
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          ROI kalkulaator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Fields - Grouped into sections with 2-column layout on desktop */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Section 1: Soetamine & Jääkväärtus */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground border-b border-border pb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Soetamine & Jääkväärtus
            </h3>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice" className="text-sm">
                  Ostuhind (€)
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={inputs.purchasePrice}
                  onChange={(e) => updateInput("purchasePrice", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expectedLifespan" className="text-sm">
                  Analüüsiperiood (aastat)
                </Label>
                <Input
                  id="expectedLifespan"
                  type="number"
                  value={inputs.expectedLifespan}
                  onChange={(e) => updateInput("expectedLifespan", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="residualValuePercent" className="text-sm">
                  Jääkväärtus perioodi lõpus (%)
                </Label>
                <Input
                  id="residualValuePercent"
                  type="number"
                  value={inputs.residualValuePercent}
                  onChange={(e) => updateInput("residualValuePercent", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(inputs.purchasePrice * (inputs.residualValuePercent / 100))} järelturu väärtus
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Töö parameetrid */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground border-b border-border pb-2">
              <Tractor className="h-4 w-4 text-primary" />
              Töö parameetrid
            </h3>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="annualHectares" className="text-sm">
                  Hektarid aastas
                </Label>
                <Input
                  id="annualHectares"
                  type="number"
                  value={inputs.annualHectares}
                  onChange={(e) => updateInput("annualHectares", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="annualWorkHours" className="text-sm">
                  Töötunnid aastas
                </Label>
                <Input
                  id="annualWorkHours"
                  type="number"
                  value={inputs.annualWorkHours}
                  onChange={(e) => updateInput("annualWorkHours", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="operatorHourlyCost" className="text-sm">
                  Operaatori tunnihind (€/h)
                </Label>
                <Input
                  id="operatorHourlyCost"
                  type="number"
                  value={inputs.operatorHourlyCost}
                  onChange={(e) => updateInput("operatorHourlyCost", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Kütus */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground border-b border-border pb-2">
              <Fuel className="h-4 w-4 text-primary" />
              Kütus
            </h3>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fuelConsumption" className="text-sm">
                  Kütusekulu (l/h)
                </Label>
                <Input
                  id="fuelConsumption"
                  type="number"
                  step="0.1"
                  value={inputs.fuelConsumption}
                  onChange={(e) => updateInput("fuelConsumption", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fuelPrice" className="text-sm">
                  Kütuse hind (€/l)
                </Label>
                <Input
                  id="fuelPrice"
                  type="number"
                  step="0.01"
                  value={inputs.fuelPrice}
                  onChange={(e) => updateInput("fuelPrice", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fuelSavingsPercent" className="text-sm">
                  Kütusesääst optimeerimisest (%)
                </Label>
                <Input
                  id="fuelSavingsPercent"
                  type="number"
                  value={inputs.fuelSavingsPercent}
                  onChange={(e) => updateInput("fuelSavingsPercent", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Hooldus */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground border-b border-border pb-2">
              <Cog className="h-4 w-4 text-primary" />
              Hooldus
            </h3>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="annualMaintenance" className="text-sm">
                  Hoolduskulu aastas (€)
                </Label>
                <Input
                  id="annualMaintenance"
                  type="number"
                  value={inputs.annualMaintenance}
                  onChange={(e) => updateInput("annualMaintenance", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maintenanceSavingsPercent" className="text-sm">
                  Sääst ennetavast hooldusest (%)
                </Label>
                <Input
                  id="maintenanceSavingsPercent"
                  type="number"
                  value={inputs.maintenanceSavingsPercent}
                  onChange={(e) => updateInput("maintenanceSavingsPercent", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ootamatute kulude vähenemine ennetava hoolduse tõttu
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Koristuse kvaliteet */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground border-b border-border pb-2">
              <Wheat className="h-4 w-4 text-primary" />
              Koristuse kvaliteet
            </h3>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="grainLossReduction" className="text-sm">
                  Terakadude vähenemine (€/ha)
                </Label>
                <Input
                  id="grainLossReduction"
                  type="number"
                  step="0.5"
                  value={inputs.grainLossReduction}
                  onChange={(e) => updateInput("grainLossReduction", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Automaatika tänu vähenev terakadu hektari kohta
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: Tulu */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground border-b border-border pb-2">
              <PiggyBank className="h-4 w-4 text-primary" />
              Tulu
            </h3>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="revenuePerHectare" className="text-sm">
                  Tulu hektari kohta (€/ha)
                </Label>
                <Input
                  id="revenuePerHectare"
                  type="number"
                  value={inputs.revenuePerHectare}
                  onChange={(e) => updateInput("revenuePerHectare", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Summary - Key metric from article */}
        <div className="border-t border-border pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Aastane kasumlikkus
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-green-500/10 p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Wheat className="h-4 w-4" />
                <span className="text-sm font-medium">Terakadude vähenemine</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                +{formatCurrency(calculations.grainLossSavings)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {inputs.grainLossReduction} €/ha × {inputs.annualHectares} ha
              </div>
            </div>

            <div className="rounded-lg bg-green-500/10 p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Fuel className="h-4 w-4" />
                <span className="text-sm font-medium">Kütusesääst</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                +{formatCurrency(calculations.fuelSavings)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(calculations.baseFuelCost)} × {inputs.fuelSavingsPercent}%
              </div>
            </div>

            <div className="rounded-lg bg-green-500/10 p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Cog className="h-4 w-4" />
                <span className="text-sm font-medium">Hoolduse kokkuhoid</span>
              </div>
              <div className="text-xl font-bold text-green-600">
                +{formatCurrency(calculations.maintenanceSavings)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(inputs.annualMaintenance)} × {inputs.maintenanceSavingsPercent}%
              </div>
            </div>

            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Aastane kogukasulikkus</span>
              </div>
              <div className="text-2xl font-bold">
                +{formatCurrency(calculations.totalAnnualBenefits)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Kokku sääst aastas
              </div>
            </div>
          </div>
        </div>

        {/* Main Results */}
        <div className="border-t border-border pt-6" ref={resultsRef}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Tulemused</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={generatePDFReport}
            >
              <FileDown className="h-4 w-4" />
              Genereeri PDF-raport
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* ROI */}
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">ROI</span>
              </div>
              <div className="text-2xl font-bold">
                ≈ {formatNumber(calculations.roi, 0)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {inputs.expectedLifespan} aasta jooksul
              </div>
            </div>

            {/* Net Ownership Cost */}
            <div className="rounded-lg bg-accent/50 p-4">
              <div className="flex items-center gap-2 text-accent-foreground mb-2">
                <Wrench className="h-4 w-4" />
                <span className="text-sm font-medium">Tegelik omamiskulu</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(Math.max(0, calculations.netAnnualOwnershipCost))}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Amort. - kasulikkus aastas
              </div>
            </div>

            {/* Cost per Hectare */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Fuel className="h-4 w-4" />
                <span className="text-sm font-medium">Kulu hektari kohta</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(calculations.costPerHectare)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                €/ha aastas
              </div>
            </div>

            {/* Annual Profit */}
            <div
              className={`rounded-lg p-4 ${
                calculations.annualProfit >= 0
                  ? "bg-green-500/10"
                  : "bg-destructive/10"
              }`}
            >
              <div
                className={`flex items-center gap-2 mb-2 ${
                  calculations.annualProfit >= 0
                    ? "text-green-600"
                    : "text-destructive"
                }`}
              >
                <PiggyBank className="h-4 w-4" />
                <span className="text-sm font-medium">Aastane kasum</span>
              </div>
              <div className="text-2xl font-bold">
                {formatCurrency(calculations.annualProfit)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Tulu - kulud
              </div>
            </div>
          </div>

          {/* TCO Bar Chart */}
          <div className="mt-6 rounded-lg border border-border p-4">
            <h4 className="font-medium mb-4">Kogu omamiskulu võrdlus ({inputs.expectedLifespan}a)</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tcoChartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
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
            <div className="mt-4 p-3 rounded-lg bg-success/10 text-center">
              <span className="text-success font-medium">
                John Deere'iga säästad {formatCurrency(calculations.competitorTCO - calculations.totalLifetimeCosts)} võrreldes keskmise konkurendiga
              </span>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium mb-3">Aastased kulud (pärast sääste)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kütus (pärast säästu)</span>
                  <span>{formatCurrency(calculations.actualFuelCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hooldus (pärast säästu)</span>
                  <span>{formatCurrency(calculations.actualMaintenanceCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Operaator</span>
                  <span>{formatCurrency(calculations.operatorCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amortisatsioon</span>
                  <span>{formatCurrency(calculations.annualDepreciation)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-medium">
                  <span>Kokku aastas</span>
                  <span>{formatCurrency(calculations.totalAnnualCosts)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h4 className="font-medium mb-3">Kogukulu analüüs (TCO)</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ostuhind</span>
                  <span>{formatCurrency(inputs.purchasePrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jääkväärtus ({inputs.expectedLifespan}a pärast)</span>
                  <span className="text-green-600">-{formatCurrency(calculations.residualValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kulu tunni kohta</span>
                  <span>{formatCurrency(calculations.costPerHour)}/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kogusääst ({inputs.expectedLifespan}a)</span>
                  <span className="text-green-600">{formatCurrency(calculations.totalLifetimeBenefits)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-medium">
                  <span>Kogu omamiskulu ({inputs.expectedLifespan}a)</span>
                  <span>{formatCurrency(calculations.totalLifetimeCosts)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
