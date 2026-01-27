import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown, Table, Calculator, FileText, Download } from "lucide-react";
import { Equipment, EquipmentType } from "@/types/equipment";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ROIInputs, calculateROI } from "./SingleROICalculator";

interface ComparisonPDFExportProps {
  selectedModels: Equipment[];
  equipmentType: EquipmentType | null;
  showTCO: boolean;
  existingInputs?: ROIInputs;
  newInputs?: ROIInputs;
}

// Formatting helpers
function formatNumber(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("et-EE").format(num);
}

function formatCurrency(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(num);
}

function calculateTCO(equipment: Equipment): number | null {
  if (!equipment.price_eur || !equipment.annual_maintenance_eur) return null;
  const lifespan = equipment.expected_lifespan_years || 10;
  return equipment.price_eur + equipment.annual_maintenance_eur * lifespan;
}

// Spec row definitions
const SPEC_ROWS: { key: keyof Equipment; label: string }[] = [
  { key: "engine_power_hp", label: "Võimsus (hj)" },
  { key: "grain_tank_liters", label: "Viljabunker (l)" },
  { key: "header_width_m", label: "Heedri laius (m)" },
  { key: "fuel_tank_liters", label: "Kütusepaak (L)" },
  { key: "cleaning_area_m2", label: "Puhasti pindala (m²)" },
  { key: "rotor_diameter_mm", label: "Rootori läbimõõt (mm)" },
  { key: "throughput_tons_h", label: "Läbilaskevõime (t/h)" },
  { key: "weight_kg", label: "Kaal (kg)" },
  { key: "fuel_consumption_lh", label: "Kütusekulu (l/h)" },
];

interface CostRow {
  key: keyof Equipment;
  label: string;
  format?: "currency";
  suffix?: string;
}

const COST_ROWS: CostRow[] = [
  { key: "price_eur", label: "Hind", format: "currency" },
  { key: "annual_maintenance_eur", label: "Hooldus/aastas", format: "currency" },
  { key: "expected_lifespan_years", label: "Eeldatav eluiga", suffix: " aastat" },
];

function addPageHeader(
  doc: jsPDF,
  pageWidth: number,
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null
) {
  // Header
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  const date = new Date().toLocaleDateString("et-EE");
  doc.text(`Kuupäev: ${date}`, 14, 12);
  
  const category = equipmentType?.name_et || "Kõik tüübid";
  doc.text(`Kategooria: ${category}`, 14, 18);
  
  const modelNames = selectedModels.map(m => `${m.brand?.name} ${m.model_name}`).join(", ");
  doc.text(`Mudelid: ${modelNames}`, 14, 24, { maxWidth: pageWidth - 28 });
}

