import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileDown, Table, Calculator, FileText, Download, User } from "lucide-react";
import { Equipment, EquipmentType } from "@/types/equipment";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ROIInputs, calculateROI } from "./SingleROICalculator";
import {
  CATEGORY_NAMES,
  buildDetailedSpecRows,
} from "@/lib/pdfSpecsHelpers";
import { addPDFHeader, addPDFFooter, getStaffUserInfo } from "@/lib/pdfHelpers";
import { useStaffUsers, type StaffUser } from "@/hooks/useStaffUsers";

interface ComparisonPDFExportProps {
  selectedModels: Equipment[];
  equipmentType: EquipmentType | null;
  showTCO: boolean;
  existingInputs?: ROIInputs;
  newInputs?: ROIInputs;
}

type PDFType = "comparison" | "comparison-tco" | "roi" | "full";

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

// Cost row definitions
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

// Build table body with all detailed specs
function buildFullSpecBody(
  selectedModels: Equipment[],
  isCombine: boolean
): string[][] {
  const detailedSpecs = buildDetailedSpecRows(selectedModels, isCombine);
  const body: string[][] = [];

  detailedSpecs.forEach(({ categoryName, rows }) => {
    // Category header row
    body.push([categoryName, ...selectedModels.map(() => "")]);

    // Field rows (indented)
    rows.forEach(({ label, values }) => {
      body.push([`  ${label}`, ...values]);
    });
  });

  return body;
}

// Generate Comparison Table PDF (with all detailed specs)
function generateComparisonTablePDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null,
  staffUser: StaffUser | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const isCombine = equipmentType?.name === "combine";
  const userInfo = getStaffUserInfo(staffUser);

  const yPos = addPDFHeader(doc, pageWidth, {
    title: "Tehnika võrdlustabel",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  });

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, yPos, { align: "center" });

  const tableStartY = yPos + 8;

  const headers = [
    "Näitaja",
    ...selectedModels.map((m) => `${m.brand?.name}\n${m.model_name}`),
  ];

  // Build full spec body with all categories
  const specBody = buildFullSpecBody(selectedModels, isCombine);

  // Add cost rows
  COST_ROWS.forEach((row) => {
    const values = selectedModels.map((m) => {
      const val = m[row.key as keyof Equipment] as number | null;
      if (row.format === "currency") return formatCurrency(val);
      if (row.suffix)
        return val !== null ? `${formatNumber(val)}${row.suffix}` : "—";
      return formatNumber(val);
    });
    specBody.push([row.label, ...values]);
  });

  // TCO row
  specBody.push([
    "TCO (Kogukulu)",
    ...selectedModels.map((m) => formatCurrency(calculateTCO(m))),
  ]);

  // Generate table with category header styling
  const categoryNames = Object.values(CATEGORY_NAMES);

  autoTable(doc, {
    startY: tableStartY,
    head: [headers],
    body: specBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 55 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const text = data.cell.text[0];
        if (categoryNames.includes(text)) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 240, 230];
        }
      }
    },
    didDrawPage: () => {
      const currentPage = doc.getCurrentPageInfo().pageNumber;
      addPDFFooter(doc, pageWidth, currentPage, doc.getNumberOfPages());
    },
  });

  doc.save("vordlustabel.pdf");
}

