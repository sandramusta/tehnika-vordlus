import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown, Table, Calculator, FileText, Download, Loader2 } from "lucide-react";
import { Equipment, EquipmentType } from "@/types/equipment";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ROIInputs, calculateROI } from "./SingleROICalculator";
import {
  getCategoryNamesForType,
  buildDetailedSpecRows,
} from "@/lib/pdfSpecsHelpers";
import { addPDFHeader, addPDFFooter, initializePDFGeneration } from "@/lib/pdfHelpers";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useState } from "react";

interface ComparisonPDFExportProps {
  selectedModels: Equipment[];
  equipmentType: EquipmentType | null;
  showTCO: boolean;
  existingInputs?: ROIInputs;
  newInputs?: ROIInputs;
}

type PDFType = "comparison" | "comparison-tco" | "roi" | "full";

// Max model columns per landscape page (label column + 5 models)
const MAX_MODELS_PER_PAGE = 5;

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

// Common autoTable styles to prevent word-breaking
const commonHeadStyles = {
  fillColor: [34, 87, 46] as [number, number, number],
  fontSize: 8,
  cellPadding: 3,
  overflow: 'linebreak' as const,
  minCellWidth: 30,
};

const commonBodyStyles = {
  fontSize: 7.5,
  cellPadding: 2,
  overflow: 'linebreak' as const,
};

// Build table body with all detailed specs
function buildFullSpecBody(
  selectedModels: Equipment[],
  isCombine: boolean,
  equipmentTypeName?: string
): string[][] {
  const detailedSpecs = buildDetailedSpecRows(selectedModels, isCombine, equipmentTypeName);
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

/**
 * Split models into chunks of MAX_MODELS_PER_PAGE and render each chunk
 * as a separate autoTable on its own page(s), repeating the label (first) column.
 */
function renderChunkedTable(
  doc: jsPDF,
  startY: number,
  allHeaders: string[],
  allBody: string[][],
  categoryNames: string[],
  pageWidth: number,
  userInfo: { name: string; email: string },
  title: string,
  isFirstChunkFirstPage: boolean
): void {
  // allHeaders[0] = "Näitaja", rest are model headers
  const labelHeader = allHeaders[0];
  const modelHeaders = allHeaders.slice(1);

  // If 5 or fewer models, no chunking needed
  const totalModels = modelHeaders.length;
  const chunks: number[][] = [];
  for (let i = 0; i < totalModels; i += MAX_MODELS_PER_PAGE) {
    const end = Math.min(i + MAX_MODELS_PER_PAGE, totalModels);
    const indices: number[] = [];
    for (let j = i; j < end; j++) indices.push(j);
    chunks.push(indices);
  }

  let currentPage = doc.getCurrentPageInfo().pageNumber;

  chunks.forEach((chunkIndices, chunkIdx) => {
    // For chunks after the first, add a new page
    if (chunkIdx > 0) {
      doc.addPage("landscape");
      const headerY = addPDFHeader(doc, pageWidth, {
        title,
        generatorName: userInfo.name,
        generatorEmail: userInfo.email,
      }, false);
      startY = headerY + 8;

      // Add chunk indicator
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(
        `(jätk – masinad ${chunkIndices[0] + 1}–${chunkIndices[chunkIndices.length - 1] + 1} / ${totalModels})`,
        pageWidth / 2,
        startY - 2,
        { align: "center" }
      );
    }

    // Build chunk headers
    const chunkHeaders = [labelHeader, ...chunkIndices.map(i => modelHeaders[i])];

    // Build chunk body – label column + only the chunk's model columns
    const chunkBody = allBody.map(row => {
      const label = row[0];
      const values = chunkIndices.map(i => row[i + 1]); // +1 because row[0] is label
      return [label, ...values];
    });

    // Calculate label column width based on available space
    const labelColWidth = 60;

    autoTable(doc, {
      startY,
      head: [chunkHeaders],
      body: chunkBody,
      theme: "striped",
      headStyles: commonHeadStyles,
      bodyStyles: commonBodyStyles,
      columnStyles: {
        0: { cellWidth: labelColWidth },
      },
      styles: {
        overflow: 'linebreak',
      },
      margin: { top: 28, bottom: 30, left: 14, right: 14 },
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
        const pageNum = doc.getCurrentPageInfo().pageNumber;
        if (pageNum > currentPage) {
          currentPage = pageNum;
          addPDFHeader(doc, pageWidth, {
            title,
            generatorName: userInfo.name,
            generatorEmail: userInfo.email,
          }, false);
        }
      },
    });
  });
}

