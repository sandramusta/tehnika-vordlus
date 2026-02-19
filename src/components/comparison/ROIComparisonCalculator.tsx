import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, FileDown, TrendingUp, ArrowRight, Scale } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  SingleROICalculator, 
  ROIInputs, 
  calculateROI, 
  defaultInputsExisting, 
  defaultInputsNew 
} from "./SingleROICalculator";
import { addPDFHeader, addPDFFooter } from "@/lib/pdfHelpers";
import { useAuth } from "@/hooks/useAuth";
export function ROIComparisonCalculator() {
  const [existingInputs, setExistingInputs] = useState<ROIInputs>(defaultInputsExisting);
  const [newInputs, setNewInputs] = useState<ROIInputs>(defaultInputsNew);

  const updateExistingInput = (key: keyof ROIInputs, value: string | number) => {
    if (key === "machineName") {
      setExistingInputs(prev => ({ ...prev, [key]: String(value) }));
    } else {
      const numValue = parseFloat(String(value)) || 0;
      setExistingInputs(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const updateNewInput = (key: keyof ROIInputs, value: string | number) => {
    if (key === "machineName") {
      setNewInputs(prev => ({ ...prev, [key]: String(value) }));
    } else {
      const numValue = parseFloat(String(value)) || 0;
      setNewInputs(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const existingCalc = useMemo(() => calculateROI(existingInputs), [existingInputs]);
  const newCalc = useMemo(() => calculateROI(newInputs), [newInputs]);

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
    
    // Payback period for the new machine investment vs staying with existing
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

  // Get current user from auth
  const { profile } = useAuth();

  // Generate PDF Report
  const generatePDFReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Add header with logo and logged-in user info
    let yPos = addPDFHeader(doc, pageWidth, {
      title: "ROI Võrdlusraport",
      generatorName: profile?.full_name || "",
      generatorEmail: profile?.email || "",
    });

    doc.setFontSize(16);
    doc.setTextColor(34, 87, 46);
    doc.text("ROI Võrdlusraport", pageWidth / 2, yPos, { align: "center" });
    
    yPos += 12;
    
    // Input Parameters Comparison
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Sisendparameetrid", 14, yPos);
    yPos += 6;
    
    autoTable(doc, {
      startY: yPos,
      head: [["Parameeter", existingInputs.machineName, newInputs.machineName]],
      body: [
        ["Ostuhind", formatCurrency(existingInputs.purchasePrice), formatCurrency(newInputs.purchasePrice)],
        ["Analüüsiperiood", `${existingInputs.expectedLifespan} a`, `${newInputs.expectedLifespan} a`],
        ["Jääkväärtus", `${existingInputs.residualValuePercent}%`, `${newInputs.residualValuePercent}%`],
        ["Hektarid aastas", `${existingInputs.annualHectares} ha`, `${newInputs.annualHectares} ha`],
        ["Töötunnid aastas", `${existingInputs.annualWorkHours} h`, `${newInputs.annualWorkHours} h`],
        ["Kütusekulu", `${existingInputs.fuelConsumption} l/h`, `${newInputs.fuelConsumption} l/h`],
        ["Kütusesääst", `${existingInputs.fuelSavingsPercent}%`, `${newInputs.fuelSavingsPercent}%`],
        ["Hoolduskulu", formatCurrency(existingInputs.annualMaintenance), formatCurrency(newInputs.annualMaintenance)],
        ["Hoolduse sääst", `${existingInputs.maintenanceSavingsPercent}%`, `${newInputs.maintenanceSavingsPercent}%`],
        ["Terakao vähenemine", `${existingInputs.grainLossReduction} €/ha`, `${newInputs.grainLossReduction} €/ha`],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 87, 46] },
    });
    
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    
    // Results Comparison
    doc.setFontSize(12);
    doc.text("Tulemused", 14, yPos);
    yPos += 6;
    
    autoTable(doc, {
      startY: yPos,
      head: [["Näitaja", existingInputs.machineName, newInputs.machineName, "Vahe"]],
      body: [
        [
          `TCO (${newInputs.expectedLifespan}a)`, 
          formatCurrency(existingCalc.totalLifetimeCosts), 
          formatCurrency(newCalc.totalLifetimeCosts),
          formatCurrency(comparison.tcoSavings)
        ],
        [
          "ROI", 
          `${formatNumber(existingCalc.roi, 0)}%`, 
          `${formatNumber(newCalc.roi, 0)}%`,
          `${comparison.roiDiff >= 0 ? "+" : ""}${formatNumber(comparison.roiDiff, 0)}%`
        ],
        [
          "Kulu/ha", 
          formatCurrency(existingCalc.costPerHectare), 
          formatCurrency(newCalc.costPerHectare),
          formatCurrency(comparison.costPerHaDiff)
        ],
        [
          "Aastane sääst", 
          formatCurrency(existingCalc.totalAnnualBenefits), 
          formatCurrency(newCalc.totalAnnualBenefits),
          formatCurrency(comparison.annualSavingsDiff)
        ],
        [
          "Aastane kasum", 
          formatCurrency(existingCalc.annualProfit), 
          formatCurrency(newCalc.annualProfit),
          formatCurrency(newCalc.annualProfit - existingCalc.annualProfit)
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: [34, 87, 46] },
    });
    
    yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    
    // Summary
    doc.setFontSize(11);
    doc.setTextColor(34, 87, 46);
    doc.text("Kokkuvõte", 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    
    if (comparison.newIsBetter) {
      doc.text(
        `• Uue masina (${newInputs.machineName}) valik säästab ${newInputs.expectedLifespan} aasta jooksul ${formatCurrency(comparison.tcoSavings)} (${formatNumber(comparison.tcoSavingsPercent, 1)}% madalam TCO).`,
        14, yPos, { maxWidth: pageWidth - 28 }
      );
      yPos += 10;
      if (comparison.paybackYears !== Infinity && comparison.paybackYears > 0) {
        doc.text(
          `• Lisainvesteeringu (${formatCurrency(comparison.additionalInvestment)}) tasuvusaeg: ${formatNumber(comparison.paybackYears, 1)} aastat.`,
          14, yPos, { maxWidth: pageWidth - 28 }
        );
        yPos += 10;
      }
    } else {
      doc.text(
        `• Olemasoleva masina (${existingInputs.machineName}) jätkamine on ${formatCurrency(Math.abs(comparison.tcoSavings))} soodsam.`,
        14, yPos, { maxWidth: pageWidth - 28 }
      );
      yPos += 10;
    }
    
    doc.text(
      `• ${newInputs.machineName} ROI on ${formatNumber(comparison.roiDiff, 0)}% ${comparison.roiDiff >= 0 ? "kõrgem" : "madalam"} kui ${existingInputs.machineName}.`,
      14, yPos, { maxWidth: pageWidth - 28 }
    );
    
    // Footer
    addPDFFooter(doc, pageWidth, 1, 1);
    
    doc.save("roi-vordlusraport.pdf");
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          ROI võrdluskalkulaator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Võrdle olemasolevat ja uut masinat, et näha, milline on soodsam valik.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Desktop: Two columns side by side */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
          <SingleROICalculator
            inputs={existingInputs}
            onInputChange={updateExistingInput}
            variant="existing"
            title="Olemasolev masin"
          />
          <SingleROICalculator
            inputs={newInputs}
            onInputChange={updateNewInput}
            variant="new"
            title="Uus masin"
          />
        </div>

        {/* Mobile/Tablet: Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Olemasolev</TabsTrigger>
              <TabsTrigger value="new">Uus masin</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="mt-4">
              <SingleROICalculator
                inputs={existingInputs}
                onInputChange={updateExistingInput}
                variant="existing"
                title="Olemasolev masin"
              />
            </TabsContent>
            <TabsContent value="new" className="mt-4">
              <SingleROICalculator
                inputs={newInputs}
                onInputChange={updateNewInput}
                variant="new"
                title="Uus masin"
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Comparison Summary */}
        <div className="border-t border-border pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Võrdluskokkuvõte
          </h3>
          
          {/* Key Comparison Metrics */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
            <div className={`rounded-lg p-4 ${comparison.tcoSavings > 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
              <div className={`flex items-center gap-2 mb-2 ${comparison.tcoSavings > 0 ? "text-green-600" : "text-destructive"}`}>
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">TCO sääst</span>
              </div>
              <div className="text-2xl font-bold">
                {comparison.tcoSavings >= 0 ? "+" : ""}{formatCurrency(comparison.tcoSavings)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatNumber(Math.abs(comparison.tcoSavingsPercent), 1)}% {comparison.newIsBetter ? "madalam" : "kõrgem"}
              </div>
            </div>

            <div className={`rounded-lg p-4 ${comparison.roiDiff >= 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
              <div className={`flex items-center gap-2 mb-2 ${comparison.roiDiff >= 0 ? "text-green-600" : "text-destructive"}`}>
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">ROI erinevus</span>
              </div>
              <div className="text-2xl font-bold">
                {comparison.roiDiff >= 0 ? "+" : ""}{formatNumber(comparison.roiDiff, 0)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Uue masina ROI vs olemasolev
              </div>
            </div>

            <div className={`rounded-lg p-4 ${comparison.costPerHaDiff > 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
              <div className={`flex items-center gap-2 mb-2 ${comparison.costPerHaDiff > 0 ? "text-green-600" : "text-destructive"}`}>
                <ArrowRight className="h-4 w-4" />
                <span className="text-sm font-medium">Kulu/ha sääst</span>
              </div>
              <div className="text-2xl font-bold">
                {comparison.costPerHaDiff >= 0 ? "+" : ""}{formatCurrency(comparison.costPerHaDiff)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Hektari kohta aastas
              </div>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calculator className="h-4 w-4" />
                <span className="text-sm font-medium">Tasuvusaeg</span>
              </div>
              <div className="text-2xl font-bold">
                {comparison.paybackYears === Infinity 
                  ? "—" 
                  : comparison.paybackYears < 0 
                    ? "Kohene" 
                    : `${formatNumber(comparison.paybackYears, 1)}a`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Lisainvesteeringu tasuvus
              </div>
            </div>
          </div>

          {/* TCO Bar Chart */}
          <div className="rounded-lg border border-border p-4">
            <h4 className="font-medium mb-4">TCO võrdlus ({newInputs.expectedLifespan} aastat)</h4>
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
                  {newInputs.machineName} säästab {formatCurrency(comparison.tcoSavings)} võrreldes {existingInputs.machineName}iga
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
              Genereeri võrdlus PDF-raport
            </Button>
          </div>
        </div>
      </CardContent>

    </Card>
  );
}