// Generate Comparison Table + TCO PDF
function generateComparisonWithTCOPDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null,
  staffUser: StaffUser | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const isCombine = equipmentType?.name === "combine";
  const userInfo = getStaffUserInfo(staffUser);

  // Page 1: Comparison Table with all specs
  let yPos = addPDFHeader(doc, pageWidth, {
    title: "Tehnika võrdlustabel + TCO analüüs",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  });

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, yPos, { align: "center" });

  const headers = [
    "Näitaja",
    ...selectedModels.map((m) => `${m.brand?.name}\n${m.model_name}`),
  ];

  // Build full spec body
  const specBody = buildFullSpecBody(selectedModels, isCombine);
  const categoryNames = Object.values(CATEGORY_NAMES);

  autoTable(doc, {
    startY: yPos + 8,
    head: [headers],
    body: specBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 55 } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const text = data.cell.text[0];
        if (categoryNames.includes(text)) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 240, 230];
        }
      }
    },
  });

  // Add new page for TCO Analysis
  doc.addPage();
  yPos = addPDFHeader(doc, pageWidth, {
    title: "Omamiskogukulu (TCO) analüüs",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  });

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("Omamiskogukulu (TCO) analüüs", pageWidth / 2, yPos, { align: "center" });

  const tcoBody: string[][] = [];
  tcoBody.push([
    "Ostuhind",
    ...selectedModels.map((m) => formatCurrency(m.price_eur)),
  ]);
  tcoBody.push([
    "Hoolduskulu aastas",
    ...selectedModels.map((m) => formatCurrency(m.annual_maintenance_eur)),
  ]);
  tcoBody.push([
    "Eeldatav eluiga",
    ...selectedModels.map((m) => `${m.expected_lifespan_years || 10} aastat`),
  ]);
  tcoBody.push([
    "Hoolduskulud kokku",
    ...selectedModels.map((m) => {
      const maint = m.annual_maintenance_eur || 0;
      const life = m.expected_lifespan_years || 10;
      return formatCurrency(maint * life);
    }),
  ]);
  tcoBody.push([
    "TCO (Kogukulu)",
    ...selectedModels.map((m) => formatCurrency(calculateTCO(m))),
  ]);

  autoTable(doc, {
    startY: yPos + 8,
    head: [
      [
        "Komponent",
        ...selectedModels.map((m) => `${m.brand?.name}\n${m.model_name}`),
      ],
    ],
    body: tcoBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 50 } },
  });

  const lastY =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

  // TCO Summary
  const tcoValues = selectedModels
    .map((m) => calculateTCO(m))
    .filter((v): v is number => v !== null);
  if (tcoValues.length > 1) {
    const minTCO = Math.min(...tcoValues);
    const maxTCO = Math.max(...tcoValues);
    const savings = maxTCO - minTCO;

    const bestModel = selectedModels.find((m) => calculateTCO(m) === minTCO);

    doc.setFontSize(11);
    doc.setTextColor(34, 87, 46);
    doc.text("Kokkuvõte", 14, lastY);

    doc.setFontSize(10);
    doc.setTextColor(0);
    if (bestModel) {
      doc.text(
        `• Madalaima omamiskuluga on ${bestModel.brand?.name} ${bestModel.model_name} (${formatCurrency(minTCO)})`,
        14,
        lastY + 8,
        { maxWidth: pageWidth - 28 }
      );
      doc.text(
        `• Maksimaalne sääst võrreldes kallima mudeliga: ${formatCurrency(savings)}`,
        14,
        lastY + 16,
        { maxWidth: pageWidth - 28 }
      );
    }
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, pageWidth, i, totalPages);
  }

  doc.save("vordlustabel-tco.pdf");
}

// Generate ROI PDF
function generateROIPDF(
  existingInputs: ROIInputs,
  newInputs: ROIInputs,
  staffUser: StaffUser | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const userInfo = getStaffUserInfo(staffUser);

  const existingCalc = calculateROI(existingInputs);
  const newCalc = calculateROI(newInputs);

  const formatNumHelper = (value: number, decimals: number = 1) =>
    new Intl.NumberFormat("et-EE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  let yPos = addPDFHeader(doc, pageWidth, {
    title: "ROI Võrdlusraport",
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  });

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("ROI Võrdlusraport", pageWidth / 2, yPos, { align: "center" });

  yPos += 12;

  // Input Parameters
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Sisendparameetrid", 14, yPos);
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    head: [["Parameeter", existingInputs.machineName, newInputs.machineName]],
    body: [
      [
        "Ostuhind",
        formatCurrency(existingInputs.purchasePrice),
        formatCurrency(newInputs.purchasePrice),
      ],
      [
        "Analüüsiperiood",
        `${existingInputs.expectedLifespan} a`,
        `${newInputs.expectedLifespan} a`,
      ],
      [
        "Jääkväärtus",
        `${existingInputs.residualValuePercent}%`,
        `${newInputs.residualValuePercent}%`,
      ],
      [
        "Hektarid aastas",
        `${existingInputs.annualHectares} ha`,
        `${newInputs.annualHectares} ha`,
      ],
      [
        "Töötunnid aastas",
        `${existingInputs.annualWorkHours} h`,
        `${newInputs.annualWorkHours} h`,
      ],
      [
        "Kütusekulu",
        `${existingInputs.fuelConsumption} l/h`,
        `${newInputs.fuelConsumption} l/h`,
      ],
      [
        "Hoolduskulu",
        formatCurrency(existingInputs.annualMaintenance),
        formatCurrency(newInputs.annualMaintenance),
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46] },
  });

  yPos =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

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
  addPDFFooter(doc, pageWidth, 1, 1);

  doc.save("roi-vordlusraport.pdf");
}