// Generate Comparison Table PDF (with all detailed specs)
async function generateComparisonTablePDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null,
  userInfo: { name: string; email: string }
): Promise<void> {
  await initializePDFGeneration();
  
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const isCombine = equipmentType?.name === "combine";

  const yPos = addPDFHeader(doc, pageWidth, {
    title: "Tehnika võrdlustabel",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  }, true);

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, yPos, { align: "center" });

  const tableStartY = yPos + 8;

  const headers = [
    "Näitaja",
    ...selectedModels.map((m) => `${m.brand?.name}\n${m.model_name}`),
  ];

  // Build full spec body with all categories
  const specBody = buildFullSpecBody(selectedModels, isCombine, equipmentType?.name);

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

  const categoryNames = Object.values(getCategoryNamesForType(equipmentType?.name)) as string[];

  renderChunkedTable(
    doc, tableStartY, headers, specBody, categoryNames,
    pageWidth, userInfo, "Tehnika võrdlustabel", true
  );

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, pageWidth, i, totalPages);
  }

  doc.save("vordlustabel.pdf");
}

// Generate Comparison Table + TCO PDF
async function generateComparisonWithTCOPDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null,
  userInfo: { name: string; email: string }
): Promise<void> {
  await initializePDFGeneration();
  
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const isCombine = equipmentType?.name === "combine";

  // Page 1: Comparison Table with all specs
  let yPos = addPDFHeader(doc, pageWidth, {
    title: "Tehnika võrdlustabel + TCO analüüs",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  }, true);

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, yPos, { align: "center" });

  const headers = [
    "Näitaja",
    ...selectedModels.map((m) => `${m.brand?.name}\n${m.model_name}`),
  ];

  // Build full spec body
  const specBody = buildFullSpecBody(selectedModels, isCombine, equipmentType?.name);
  const categoryNames = Object.values(getCategoryNamesForType(equipmentType?.name)) as string[];

  renderChunkedTable(
    doc, yPos + 8, headers, specBody, categoryNames,
    pageWidth, userInfo, "Tehnika võrdlustabel + TCO analüüs", true
  );

  // Add new page for TCO Analysis
  doc.addPage("landscape");
  yPos = addPDFHeader(doc, pageWidth, {
    title: "Omamiskogukulu (TCO) analüüs",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  }, false);

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
    headStyles: commonHeadStyles,
    bodyStyles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 60 } },
    styles: { overflow: 'linebreak' },
    margin: { bottom: 30 },
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
async function generateROIPDF(
  existingInputs: ROIInputs,
  newInputs: ROIInputs,
  userInfo: { name: string; email: string }
): Promise<void> {
  await initializePDFGeneration();
  
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();

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
  }, true);

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
    headStyles: commonHeadStyles,
    bodyStyles: { fontSize: 9, cellPadding: 3 },
    styles: { overflow: 'linebreak' },
    margin: { bottom: 30 },
  });

  yPos =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 15;

  // Results - check if table fits on current page
  const tcoSavings = existingCalc.totalLifetimeCosts - newCalc.totalLifetimeCosts;
  const roiDiff = newCalc.roi - existingCalc.roi;

  const pageHeight = doc.internal.pageSize.getHeight();
  const resultsTableHeight = 60;
  if (yPos + resultsTableHeight + 30 > pageHeight) {
    doc.addPage("landscape");
    yPos = 20;
  }

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
    headStyles: commonHeadStyles,
    bodyStyles: { fontSize: 9, cellPadding: 3 },
    styles: { overflow: 'linebreak' },
    margin: { bottom: 30 },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPDFFooter(doc, pageWidth, i, totalPages);
  }

  doc.save("roi-vordlusraport.pdf");
}