function addPageFooter(doc: jsPDF, pageWidth: number, pageNum: number, totalPages: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Wihuri Agri - Tehnika võrdlus", 14, pageHeight - 10);
  doc.text(`Leht ${pageNum} / ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: "right" });
}

// Generate Comparison Table PDF
export function generateComparisonTablePDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header info
  addPageHeader(doc, pageWidth, selectedModels, equipmentType);
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, 40, { align: "center" });
  
  let yPos = 50;
  
  // Build table data
  const headers = ["Näitaja", ...selectedModels.map(m => `${m.brand?.name}\n${m.model_name}`)];
  
  // Technical specs
  const specBody: string[][] = [];
  SPEC_ROWS.forEach(row => {
    const values = selectedModels.map(m => {
      const val = m[row.key as keyof Equipment] as number | null;
      return formatNumber(val);
    });
    if (values.some(v => v !== "—")) {
      specBody.push([row.label, ...values]);
    }
  });
  
  // Cost section
  const costBody: string[][] = [];
  COST_ROWS.forEach(row => {
    const values = selectedModels.map(m => {
      const val = m[row.key as keyof Equipment] as number | null;
      if (row.format === "currency") return formatCurrency(val);
      if (row.suffix) return val !== null ? `${formatNumber(val)}${row.suffix}` : "—";
      return formatNumber(val);
    });
    costBody.push([row.label, ...values]);
  });
  
  // TCO row
  const tcoValues = selectedModels.map(m => formatCurrency(calculateTCO(m)));
  costBody.push(["TCO (Kogukulu)", ...tcoValues]);
  
  // Technical specs table
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: specBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 },
    },
  });
  
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  // Cost table
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Hinnad ja kulud", 14, yPos);
  yPos += 5;
  
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: costBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 50 },
    },
  });
  
  // Footer
  addPageFooter(doc, pageWidth, 1, 1);
  
  doc.save("vordlustabel.pdf");
}

// Generate Comparison Table + TCO PDF
export function generateComparisonWithTCOPDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Page 1: Comparison Table
  addPageHeader(doc, pageWidth, selectedModels, equipmentType);
  
  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, 40, { align: "center" });
  
  let yPos = 50;
  const headers = ["Näitaja", ...selectedModels.map(m => `${m.brand?.name}\n${m.model_name}`)];
  
  // Technical specs
  const specBody: string[][] = [];
  SPEC_ROWS.forEach(row => {
    const values = selectedModels.map(m => {
      const val = m[row.key as keyof Equipment] as number | null;
      return formatNumber(val);
    });
    if (values.some(v => v !== "—")) {
      specBody.push([row.label, ...values]);
    }
  });
  
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: specBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 50 } },
  });
  
  addPageFooter(doc, pageWidth, 1, 2);
  
  // Page 2: TCO Analysis
  doc.addPage();
  addPageHeader(doc, pageWidth, selectedModels, equipmentType);
  
  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Omamiskogukulu (TCO) analüüs", pageWidth / 2, 40, { align: "center" });
  
  yPos = 50;
  
  // TCO table
  const tcoBody: string[][] = [];
  
  // Price
  tcoBody.push(["Ostuhind", ...selectedModels.map(m => formatCurrency(m.price_eur))]);
  
  // Annual maintenance
  tcoBody.push(["Hoolduskulu aastas", ...selectedModels.map(m => formatCurrency(m.annual_maintenance_eur))]);
  
  // Lifespan
  tcoBody.push(["Eeldatav eluiga", ...selectedModels.map(m => `${m.expected_lifespan_years || 10} aastat`)]);
  
  // Total maintenance
  tcoBody.push([
    "Hoolduskulud kokku",
    ...selectedModels.map(m => {
      const maint = m.annual_maintenance_eur || 0;
      const life = m.expected_lifespan_years || 10;
      return formatCurrency(maint * life);
    }),
  ]);
  
  // TCO
  tcoBody.push(["TCO (Kogukulu)", ...selectedModels.map(m => formatCurrency(calculateTCO(m)))]);
  
  autoTable(doc, {
    startY: yPos,
    head: [["Komponent", ...selectedModels.map(m => `${m.brand?.name}\n${m.model_name}`)]],
    body: tcoBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 50 } },
  });
  
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  // TCO Summary
  const tcoValues = selectedModels.map(m => calculateTCO(m)).filter((v): v is number => v !== null);
  if (tcoValues.length > 1) {
    const minTCO = Math.min(...tcoValues);
    const maxTCO = Math.max(...tcoValues);
    const savings = maxTCO - minTCO;
    
    const bestModel = selectedModels.find(m => calculateTCO(m) === minTCO);
    
    doc.setFontSize(11);
    doc.setTextColor(34, 87, 46);
    doc.text("Kokkuvõte", 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(0);
    if (bestModel) {
      doc.text(
        `• Madalaima omamiskuluga on ${bestModel.brand?.name} ${bestModel.model_name} (${formatCurrency(minTCO)})`,
        14, yPos, { maxWidth: pageWidth - 28 }
      );
      yPos += 8;
      doc.text(
        `• Maksimaalne sääst võrreldes kallima mudeliga: ${formatCurrency(savings)}`,
        14, yPos, { maxWidth: pageWidth - 28 }
      );
    }
  }
  
  addPageFooter(doc, pageWidth, 2, 2);
  
  doc.save("vordlustabel-tco.pdf");
}

// Generate ROI PDF (existing functionality preserved)
export function generateROIPDF(
  existingInputs: ROIInputs,
  newInputs: ROIInputs
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const existingCalc = calculateROI(existingInputs);
  const newCalc = calculateROI(newInputs);
  
  const formatNumHelper = (value: number, decimals: number = 1) =>
    new Intl.NumberFormat("et-EE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(34, 87, 46);
  doc.text("ROI Võrdlusraport", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Genereeritud: ${new Date().toLocaleDateString("et-EE")}`, pageWidth / 2, 28, { align: "center" });
  
  let yPos = 40;
  
  // Input Parameters
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text("Sisendparameetrid", 14, yPos);
  yPos += 8;
  
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
      ["Hoolduskulu", formatCurrency(existingInputs.annualMaintenance), formatCurrency(newInputs.annualMaintenance)],
    ],
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46] },
  });
  
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  
  // Results
  const tcoSavings = existingCalc.totalLifetimeCosts - newCalc.totalLifetimeCosts;
  const roiDiff = newCalc.roi - existingCalc.roi;
  
  doc.setFontSize(14);
  doc.text("Tulemused", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [["Näitaja", existingInputs.machineName, newInputs.machineName, "Vahe"]],
    body: [
      [
        `TCO (${newInputs.expectedLifespan}a)`,
        formatCurrency(existingCalc.totalLifetimeCosts),
        formatCurrency(newCalc.totalLifetimeCosts),
        formatCurrency(tcoSavings),
      ],
      [
        "ROI",
        `${formatNumHelper(existingCalc.roi, 0)}%`,
        `${formatNumHelper(newCalc.roi, 0)}%`,
        `${roiDiff >= 0 ? "+" : ""}${formatNumHelper(roiDiff, 0)}%`,
      ],
      [
        "Kulu/ha",
        formatCurrency(existingCalc.costPerHectare),
        formatCurrency(newCalc.costPerHectare),
        formatCurrency(existingCalc.costPerHectare - newCalc.costPerHectare),
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46] },
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Wihuri Agri - ROI analüüs", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
  
  doc.save("roi-vordlusraport.pdf");
}