// Generate Full Report PDF (all specs + TCO + ROI)
function generateFullReportPDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null,
  existingInputs: ROIInputs,
  newInputs: ROIInputs,
  staffUser: StaffUser | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const isCombine = equipmentType?.name === "combine";
  const userInfo = getStaffUserInfo(staffUser);

  // ========== PAGE 1+: Comparison Table ==========
  let yPos = addPDFHeader(doc, pageWidth, {
    title: "Täisraport - Tehnika võrdlus",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  });

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, yPos, { align: "center" });

  const headers = [
    "Näitaja",
    ...selectedModels.map((m) => `${m.brand?.name}\n${m.model_name}`),
  ];

  // Build full spec body
  const specBody = buildFullSpecBody(selectedModels, isCombine);

  // Add cost rows
  COST_ROWS.forEach((row) => {
    const values = selectedModels.map((m) => {
      const val = m[row.key as keyof Equipment] as number | null;
      if (row.format === "currency") return formatCurrency(val);
      if (row.suffix)
        return val !== null ? `${formatNumber(val)}${row.suffix}` : "—";
      return formatNumber(val);
    });
    specBody.push([row.label, ...values]);
  });

  // TCO row
  specBody.push([
    "TCO (Kogukulu)",
    ...selectedModels.map((m) => formatCurrency(calculateTCO(m))),
  ]);

  const categoryNames = Object.values(CATEGORY_NAMES);

  autoTable(doc, {
    startY: yPos + 8,
    head: [headers],
    body: specBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 55 } },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 0) {
        const text = data.cell.text[0];
        if (categoryNames.includes(text)) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 240, 230];
        }
      }
    },
  });

  // ========== TCO Analysis Page ==========
  doc.addPage();
  yPos = addPDFHeader(doc, pageWidth, {
    title: "Omamiskogukulu (TCO) analüüs",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  });

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("Omamiskogukulu (TCO) analüüs", pageWidth / 2, yPos, { align: "center" });

  const tcoBody: string[][] = [];
  tcoBody.push([
    "Ostuhind",
    ...selectedModels.map((m) => formatCurrency(m.price_eur)),
  ]);
  tcoBody.push([
    "Hoolduskulu aastas",
    ...selectedModels.map((m) => formatCurrency(m.annual_maintenance_eur)),
  ]);
  tcoBody.push([
    "Eeldatav eluiga",
    ...selectedModels.map((m) => `${m.expected_lifespan_years || 10} aastat`),
  ]);
  tcoBody.push([
    "Hoolduskulud kokku",
    ...selectedModels.map((m) => {
      const maint = m.annual_maintenance_eur || 0;
      const life = m.expected_lifespan_years || 10;
      return formatCurrency(maint * life);
    }),
  ]);
  tcoBody.push([
    "TCO (Kogukulu)",
    ...selectedModels.map((m) => formatCurrency(calculateTCO(m))),
  ]);

  autoTable(doc, {
    startY: yPos + 8,
    head: [
      [
        "Komponent",
        ...selectedModels.map((m) => `${m.brand?.name}\n${m.model_name}`),
      ],
    ],
    body: tcoBody,
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { cellWidth: 50 } },
  });

  // ========== ROI Analysis Page ==========
  doc.addPage();
  yPos = addPDFHeader(doc, pageWidth, {
    title: "ROI Kalkulaator",
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  });

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("ROI Kalkulaator", pageWidth / 2, yPos, { align: "center" });

  yPos += 12;

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
      [
        "Ostuhind",
        formatCurrency(existingInputs.purchasePrice),
        formatCurrency(newInputs.purchasePrice),
      ],
      [
        "Analüüsiperiood",
        `${existingInputs.expectedLifespan} a`,
        `${newInputs.expectedLifespan} a`,
      ],
      [
        "Hektarid aastas",
        `${existingInputs.annualHectares} ha`,
        `${newInputs.annualHectares} ha`,
      ],
      [
        "Töötunnid aastas",
        `${existingInputs.annualWorkHours} h`,
        `${newInputs.annualWorkHours} h`,
      ],
      [
        "Hoolduskulu",
        formatCurrency(existingInputs.annualMaintenance),
        formatCurrency(newInputs.annualMaintenance),
      ],
    ],
    theme: "striped",
    headStyles: { fillColor: [34, 87, 46], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
  });

  yPos =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

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

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, pageWidth, i, totalPages);
  }

  doc.save("taysraport.pdf");
}

