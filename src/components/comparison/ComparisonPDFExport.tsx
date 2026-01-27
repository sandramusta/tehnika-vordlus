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
import {
  CATEGORY_NAMES,
  buildDetailedSpecRows,
} from "@/lib/pdfSpecsHelpers";

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

function addPageHeader(
  doc: jsPDF,
  pageWidth: number,
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null
) {
  doc.setFontSize(10);
  doc.setTextColor(100);

  const date = new Date().toLocaleDateString("et-EE");
  doc.text(`Kuupäev: ${date}`, 14, 12);

  const category = equipmentType?.name_et || "Kõik tüübid";
  doc.text(`Kategooria: ${category}`, 14, 18);

  const modelNames = selectedModels
    .map((m) => `${m.brand?.name} ${m.model_name}`)
    .join(", ");
  doc.text(`Mudelid: ${modelNames}`, 14, 24, { maxWidth: pageWidth - 28 });
}

function addPageFooter(
  doc: jsPDF,
  pageWidth: number,
  pageNum: number,
  totalPages: number
) {
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Wihuri Agri - Tehnika võrdlus", 14, pageHeight - 10);
  doc.text(`Leht ${pageNum} / ${totalPages}`, pageWidth - 14, pageHeight - 10, {
    align: "right",
  });
}

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
export function generateComparisonTablePDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const isCombine = equipmentType?.name === "combine";

  addPageHeader(doc, pageWidth, selectedModels, equipmentType);

  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, 40, { align: "center" });

  const yPos = 50;

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
    startY: yPos,
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
    didDrawPage: (data) => {
      const currentPage = doc.getCurrentPageInfo().pageNumber;
      addPageFooter(doc, pageWidth, currentPage, doc.getNumberOfPages());
    },
  });

  doc.save("vordlustabel.pdf");
}

// Generate Comparison Table + TCO PDF
export function generateComparisonWithTCOPDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const isCombine = equipmentType?.name === "combine";

  // Page 1: Comparison Table with all specs
  addPageHeader(doc, pageWidth, selectedModels, equipmentType);

  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, 40, { align: "center" });

  let yPos = 50;
  const headers = [
    "Näitaja",
    ...selectedModels.map((m) => `${m.brand?.name}\n${m.model_name}`),
  ];

  // Build full spec body
  const specBody = buildFullSpecBody(selectedModels, isCombine);
  const categoryNames = Object.values(CATEGORY_NAMES);

  autoTable(doc, {
    startY: yPos,
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
    didDrawPage: () => {
      // Footer will be added at the end
    },
  });

  // Add new page for TCO Analysis
  doc.addPage();
  addPageHeader(doc, pageWidth, selectedModels, equipmentType);

  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Omamiskogukulu (TCO) analüüs", pageWidth / 2, 40, { align: "center" });

  yPos = 50;

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
    startY: yPos,
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

  yPos =
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
    doc.text("Kokkuvõte", 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(0);
    if (bestModel) {
      doc.text(
        `• Madalaima omamiskuluga on ${bestModel.brand?.name} ${bestModel.model_name} (${formatCurrency(minTCO)})`,
        14,
        yPos,
        { maxWidth: pageWidth - 28 }
      );
      yPos += 8;
      doc.text(
        `• Maksimaalne sääst võrreldes kallima mudeliga: ${formatCurrency(savings)}`,
        14,
        yPos,
        { maxWidth: pageWidth - 28 }
      );
    }
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, pageWidth, i, totalPages);
  }

  doc.save("vordlustabel-tco.pdf");
}

// Generate ROI PDF
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
  doc.text(
    `Genereeritud: ${new Date().toLocaleDateString("et-EE")}`,
    pageWidth / 2,
    28,
    { align: "center" }
  );

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
  doc.text(
    "Wihuri Agri - ROI analüüs",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  doc.save("roi-vordlusraport.pdf");
}

// Generate Full Report PDF (all specs + TCO + ROI)
export function generateFullReportPDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null,
  existingInputs: ROIInputs,
  newInputs: ROIInputs
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const isCombine = equipmentType?.name === "combine";

  // ========== PAGE 1+: Comparison Table ==========
  addPageHeader(doc, pageWidth, selectedModels, equipmentType);

  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, 40, { align: "center" });

  let yPos = 50;
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
    startY: yPos,
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
  addPageHeader(doc, pageWidth, selectedModels, equipmentType);

  doc.setFontSize(18);
  doc.setTextColor(34, 87, 46);
  doc.text("Omamiskogukulu (TCO) analüüs", pageWidth / 2, 40, { align: "center" });

  yPos = 50;

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
    startY: yPos,
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
    addPageFooter(doc, pageWidth, i, totalPages);
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
              onClick={() =>
                generateComparisonTablePDF(selectedModels, equipmentType)
              }
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
              onClick={() =>
                generateComparisonWithTCOPDF(selectedModels, equipmentType)
              }
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
                  onClick={() => generateROIPDF(existingInputs!, newInputs!)}
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
                  onClick={() =>
                    generateFullReportPDF(
                      selectedModels,
                      equipmentType,
                      existingInputs!,
                      newInputs!
                    )
                  }
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
  );
}