// Generate All-in-One PDF
export function generateFullReportPDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null,
  existingInputs: ROIInputs,
  newInputs: ROIInputs
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const totalPages = 3;
  
  // ========== PAGE 1: Comparison Table ==========
  addPageHeader(doc, pageWidth, selectedModels, equipmentType);
  
  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, 40, { align: "center" });
  
  let yPos = 50;
  const headers = ["Näitaja", ...selectedModels.map(m => `${m.brand?.name}\n${m.model_name}`)];
  
  // Technical specs
  const specBody: string[][] = [];
  SPEC_ROWS.forEach(row => {
    const values = selectedModels.map(m => {
      const val = m[row.key as keyof Equipment] as number | null;
      return formatNumber(val);
    });
    if (values.some(v => v !== "—")) {
      specBody.push([row.label, ...values]);
    }
  });
  
  // Cost rows
  COST_ROWS.forEach(row => {
    const values = selectedModels.map(m => {
      const val = m[row.key as keyof Equipment] as number | null;
      if (row.format === "currency") return formatCurrency(val);
      if (row.suffix) return val !== null ? `${formatNumber(val)}${row.suffix}` : "—";
      return formatNumber(val);
    });
    specBody.push([row.label, ...values]);
  });
  
  // TCO
  specBody.push(["TCO (Kogukulu)", ...selectedModels.map(m => formatCurrency(calculateTCO(m)))]);
  
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: specBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 50 } },
  });
  
  addPageFooter(doc, pageWidth, 1, totalPages);
  
  // ========== PAGE 2: TCO Analysis ==========
  doc.addPage();
  addPageHeader(doc, pageWidth, selectedModels, equipmentType);
  
  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Omamiskogukulu (TCO) analüüs", pageWidth / 2, 40, { align: "center" });
  
  yPos = 50;
  
  const tcoBody: string[][] = [];
  tcoBody.push(["Ostuhind", ...selectedModels.map(m => formatCurrency(m.price_eur))]);
  tcoBody.push(["Hoolduskulu aastas", ...selectedModels.map(m => formatCurrency(m.annual_maintenance_eur))]);
  tcoBody.push(["Eeldatav eluiga", ...selectedModels.map(m => `${m.expected_lifespan_years || 10} aastat`)]);
  tcoBody.push([
    "Hoolduskulud kokku",
    ...selectedModels.map(m => {
      const maint = m.annual_maintenance_eur || 0;
      const life = m.expected_lifespan_years || 10;
      return formatCurrency(maint * life);
    }),
  ]);
  tcoBody.push(["TCO (Kogukulu)", ...selectedModels.map(m => formatCurrency(calculateTCO(m)))]);
  
  autoTable(doc, {
    startY: yPos,
    head: [["Komponent", ...selectedModels.map(m => `${m.brand?.name}\n${m.model_name}`)]],
    body: tcoBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 50 } },
  });
  
  addPageFooter(doc, pageWidth, 2, totalPages);
  
  // ========== PAGE 3: ROI Analysis ==========
  doc.addPage();
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Kuupäev: ${new Date().toLocaleDateString("et-EE")}`, 14, 12);
  
  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("ROI Kalkulaator", pageWidth / 2, 30, { align: "center" });
  
  yPos = 45;
  
  const existingCalc = calculateROI(existingInputs);
  const newCalc = calculateROI(newInputs);
  
  const formatNumHelper = (value: number, decimals: number = 1) =>
    new Intl.NumberFormat("et-EE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  
  // Input Parameters
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
      ["Hektarid aastas", `${existingInputs.annualHectares} ha`, `${newInputs.annualHectares} ha`],
      ["Töötunnid aastas", `${existingInputs.annualWorkHours} h`, `${newInputs.annualWorkHours} h`],
      ["Hoolduskulu", formatCurrency(existingInputs.annualMaintenance), formatCurrency(newInputs.annualMaintenance)],
    ],
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
  });
  
  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  
  // Results
  const tcoSavings = existingCalc.totalLifetimeCosts - newCalc.totalLifetimeCosts;
  const roiDiff = newCalc.roi - existingCalc.roi;
  
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
        formatCurrency(tcoSavings),
      ],
      [
        "ROI",
        `${formatNumHelper(existingCalc.roi, 0)}%`,
        `${formatNumHelper(newCalc.roi, 0)}%`,
        `${roiDiff >= 0 ? "+" : ""}${formatNumHelper(roiDiff, 0)}%`,
      ],
      [
        "Aastane kasum",
        formatCurrency(existingCalc.annualProfit),
        formatCurrency(newCalc.annualProfit),
        formatCurrency(newCalc.annualProfit - existingCalc.annualProfit),
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
  });
  
  addPageFooter(doc, pageWidth, 3, totalPages);
  
  doc.save("taysraport.pdf");
}

// Main Export Component
export function ComparisonPDFExport({
  selectedModels,
  equipmentType,
  existingInputs,
  newInputs,
}: ComparisonPDFExportProps) {
  const hasModels = selectedModels.length > 0;
  const hasROIInputs = existingInputs && newInputs;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={!hasModels}>
          <Download className="h-4 w-4" />
          Laadi alla PDF
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover w-[280px]">
        {!hasModels ? (
          <div className="p-3 text-sm text-muted-foreground text-center">
            Vali vähemalt 1 mudel
          </div>
        ) : (
          <>
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => generateComparisonTablePDF(selectedModels, equipmentType)}
            >
              <Table className="h-4 w-4" />
              <div>
                <div className="font-medium">Võrdlustabel</div>
                <div className="text-xs text-muted-foreground">Tehniline võrdlus</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              className="gap-2 cursor-pointer"
              onClick={() => generateComparisonWithTCOPDF(selectedModels, equipmentType)}
            >
              <Calculator className="h-4 w-4" />
              <div>
                <div className="font-medium">Võrdlustabel + TCO</div>
                <div className="text-xs text-muted-foreground">Tehniline + omamiskulu</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {hasROIInputs && (
              <>
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => generateROIPDF(existingInputs!, newInputs!)}
                >
                  <FileText className="h-4 w-4" />
                  <div>
                    <div className="font-medium">ROI raport</div>
                    <div className="text-xs text-muted-foreground">Tasuvusanalüüs</div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => generateFullReportPDF(selectedModels, equipmentType, existingInputs!, newInputs!)}
                >
                  <FileDown className="h-4 w-4" />
                  <div>
                    <div className="font-medium">Kõik (täisraport)</div>
                    <div className="text-xs text-muted-foreground">Võrdlus + TCO + ROI</div>
                  </div>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