// Main Export Component
export function ComparisonPDFExport({
  selectedModels,
  equipmentType,
  existingInputs,
  newInputs,
}: ComparisonPDFExportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [pendingPDFType, setPendingPDFType] = useState<PDFType | null>(null);

  const { data: staffUsers = [], isLoading } = useStaffUsers();
  
  const hasModels = selectedModels.length > 0;
  const hasROIInputs = existingInputs && newInputs;

  const openUserSelection = (pdfType: PDFType) => {
    setPendingPDFType(pdfType);
    setDialogOpen(true);
  };

  const handleGeneratePDF = () => {
    const selectedUser = staffUsers.find((u) => u.id === selectedUserId) || null;

    switch (pendingPDFType) {
      case "comparison":
        generateComparisonTablePDF(selectedModels, equipmentType, selectedUser);
        break;
      case "comparison-tco":
        generateComparisonWithTCOPDF(selectedModels, equipmentType, selectedUser);
        break;
      case "roi":
        if (existingInputs && newInputs) {
          generateROIPDF(existingInputs, newInputs, selectedUser);
        }
        break;
      case "full":
        if (existingInputs && newInputs) {
          generateFullReportPDF(
            selectedModels,
            equipmentType,
            existingInputs,
            newInputs,
            selectedUser
          );
        }
        break;
    }

    setDialogOpen(false);
    setPendingPDFType(null);
  };

  return (
    <>
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
                onClick={() => openUserSelection("comparison")}
              >
                <Table className="h-4 w-4" />
                <div>
                  <div className="font-medium">Võrdlustabel</div>
                  <div className="text-xs text-muted-foreground">
                    Tehniline võrdlus (kõik näitajad)
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onClick={() => openUserSelection("comparison-tco")}
              >
                <Calculator className="h-4 w-4" />
                <div>
                  <div className="font-medium">Võrdlustabel + TCO</div>
                  <div className="text-xs text-muted-foreground">
                    Tehniline + omamiskulu
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {hasROIInputs && (
                <>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => openUserSelection("roi")}
                  >
                    <FileText className="h-4 w-4" />
                    <div>
                      <div className="font-medium">ROI raport</div>
                      <div className="text-xs text-muted-foreground">
                        Tasuvusanalüüs
                      </div>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => openUserSelection("full")}
                  >
                    <FileDown className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Kõik (täisraport)</div>
                      <div className="text-xs text-muted-foreground">
                        Võrdlus + TCO + ROI
                      </div>
                    </div>
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Vali dokumendi koostaja
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Vali oma nimi, et see kuvataks PDF-dokumendi päises koostaja infona.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="staff-user">Koostaja</Label>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Laadin...</div>
              ) : staffUsers.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Kasutajaid pole lisatud. Lisa kasutajad Admin → Kasutajad vaates.
                  </p>
                </div>
              ) : (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vali oma nimi" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div>
                          <div className="font-medium">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Tühista
            </Button>
            <Button onClick={handleGeneratePDF}>
              <Download className="h-4 w-4 mr-2" />
              Genereeri PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export individual functions for use elsewhere (e.g., ROIComparisonCalculator)
export {
  generateComparisonTablePDF,
  generateComparisonWithTCOPDF,
  generateROIPDF,
  generateFullReportPDF,
};