// Generate Full Report PDF (all specs + TCO + ROI)
async function generateFullReportPDF(
  selectedModels: Equipment[],
  equipmentType: EquipmentType | null,
  existingInputs: ROIInputs,
  newInputs: ROIInputs,
  userInfo: { name: string; email: string }
): Promise<void> {
  await initializePDFGeneration();
  
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const isCombine = equipmentType?.name === "combine";

  // ========== PAGE 1+: Comparison Table ==========
  let yPos = addPDFHeader(doc, pageWidth, {
    title: "Täisraport - Tehnika võrdlus",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  }, true);

  doc.setFontSize(16);
  doc.setTextColor(34, 87, 46);
  doc.text("Võrdlustabel", pageWidth / 2, yPos, { align: "center" });

  const headers = [
    "Näitaja",
    ...selectedModels.map((m) => `${m.brand?.name}\n${m.model_name}`),
  ];

  // Build full spec body
  const specBody = buildFullSpecBody(selectedModels, isCombine, equipmentType?.name);

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

  const categoryNames = Object.values(getCategoryNamesForType(equipmentType?.name)) as string[];

  renderChunkedTable(
    doc, yPos + 8, headers, specBody, categoryNames,
    pageWidth, userInfo, "Täisraport - Tehnika võrdlus", true
  );

  // ========== TCO Analysis Page ==========
  doc.addPage("landscape");
  yPos = addPDFHeader(doc, pageWidth, {
    title: "Omamiskogukulu (TCO) analüüs",
    selectedModels,
    equipmentType,
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  }, false);

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
    headStyles: commonHeadStyles,
    bodyStyles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { cellWidth: 60 } },
    styles: { overflow: 'linebreak' },
    margin: { bottom: 30 },
  });

  // ========== ROI Analysis Page ==========
  doc.addPage("landscape");
  yPos = addPDFHeader(doc, pageWidth, {
    title: "ROI Kalkulaator",
    generatorName: userInfo.name,
    generatorEmail: userInfo.email,
  }, false);

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
    headStyles: commonHeadStyles,
    bodyStyles: { fontSize: 9, cellPadding: 3 },
    styles: { overflow: 'linebreak' },
    margin: { bottom: 30 },
  });

  yPos =
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

  // Results - check if table fits on current page
  const tcoSavings = existingCalc.totalLifetimeCosts - newCalc.totalLifetimeCosts;
  const roiDiff = newCalc.roi - existingCalc.roi;

  const roiPageHeight = doc.internal.pageSize.getHeight();
  const roiResultsHeight = 60;
  if (yPos + roiResultsHeight + 30 > roiPageHeight) {
    doc.addPage("landscape");
    yPos = 20;
  }

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
    headStyles: commonHeadStyles,
    bodyStyles: { fontSize: 9, cellPadding: 3 },
    styles: { overflow: 'linebreak' },
    margin: { bottom: 30 },
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
  const { profile } = useAuth();
  const { logActivity } = useActivityLog();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const hasModels = selectedModels.length > 0;
  const hasROIInputs = existingInputs && newInputs;

  const userInfo = {
    name: profile?.full_name || "",
    email: profile?.email || "",
  };

  const handleGeneratePDF = async (pdfType: PDFType) => {
    setIsGenerating(true);
    try {
      switch (pdfType) {
        case "comparison":
          await generateComparisonTablePDF(selectedModels, equipmentType, userInfo);
          break;
        case "comparison-tco":
          await generateComparisonWithTCOPDF(selectedModels, equipmentType, userInfo);
          break;
        case "roi":
          if (existingInputs && newInputs) {
            await generateROIPDF(existingInputs, newInputs, userInfo);
          }
          break;
        case "full":
          if (existingInputs && newInputs) {
            await generateFullReportPDF(
              selectedModels,
              equipmentType,
              existingInputs,
              newInputs,
              userInfo
            );
          }
          break;
      }
      // Log the activity
      logActivity("PDF_GENERATED", {
        type: pdfType,
        models: selectedModels.map((m) => `${m.brand?.name} ${m.model_name}`),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={!hasModels || isGenerating}>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isGenerating ? "Genereerin..." : "Laadi alla PDF"}
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
              onClick={() => handleGeneratePDF("comparison")}
              disabled={isGenerating}
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
              onClick={() => handleGeneratePDF("comparison-tco")}
              disabled={isGenerating}
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
                  onClick={() => handleGeneratePDF("roi")}
                  disabled={isGenerating}
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
                  onClick={() => handleGeneratePDF("full")}
                  disabled={isGenerating}
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

// Export individual functions for use elsewhere (e.g., ROIComparisonCalculator)
export {
  generateComparisonTablePDF,
  generateComparisonWithTCOPDF,
  generateROIPDF,
  generateFullReportPDF,
};
